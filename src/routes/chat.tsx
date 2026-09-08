import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, LifeBuoy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat con RR.HH. — Portal IVAD" },
      {
        name: "description",
        content:
          "El chat con Recursos Humanos de IVAD está cerrado por el momento. Usa la página de Soporte para enviar tu consulta.",
      },
      { property: "og:title", content: "Chat con RR.HH. — Portal IVAD" },
      {
        property: "og:description",
        content: "Canal de Recursos Humanos de IVAD, temporalmente cerrado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chat,
});

function Chat() {
  const router = useRouter();

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
          <p className="text-xs opacity-70">Cerrado por el momento</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Lock className="h-7 w-7 text-primary" />
        </span>
        <h2 className="font-display text-lg font-bold text-foreground">
          El chat está cerrado por ahora
        </h2>
        <p className="text-sm text-muted-foreground">
          Todavía no hay una persona de Recursos Humanos disponible para responder por este canal,
          así que no se pueden enviar mensajes. Mientras tanto, envía tu duda por Soporte y te
          responderemos ahí.
        </p>
        <Button asChild>
          <Link to="/soporte">
            <LifeBuoy className="mr-2 h-4 w-4" /> Ir a Soporte
          </Link>
        </Button>
      </div>

      <div className="border-t border-border bg-card px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
        Envío de mensajes desactivado temporalmente
      </div>
    </div>
  );
}
