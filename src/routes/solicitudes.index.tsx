import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  Inbox,
  Plus,
} from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { tiposSolicitud } from "@/lib/derechos";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/solicitudes/")({
  head: () => ({
    meta: [
      { title: "Solicitudes y Aprobaciones — Portal IVAD" },
      {
        name: "description",
        content:
          "Solicita permisos, licencias y vacaciones en IVAD, consulta tus derechos y sigue el estado de cada aprobación.",
      },
      { property: "og:title", content: "Solicitudes y Aprobaciones — Portal IVAD" },
      {
        property: "og:description",
        content: "Permisos, licencias y vacaciones con flujo de aprobación de Recursos Humanos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Solicitudes,
});

export const tonoEstado: Record<string, string> = {
  Pendiente: "bg-accent text-accent-foreground",
  Aprobada: "bg-success text-success-foreground",
  Rechazada: "bg-destructive text-destructive-foreground",
  Cancelada: "bg-muted text-muted-foreground",
};

function Solicitudes() {
  const { misSolicitudes, solicitudesPendientes, esRRHH, cancelarSolicitud } = usePortal();

  return (
    <AppShell>
      <AppHeader titulo="Solicitudes" />
      <div className="space-y-6 px-4 py-5">
        <section className="brand-gradient relative overflow-hidden rounded-2xl p-5 text-primary-foreground">
          <div className="max-w-[65%]">
            <h2 className="font-display text-xl font-bold">Solicitudes y Aprobaciones</h2>
            <p className="mt-2 text-sm opacity-80">
              Toda ausencia debe solicitarse y ser aprobada antes de tomarse, aunque la ley te
              reconozca el derecho.
            </p>
          </div>
          <FileCheck className="absolute -right-2 top-6 h-28 w-28 opacity-15" />
          <CheckCircle2 className="absolute bottom-5 right-6 h-10 w-10 text-accent" />
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link to="/solicitudes/nueva">
              <Plus className="mr-2 h-5 w-5" /> Nueva solicitud
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/solicitudes/derechos">
              <BookOpenCheck className="mr-2 h-5 w-5" /> Mis derechos y licencias
            </Link>
          </Button>
        </div>

        {esRRHH ? (
          <Link to="/solicitudes/aprobaciones" className="surface-card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Inbox className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">Bandeja de aprobaciones</span>
              <span className="block text-xs text-muted-foreground">
                Revisa, aprueba o rechaza las solicitudes del personal
              </span>
            </span>
            {solicitudesPendientes.length > 0 ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                {solicitudesPendientes.length}
              </span>
            ) : null}
          </Link>
        ) : null}

        <section>
          <SectionTitle>Tipos de solicitud</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {tiposSolicitud.map((t) => (
              <Link
                key={t.id}
                to="/solicitudes/nueva"
                search={{ tipo: t.id }}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{t.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{t.duracion}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Mis solicitudes</SectionTitle>
          {misSolicitudes.length === 0 ? (
            <p className="surface-card p-4 text-sm text-muted-foreground">
              Aún no has enviado solicitudes. Usa “Nueva solicitud” para pedir un permiso, licencia
              o tus vacaciones.
            </p>
          ) : (
            <div className="space-y-3">
              {misSolicitudes.map((s) => (
                <article key={s.id} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-foreground">{s.tipo}</p>
                      <p className="text-sm text-foreground">
                        {s.fechaInicio} al {s.fechaFin} · {s.dias} día(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.conSalario ? "Con disfrute de salario" : "Sin disfrute de salario"} ·
                        Enviada el {s.fecha}
                      </p>
                      {s.motivo ? (
                        <p className="mt-1 text-sm text-foreground">{s.motivo}</p>
                      ) : null}
                      {s.respuesta ? (
                        <p className="mt-2 rounded-lg bg-muted p-2 text-xs text-foreground">
                          Respuesta de RR.HH.: {s.respuesta}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tonoEstado[s.estado]}`}
                    >
                      {s.estado}
                    </span>
                  </div>
                  {s.estado === "Pendiente" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void cancelarSolicitud(s.id)}
                    >
                      Cancelar solicitud
                    </Button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
