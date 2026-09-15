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
  telefono: z.string().optional(),
  whatsapp: z.string().optional(),
  canalAvisos: z.enum(["correo", "whatsapp", "ambos", "ninguno"]).default("correo"),
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

    // Toda contraseña puesta por Administración es provisional: el colaborador
    // deberá crear la suya al iniciar sesión.
    const provisional = Boolean(data.clave && data.clave.length >= 6);

    const { error: errorPerfil } = await sb.from("perfiles").upsert({
      id: userId,
      email,
      nombre: data.nombre.trim(),
      cargo: data.cargo.trim(),
      area: data.area.trim(),
      iniciales: inicialesDe(data.nombre),
      ...(data.telefono !== undefined ? { telefono: data.telefono.trim() } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: normalizarWhatsApp(data.whatsapp) } : {}),
      ...(data.canalAvisos !== undefined ? { canal_avisos: data.canalAvisos } : {}),
      ...(provisional ? { clave_provisional: true, clave_provisional_texto: data.clave ?? null } : {}),
    });
    if (errorPerfil) return { ok: false as const, error: errorPerfil.message };

    await sb.from("user_roles").delete().eq("user_id", userId);
    const { error: errorRol } = await sb
      .from("user_roles")
      .insert({ user_id: userId, role: data.rol });
    if (errorRol) return { ok: false as const, error: errorRol.message };

    // Si se asignó contraseña provisional, enviarla de inmediato al correo del colaborador desde Cuenta@ivadsrl.com
    if (provisional && data.clave) {
      try {
        const { enviarCorreoClaveProvisional } = await import("./correo.server");
        await enviarCorreoClaveProvisional({
          para: email,
          nombre: data.nombre.trim(),
          claveProvisional: data.clave,
        });
      } catch (errCorreo) {
        console.error("No se pudo enviar correo con clave provisional:", errCorreo);
      }
    }

    return { ok: true as const };
  });

export function normalizarWhatsApp(v: string | null | undefined): string {
  let num = (v ?? "").replace(/\D/g, "");
  // Si es un número dominicano de 10 dígitos (809, 829, 849), le anteponemos el código de país 1
  if (num.length === 10 && (num.startsWith("809") || num.startsWith("829") || num.startsWith("849"))) {
    num = "1" + num;
  }
  return num;
}

const colaboradorSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  cargo: z.string().trim().max(80).default(""),
  area: z.string().trim().max(60).default(""),
  email: z.string().trim().email("Correo electrónico inválido").max(120).optional(),
  telefono: z.string().default(""),
  whatsapp: z.string().default(""),
  canalAvisos: z.enum(["correo", "whatsapp", "ambos", "ninguno"]).default("correo"),
  salario: z.number().min(0).max(10000000).optional(),
  estado: z.enum(["activo", "ausente", "vacaciones"]).default("activo"),
});

/** Actualiza el expediente completo de un colaborador usando privilegios administrativos (service role). */
export const guardarColaboradorFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => colaboradorSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const esGestor = (roles ?? []).some(
      (r) => r.role === "Administrador" || r.role === "Recursos Humanos" || r.role === "Contabilidad",
    );
    if (!esGestor) return { ok: false as const, error: "No tienes permisos para modificar expedientes" };

    const sb = await admin();
    const whatsappNormalizado = normalizarWhatsApp(data.whatsapp);

    const fila: Record<string, unknown> = {
      nombre: data.nombre.trim(),
      cargo: data.cargo.trim(),
      area: data.area.trim(),
      telefono: data.telefono.trim(),
      whatsapp: whatsappNormalizado,
      canal_avisos: data.canalAvisos,
      estado: data.estado,
      iniciales: inicialesDe(data.nombre),
    };
    if (data.salario !== undefined) {
      fila["salario"] = data.salario;
    }

    const { error: errorPerfil } = await sb
      .from("perfiles")
      .update(fila as never)
      .eq("id", data.id);

    if (errorPerfil) return { ok: false as const, error: errorPerfil.message };

    // Si se cambió el correo, actualizar auth y perfiles
    if (data.email) {
      const nuevoEmail = data.email.trim().toLowerCase();
      const { data: actual } = await sb
        .from("perfiles")
        .select("email")
        .eq("id", data.id)
        .maybeSingle();

      if (actual?.email && nuevoEmail !== actual.email.toLowerCase()) {
        await sb.from("perfiles").update({ email: nuevoEmail }).eq("id", data.id);
        await sb.auth.admin.updateUserById(data.id, { email: nuevoEmail });
      }
    }

    return { ok: true as const, whatsapp: whatsappNormalizado };
  });

/**
 * Cambia el correo de acceso de un colaborador. Solo Administración, RR.HH. o Contabilidad.
 * Avisa por correo a la dirección nueva (y a la anterior si existe).
 */
export const cambiarCorreoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), email: z.string().email().max(120) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const autorizado = (roles ?? []).some(
      (r) =>
        r.role === "Administrador" ||
        r.role === "Recursos Humanos" ||
        r.role === "Contabilidad",
    );
    if (!autorizado)
      return {
        ok: false as const,
        error: "Solo Administración, Recursos Humanos o Contabilidad puede cambiar el correo",
      };

    const sb = await admin();
    const email = data.email.trim().toLowerCase();

    const { data: perfil } = await sb
      .from("perfiles")
      .select("email, nombre")
      .eq("id", data.id)
      .maybeSingle();
    const anterior = perfil?.email?.toLowerCase() ?? "";
    if (anterior === email) return { ok: true as const };

    const act = await sb.auth.admin.updateUserById(data.id, { email, email_confirm: true });
    if (act.error) return { ok: false as const, error: act.error.message };

    const { error } = await sb.from("perfiles").update({ email }).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };

    const { enviarCorreoInstitucional } = await import("./correo.server");
    const detalle = `Tu correo de acceso al Portal del Colaborador ahora es ${email}. Úsalo para iniciar sesión.\n\nPor seguridad, el correo de acceso solo puede cambiarlo Administración, Recursos Humanos o Contabilidad. Si no solicitaste este cambio, avísanos desde Soporte.`;
    await enviarCorreoInstitucional({
      para: email,
      nombre: perfil?.nombre ?? "",
      titulo: "Actualizamos tu correo de acceso",
      detalle,
      etiqueta: "Cuenta",
      enlace: "/perfil",
      enlaceTexto: "Ver mi perfil",
    });
    if (anterior)
      await enviarCorreoInstitucional({
        para: anterior,
        nombre: perfil?.nombre ?? "",
        titulo: "Tu correo de acceso fue actualizado",
        detalle: `A partir de ahora iniciarás sesión con ${email}. Este buzón ya no recibirá las notificaciones del portal.`,
        etiqueta: "Cuenta",
      });

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

/**
 * El propio colaborador define su contraseña definitiva cuando la que tiene
 * fue asignada por Administración (provisional).
 */
export const establecerClaveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        clave: z.string().min(6).max(72),
        confirmacion: z.string().min(6).max(72),
      })
      .refine((d) => d.clave === d.confirmacion, {
        message: "Las contraseñas no coinciden",
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = await admin();

    const act = await sb.auth.admin.updateUserById(context.userId, { password: data.clave });
    if (act.error) return { ok: false as const, error: act.error.message };

    const { error } = await sb
      .from("perfiles")
      .update({ clave_provisional: false, clave_provisional_texto: null })
      .eq("id", context.userId);
    if (error) return { ok: false as const, error: error.message };

    const { data: perfil } = await sb
      .from("perfiles")
      .select("email, nombre")
      .eq("id", context.userId)
      .maybeSingle();

    if (perfil?.email) {
      const { enviarCorreoInstitucional } = await import("./correo.server");
      await enviarCorreoInstitucional({
        para: perfil.email,
        nombre: perfil.nombre ?? "",
        titulo: "Creaste tu contraseña de acceso",
        detalle:
          "Ya reemplazaste la contraseña provisional que te asignó Administración. Desde ahora entra al Portal del Colaborador con la contraseña que acabas de crear.\n\nSi no fuiste tú, escríbenos de inmediato desde Soporte.",
        etiqueta: "Seguridad",
        enlace: "/perfil",
        enlaceTexto: "Ver mi perfil",
      });
    }

    return { ok: true as const };
  });

/**
 * Envía por correo desde Cuenta@ivadsrl.com la contraseña provisional a todos los colaboradores
 * que la tienen asignada y pendiente de primer uso. Solo Administrador / Recursos Humanos.
 */
export const enviarClavesProvisionalesPendientesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const esGestor = (roles ?? []).some(
      (r) => r.role === "Administrador" || r.role === "Recursos Humanos",
    );
    if (!esGestor) return { ok: false as const, error: "No tienes permisos para esta acción" };

    const sb = await admin();
    const { data: filas, error } = await sb
      .from("perfiles")
      .select("id, nombre, email, clave_provisional_texto")
      .eq("clave_provisional", true)
      .not("clave_provisional_texto", "is", null);

    if (error) return { ok: false as const, error: error.message };
    if (!filas || filas.length === 0) {
      return {
        ok: true as const,
        total: 0,
        enviados: 0,
        mensaje: "No hay colaboradores con contraseña provisional pendiente de primer acceso.",
      };
    }

    const { enviarCorreoClaveProvisional } = await import("./correo.server");
    let enviados = 0;
    const detalles: Array<{ nombre: string; email: string; ok: boolean; error?: string }> = [];

    for (const f of filas) {
      if (!f.email || !f.clave_provisional_texto) continue;
      const res = await enviarCorreoClaveProvisional({
        para: f.email,
        nombre: f.nombre || "Colaborador",
        claveProvisional: f.clave_provisional_texto,
      });
      if (res.ok) {
        enviados++;
        detalles.push({ nombre: f.nombre, email: f.email, ok: true });
        // Notificación interna en el portal
        await sb.from("avisos").insert({
          para_id: f.id,
          titulo: "Contraseña provisional enviada a tu correo",
          detalle: `Se enviaron tus credenciales de acceso desde Cuenta@ivadsrl.com a ${f.email}. Al ingresar deberás crear tu propia contraseña personal.`,
          nuevo: true,
        });
      } else {
        detalles.push({ nombre: f.nombre, email: f.email, ok: false, error: res.error });
      }
    }

    return {
      ok: true as const,
      total: filas.length,
      enviados,
      detalles,
    };
  });

/**
 * Envía por correo desde Cuenta@ivadsrl.com la contraseña provisional a un colaborador específico.
 */
export const enviarClaveProvisionalIndividualFn = createServerFn({ method: "POST" })
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

    const sb = await admin();
    const { data: f, error } = await sb
      .from("perfiles")
      .select("id, nombre, email, clave_provisional_texto, clave_provisional")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !f) return { ok: false as const, error: "Colaborador no encontrado" };
    if (!f.email) return { ok: false as const, error: "El colaborador no tiene correo registrado" };
    if (!f.clave_provisional_texto) {
      return {
        ok: false as const,
        error: "El colaborador no tiene una contraseña provisional asignada en el sistema",
      };
    }

    const { enviarCorreoClaveProvisional } = await import("./correo.server");
    const res = await enviarCorreoClaveProvisional({
      para: f.email,
      nombre: f.nombre || "Colaborador",
      claveProvisional: f.clave_provisional_texto,
    });

    if (!res.ok) return { ok: false as const, error: res.error ?? "No se pudo enviar el correo" };

    await sb.from("avisos").insert({
      para_id: f.id,
      titulo: "Contraseña provisional enviada a tu correo",
      detalle: `Se enviaron tus credenciales de acceso desde Cuenta@ivadsrl.com a ${f.email}. Al ingresar deberás crear tu propia contraseña personal.`,
      nuevo: true,
    });

    return { ok: true as const, email: f.email };
  });
