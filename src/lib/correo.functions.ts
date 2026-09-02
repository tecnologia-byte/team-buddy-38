import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  para: z.string().email(),
  nombre: z.string().default(""),
  titulo: z.string().min(2).max(150),
  detalle: z.string().max(3000).default(""),
  etiqueta: z.string().max(40).default("Notificación"),
  enlace: z.string().max(200).optional(),
  enlaceTexto: z.string().max(60).optional(),
  insignias: z.boolean().optional(),
});

/** Envía un correo institucional a un colaborador (solo con sesión activa). */
export const enviarCorreoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { enviarCorreoInstitucional } = await import("./correo.server");
    return enviarCorreoInstitucional(data);
  });
