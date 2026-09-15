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

  // 1. Envío por WhatsApp con la IA Mimi (Consulta de Conformidad interactiva)
  if (canal === "whatsapp" || canal === "ambos") {
    let numWa = (destino.whatsapp ?? "").replace(/\D/g, "");
    if (numWa.length === 10 && (numWa.startsWith("809") || numWa.startsWith("829") || numWa.startsWith("849"))) {
      numWa = "1" + numWa;
    }
    if (numWa && numWa.length >= 10) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: colab } = await supabaseAdmin
          .from("perfiles")
          .select("id")
          .or(`whatsapp.eq.${numWa},email.eq.${destino.correo || ""}`)
          .maybeSingle();

        if (colab?.id) {
          const { data: existente } = await supabaseAdmin
            .from("volantes")
            .select("id")
            .eq("colaborador_id", colab.id)
            .eq("comprobante", volante.comprobante)
            .maybeSingle();

          if (existente?.id) {
            await supabaseAdmin.from("volantes").update({
              periodo_desde: volante.periodoDesde,
              periodo_hasta: volante.periodoHasta,
              fecha_emision: volante.fechaEmision,
              neto,
              datos: volante as never,
              estado: "PendienteConformidad",
              updated_at: new Date().toISOString(),
            }).eq("id", existente.id);
          } else {
            await supabaseAdmin.from("volantes").insert({
              colaborador_id: colab.id,
              comprobante: volante.comprobante,
              periodo_desde: volante.periodoDesde,
              periodo_hasta: volante.periodoHasta,
              fecha_emision: volante.fechaEmision,
              neto,
              datos: volante as never,
              estado: "PendienteConformidad",
            });
          }
        }
      } catch (errDb) {
        console.error("Error guardando volante para Mimi:", errDb);
      }

      const textoWa =
        `¡Hola ${volante.nombre.split(" ")[0]}! 👋 Soy *Mimi*, tu asistente de Gestión Humana y Nómina de IVAD.\n\n` +
        `Se ha registrado tu volante oficial de pago:\n` +
        `• Período: ${volante.periodoDesde} al ${volante.periodoHasta}\n` +
        `• Comprobante: ${volante.comprobante}\n` +
        `• Monto neto: RD$ ${pesosCorreo(neto)}\n\n` +
        `👉 *¿Te sientes conforme con este pago registrado?*\n\n` +
        `• Responde *SÍ* si estás conforme para enviarte de inmediato tu volante oficial en PDF debidamente firmado.\n` +
        `• Responde *NO* si tienes alguna duda, reclamo o diferencia.\n\n` +
        `🛡️ *Aviso de Seguridad y Confidencialidad IVAD:*\n` +
        `En IVAD garantizamos total seguridad en este sistema del personal. Cualquier consulta o duda sobre tu seguridad, por favor comunícate con: seguridad@ivadsrl.com.`;

      const resWa = await enviarWhatsapp({
        puente: destino.puenteUrl || undefined,
        para: numWa,
        texto: textoWa,
        token: destino.puenteToken || undefined,
      }).catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : "Error WhatsApp" }));

      if (resWa.ok) {
        medios.push("WhatsApp (Mimi)");
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
