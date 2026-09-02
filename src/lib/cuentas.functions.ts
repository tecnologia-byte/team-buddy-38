import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rolSchema = z.enum([
  "Administrador",
  "Recursos Humanos",
  "Contabilidad",
  "Supervisor",
  "Colaborador",
]);

const cuentaSchema = z.object({
  email: z.string().email(),
  clave: z.string().optional(),
  nombre: z.string().min(2),
  cargo: z.string().default(""),
  area: z.string().default(""),
  rol: rolSchema,
  emailOriginal: z.string().email().optional(),
});

const inicialesDe = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "NC";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Crea o actualiza credenciales. Solo Administración / Recursos Humanos. */
export const guardarCuentaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => cuentaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const esGestor = (roles ?? []).some(
      (r) => r.role === "Administrador" || r.role === "Recursos Humanos",
    );
    if (!esGestor) return { ok: false as const, error: "No tienes permisos para esta acción" };

    const sb = await admin();
    const email = data.email.trim().toLowerCase();

    // ¿Ya existe el perfil que se está editando?
    const buscar = data.emailOriginal?.trim().toLowerCase() ?? email;
    const { data: existente } = await sb
      .from("perfiles")
      .select("id, email")
      .ilike("email", buscar)
      .maybeSingle();

    let userId = existente?.id;

    if (!userId) {
      if (!data.clave || data.clave.length < 6)
        return { ok: false as const, error: "La contraseña debe tener al menos 6 caracteres" };
      const creado = await sb.auth.admin.createUser({
        email,
        password: data.clave,
        email_confirm: true,
      });
      if (creado.error || !creado.data.user)
        return {
          ok: false as const,
          error: creado.error?.message ?? "No se pudo crear el usuario",
        };
      userId = creado.data.user.id;
    } else {
      const cambios: { email?: string; password?: string } = {};
      if (email !== existente?.email?.toLowerCase()) cambios.email = email;
      if (data.clave && data.clave.length >= 6) cambios.password = data.clave;
      if (Object.keys(cambios).length > 0) {
        const act = await sb.auth.admin.updateUserById(userId, cambios);
        if (act.error) return { ok: false as const, error: act.error.message };
      }
    }

    const { error: errorPerfil } = await sb.from("perfiles").upsert({
      id: userId,
      email,
      nombre: data.nombre.trim(),
      cargo: data.cargo.trim(),
      area: data.area.trim(),
      iniciales: inicialesDe(data.nombre),
    });
    if (errorPerfil) return { ok: false as const, error: errorPerfil.message };

    await sb.from("user_roles").delete().eq("user_id", userId);
    const { error: errorRol } = await sb
      .from("user_roles")
      .insert({ user_id: userId, role: data.rol });
    if (errorRol) return { ok: false as const, error: errorRol.message };

    return { ok: true as const };
  });

/** Elimina el acceso de un usuario. Solo Administración / Recursos Humanos. */
export const eliminarCuentaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const esGestor = (roles ?? []).some(
      (r) => r.role === "Administrador" || r.role === "Recursos Humanos",
    );
    if (!esGestor) return { ok: false as const, error: "No tienes permisos para esta acción" };
    if (data.id === context.userId)
      return { ok: false as const, error: "No puedes eliminar tu propia cuenta" };

    const sb = await admin();
    const { error } = await sb.auth.admin.deleteUser(data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Crea la primera cuenta de administrador, únicamente si aún no existe ninguna. */
export const crearPrimerAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().email(),
        clave: z.string().min(6),
        nombre: z.string().min(2),
        cargo: z.string().default("Administración"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { count } = await sb.from("perfiles").select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0)
      return { ok: false as const, error: "Ya existe una cuenta; solicita acceso a un administrador" };

    const email = data.email.trim().toLowerCase();
    const creado = await sb.auth.admin.createUser({
      email,
      password: data.clave,
      email_confirm: true,
    });
    if (creado.error || !creado.data.user)
      return { ok: false as const, error: creado.error?.message ?? "No se pudo crear la cuenta" };

    const userId = creado.data.user.id;
    await sb.from("perfiles").upsert({
      id: userId,
      email,
      nombre: data.nombre.trim(),
      cargo: data.cargo.trim(),
      area: "Tecnología",
      iniciales: inicialesDe(data.nombre),
    });
    await sb.from("user_roles").insert({ user_id: userId, role: "Administrador" });
    return { ok: true as const };
  });

/** Indica si el portal aún no tiene ninguna cuenta creada. */
export const portalVacioFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { count } = await sb.from("perfiles").select("id", { count: "exact", head: true });
  return { vacio: (count ?? 0) === 0 };
});
