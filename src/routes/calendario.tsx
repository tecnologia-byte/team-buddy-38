import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { eventos } from "@/lib/data";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — Portal IVAD" },
      {
        name: "description",
        content: "Eventos, capacitaciones, pagos de nómina y cumpleaños del personal de IVAD Home & Goods.",
      },
      { property: "og:title", content: "Calendario — Portal IVAD" },
      { property: "og:description", content: "Agenda interna de IVAD: eventos, pagos y capacitaciones." },
    ],
  }),
  component: Calendario,
});

const dias = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function Calendario() {
  const [seleccion, setSeleccion] = useState(16);
  const celdas: (number | null)[] = [
    null,
    null,
    1, 2, 3, 4, 5,
    6, 7, 8, 9, 10, 11, 12,
    13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26,
    27, 28, 29, 30, 31,
  ];
  const conEvento = new Set(eventos.map((e) => e.dia));

  return (
    <AppShell>
      <AppHeader titulo="Calendario" />
      <div className="space-y-6 px-4 py-5">
        <section className="surface-card p-4">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Mes anterior" className="p-1 text-primary">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-display font-bold text-foreground">Mayo 2024</h2>
            <button type="button" aria-label="Mes siguiente" className="p-1 text-primary">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
            {dias.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-muted-foreground">
                {d}
              </span>
            ))}
            {celdas.map((d, i) => (
              <div key={i} className="flex justify-center">
                {d === null ? (
                  <span className="py-2 text-sm text-muted-foreground/40">·</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSeleccion(d)}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                      seleccion === d
                        ? "bg-primary font-bold text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {d}
                    {conEvento.has(d) && seleccion !== d ? (
                      <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
                    ) : null}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle action={<span className="text-xs font-medium text-primary">Ver todos</span>}>
            Próximos eventos
          </SectionTitle>
          <div className="space-y-3">
            {eventos.map((e) => (
              <article key={e.titulo} className="surface-card flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary">
                  <span className="font-display text-base font-bold text-primary">{e.dia}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">May</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-foreground">{e.titulo}</p>
                  <p className="text-sm text-muted-foreground">{e.area}</p>
                  <p className="text-xs text-muted-foreground">{e.cuando}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-brand-soft p-4">
          <p className="font-semibold text-foreground">Mantente al día</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recibirás notificaciones de los eventos importantes según tus preferencias.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
