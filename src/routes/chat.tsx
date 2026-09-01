import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Phone, Send } from "lucide-react";
import { chatRRHH } from "@/lib/data";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat con RR.HH. — Portal IVAD" },
      {
        name: "description",
        content: "Canal directo con Recursos Humanos de IVAD para consultas de permisos, nómina y beneficios.",
      },
      { property: "og:title", content: "Chat con RR.HH. — Portal IVAD" },
      { property: "og:description", content: "Habla con Recursos Humanos desde el portal de personal." },
    ],
  }),
  component: Chat,
});

function Chat() {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(chatRRHH);
  const [texto, setTexto] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes]);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-lg flex-col bg-background">
      <header className="brand-gradient flex items-center gap-3 px-3 py-3 text-primary-foreground">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="p-1 opacity-90"
          aria-label="Volver"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
          RH
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold">Chat con RR.HH.</p>
          <p className="text-xs opacity-70">En línea</p>
        </div>
        <Phone className="h-5 w-5 opacity-90" />
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        <p className="mx-auto w-fit rounded-full bg-brand-soft px-3 py-1 text-xs text-muted-foreground">
          21/05/2024
        </p>
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-[var(--shadow-card)] ${
              m.de === "yo"
                ? "ml-auto rounded-br-md bg-success/20 text-foreground"
                : "mr-auto rounded-bl-md bg-card text-foreground"
            }`}
          >
            <p className="text-sm leading-snug">{m.texto}</p>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{m.hora}</p>
          </div>
        ))}
        <div ref={finRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border bg-card px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          setMensajes((prev) => [...prev, { de: "yo", texto: texto.trim(), hora: "Ahora" }]);
          setTexto("");
        }}
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          placeholder="Escribe un mensaje..."
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
