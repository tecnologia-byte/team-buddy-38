import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const tipoFechaSchema = z.enum([
  "feriado",
  "empresa",
  "reunion",
  "capacitacion",
  "pago",
  "otro",
]);

export type TipoFechaImportante = z.infer<typeof tipoFechaSchema>;

export const fechaImportanteSchema = z.object({
  id: z.string(),
  titulo: z.string().min(2, "El título debe tener al menos 2 caracteres").max(120),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (AAAA-MM-DD)"),
  tipo: tipoFechaSchema.default("empresa"),
  descripcion: z.string().max(500).optional(),
  creadoPor: z.string().optional(),
  creadoAt: z.string().optional(),
});

export type FechaImportante = z.infer<typeof fechaImportanteSchema>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Guarda la lista completa de fechas importantes del calendario en la tabla ajustes. Solo Administradores. */
export const guardarFechasImportantesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fechas: z.array(fechaImportanteSchema),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // 1. Verificar si el usuario autenticado tiene el rol de Administrador
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const esAdmin = (roles ?? []).some((r) => r.role === "Administrador");
    if (!esAdmin) {
      throw new Error("Acceso denegado: Solo los administradores pueden gestionar fechas importantes del calendario.");
    }

    // 2. Persistir en la tabla de ajustes usando el cliente administrativo
    const adminClient = await admin();
    const { error } = await adminClient.from("ajustes").upsert(
      {
        clave: "calendario_fechas_importantes",
        valor: JSON.stringify(data.fechas),
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "clave" },
    );

    if (error) {
      console.error("Error al guardar fechas importantes:", error);
      throw new Error("No se pudo guardar la fecha importante en la base de datos.");
    }

    return { ok: true };
  });
