import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  de: z.string().max(30).default(""),
  texto: z.string().min(1).max(3000),
});

const INSTRUCCIONES_MIMI = `Eres Mimi, la asistente inteligente de Recursos Humanos y Nómina de IVAD Home & Goods (República Dominicana).
Tu personalidad es amable, profesional, empática y cordial, con acento dominicano educado.
Ayudas al personal con: volantes de pago y nómina, dudas salariales, vacaciones, permisos, asistencia y acceso al portal en https://personalivad.ivadsrl.com.
Canales oficiales de contacto:
- Nómina y aclaraciones de pago: nomina@ivadsrl.com
- Seguridad del personal y confidencialidad: seguridad@ivadsrl.com
Responde de forma concisa (máximo 4 o 5 líneas). Nunca inventes información personal ni confirmes pagos sin respaldo.`;

function normalizarTel(t: string): { completo: string; sinPrefijo: string } {
  let num = t.replace(/\D/g, "");
  if (num.length === 10 && (num.startsWith("809") || num.startsWith("829") || num.startsWith("849"))) {
    num = "1" + num;
  }
  const sinPrefijo = num.startsWith("1") ? num.slice(1) : num;
  return { completo: num, sinPrefijo };
}

function esRespuestaAfirmativa(texto: string): boolean {
  const t = texto.trim().toLowerCase();
  // Respuestas directas o frases afirmativas
  return (
    /^(si|sí|sip|sipi|yes|claro|de acuerdo|conforme|recibido|correcto|exacto|todo bien|ok|dale|perfecto|confirmado|estoy conforme|todo en orden|gracias|muchas gracias)[\s.!,]*$/i.test(t) ||
    /\b(si|sí),?\s+(estoy conforme|todo bien|de acuerdo|correcto|gracias)\b/i.test(t) ||
    /\b(estoy conforme|recibí conforme|todo bien gracias|todo correcto)\b/i.test(t)
  );
}

function esRespuestaNegativa(texto: string): boolean {
  const t = texto.trim().toLowerCase();
  return (
    /^(no|nop|negativo|inconforme|no estoy conforme|no conforme|no me cuadra|hay un error|tengo dudas|falta|faltan)[\s.!,]*$/i.test(t) ||
    /\b(no estoy conforme|no me cuadra|me falta|me descontaron|hay un error|no cuadra|tengo un reclamo|no recibi completo)\b/i.test(t)
  );
}

/** Recibe los mensajes que llegan al WhatsApp de la empresa y responde con IA Mimi. */
export const Route = createFileRoute("/api/public/whatsapp/entrante")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["WHATSAPP_PUENTE_TOKEN"]?.trim() || "ivad-secret-token";
        const headerToken = request.headers.get("x-puente-token")?.trim();
        if (headerToken !== token) {
          return new Response("No autorizado", { status: 401 });
        }

        const cuerpo = schema.safeParse(await request.json().catch(() => null));
        if (!cuerpo.success) return new Response("Datos inválidos", { status: 400 });

        const { completo: numCompleto, sinPrefijo } = normalizarTel(cuerpo.data.de);
        const textoUsuario = cuerpo.data.texto.trim();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Identificar colaborador en la base de datos por su WhatsApp o teléfono
        let perfil: { id: string; nombre: string; email: string; whatsapp: string } | null = null;
        if (numCompleto) {
          const { data: p } = await supabaseAdmin
            .from("perfiles")
            .select("id, nombre, email, whatsapp")
            .or(`whatsapp.eq.${numCompleto},whatsapp.eq.${sinPrefijo},telefono.eq.${numCompleto},telefono.eq.${sinPrefijo}`)
            .limit(1)
            .maybeSingle();
          if (p) perfil = p;
        }

        // 2. Si el colaborador fue identificado, revisar si tiene un volante pendiente o reciente
        if (perfil) {
          const { data: volantePendiente } = await supabaseAdmin
            .from("volantes")
            .select("*")
            .eq("colaborador_id", perfil.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const tieneVolanteActivo =
            volantePendiente &&
            (volantePendiente.estado === "PendienteConformidad" ||
              volantePendiente.estado === "Emitido" ||
              volantePendiente.estado === "Borrador");

          const primerNombre = perfil.nombre.split(" ")[0] || "colaborador";

          // CASO A: EL COLABORADOR DICE QUE SÍ (CONFORME)
          if (tieneVolanteActivo && esRespuestaAfirmativa(textoUsuario)) {
            try {
              const { volantePdfBase64 } = await import("@/lib/volante-pdf.server");
              const datosVolante = (volantePendiente.datos || {}) as import("@/lib/volante-envio.server").VolanteEnvio;

              // Asegurar datos mínimos en caso de faltar
              datosVolante.nombre = datosVolante.nombre || perfil.nombre;
              datosVolante.periodoDesde = datosVolante.periodoDesde || volantePendiente.periodo_desde;
              datosVolante.periodoHasta = datosVolante.periodoHasta || volantePendiente.periodo_hasta;
              datosVolante.comprobante = datosVolante.comprobante || volantePendiente.comprobante;

              const pdfBase64 = await volantePdfBase64(datosVolante);
              const nombrePdf = `volante-${(volantePendiente.comprobante || "pago").replace(/[^\w-]/g, "")}.pdf`;

              // Actualizar estado en volantes a Conforme
              await supabaseAdmin
                .from("volantes")
                .update({
                  estado: "Conforme",
                  enviado_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", volantePendiente.id);

              // Marcar recibo en pagos como Conforme
              await supabaseAdmin
                .from("pagos")
                .update({ recibo: "Conforme", estado: "Pagado" })
                .eq("colaborador_id", perfil.id)
                .eq("periodo", volantePendiente.periodo_hasta);

              // Registrar aviso interno en el portal
              await supabaseAdmin.from("avisos").insert({
                para_id: perfil.id,
                titulo: `Volante ${volantePendiente.comprobante || ""} confirmado`,
                detalle: `Confirmaste conformidad por WhatsApp con Mimi para el pago del período ${volantePendiente.periodo_desde} al ${volantePendiente.periodo_hasta}.`,
                nuevo: true,
              });

              const respuesta =
                `¡Excelente, ${primerNombre}! 🎉 Me alegra mucho saber que todo está en orden y te sientes conforme.\n\n` +
                `📄 Te adjunto de inmediato tu volante oficial de pago en formato PDF debidamente firmado.\n\n` +
                `¡Que disfrutes tu pago! 🥳 Recuerda que este documento ya está en tus manos; resguárdalo y cuídalo adecuadamente.\n\n` +
                `🛡️ En IVAD garantizamos total seguridad y confidencialidad en este sistema del personal. Cualquier duda, escríbenos a: seguridad@ivadsrl.com.`;

              return Response.json({
                respuesta,
                doc: {
                  documentoBase64: pdfBase64,
                  nombreArchivo: nombrePdf,
                  mimetype: "application/pdf",
                },
              });
            } catch (errPdf) {
              console.error("Error generando PDF para Mimi WhatsApp:", errPdf);
            }
          }

          // CASO B: EL COLABORADOR DICE QUE NO (INCONFORME)
          if (tieneVolanteActivo && esRespuestaNegativa(textoUsuario)) {
            // Revisar si ya explicó el motivo en el mismo mensaje (más de 15 caracteres con detalle)
            const tieneDetalle =
              textoUsuario.length > 15 &&
              !/^(no|inconforme|no estoy conforme|no me cuadra)[\s.!,]*$/i.test(textoUsuario);

            if (!tieneDetalle) {
              // Preguntar por qué con amabilidad
              const respuesta =
                `Entiendo perfectamente, ${primerNombre}. 📝\n\n` +
                `¿Podrías indicarme cuál es el motivo o qué diferencia tienes con respecto a tu pago (horas extras, comisiones, deducciones o monto)?\n\n` +
                `De esa manera podré registrar tu caso y pasarle el dato de inmediato a soporte.`;
              return Response.json({ respuesta });
            } else {
              // Ya explicó el motivo: registrar ticket en soporte de RRHH y escalar a nomina@ivadsrl.com
              await supabaseAdmin.from("soporte_tickets").insert({
                creador_id: perfil.id,
                nombre: perfil.nombre,
                email: perfil.email,
                categoria: "Nómina",
                asunto: `Reclamo de Volante ${volantePendiente.comprobante || ""} · ${perfil.nombre}`,
                mensaje:
                  `Inconformidad manifestada por WhatsApp con Mimi respecto al volante de pago ` +
                  `(${volantePendiente.periodo_desde} al ${volantePendiente.periodo_hasta}, Neto RD$ ${volantePendiente.neto}):\n\n` +
                  `Motivo indicado por el colaborador:\n"${textoUsuario}"`,
                estado: "Abierto",
              });

              await supabaseAdmin
                .from("volantes")
                .update({ estado: "Reclamo", updated_at: new Date().toISOString() })
                .eq("id", volantePendiente.id);

              await supabaseAdmin.from("avisos").insert({
                para_id: perfil.id,
                titulo: "Reclamo de nómina registrado",
                detalle: `Mimi registró tus comentarios sobre el pago. Tu caso fue transferido a soporte de Recursos Humanos.`,
                nuevo: true,
              });

              const respuesta =
                `Comprendo la situación, ${primerNombre}. He registrado tus comentarios y le pasaré el dato al equipo de soporte y Recursos Humanos para que revisen tu caso con prioridad.\n\n` +
                `También puedes comunicarte directamente con nuestro departamento de nómina en:\n` +
                `📧 *nomina@ivadsrl.com*\n\n` +
                `O para cualquier duda de seguridad de datos:\n` +
                `📧 *seguridad@ivadsrl.com*\n\n` +
                `Estamos trabajando para ayudarte y darte una pronta respuesta. ¡Gracias por avisarnos!`;

              return Response.json({ respuesta });
            }
          }

          // Si el volante estaba en estado Reclamo y el colaborador envía detalles adicionales
          if (volantePendiente && volantePendiente.estado === "Reclamo" && textoUsuario.length > 5) {
            await supabaseAdmin.from("soporte_tickets").insert({
              creador_id: perfil.id,
              nombre: perfil.nombre,
              email: perfil.email,
              categoria: "Nómina",
              asunto: `Detalle adicional de reclamo · ${perfil.nombre}`,
              mensaje: `Detalle adicional enviado por WhatsApp a Mimi:\n"${textoUsuario}"`,
              estado: "Abierto",
            });

            const respuesta =
              `Anotado, ${primerNombre}. He agregado este detalle a tu caso de soporte para el equipo de nómina.\n\n` +
              `Recuerda que para seguimiento directo puedes escribir a:\n` +
              `📧 *nomina@ivadsrl.com*`;
            return Response.json({ respuesta });
          }
        }

        // 3. Si no hay interacción de volante de pago pendiente, Mimi responde como asistente general con Gemini
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({
            respuesta:
              "¡Hola! Soy Mimi de IVAD. Para consultas sobre tu nómina o solicitudes, " +
              "puedes acceder al portal en https://personalivad.ivadsrl.com o escribir a nomina@ivadsrl.com.",
          });
        }

        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: INSTRUCCIONES_MIMI },
                { role: "user", content: textoUsuario },
              ],
            }),
          });

          if (!res.ok) {
            return Response.json({
              respuesta:
                "Gracias por comunicarte con IVAD. Para consultas sobre tu cuenta o nómina, " +
                "entra a https://personalivad.ivadsrl.com o escribe a nomina@ivadsrl.com.",
            });
          }

          const datos = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          return Response.json({
            respuesta:
              datos.choices?.[0]?.message?.content ??
              "Gracias por escribir. Puedes consultar tu información en https://personalivad.ivadsrl.com.",
          });
        } catch (e) {
          console.error("Error en llamada a Gemini para Mimi:", e);
          return Response.json({
            respuesta:
              "Gracias por escribir a IVAD. Puedes consultar tus pagos y datos en https://personalivad.ivadsrl.com o contactar a nomina@ivadsrl.com.",
          });
        }
      },
    },
  },
});
