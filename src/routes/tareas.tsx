import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { tareas as tareasIniciales } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/tareas")({
  head: () => ({
    meta: [
      { title: "Tareas — Portal IVAD" },
      {
        name: "description",
        content: "Gestiona tus tareas pendientes y completadas dentro del portal de personal de IVAD.",
      },
      { property: "og:title", content: "Tareas — Portal IVAD" },
      { property: "og:description", content: "Pendientes del colaborador con prioridad y fecha límite." },
    ],
  }),
  component: Tareas,
});

const tono: Record<string, string> = {
  Alta: "bg-destructive text-destructive-foreground",
  Media: "bg-accent text-accent-foreground",
  Baja: "bg-secondary text-secondary-foreground",
};

function Tareas() {
  const [lista, setLista] = useState(tareasIniciales);
  const pendientes = lista.filter((t) => !t.lista);
  const completadas = lista.filter((t) => t.lista);

  const alternar = (titulo: string) =>
    setLista((prev) => prev.map((t) => (t.titulo === titulo ? { ...t, lista: !t.lista } : t)));

  return (
    <AppShell>
      <AppHeader titulo="Tareas" />
      <div className="space-y-6 px-4 py-5">
        <section>
          <SectionTitle>Pendientes ({pendientes.length})</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {pendientes.map((t) => (
              <label key={t.titulo} className="flex items-center gap-3 px-4 py-3.5">
                <Checkbox checked={false} onCheckedChange={() => alternar(t.titulo)} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">Vence: {t.vence}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tono[t.prioridad]}`}>
                  {t.prioridad}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Completadas ({completadas.length})</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {completadas.map((t) => (
              <label key={t.titulo} className="flex items-center gap-3 px-4 py-3.5">
                <Checkbox checked onCheckedChange={() => alternar(t.titulo)} />
                <p className="flex-1 text-muted-foreground line-through">{t.titulo}</p>
              </label>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
