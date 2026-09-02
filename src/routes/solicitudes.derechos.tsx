import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, Scale, ShieldAlert } from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { derechosGenerales, tiposSolicitud } from "@/lib/derechos";

export const Route = createFileRoute("/solicitudes/derechos")({
  head: () => ({
    meta: [
      { title: "Mis derechos: permisos y licencias — Portal IVAD" },
      {
        name: "description",
        content:
          "Guía de permisos, licencias y vacaciones según el Código de Trabajo de la República Dominicana (Ley 16-92) para el personal de IVAD.",
      },
      { property: "og:title", content: "Mis derechos: permisos y licencias — Portal IVAD" },
      {
        property: "og:description",
        content:
          "Conoce a qué licencias y permisos tienes derecho y cómo solicitarlos formalmente en IVAD.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Derechos,
});

function Derechos() {
  return (
    <AppShell wide>
      <AppHeader titulo="Mis derechos" volver />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-5">
        <section className="brand-gradient relative overflow-hidden rounded-2xl p-5 text-primary-foreground">
          <div className="max-w-[70%]">
            <h2 className="font-display text-xl font-bold">Permisos y licencias de ley</h2>
            <p className="mt-2 text-sm opacity-80">
              Basado en el Código de Trabajo de la República Dominicana (Ley 16-92) y la Ley 87-01
              de Seguridad Social.
            </p>
          </div>
          <Scale className="absolute -right-2 top-6 h-28 w-28 opacity-15" />
        </section>

        <div className="surface-card flex items-start gap-3 border-l-4 border-accent p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p className="text-sm text-foreground">
            <strong>Importante:</strong> tener el derecho no autoriza la ausencia. Toda licencia o
            permiso debe solicitarse por el portal y contar con la aprobación de Recursos Humanos
            antes de ausentarte; de lo contrario la ausencia se registra como injustificada.
          </p>
        </div>

        <section>
          <SectionTitle>Catálogo de licencias y permisos</SectionTitle>
          <div className="space-y-3">
            {tiposSolicitud.map((t) => (
              <article key={t.id} className="surface-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-foreground">{t.nombre}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    {t.categoria}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      t.conSalario === true
                        ? "bg-success text-success-foreground"
                        : t.conSalario === false
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {t.conSalario === true
                      ? "Con salario"
                      : t.conSalario === false
                        ? "Sin salario"
                        : "Según el caso"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{t.resumen}</p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">
                      Duración
                    </dt>
                    <dd className="text-foreground">{t.duracion}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">
                      Base legal
                    </dt>
                    <dd className="text-foreground">{t.baseLegal}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">
                      Documento de soporte
                    </dt>
                    <dd className="text-foreground">{t.soporte}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">
                      Antelación
                    </dt>
                    <dd className="text-foreground">{t.aviso}</dd>
                  </div>
                </dl>
                <ul className="mt-3 space-y-1 text-sm text-foreground">
                  {t.requisitos.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className="mt-4">
                  <Link to="/solicitudes/nueva" search={{ tipo: t.id }}>
                    Solicitar {t.nombre.toLowerCase()}
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Otros derechos que debes conocer</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {derechosGenerales.map((d) => (
              <div key={d.titulo} className="p-4">
                <p className="font-semibold text-foreground">{d.titulo}</p>
                <p className="text-sm text-foreground">{d.detalle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d.base}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Esta guía es informativa y resume la normativa vigente. Ante cualquier duda escribe a
          Recursos Humanos desde el chat interno o la página de soporte.
        </p>
      </div>
    </AppShell>
  );
}
