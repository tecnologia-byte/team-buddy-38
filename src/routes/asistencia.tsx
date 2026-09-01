import { createFileRoute } from "@tanstack/react-router";
import { Clock, LogIn, LogOut } from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { asistencia } from "@/lib/data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/asistencia")({
  head: () => ({
    meta: [
      { title: "Asistencia — Portal IVAD" },
      {
        name: "description",
        content: "Registra tu entrada y salida y consulta el historial semanal de asistencia en IVAD.",
      },
      { property: "og:title", content: "Asistencia — Portal IVAD" },
      { property: "og:description", content: "Marcaje de entrada, salida e historial semanal." },
    ],
  }),
  component: Asistencia,
});

const tono: Record<string, string> = {
  "A tiempo": "bg-success text-success-foreground",
  Tardanza: "bg-accent text-accent-foreground",
  Permiso: "bg-secondary text-secondary-foreground",
};

function Asistencia() {
  return (
    <AppShell>
      <AppHeader titulo="Asistencia" />
      <div className="space-y-5 px-4 py-5">
        <section className="brand-gradient rounded-2xl p-5 text-primary-foreground">
          <p className="text-sm opacity-75">Hoy, martes 21 de mayo</p>
          <div className="mt-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <span className="font-display text-3xl font-bold">08:12 a.m.</span>
          </div>
          <p className="mt-1 text-xs opacity-70">Entrada registrada · Oficina principal</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary">
              <LogIn className="mr-2 h-4 w-4" /> Marcar entrada
            </Button>
            <Button variant="secondary">
              <LogOut className="mr-2 h-4 w-4" /> Marcar salida
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {[
            { valor: "18", label: "Días trabajados" },
            { valor: "2", label: "Tardanzas" },
            { valor: "1", label: "Permisos" },
          ].map((k) => (
            <div key={k.label} className="surface-card p-3 text-center">
              <p className="font-display text-2xl font-bold text-foreground">{k.valor}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </section>

        <section>
          <SectionTitle>Esta semana</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {asistencia.map((a) => (
              <div key={a.dia} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{a.dia}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.entrada} — {a.salida} · {a.horas}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tono[a.estado]}`}>
                  {a.estado}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
