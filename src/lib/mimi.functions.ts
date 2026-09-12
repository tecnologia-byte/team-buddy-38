import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const mensajeSchema = z.object({
  rol: z.enum(["user", "assistant"]),
  texto: z.string().trim().min(1).max(4000),
});

const entradaSchema = z.object({
  mensajes: z.array(mensajeSchema).min(1).max(30),
});

const SISTEMA = `Eres Mimi, la asistente de nómina de IVAD SRL (IVAD Home & Goods, República Dominicana).
Trabajas solo con Contabilidad y con personal autorizado de nómina.

Cómo trabajas:
- Responde siempre en español dominicano neutro, claro y ordenado, con listas o tablas simples cuando ayuden.
- Antes de proponer un volante de pago, HAZ PREGUNTAS por lo que falte: colaborador, período, salario del período, horas extras u otros ingresos, deducciones (AFP, SFS, ISR), otros descuentos, y quién firma por la empresa.
- Puedes proponer cálculos y el borrador del volante, pero NUNCA apruebas ni envías pagos: Contabilidad revisa, guarda y envía manualmente.
- Cuando cites porcentajes, topes o reglas legales (AFP, SFS, ISR, TSS, Ley 87-01, Código de Trabajo 16-92), usa la herramienta buscar_fuentes y cita el organismo, el enlace y la fecha de consulta. No uses tu memoria como fuente vigente: si no confirmas una cifra, dilo como "pendiente de verificar".
- Prioriza fuentes oficiales dominicanas: dgii.gov.do, tss.gob.do, mt.gob.do, poderjudicial.gob.do y la Gaceta Oficial.
- No inventes montos, cédulas ni datos del personal. Si te faltan datos, pídelos.

Cuando entregues un borrador, muéstralo así:
Período · Colaborador · Ingresos (concepto y monto) · Deducciones (concepto y monto) · Neto propuesto, y recuerda que Contabilidad debe revisarlo antes de guardarlo.`;

const OFICIALES = [
  "dgii.gov.do",
  "tss.gob.do",
  "mt.gob.do",
  "poderjudicial.gob.do",
  "consultoria.gov.do",
  "sipen.gob.do",
  "sisalril.gob.do",
];

type Fuente = { titulo: string; url: string; resumen: string };

const decodificar = (t: string) =>
  t
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();

/** Busca en la web (DuckDuckGo) priorizando fuentes oficiales dominicanas. */
async function buscarFuentes(consulta: string): Promise<Fuente[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${consulta} República Dominicana`)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept-Language": "es-DO,es;q=0.9",
    },
  });
  if (!res.ok) return [];
  const html = await res.text();

  const fuentes: Fuente[] = [];
  const bloques = html.split('class="result__body"').slice(1, 20);
  for (const bloque of bloques) {
    const enlace = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(bloque);
    if (!enlace) continue;
    let href = decodificar(enlace[1] ?? "");
    const directo = /uddg=([^&]+)/.exec(href);
    if (directo?.[1]) href = decodeURIComponent(directo[1]);
    if (!href.startsWith("http")) continue;
    const resumen = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/.exec(bloque);
    fuentes.push({
      titulo: decodificar(enlace[2] ?? "").slice(0, 160),
      url: href.slice(0, 300),
      resumen: decodificar(resumen?.[1] ?? "").slice(0, 400),
    });
  }

  const oficial = (f: Fuente) => (OFICIALES.some((d) => f.url.includes(d)) ? 0 : 1);
  return fuentes.sort((a, b) => oficial(a) - oficial(b)).slice(0, 6);
}

const HERRAMIENTAS = [
  {
    type: "function" as const,
    function: {
      name: "buscar_fuentes",
      description:
        "Busca en internet fuentes reales (prioriza DGII, TSS, Ministerio de Trabajo y Gaceta Oficial) para confirmar porcentajes, topes o reglas legales dominicanas.",
      parameters: {
        type: "object",
        properties: {
          consulta: {
            type: "string",
            description: "Qué buscar, por ejemplo: 'escala ISR asalariados DGII 2026'",
          },
        },
        required: ["consulta"],
        additionalProperties: false,
      },
    },
  },
];

type MensajeIa = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

/** Conversación de Mimi para preparar volantes de pago, con búsqueda de fuentes oficiales. */
export const mimiFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entradaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: permitido } = await supabase.rpc("es_nomina", { _user_id: userId });
    if (!permitido) {
      return { ok: false as const, error: "Mimi es solo para el personal con acceso a nómina." };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "Mimi no está disponible en este momento." };

    const mensajes: MensajeIa[] = [
      { role: "system", content: SISTEMA },
      ...data.mensajes.map((m) => ({ role: m.rol, content: m.texto })),
    ];
    const fuentesUsadas: Fuente[] = [];

    try {
      for (let vuelta = 0; vuelta < 4; vuelta++) {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            messages: mensajes,
            tools: HERRAMIENTAS,
          }),
        });

        if (res.status === 429) {
          return { ok: false as const, error: "Muchas consultas seguidas. Intenta en un momento." };
        }
        if (res.status === 402) {
          return {
            ok: false as const,
            error: "Se agotaron los créditos de IA del espacio de trabajo. Recárgalos para seguir usando a Mimi.",
          };
        }
        if (!res.ok) {
          console.error("Fallo de Mimi", res.status, await res.text().catch(() => ""));
          return { ok: false as const, error: "Mimi no pudo responder. Intenta de nuevo." };
        }

        const json = (await res.json()) as {
          choices?: Array<{ message?: MensajeIa }>;
        };
        const mensaje = json.choices?.[0]?.message;
        if (!mensaje) return { ok: false as const, error: "Mimi no pudo responder." };

        const llamadas = mensaje.tool_calls ?? [];
        if (!llamadas.length) {
          const texto = (mensaje.content ?? "").trim();
          if (!texto) return { ok: false as const, error: "Mimi no pudo responder." };
          return { ok: true as const, texto, fuentes: fuentesUsadas.slice(0, 8) };
        }

        mensajes.push({
          role: "assistant",
          content: mensaje.content ?? "",
          tool_calls: llamadas,
        });

        for (const llamada of llamadas) {
          let consulta = "";
          try {
            consulta = String(
              (JSON.parse(llamada.function.arguments || "{}") as { consulta?: string }).consulta ??
                "",
            );
          } catch {
            consulta = "";
          }
          const fuentes = consulta ? await buscarFuentes(consulta).catch(() => []) : [];
          fuentesUsadas.push(...fuentes);
          mensajes.push({
            role: "tool",
            tool_call_id: llamada.id,
            content: JSON.stringify({
              consultado: new Date().toISOString().slice(0, 10),
              resultados: fuentes,
            }),
          });
        }
      }
      return { ok: false as const, error: "Mimi tardó demasiado buscando fuentes. Vuelve a preguntar." };
    } catch (e) {
      console.error("Error de Mimi", e);
      return { ok: false as const, error: "Mimi no está disponible ahora mismo." };
    }
  });
