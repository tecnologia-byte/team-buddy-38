import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/solicitudes/aprobaciones")({
  head: () => ({
    meta: [
      { title: "Bandeja de aprobaciones — Portal IVAD" },
      {
        name: "description",
        content:
          "Recursos Humanos y Administración revisan, aprueban o rechazan las solicitudes de permisos, licencias y vacaciones del personal de IVAD.",
      },
      { property: "og:title", content: "Bandeja de aprobaciones — Portal IVAD" },
      {
        property: "og:description",
        content: "Gestión de permisos y licencias del personal de IVAD Home & Goods.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Aprobaciones,
});

const tono: Record<string, string> = {
  Pendiente: "bg-accent text-accent-foreground",
  Aprobada: "bg-success text-success-foreground",
  Rechazada: "bg-destructive text-destructive-foreground",
  Cancelada: "bg-muted text-muted-foreground",
};

function Aprobaciones() {
  const { solicitudes, colaboradores, esRRHH, responderSolicitud } = usePortal();
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  const nombre = (id: string) => colaboradores.find((c) => c.id === id)?.nombre ?? "Colaborador";

  const responder = async (id: string, estado: "Aprobada" | "Rechazada") => {
    const r = await responderSolicitud(id, estado, comentarios[id] ?? "");
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo actualizar la solicitud.");
      return;
    }
    toast.success(`Solicitud ${estado.toLowerCase()}.`);
    setComentarios((p) => ({ ...p, [id]: "" }));
  };

  if (!esRRHH) {
    return (
      <AppShell>
        <AppHeader titulo="Aprobaciones" volver />
        <p className="surface-card m-4 p-4 text-sm text-muted-foreground">
          Solo Recursos Humanos y Administración pueden revisar las solicitudes del personal.
        </p>
      </AppShell>
    );
  }

  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente");
  const historial = solicitudes.filter((s) => s.estado !== "Pendiente");

  return (
    <AppShell wide>
      <AppHeader titulo="Aprobaciones" volver />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-5">
        <section>
          <SectionTitle>Pendientes ({pendientes.length})</SectionTitle>
          {pendientes.length === 0 ? (
            <p className="surface-card flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Inbox className="h-4 w-4" /> No hay solicitudes pendientes.
            </p>
          ) : (
            <div className="space-y-3">
              {pendientes.map((s) => (
                <article key={s.id} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-foreground">{nombre(s.colaboradorId)}</p>
                      <p className="text-sm font-semibold text-foreground">{s.tipo}</p>
                      <p className="text-sm text-foreground">
                        {s.fechaInicio} al {s.fechaFin} · {s.dias} día(s) ·{" "}
                        {s.conSalario ? "con salario" : "sin salario"}
                      </p>
                      {s.motivo ? <p className="mt-1 text-sm text-foreground">{s.motivo}</p> : null}
                      {s.soporte ? (
                        <p className="text-xs text-muted-foreground">Soporte: {s.soporte}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">{s.baseLegal}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tono[s.estado]}`}>
                      {s.estado}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Input
                      value={comentarios[s.id] ?? ""}
                      onChange={(e) =>
                        setComentarios((p) => ({ ...p, [s.id]: e.target.value }))
                      }
                      placeholder="Comentario para el colaborador (opcional)"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void responder(s.id, "Aprobada")}>
                        <Check className="mr-1 h-4 w-4" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void responder(s.id, "Rechazada")}
                      >
                        <X className="mr-1 h-4 w-4" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Historial</SectionTitle>
          {historial.length === 0 ? (
            <p className="surface-card p-4 text-sm text-muted-foreground">Sin historial todavía.</p>
          ) : (
            <div className="surface-card divide-y divide-border">
              {historial.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{nombre(s.colaboradorId)}</p>
                    <p className="text-sm text-foreground">
                      {s.tipo} · {s.fechaInicio} al {s.fechaFin}
                    </p>
                    {s.respuesta ? (
                      <p className="text-xs text-muted-foreground">{s.respuesta}</p>
                    ) : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tono[s.estado]}`}>
                    {s.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
