import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  de: z.string().max(30).default(""),
  texto: z.string().min(1).max(3000),
});

function normalizarTel(t: string): { completo: string; sinPrefijo: string } {
  let num = t.replace(/\D/g, "");
  if (num.length === 10 && (num.startsWith("809") || num.startsWith("829") || num.startsWith("849"))) {
    num = "1" + num;
  }
  const sinPrefijo = num.startsWith("1") ? num.slice(1) : num;
  return { completo: num, sinPrefijo };
}

type IntencionMimi = "CONFORME" | "INCONFORME" | "OTRO";

/**
 * Clasificador inteligente de lenguaje humano para Mimi.
 * Detecta objeciones como "me siento que es muy poco", modismos dominicanos,
 * abreviaturas, typos y lenguaje natural con Gemini 2.5 Flash y respaldo por reglas.
 */
async function clasificarIntencionHumana(
  texto: string,
  apiKey?: string,
): Promise<{ intencion: IntencionMimi; motivo?: string }> {
  const t = " " + texto.trim().toLowerCase() + " ";

  // 1. Detección prioritaria de objeciones / inconformidades
  // Si dice "pero", "muy poco", "poco", "incompleto", "no", "menos", etc., SIEMPRE es INCONFORME
  // aún si incluye palabras de cortesía como "gracias".
  const tieneObjecion =
    /(pero|muy poco|poco|incompleto|no me cuadra|no estoy conforme|no conforme|falta|faltan|menos|error|reclamo|diferencia|no me pagaron|descontaron|descuento|esperaba mas|esperaba más|no me parece|muy bajito|injusto)/i.test(
      t,
    );

  if (tieneObjecion) {
    return { intencion: "INCONFORME", motivo: texto };
  }

  // 2. Si dice 'no' explícito
  if (/(^|\s)(no|nop|negativo|para nada|que va|tengo dudas|no mimi)($|\s|[.,!])/i.test(t)) {
    return { intencion: "INCONFORME", motivo: texto };
  }

  // 3. Si dice 'sí' explícito sin objeciones
  const contieneSi =
    /(^|\s)(si|sí|sip|sipi|yes|claro|de acuerdo|conforme|recibido|correcto|exacto|todo bien|ok|dale|perfecto|confirmado|estoy conforme|todo en orden|gracias|muchas gracias|ta to bien|to bien|ta to|si mimi|lo recibi|recibi)($|\s|[.,!])/i.test(
      t,
    );

  if (contieneSi) {
    return { intencion: "CONFORME" };
  }

  // 4. Si hay API Key de Gemini, clasificación por lenguaje natural humano profundo
  if (apiKey) {
    try {
      const prompt = `Eres Mimi, asistente de Recursos Humanos y Nómina de IVAD SRL (República Dominicana).
A un colaborador se le envió el resumen de su volante de pago y se le preguntó si se siente conforme con su pago registrado (SÍ o NO).

Mensaje recibido del colaborador: "${texto}"

Clasifica la intención del colaborador en una de estas 3 categorías:
1. CONFORME: Si el colaborador confirma, acepta, dice que sí, que todo está bien, que ya lo vio, agradece o expresa satisfacción (ejemplos: "si", "sí", "claro mimi", "todo bien gracias", "conforme", "recibido", "perfecto", "siii todo fino", "dale mandame el volante", "ta to bien").
2. INCONFORME: Si el colaborador rechaza, dice que no, manifiesta que el monto es poco, que le falta dinero, que tiene dudas, que no le cuadra o que hay un error (ejemplos: "no", "gracias pero me siento que es muy poco", "no estoy conforme", "falta dinero", "me faltaron horas extras").
3. OTRO: Si el mensaje es una pregunta general o saludo no relacionado.

Responde ÚNICAMENTE en formato JSON estricto:
{"intencion": "CONFORME" | "INCONFORME" | "OTRO", "motivo": "explicación o null"}`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const contenido = json?.choices?.[0]?.message?.content;
        if (contenido) {
          const parsed = JSON.parse(contenido);
          if (parsed.intencion) {
            return {
              intencion: parsed.intencion as IntencionMimi,
              motivo: parsed.motivo ? String(parsed.motivo) : texto,
            };
          }
        }
      }
    } catch (e) {
      console.error("Error en clasificación IA de Mimi:", e);
    }
  }

  return { intencion: "OTRO" };
}

/**
 * Genera una respuesta 100% humana, empática y personalizada con Gemini IA
 * cuando el colaborador manifiesta cualquier inconformidad con su pago.
 */
async function generarRespuestaHumanaInconformidad({
  nombre,
  mensajeUsuario,
  volante,
  apiKey,
}: {
  nombre: string;
  mensajeUsuario: string;
  volante: { comprobante?: string; periodo_desde?: string; periodo_hasta?: string; neto?: number };
  apiKey?: string;
}): Promise<string> {
  const primerNombre = nombre.split(" ")[0] || "colaborador";

  if (apiKey) {
    try {
      const prompt = `Eres Mimi, la asistente de Recursos Humanos y Nómina de la empresa IVAD SRL en República Dominicana.
Un colaborador llamado ${nombre} ha recibido su volante de pago (${volante.comprobante || "Nómina"}, período del ${volante.periodo_desde} al ${volante.periodo_hasta}, Neto RD$ ${volante.neto}) y ha manifestado su inconformidad o duda por WhatsApp.

Mensaje exacto del colaborador: "${mensajeUsuario}"

Tu misión:
1. Responde como una persona humana real de Recursos Humanos: muy empática, cálida, respetuosa y comprensiva. ¡NUNCA suenes como un robot o una plantilla automatizada!
2. Valida con empatía lo que el colaborador expresó (por ejemplo, si dice que siente que es muy poco o que faltan horas, dile con calidez que comprendes su inquietud respecto a lo devengado).
3. Infórmale que ya has tomado nota de sus observaciones, que has abierto un caso formal y que se lo pasaste de inmediato al equipo de Soporte y Recursos Humanos para que revisen los cálculos detallados de su pago con prioridad.
4. Explícale que si desea enviar fotos de sus registros, comprobantes de horas o hablar directamente con el departamento de Nómina, puede comunicarse a:
   📧 nomina@ivadsrl.com
5. Despídete asegurándole que su caso está en manos del equipo y se le dará pronta respuesta.
6. Mantén la respuesta en 2 o 3 párrafos concisos y bien formateados para WhatsApp (puedes usar negritas y emojis discretos).`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const contenido = json?.choices?.[0]?.message?.content?.trim();
        if (contenido) return contenido;
      }
    } catch (e) {
      console.error("Error generando respuesta humana con Gemini:", e);
    }
  }

  // Fallback humano y empático si la IA no estuviese disponible
  return (
    `Entiendo perfectamente cómo te sientes, ${primerNombre}. Lamento mucho que sientas que el monto recibido no es el esperado o que tengas alguna diferencia con tu volante de pago.\n\n` +
    `Ya he registrado formalmente tu caso y le pasé el reporte con prioridad al equipo de Recursos Humanos y Nómina para que revisen los cálculos detallados de tu período.\n\n` +
    `Si tienes algún comprobante de tus horas o deseas comunicarte directamente con el departamento de nómina, puedes escribirles a:\n` +
    `📧 *nomina@ivadsrl.com*\n\n` +
    `¡Estamos trabajando para darte una respuesta clara y justa a la mayor brevedad posible!`
  );
}

/** Recibe los mensajes que llegan al WhatsApp de la empresa y los atiende con la IA Mimi. */
export const Route = createFileRoute("/api/public/whatsapp/entrante")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Validación estricta del token del puente (header x-puente-token, Authorization Bearer o ?token=)
        if (!(await validarTokenPuente(request))) {
          return new Response("No autorizado", { status: 401 });
        }


        const cuerpo = schema.safeParse(await request.json().catch(() => null));
        if (!cuerpo.success) return new Response("Datos inválidos", { status: 400 });

        let { completo: numCompleto, sinPrefijo } = normalizarTel(cuerpo.data.de);
        // Soporte para identidades LID de WhatsApp (mapeo directo del LID de Luis Alonzo)
        if (
          numCompleto === "191500109537421" ||
          sinPrefijo === "191500109537421" ||
          cuerpo.data.de.includes("191500109537421")
        ) {
          numCompleto = "18494252220";
          sinPrefijo = "8494252220";
        }

        const textoUsuario = cuerpo.data.texto.trim();
        const apiKey = process.env["LOVABLE_API_KEY"];

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Identificar al colaborador en el expediente de perfiles de forma robusta
        let perfil: { id: string; nombre: string; email: string; whatsapp: string } | null = null;
        if (numCompleto || sinPrefijo) {
          // Búsqueda secuencial segura para evitar incompatibilidades de sintaxis en PostgREST
          const { data: p1 } = await supabaseAdmin
            .from("perfiles")
            .select("id, nombre, email, whatsapp")
            .eq("whatsapp", numCompleto)
            .maybeSingle();

          if (p1) {
            perfil = p1;
          } else {
            const { data: p2 } = await supabaseAdmin
              .from("perfiles")
              .select("id, nombre, email, whatsapp")
              .eq("whatsapp", sinPrefijo)
              .maybeSingle();

            if (p2) {
              perfil = p2;
            } else {
              const { data: p3 } = await supabaseAdmin
                .from("perfiles")
                .select("id, nombre, email, whatsapp")
                .ilike("whatsapp", `%${sinPrefijo}%`)
                .maybeSingle();

              if (p3) {
                perfil = p3;
              } else {
                const { data: p4 } = await supabaseAdmin
                  .from("perfiles")
                  .select("id, nombre, email, whatsapp")
                  .ilike("telefono", `%${sinPrefijo}%`)
                  .maybeSingle();
                if (p4) perfil = p4;
              }
            }
          }
        }

        // REGLA ESTRICTA: Si no es un colaborador registrado, Mimi permanece en silencio total (no responde)
        if (!perfil) {
          return Response.json({ respuesta: "" });
        }

        // 2. Buscar el último volante registrado para este colaborador
        const { data: volanteUltimo } = await supabaseAdmin
          .from("volantes")
          .select("*")
          .eq("colaborador_id", perfil.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const primerNombre = perfil.nombre.split(" ")[0] || "colaborador";

        // REGLA ESTRICTA DE AUTO-DESACTIVACIÓN:
        // Si no hay volante pendiente o si el volante ya fue concluido (Conforme o Reclamo),
        // Mimi ya completó su función y permanece apagada en silencio para no invadir el chat.
        if (!volanteUltimo) {
          return Response.json({ respuesta: "" });
        }

        const estadoVolante = volanteUltimo.estado;
        if (estadoVolante === "Conforme" || estadoVolante === "Reclamo") {
          return Response.json({ respuesta: "" });
        }

        // 4. Manejo de notas de voz
        if (textoUsuario.startsWith("[Nota de voz") || textoUsuario.startsWith("[Archivo multimedia")) {
          return Response.json({
            respuesta:
              `¡Hola, ${primerNombre}! 👋 He recibido tu mensaje.\n\n` +
              `Para procesar tu volante en el sistema oficial, por favor respóndeme por texto:\n` +
              `👉 Responde *SÍ* si estás conforme con tu pago para enviarte de inmediato tu volante en PDF firmado.\n` +
              `👉 Responde *NO* si tienes alguna inconformidad o duda sobre tus horas extras, deducciones o monto.`,
          });
        }

        // 5. Si el volante está esperando explicación de motivo (estado "EsperandoMotivo"):
        if (estadoVolante === "EsperandoMotivo") {
          // El colaborador está enviando la explicación de por qué no está conforme
          await supabaseAdmin.from("soporte_tickets").insert({
            creador_id: perfil.id,
            nombre: perfil.nombre,
            email: perfil.email,
            categoria: "Nómina",
            asunto: `Reclamo de Volante ${volanteUltimo.comprobante || ""} · ${perfil.nombre}`,
            mensaje:
              `Inconformidad manifestada por WhatsApp respecto al volante de pago ` +
              `(${volanteUltimo.periodo_desde} al ${volanteUltimo.periodo_hasta}, Neto: RD$ ${volanteUltimo.neto}):\n\n` +
              `Motivo explicado por el colaborador:\n"${textoUsuario}"`,
            estado: "Abierto",
          });

          // Actualizar estado a 'Reclamo' -> Mimi se desactiva a partir de este momento
          await supabaseAdmin
            .from("volantes")
            .update({ estado: "Reclamo", updated_at: new Date().toISOString() })
            .eq("id", volanteUltimo.id);

          await supabaseAdmin.from("avisos").insert({
            para_id: perfil.id,
            titulo: "Reclamo de nómina transferido a soporte",
            detalle: `Mimi transfirió tus observaciones al equipo de Recursos Humanos y Nómina.`,
            nuevo: true,
          });

          const respuesta = await generarRespuestaHumanaInconformidad({
            nombre: perfil.nombre,
            mensajeUsuario: textoUsuario,
            volante: volanteUltimo,
            apiKey,
          });

          return Response.json({ respuesta });
        }

        // 5. Si el volante está en estado "PendienteConformidad" o "Emitido":
        // Mimi analiza el mensaje con comprensión de lenguaje natural humano
        const { intencion, motivo } = await clasificarIntencionHumana(textoUsuario, apiKey);

        // --- CASO 1: EL COLABORADOR ESTÁ CONFORME (SÍ) ---
        if (intencion === "CONFORME") {
          try {
            const { volantePdfBase64 } = await import("@/lib/volante-pdf.server");
            const datosVolante = (volanteUltimo.datos || {}) as import("@/lib/volante-envio.server").VolanteEnvio;

            datosVolante.nombre = datosVolante.nombre || perfil.nombre;
            datosVolante.periodoDesde = datosVolante.periodoDesde || volanteUltimo.periodo_desde;
            datosVolante.periodoHasta = datosVolante.periodoHasta || volanteUltimo.periodo_hasta;
            datosVolante.comprobante = datosVolante.comprobante || volanteUltimo.comprobante;

            const pdfBase64 = await volantePdfBase64(datosVolante);
            const nombrePdf = `volante-${(volanteUltimo.comprobante || "pago").replace(/[^\w-]/g, "")}.pdf`;

            // Actualizar estado a 'Conforme' -> Mimi se desactiva para futuros mensajes
            await supabaseAdmin
              .from("volantes")
              .update({
                estado: "Conforme",
                enviado_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", volanteUltimo.id);

            // Marcar recibo en pagos como Conforme
            await supabaseAdmin
              .from("pagos")
              .update({ recibo: "Conforme", estado: "Pagado" })
              .eq("colaborador_id", perfil.id)
              .eq("periodo", volanteUltimo.periodo_hasta);

            // Registrar aviso interno en el portal
            await supabaseAdmin.from("avisos").insert({
              para_id: perfil.id,
              titulo: `Volante ${volanteUltimo.comprobante || ""} confirmado`,
              detalle: `Confirmaste conformidad por WhatsApp con Mimi para el pago del período ${volanteUltimo.periodo_desde} al ${volanteUltimo.periodo_hasta}.`,
              nuevo: true,
            });

            const respuesta =
              `¡Excelente, ${primerNombre}! 🎉 Me alegra mucho saber que todo está en orden y te sientes conforme.\n\n` +
              `📄 Te adjunto de inmediato tu volante oficial de pago en formato PDF debidamente firmado.\n\n` +
              `¡Que disfrutes tu pago! 🥳 Recuerda que este documento ya está en tus manos; resguárdalo y cuídalo adecuadamente bajo tu custodia y responsabilidad.\n\n` +
              `🛡️ En IVAD garantizamos total seguridad y confidencialidad en este sistema del personal. Cualquier duda o consulta sobre tu seguridad, por favor comunícate con: seguridad@ivadsrl.com.`;

            // Envía el texto y el archivo PDF adjunto
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
            return Response.json({
              respuesta:
                `¡Excelente, ${primerNombre}! Me alegra que estés conforme. ` +
                `Puedes descargar tu volante oficial con firma digital en https://personalivad.ivadsrl.com/nomina. ¡Que disfrutes tu pago!`,
            });
          }
        }

        // --- CASO 2: EL COLABORADOR ESTÁ INCONFORME (DICE NO, MONTO POCO, DIFERENCIA, ETC.) ---
        if (intencion === "INCONFORME") {
          const motivoFinal = motivo || textoUsuario;

          // 1. Abrir ticket formal en soporte_tickets para Nómina y Recursos Humanos
          await supabaseAdmin.from("soporte_tickets").insert({
            creador_id: perfil.id,
            nombre: perfil.nombre,
            email: perfil.email,
            categoria: "Nómina",
            asunto: `Inconformidad Volante ${volanteUltimo.comprobante || ""} · ${perfil.nombre}`,
            mensaje:
              `Inconformidad manifestada por WhatsApp respecto al volante de pago ` +
              `(${volanteUltimo.periodo_desde} al ${volanteUltimo.periodo_hasta}, Neto RD$ ${volanteUltimo.neto}):\n\n` +
              `Observaciones del colaborador:\n"${motivoFinal}"`,
            estado: "Abierto",
          });

          // 2. Actualizar estado a 'Reclamo' -> Mimi se auto-desactiva de inmediato
          await supabaseAdmin
            .from("volantes")
            .update({ estado: "Reclamo", updated_at: new Date().toISOString() })
            .eq("id", volanteUltimo.id);

          // 3. Registrar aviso interno en el portal del colaborador
          await supabaseAdmin.from("avisos").insert({
            para_id: perfil.id,
            titulo: "Caso de nómina transferido a soporte",
            detalle: `Mimi registró tus observaciones sobre el volante y transfirió el caso al equipo de Recursos Humanos y Nómina.`,
            nuevo: true,
          });

          // 4. Generar respuesta 100% humana, empática y personalizada con IA (sin plantillas robóticas)
          const respuesta = await generarRespuestaHumanaInconformidad({
            nombre: perfil.nombre,
            mensajeUsuario: motivoFinal,
            volante: volanteUltimo,
            apiKey,
          });

          return Response.json({ respuesta });
        }

        // Si es otro mensaje no concluyente mientras el volante está pendiente, Mimi le recuerda amablemente
        return Response.json({
          respuesta:
            `Hola ${primerNombre}, tenemos registrado tu volante de pago (${volanteUltimo.periodo_desde} al ${volanteUltimo.periodo_hasta}, Neto RD$ ${volanteUltimo.neto}).\n\n` +
            `¿Confirmas que te sientes conforme con este pago? (Responde SÍ para enviarte tu volante en PDF, o NO si tienes alguna inconformidad).`,
        });
      },
    },
  },
});
