import { enviarCorreoInstitucional, REMITENTE_NOMINA } from "./correo.server";
import { pesosCorreo } from "./volante-correo.server";
import { volantePdfBase64 } from "./volante-pdf.server";

export type LineaEnvio = { concepto: string; monto: number };

export type VolanteEnvio = {
  comprobante: string;
  fechaEmision: string;
  periodoDesde: string;
  periodoHasta: string;
  nombre: string;
  cedula?: string | undefined;
  codigo?: string | undefined;
  cargo?: string | undefined;
  departamento?: string | undefined;
  ingreso?: string | undefined;
  banco?: string | undefined;
  seguridadSocial?: string | undefined;
  ingresos: LineaEnvio[];
  deducciones: LineaEnvio[];
  firma?: string | undefined;
  firmaFecha?: string | undefined;
  firmaEmpresa?: string | undefined;
  firmaEmpresaNombre?: string | undefined;
  firmaEmpresaCargo?: string | undefined;
};

/** Genera el PDF con el estilo del volante IVAD y lo envía al correo del colaborador. */
export async function enviarVolantePorCorreo(para: string, volante: VolanteEnvio) {
  const bruto = volante.ingresos.reduce((s, l) => s + l.monto, 0);
  const deducido = volante.deducciones.reduce((s, l) => s + l.monto, 0);
  const neto = bruto - deducido;
  const pdf = await volantePdfBase64(volante);

  return enviarCorreoInstitucional(
    {
      para,
      nombre: volante.nombre,
      titulo: "Se registró tu pago de nómina",
      etiqueta: "Pago de nómina",
      detalle:
        `Contabilidad registró tu pago correspondiente al período ${volante.periodoDesde} al ${volante.periodoHasta}.\n` +
        `Comprobante No. ${volante.comprobante}\nNeto recibido: RD$ ${pesosCorreo(neto)}\n\n` +
        `Adjuntamos tu recibo de pago en PDF; puedes abrirlo, imprimirlo o guardarlo.`,
      enlace: "/nomina",
      enlaceTexto: "Ver mi nómina",
    },
    {
      from: REMITENTE_NOMINA,
      asunto: `Recibo de pago ${volante.comprobante || volante.periodoHasta} · IVAD`,
      adjuntos: [
        {
          filename: `recibo-${(volante.comprobante || "ivad").replace(/[^\w-]/g, "")}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    },
  );
}
