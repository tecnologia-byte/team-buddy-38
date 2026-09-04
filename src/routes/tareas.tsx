import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/tareas")({
  head: () => ({
    meta: [
      { title: "Tareas — Portal IVAD" },
      {
        name: "description",
        content:
          "Consulta las tareas que Recursos Humanos y Administración te asignaron y márcalas como realizadas.",
      },
      { property: "og:title", content: "Tareas — Portal IVAD" },
      {
        property: "og:description",
        content: "Tareas asignadas al colaborador con prioridad y fecha límite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { misTareas, marcarTarea } = usePortal();
  const pendientes = misTareas.filter((t) => !t.completada);
  const completadas = misTareas.filter((t) => t.completada);

  const alternar = async (id: string, completada: boolean) => {
    const r = await marcarTarea(id, completada);
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo actualizar la tarea.");
      return;
    }
    toast.success(completada ? "Tarea marcada como realizada." : "Tarea reabierta.");
  };

  return (
    <AppShell>
      <AppHeader titulo="Tareas" />
      <div className="space-y-6 px-4 py-5">
        <section>
          <SectionTitle>Pendientes ({pendientes.length})</SectionTitle>
          {pendientes.length === 0 ? (
            <p className="surface-card flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <ListTodo className="h-4 w-4" /> No tienes tareas pendientes.
            </p>
          ) : (
            <div className="surface-card divide-y divide-border">
              {pendientes.map((t) => (
                <label key={t.id} className="flex items-start gap-3 px-4 py-3.5">
                  <Checkbox
                    className="mt-1"
                    checked={false}
                    onCheckedChange={() => void alternar(t.id, true)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{t.titulo}</p>
                    {t.detalle ? (
                      <p className="text-sm text-muted-foreground">{t.detalle}</p>
                    ) : null}
                    {t.vence ? (
                      <p className="text-xs text-muted-foreground">Vence: {t.vence}</p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tono[t.prioridad]}`}
                  >
                    {t.prioridad}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Realizadas ({completadas.length})</SectionTitle>
          {completadas.length === 0 ? (
            <p className="surface-card flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" /> Aún no has completado tareas.
            </p>
          ) : (
            <div className="surface-card divide-y divide-border">
              {completadas.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Checkbox checked onCheckedChange={() => void alternar(t.id, false)} />
                  <p className="flex-1 text-muted-foreground line-through">{t.titulo}</p>
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
