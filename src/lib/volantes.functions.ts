import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(60) });

type LineaGuardada = { concepto?: string; monto?: string | number };

const numero = (valor: unknown) => {
  const n = Number(String(valor ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const limpiar = (lineas: unknown) =>
  (Array.isArray(lineas) ? (lineas as LineaGuardada[]) : [])
    .filter((l) => String(l?.concepto ?? "").trim() || String(l?.monto ?? "").trim())
    .map((l) => ({ concepto: String(l?.concepto ?? ""), monto: numero(l?.monto) }));

const texto = (v: unknown) => {
  const t = String(v ?? "").trim();
  return t ? t : undefined;
};

const pesos = (n: number) =>
  n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Envía uno o varios volantes guardados: genera el PDF individual de cada colaborador,
 * lo manda a su propio correo y crea el aviso privado dentro del portal.
 * Un fallo en un volante no detiene los demás ni lo marca como enviado.
 */
export const enviarVolantesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: permitido } = await supabase.rpc("es_nomina", { _user_id: userId });
    if (!permitido) {
      return { ok: false as const, error: "No tienes acceso a la nómina.", resultados: [] };
    }

    const { data: filas, error } = await supabase
      .from("volantes")
      .select("*")
      .in("id", data.ids)
      .neq("estado", "Enviado");
    if (error) return { ok: false as const, error: error.message, resultados: [] };
    if (!filas?.length) {
      return { ok: false as const, error: "No hay volantes pendientes por enviar.", resultados: [] };
    }

    const { despacharVolante } = await import("./volante-envio.server");

    // Consultamos la configuración del puente WhatsApp para los colaboradores que elijan WhatsApp o Ambos
    const { data: ajustesFilas } = await supabase
      .from("ajustes")
      .select("clave, valor")
      .in("clave", ["whatsapp_puente_url", "whatsapp_puente_token"]);

    const puenteUrl = ajustesFilas?.find((a) => a.clave === "whatsapp_puente_url")?.valor;
    const puenteToken = ajustesFilas?.find((a) => a.clave === "whatsapp_puente_token")?.valor;

    const resultados: Array<{ id: string; nombre: string; ok: boolean; error?: string; medios?: string }> = [];

    for (const fila of filas) {
      const d = (fila.datos ?? {}) as Record<string, unknown>;
      const nombre = String(d["nombre"] ?? "");
      await supabase.from("volantes").update({ estado: "Enviando", error: null }).eq("id", fila.id);

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("id, nombre, email, correo_alterno, whatsapp, canal_avisos")
        .eq("id", fila.colaborador_id)
        .maybeSingle();

      const correo = perfil?.email?.trim() || perfil?.correo_alterno?.trim() || "";
      const whatsapp = perfil?.whatsapp?.trim() || "";
      const canalAvisos = (perfil?.canal_avisos || "correo") as "correo" | "whatsapp" | "ambos" | "ninguno";

      try {
        const ingresos = limpiar(d["ingresos"]);
        const deducciones = limpiar(d["deducciones"]);
        const res = await despacharVolante({
          destino: {
            correo,
            whatsapp,
            canalAvisos,
            puenteUrl,
            puenteToken,
          },
          volante: {
            comprobante: String(d["comprobante"] ?? fila.comprobante ?? ""),
            fechaEmision: String(d["fechaEmision"] ?? fila.fecha_emision ?? ""),
            periodoDesde: String(d["periodoDesde"] ?? fila.periodo_desde ?? ""),
            periodoHasta: String(d["periodoHasta"] ?? fila.periodo_hasta ?? ""),
            nombre: nombre || perfil?.nombre || "",
            cedula: texto(d["cedula"]),
            codigo: texto(d["codigo"]),
            cargo: texto(d["cargo"]),
            departamento: texto(d["departamento"]),
            ingreso: texto(d["ingreso"]),
            banco: texto(d["banco"]),
            seguridadSocial: texto(d["seguridadSocial"]),
            ingresos,
            deducciones,
            firma: texto(d["firma"]),
            firmaFecha: texto(d["firmaFecha"]),
            firmaEmpresa: texto(d["firmaEmpresa"]),
            firmaEmpresaNombre: texto(d["firmaEmpresaNombre"]),
            firmaEmpresaCargo: texto(d["firmaEmpresaCargo"]),
          },
        });

        if (!res.ok) throw new Error(res.error ?? "No se pudo despachar el volante");

        const neto =
          ingresos.reduce((s, l) => s + l.monto, 0) - deducciones.reduce((s, l) => s + l.monto, 0);

        const mediosTexto = res.medios.join(" y ");
        await supabase.from("avisos").insert({
          para_id: fila.colaborador_id,
          titulo: `Volante de pago ${fila.comprobante || ""}`.trim(),
          detalle:
            `Se registró tu pago del período ${fila.periodo_desde} al ${fila.periodo_hasta}. ` +
            `Neto recibido: RD$ ${pesos(neto)}. Te enviamos el volante en PDF por ${mediosTexto}.`,
          nuevo: true,
        });

        await supabase
          .from("volantes")
          .update({
            estado: "Enviado",
            error: null,
            enviado_por: userId,
            enviado_at: new Date().toISOString(),
          })
          .eq("id", fila.id);

        resultados.push({ id: fila.id, nombre: nombre || perfil?.nombre || "", ok: true, medios: mediosTexto });
      } catch (e) {
        const mensaje = e instanceof Error ? e.message : "No se pudo enviar el volante";
        await supabase
          .from("volantes")
          .update({ estado: "Error", error: mensaje.slice(0, 300) })
          .eq("id", fila.id);
        resultados.push({
          id: fila.id,
          nombre: nombre || perfil?.nombre || "",
          ok: false,
          error: mensaje,
        });
      }
    }

    return { ok: true as const, resultados };
  });
