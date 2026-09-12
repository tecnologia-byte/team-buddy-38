import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mimiFn } from "@/lib/mimi.functions";

type Fuente = { titulo: string; url: string; resumen: string };
type Mensaje = { rol: "user" | "assistant"; texto: string; fuentes?: Fuente[] };

const SUGERENCIAS = [
  "Hazme preguntas para preparar el volante de este mes",
  "¿Cuáles son los porcentajes vigentes de AFP y SFS del empleado?",
  "Explícame cómo se calcula la retención de ISR asalariados",
];

const BIENVENIDA: Mensaje = {
  rol: "assistant",
  texto:
    "¡Hola! Soy Mimi, tu asistente de nómina. Puedo preguntarte los datos que faltan, proponerte los cálculos del volante y confirmar porcentajes con fuentes oficiales (DGII, TSS, Ministerio de Trabajo). Yo no apruebo ni envío pagos: tú revisas y decides. ¿Con cuál colaborador empezamos?",
};

/** Chat de Mimi: prepara borradores de volantes y consulta fuentes oficiales dominicanas. */
export function MimiChat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || pensando) return;
    const historial = [...mensajes, { rol: "user" as const, texto: limpio }];
    setMensajes(historial);
    setTexto("");
    setPensando(true);
    try {
      const res = await mimiFn({
        data: {
          mensajes: historial
            .slice(-20)
            .map((m) => ({ rol: m.rol, texto: m.texto.slice(0, 4000) })),
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        setMensajes((m) => [
          ...m,
          { rol: "assistant", texto: res.error ?? "No pude responder ahora mismo." },
        ]);
      } else {
        setMensajes((m) => [
          ...m,
          { rol: "assistant", texto: res.texto, ...(res.fuentes?.length ? { fuentes: res.fuentes } : {}) },
        ]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mimi no está disponible");
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display font-bold text-foreground">Mimi · asistente de nómina</h3>
            <p className="text-xs text-muted-foreground">
              Prepara propuestas y busca fuentes oficiales. La revisión y el envío siempre son tuyos.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void enviar(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card space-y-3 p-4">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
              m.rol === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.texto}</p>
            {m.fuentes?.length ? (
              <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide">Fuentes consultadas</p>
                {m.fuentes.map((f) => (
                  <a
                    key={f.url}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] underline"
                  >
                    {f.titulo || f.url}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {pensando ? (
          <p className="text-xs text-muted-foreground">Mimi está revisando fuentes y calculando…</p>
        ) : null}
      </div>

      <div className="surface-card space-y-2 p-3">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Escríbele a Mimi: por ejemplo, “prepara el volante de Natalia con salario 35,000 de la primera quincena”."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar(texto);
            }
          }}
        />
        <div className="flex justify-end">
          <Button type="button" disabled={pensando || !texto.trim()} onClick={() => void enviar(texto)}>
            <Send className="mr-2 h-4 w-4" /> Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
