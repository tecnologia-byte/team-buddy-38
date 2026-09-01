import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Equal } from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { nomina, pesos } from "@/lib/data";

export const Route = createFileRoute("/nomina")({
  head: () => ({
    meta: [
      { title: "Histórico de Pagos — Portal IVAD" },
      {
        name: "description",
        content: "Consulta el histórico de nómina de IVAD: ingresos, descuentos y neto por mes.",
      },
      { property: "og:title", content: "Histórico de Pagos — Portal IVAD" },
      { property: "og:description", content: "Resumen anual y mensual de nómina del colaborador." },
    ],
  }),
  component: Nomina,
});

function Nomina() {
  const max = Math.max(...nomina.meses.map((m) => m.ingresos));

  return (
    <AppShell>
      <AppHeader titulo="Histórico de Pagos" />
      <div className="space-y-5 px-4 py-5">
        <section className="surface-card flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Año seleccionado</p>
            <p className="font-display text-2xl font-bold text-foreground">2024</p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Seleccionar año
          </button>
        </section>

        <section className="brand-gradient rounded-2xl p-4 text-primary-foreground">
          <p className="border-l-2 border-accent pl-2 font-semibold">Resumen anual</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Total icon={ArrowDown} label="Ingresos" valor={pesos(nomina.anual.ingresos)} />
            <Total icon={ArrowUp} label="Descuentos" valor={pesos(nomina.anual.descuentos)} destacado />
            <Total icon={Equal} label="Neto" valor={pesos(nomina.anual.neto)} />
          </div>
        </section>

        <section className="surface-card p-4">
          <SectionTitle>Resumen mensual</SectionTitle>
          <div className="flex h-40 items-end gap-2">
            {nomina.meses.map((m) => (
              <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-0.5">
                  <span
                    className="w-1.5 rounded-t bg-primary"
                    style={{ height: `${(m.ingresos / max) * 100}%` }}
                  />
                  <span
                    className="w-1.5 rounded-t bg-accent"
                    style={{ height: `${(m.descuentos / max) * 100}%` }}
                  />
                  <span
                    className="w-1.5 rounded-t bg-chart-3"
                    style={{ height: `${(m.neto / max) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.mes.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
            <Leyenda color="bg-primary" label="Ingresos" />
            <Leyenda color="bg-accent" label="Descuentos" />
            <Leyenda color="bg-chart-3" label="Neto" />
          </div>
        </section>

        <section className="surface-card overflow-hidden p-4">
          <SectionTitle>Detalle mensual</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-semibold">Mes</th>
                <th className="pb-2 text-right font-semibold">Ingresos</th>
                <th className="pb-2 text-right font-semibold">Desc.</th>
                <th className="pb-2 text-right font-semibold">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {nomina.meses.map((m) => (
                <tr key={m.mes}>
                  <td className="py-2.5 text-foreground">{m.mes}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{pesos(m.ingresos)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{pesos(m.descuentos)}</td>
                  <td className="py-2.5 text-right font-semibold text-foreground">{pesos(m.neto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}

function Total({
  icon: Icon,
  label,
  valor,
  destacado,
}: {
  icon: typeof ArrowUp;
  label: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          destacado ? "bg-accent text-accent-foreground" : "bg-primary-foreground/10"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs opacity-70">{label}</span>
      <span className="font-display text-sm font-bold">{valor}</span>
    </div>
  );
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-4 rounded-full ${color}`} /> {label}
    </span>
  );
}
