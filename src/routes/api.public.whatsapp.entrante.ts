import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({ de: z.string().max(30).default(""), texto: z.string().min(1).max(2000) });

const INSTRUCCIONES = `Eres el asistente de WhatsApp del Portal del Colaborador de IVAD Home & Goods (República Dominicana).
Respondes en español dominicano, cordial y breve (máximo 4 líneas).
Ayudas con: permisos de salida, vacaciones, certificados de trabajo, nómina y recibos de pago, tareas asignadas y acceso al portal.
El portal está en https://personalivad.ivadsrl.com.
Nunca inventes montos, fechas ni aprobaciones: si el dato es personal, indica que lo revise en el portal o escriba a Recursos Humanos.`;

/** Recibe los mensajes que llegan al WhatsApp de la empresa y responde con IA. */
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

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ respuesta: "" });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: INSTRUCCIONES },
              { role: "user", content: cuerpo.data.texto },
            ],
          }),
        });

        if (!res.ok) {
          console.error(`IA de WhatsApp falló [${res.status}]: ${await res.text()}`);
          return Response.json({
            respuesta:
              "Gracias por escribir. En este momento no puedo responder automáticamente; " +
              "por favor entra al portal o escríbenos por Soporte.",
          });
        }

        const datos = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return Response.json({ respuesta: datos.choices?.[0]?.message?.content ?? "" });
      },
    },
  },
});
