import { createFileRoute } from "@tanstack/react-router";

import { validarTokenPuente } from "@/lib/puente-auth.server";

function validarToken(request: Request): Promise<boolean> {
  return validarTokenPuente(request);
}


export const Route = createFileRoute("/api/public/whatsapp/sesion")({
  server: {
    handlers: {
      // 1. Obtener la sesión respaldada de WhatsApp para que el puente la restaure al encender o reiniciar
      GET: async ({ request }) => {
        if (!validarToken(request)) {
          return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("ajustes")
          .select("valor, updated_at")
          .eq("clave", "whatsapp_baileys_sesion")
          .maybeSingle();

        if (error || !data?.valor) {
          return new Response(
            JSON.stringify({ ok: false, mensaje: "No hay sesión respaldada en base de datos." }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        try {
          const archivos = JSON.parse(data.valor);
          return new Response(
            JSON.stringify({
              ok: true,
              archivos,
              actualizadoEn: data.updated_at,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch {
          return new Response(
            JSON.stringify({ ok: false, error: "Error al deserializar sesión de base de datos" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },

      // 2. Guardar o sincronizar credenciales de WhatsApp en Supabase
      POST: async ({ request }) => {
        if (!validarToken(request)) {
          return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const cuerpo = (await request.json().catch(() => null)) as {
          archivos?: Record<string, string>;
        } | null;

        if (!cuerpo?.archivos || typeof cuerpo.archivos !== "object") {
          return new Response(
            JSON.stringify({ ok: false, error: "Formato inválido: se esperaba un mapa de archivos." }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Obtenemos la sesión existente para fusionar archivos y no perder llaves criptográficas antiguas
        const { data: existente } = await supabaseAdmin
          .from("ajustes")
          .select("valor")
          .eq("clave", "whatsapp_baileys_sesion")
          .maybeSingle();

        let sesionFusionada: Record<string, string> = {};
        if (existente?.valor) {
          try {
            sesionFusionada = JSON.parse(existente.valor);
          } catch {
            sesionFusionada = {};
          }
        }

        // Incorporamos los archivos nuevos o actualizados
        for (const [nombre, contenido] of Object.entries(cuerpo.archivos)) {
          if (contenido) {
            sesionFusionada[nombre] = contenido;
          }
        }

        const jsonFinal = JSON.stringify(sesionFusionada);

        const { error } = await supabaseAdmin.from("ajustes").upsert(
          {
            clave: "whatsapp_baileys_sesion",
            valor: jsonFinal,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: "clave" },
        );

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            ok: true,
            totalArchivos: Object.keys(sesionFusionada).length,
            guardadoEn: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },

      // 3. Eliminar respaldo de sesión cuando el usuario decida desvincular explícitamente el WhatsApp
      DELETE: async ({ request }) => {
        if (!validarToken(request)) {
          return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("ajustes").delete().eq("clave", "whatsapp_baileys_sesion");

        return new Response(JSON.stringify({ ok: true, mensaje: "Sesión eliminada de base de datos" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
