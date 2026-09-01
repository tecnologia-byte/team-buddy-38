import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, FileCheck } from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { solicitudes, tiposSolicitud } from "@/lib/data";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({
    meta: [
      { title: "Solicitudes y Aprobaciones — Portal IVAD" },
      {
        name: "description",
        content: "Gestiona solicitudes de permisos, licencias, vacaciones y servicios varios en IVAD.",
      },
      { property: "og:title", content: "Solicitudes y Aprobaciones — Portal IVAD" },
      { property: "og:description", content: "Permisos, licencias y vacaciones con flujo de aprobación." },
    ],
  }),
  component: Solicitudes,
});

const tono: Record<string, string> = {
  Pendiente: "bg-accent text-accent-foreground",
  Aprobada: "bg-success text-success-foreground",
  Rechazada: "bg-destructive text-destructive-foreground",
};

function Solicitudes() {
  return (
    <AppShell>
      <AppHeader titulo="Solicitudes" />
      <div className="space-y-6 px-4 py-5">
        <section className="brand-gradient relative overflow-hidden rounded-2xl p-5 text-primary-foreground">
          <div className="max-w-[65%]">
            <h2 className="font-display text-xl font-bold">Solicitudes y Aprobaciones</h2>
            <p className="mt-2 text-sm opacity-80">
              Gestiona las solicitudes de permisos, licencias, vacaciones y servicios varios.
            </p>
          </div>
          <FileCheck className="absolute -right-2 top-6 h-28 w-28 opacity-15" />
          <CheckCircle2 className="absolute bottom-5 right-6 h-10 w-10 text-accent" />
        </section>

        <section>
          <SectionTitle>Tipos de solicitud</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {tiposSolicitud.map((t) => (
              <button
                key={t}
                type="button"
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <span className="font-semibold text-foreground">{t}</span>
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Mis solicitudes recientes</SectionTitle>
          <div className="space-y-3">
            {solicitudes.map((s) => (
              <article key={s.tipo + s.solicitante} className="surface-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-foreground">{s.tipo}</p>
                    <p className="text-sm text-muted-foreground">{s.solicitante}</p>
                    <p className="text-xs text-muted-foreground">{s.rango}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tono[s.estado]}`}
                  >
                    {s.estado}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
