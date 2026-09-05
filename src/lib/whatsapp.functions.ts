import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const puenteSchema = z.object({ puente: z.string().url().max(300) });

const resultado = <T,>(fn: () => Promise<T>) =>
  fn().catch((e: unknown) => ({
    ok: false as const,
    error: e instanceof Error ? e.message : "Error del puente de WhatsApp",
  }));

/** Estado de la conexión de WhatsApp y QR pendiente de escanear. */
export const estadoWhatsappFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => puenteSchema.parse(data))
  .handler(async ({ data }) =>
    resultado(async () => {
      const { estadoPuente } = await import("./whatsapp.server");
      const e = await estadoPuente(data.puente);
      return { ok: true as const, ...e };
    }),
  );

/** Envía un mensaje de WhatsApp a un colaborador. */
export const enviarWhatsappFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    puenteSchema.extend({ para: z.string().min(8).max(20), texto: z.string().min(1).max(3000) }).parse(data),
  )
  .handler(async ({ data }) =>
    resultado(async () => {
      const { enviarWhatsapp } = await import("./whatsapp.server");
      await enviarWhatsapp(data.puente, data.para, data.texto);
      return { ok: true as const };
    }),
  );

/** Cierra la sesión de WhatsApp para vincular otro teléfono. */
export const desvincularWhatsappFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => puenteSchema.parse(data))
  .handler(async ({ data }) =>
    resultado(async () => {
      const { cerrarPuente } = await import("./whatsapp.server");
      await cerrarPuente(data.puente);
      return { ok: true as const };
    }),
  );
