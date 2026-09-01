import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { AppShell, AppHeader } from "@/components/app-shell";
import { notificaciones } from "@/lib/data";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/notificaciones")({
  head: () => ({
    meta: [
      { title: "Notificaciones — Portal IVAD" },
      {
        name: "description",
        content: "Avisos internos de IVAD: mensajes nuevos, cumpleaños, recibos de nómina y estado de tu foto de perfil.",
      },
      { property: "og:title", content: "Notificaciones — Portal IVAD" },
      { property: "og:description", content: "Centro de avisos del portal de personal de IVAD." },
    ],
  }),
  component: Notificaciones,
});

function Notificaciones() {
  const { misAvisos, marcarAvisosLeidos } = usePortal();

  useEffect(() => {
    marcarAvisosLeidos();
  }, [marcarAvisosLeidos]);

  return (
    <AppShell>
      <AppHeader titulo="Notificaciones" />
      <div className="space-y-3 px-4 py-5">
        {misAvisos.map((a) => (
          <article key={a.id} className="surface-card flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-foreground">{a.titulo}</p>
              <p className="text-sm text-muted-foreground">{a.detalle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.fecha}</p>
            </div>
            {a.nuevo ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
            <ChevronRight className="h-5 w-5 text-primary" />
          </article>
        ))}
        {notificaciones.map((n) => (
          <article key={n.titulo} className="surface-card flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-foreground">{n.titulo}</p>
              <p className="text-sm text-muted-foreground">{n.detalle}</p>
            </div>
            {n.nuevo ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
            <ChevronRight className="h-5 w-5 text-primary" />
          </article>
        ))}
      </div>
    </AppShell>
  );
}
