import { enviarCorreoInstitucional, REMITENTE_NOMINA } from "./correo.server";
import { pesosCorreo } from "./volante-correo.server";
import { volantePdfBase64 } from "./volante-pdf.server";
import { enviarWhatsapp } from "./whatsapp.server";

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

export type DestinoVolante = {
  correo?: string | null | undefined;
  whatsapp?: string | null | undefined;
  canalAvisos?: "correo" | "whatsapp" | "ambos" | "ninguno" | string | null | undefined;
  puenteUrl?: string | null | undefined;
  puenteToken?: string | null | undefined;
};

/**
 * Despacha un volante/recibo de pago según el canal elegido por el colaborador:
 * - 'correo': Envía el PDF oficial adjunto por correo electrónico.
 * - 'whatsapp': Envía el PDF oficial adjunto por WhatsApp a través del puente Baileys.
 * - 'ambos': Envía el PDF oficial adjunto por Correo y por WhatsApp.
 * - 'ninguno': Solo queda disponible en el portal interno.
 */
export async function despacharVolante({
  destino,
  volante,
}: {
  destino: DestinoVolante;
  volante: VolanteEnvio;
}): Promise<{ ok: boolean; medios: string[]; error?: string; advertencia?: string }> {
  const canal = (destino.canalAvisos || "correo") as "correo" | "whatsapp" | "ambos" | "ninguno";
  if (canal === "ninguno") {
    return { ok: true, medios: ["Portal"] };
  }

  const bruto = volante.ingresos.reduce((s, l) => s + l.monto, 0);
  const deducido = volante.deducciones.reduce((s, l) => s + l.monto, 0);
  const neto = bruto - deducido;
  const pdf = await volantePdfBase64(volante);
  const nombrePdf = `recibo-${(volante.comprobante || "ivad").replace(/[^\w-]/g, "")}.pdf`;

  const medios: string[] = [];
  const errores: string[] = [];

  // 1. Envío por WhatsApp (PDF adjunto) si el canal es 'whatsapp' o 'ambos'
  if (canal === "whatsapp" || canal === "ambos") {
    let numWa = (destino.whatsapp ?? "").replace(/\D/g, "");
    if (numWa.length === 10 && (numWa.startsWith("809") || numWa.startsWith("829") || numWa.startsWith("849"))) {
      numWa = "1" + numWa;
    }
    if (numWa && numWa.length >= 10) {
      const textoWa =
        `Hola ${volante.nombre}, se ha emitido tu volante oficial de pago de nómina.\n\n` +
        `• Período: ${volante.periodoDesde} al ${volante.periodoHasta}\n` +
        `• Comprobante: ${volante.comprobante}\n` +
        `• Monto neto: RD$ ${pesosCorreo(neto)}\n\n` +
        `📄 Adjunto encontrarás tu volante de pago en formato PDF oficial.\n\n` +
        `🛡️ *Aviso de Seguridad y Confidencialidad IVAD:*\n` +
        `Este volante de pago ya está en tus manos y contiene información confidencial; recuerda que debes resguardarlo y cuidarlo adecuadamente bajo tu custodia y responsabilidad.\n\n` +
        `En IVAD garantizamos la seguridad y protección de datos en este sistema del personal. Cualquier información que no entiendas o consulta sobre tu seguridad, por favor comunícate con: seguridad@ivadsrl.com\n\n` +
        `Puedes consultar tu histórico en cualquier momento en el portal: https://personalivad.ivadsrl.com/nomina`;

      const resWa = await enviarWhatsapp({
        puente: destino.puenteUrl || undefined,
        para: numWa,
        texto: textoWa,
        token: destino.puenteToken || undefined,
        doc: {
          documentoBase64: pdf,
          nombreArchivo: nombrePdf,
          mimetype: "application/pdf",
        },
      }).catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : "Error WhatsApp" }));

      if (resWa.ok) {
        medios.push("WhatsApp");
      } else {
        errores.push(`WhatsApp: ${resWa.error}`);
      }
    } else {
      errores.push("Sin número de WhatsApp registrado");
    }
  }

  // 2. Envío por Correo si lo pidió, o como respaldo cuando el WhatsApp no salió
  if (canal === "correo" || canal === "ambos" || medios.length === 0) {
    const correoDestino = (destino.correo ?? "").trim();
    if (correoDestino) {
      const resCorreo = await enviarCorreoInstitucional(
        {
          para: correoDestino,
          nombre: volante.nombre,
          titulo: "Se registró tu pago de nómina",
          etiqueta: "Pago de nómina",
          detalle:
            `Contabilidad registró tu pago correspondiente al período ${volante.periodoDesde} al ${volante.periodoHasta}.\n` +
            `Comprobante No. ${volante.comprobante}\nNeto recibido: RD$ ${pesosCorreo(neto)}\n\n` +
            `Adjuntamos tu volante de pago oficial en PDF; puedes abrirlo, imprimirlo o guardarlo.\n\n` +
            `🛡️ Aviso de Seguridad y Confidencialidad IVAD:\n` +
            `Este volante de pago ya está en tus manos y contiene información confidencial; recuerda que debes resguardarlo y cuidarlo adecuadamente bajo tu custodia y responsabilidad.\n\n` +
            `En IVAD garantizamos la seguridad y protección de datos en este sistema del personal. Si hay cualquier información que no entiendas o tienes alguna consulta de seguridad, por favor comunícate con: seguridad@ivadsrl.com.`,
          enlace: "/nomina",
          enlaceTexto: "Ver mi nómina",
        },
        {
          from: REMITENTE_NOMINA,
          asunto: `Recibo de pago ${volante.comprobante || volante.periodoHasta} · IVAD`,
          adjuntos: [
            {
              filename: nombrePdf,
              content: pdf,
              contentType: "application/pdf",
            },
          ],
        },
      ).catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : "Error correo" }));

      if (resCorreo.ok) {
        medios.push("Correo");
      } else {
        errores.push(`Correo: ${resCorreo.error}`);
      }
    } else {
      errores.push("Sin correo registrado");
    }
  }

  if (medios.length > 0) {
    return {
      ok: true,
      medios,
      ...(errores.length > 0 ? { advertencia: errores.join("; ") } : {}),
    };
  }

  return { ok: false, medios: [], error: errores.join("; ") || "No se pudo entregar por ningún canal" };
}

/** Genera el PDF con el estilo del volante IVAD y lo envía al correo del colaborador. */
export async function enviarVolantePorCorreo(para: string, volante: VolanteEnvio) {
  return despacharVolante({
    destino: { correo: para, canalAvisos: "correo" },
    volante,
  });
}
