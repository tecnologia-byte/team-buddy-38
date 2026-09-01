import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { AppShell, AppHeader } from "@/components/app-shell";
import { chatRRHH } from "@/lib/data";
import { Input } from "@/components/ui/input";

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
  const [mensajes, setMensajes] = useState(chatRRHH);
  const [texto, setTexto] = useState("");

  return (
    <AppShell>
      <AppHeader titulo="Chat con RR.HH." subtitulo="Departamento de Recursos Humanos" volver />
      <div className="space-y-3 px-4 py-5">
        <p className="mx-auto w-fit rounded-full bg-brand-soft px-3 py-1 text-xs text-muted-foreground">
          21/05/2024
        </p>
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl p-3 ${
              m.de === "yo"
                ? "ml-auto bg-success/15 text-foreground"
                : "surface-card text-foreground"
            }`}
          >
            <p className="text-sm">{m.texto}</p>
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{m.hora}</p>
          </div>
        ))}

        <form
          className="sticky bottom-24 mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!texto.trim()) return;
            setMensajes((prev) => [
              ...prev,
              { de: "yo", texto: texto.trim(), hora: "Ahora" },
            ]);
            setTexto("");
          }}
        >
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="rounded-full bg-card"
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
    </AppShell>
  );
}
