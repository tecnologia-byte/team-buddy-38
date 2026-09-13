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

const lineaSchema = z.object({ concepto: z.string().max(160).default(""), monto: z.number().default(0) });

const volanteSchema = z.object({
  para: z.string().optional().default(""),
  whatsapp: z.string().optional(),
  canalAvisos: z.enum(["correo", "whatsapp", "ambos", "ninguno"]).default("correo"),
  puenteWhatsappUrl: z.string().optional(),
  puenteWhatsappToken: z.string().optional(),
  comprobante: z.string().max(60).default(""),
  fechaEmision: z.string().max(40).default(""),
  periodoDesde: z.string().max(40).default(""),
  periodoHasta: z.string().max(40).default(""),
  nombre: z.string().max(120).default(""),
  cedula: z.string().max(40).optional(),
  codigo: z.string().max(40).optional(),
  cargo: z.string().max(120).optional(),
  departamento: z.string().max(120).optional(),
  ingreso: z.string().max(40).optional(),
  banco: z.string().max(120).optional(),
  seguridadSocial: z.string().max(160).optional(),
  ingresos: z.array(lineaSchema).max(20).default([]),
  deducciones: z.array(lineaSchema).max(20).default([]),
  firma: z.string().max(400000).optional(),
  firmaFecha: z.string().max(40).optional(),
  firmaEmpresa: z.string().max(400000).optional(),
  firmaEmpresaNombre: z.string().max(120).optional(),
  firmaEmpresaCargo: z.string().max(120).optional(),
});

/** Envía el recibo/volante de pago al colaborador según su canal preferido (Correo, WhatsApp o Ambos), con el PDF adjunto. */
export const enviarReciboFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => volanteSchema.parse(data))
  .handler(async ({ data }) => {
    const { despacharVolante } = await import("./volante-envio.server");
    const { para, whatsapp, canalAvisos, puenteWhatsappUrl, puenteWhatsappToken, ...volante } = data;

    const res = await despacharVolante({
      destino: {
        correo: para,
        whatsapp,
        canalAvisos,
        puenteUrl: puenteWhatsappUrl,
        puenteToken: puenteWhatsappToken,
      },
      volante,
    });

    return {
      ok: res.ok,
      medios: res.medios.join(" y "),
      advertencia: res.advertencia,
      error: res.error,
    };
  });
