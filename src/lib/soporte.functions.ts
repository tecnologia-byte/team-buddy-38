import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const mensajeSchema = z.object({
  rol: z.enum(["user", "assistant"]),
  texto: z.string().trim().min(1).max(2000),
});

const entradaSchema = z.object({
  mensajes: z.array(mensajeSchema).min(1).max(20),
});

const SISTEMA = `Eres el asistente virtual de soporte del Portal del Colaborador de IVAD Home & Goods (República Dominicana).
Ayudas a los empleados con: solicitudes de vacaciones, permisos y licencias, marcaje de asistencia, recibos y pagos de nómina,
firma digital, actualización de la foto de perfil, acceso al portal y contacto con Recursos Humanos.
Responde siempre en español dominicano neutro, en tono cordial y breve (máximo 5 líneas).
Si el tema requiere datos personales, montos exactos o una decisión de RR.HH., indica que el colaborador debe abrir un ticket
en el formulario de contacto de la página de Soporte o escribir por el Chat con RR.HH.`;

/** Chat de soporte con IA (Lovable AI Gateway). Solo para usuarios autenticados. */
export const soporteIaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entradaSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, error: "El asistente no está disponible en este momento." };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SISTEMA },
            ...data.mensajes.map((m) => ({ role: m.rol, content: m.texto })),
          ],
        }),
      });

      if (res.status === 429) {
        return { ok: false as const, error: "Muchas consultas seguidas. Intenta en un momento." };
      }
      if (!res.ok) {
        console.error("Fallo del asistente de soporte", res.status);
        return { ok: false as const, error: "El asistente no pudo responder. Intenta de nuevo." };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const texto = json.choices?.[0]?.message?.content?.trim();
      if (!texto) {
        return { ok: false as const, error: "El asistente no pudo responder. Intenta de nuevo." };
      }
      return { ok: true as const, texto };
    } catch (e) {
      console.error("Error del asistente de soporte", e);
      return { ok: false as const, error: "El asistente no está disponible ahora mismo." };
    }
  });
