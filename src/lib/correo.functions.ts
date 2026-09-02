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
  para: z.string().email(),
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
});

/** Envía el recibo/volante de pago al colaborador desde nomina@ivadsrl.com, con el documento adjunto. */
export const enviarReciboFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => volanteSchema.parse(data))
  .handler(async ({ data }) => {
    const { enviarCorreoInstitucional, REMITENTE_NOMINA } = await import("./correo.server");
    const { volanteHtml, pesosCorreo } = await import("./volante-correo.server");
    const { para, ...volante } = data;

    const bruto = volante.ingresos.reduce((s, l) => s + l.monto, 0);
    const deducido = volante.deducciones.reduce((s, l) => s + l.monto, 0);
    const neto = bruto - deducido;
    const html = volanteHtml(volante);

    return enviarCorreoInstitucional(
      {
        para,
        nombre: volante.nombre,
        titulo: "Se registró tu pago de nómina",
        etiqueta: "Pago de nómina",
        detalle:
          `Contabilidad registró tu pago correspondiente al período ${volante.periodoDesde} al ${volante.periodoHasta}.\n` +
          `Comprobante No. ${volante.comprobante}\nNeto recibido: RD$ ${pesosCorreo(neto)}\n\n` +
          `Adjuntamos tu recibo de pago; puedes abrirlo, imprimirlo o guardarlo como PDF.`,
        enlace: "/nomina",
        enlaceTexto: "Ver mi nómina",
      },
      {
        from: REMITENTE_NOMINA,
        asunto: `Recibo de pago ${volante.comprobante || volante.periodoHasta} · IVAD`,
        adjuntos: [
          {
            filename: `recibo-${(volante.comprobante || "ivad").replace(/[^\w-]/g, "")}.html`,
            content: Buffer.from(html, "utf-8").toString("base64"),
          },
        ],
      },
    );
  });
