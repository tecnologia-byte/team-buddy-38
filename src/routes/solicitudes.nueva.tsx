import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tipoPorId, tiposSolicitud } from "@/lib/derechos";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/solicitudes/nueva")({
  validateSearch: (search: Record<string, unknown>) => ({
    tipo: typeof search["tipo"] === "string" ? (search["tipo"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Nueva solicitud de permiso — Portal IVAD" },
      {
        name: "description",
        content:
          "Envía una solicitud de permiso, licencia o vacaciones a Recursos Humanos de IVAD con fechas, motivo y base legal.",
      },
      { property: "og:title", content: "Nueva solicitud de permiso — Portal IVAD" },
      {
        property: "og:description",
        content: "Formulario de permisos, licencias y vacaciones del personal de IVAD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NuevaSolicitud,
});

const hoy = () => new Date().toISOString().slice(0, 10);

const diasEntre = (a: string, b: string) => {
  if (!a || !b) return 1;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (Number.isNaN(ms) || ms < 0) return 1;
  return Math.floor(ms / 86400000) + 1;
};

function NuevaSolicitud() {
  const { tipo: tipoInicial } = Route.useSearch();
  const navigate = useNavigate();
  const { crearSolicitud } = usePortal();

  const [tipoId, setTipoId] = useState(tipoInicial ?? tiposSolicitud[0]!.id);
  const [inicio, setInicio] = useState(hoy());
  const [fin, setFin] = useState(hoy());
  const [motivo, setMotivo] = useState("");
  const [soporte, setSoporte] = useState("");
  const [enviando, setEnviando] = useState(false);

  const tipo = useMemo(() => tipoPorId(tipoId) ?? tiposSolicitud[0]!, [tipoId]);
  const dias = diasEntre(inicio, fin);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const r = await crearSolicitud({
      tipo: tipo.nombre,
      motivo,
      fechaInicio: inicio,
      fechaFin: fin,
      dias,
      conSalario: tipo.conSalario === true,
      baseLegal: tipo.baseLegal,
      ...(soporte.trim() ? { soporte: soporte.trim() } : {}),
    });
    setEnviando(false);
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo enviar la solicitud.");
      return;
    }
    toast.success("Solicitud enviada. Recursos Humanos la revisará.");
    void navigate({ to: "/solicitudes" });
  };

  return (
    <AppShell wide>
      <AppHeader titulo="Nueva solicitud" volver />
      <form onSubmit={enviar} className="mx-auto max-w-2xl space-y-6 px-4 py-5">
        <section className="space-y-4">
          <SectionTitle>Tipo de solicitud</SectionTitle>
          <div className="surface-card space-y-2 p-4">
            <Label htmlFor="tipo">¿Qué necesitas solicitar?</Label>
            <select
              id="tipo"
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {tiposSolicitud.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            <div className="mt-2 rounded-lg bg-muted p-3 text-sm text-foreground">
              <p className="flex items-start gap-2 font-semibold">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {tipo.duracion}
              </p>
              <p className="mt-1">{tipo.resumen}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tipo.baseLegal}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Soporte requerido: {tipo.soporte} · {tipo.aviso}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {tipo.conSalario === true
                  ? "Con disfrute de salario."
                  : tipo.conSalario === false
                    ? "Sin disfrute de salario (se descuenta)."
                    : "El disfrute de salario depende del caso y del soporte presentado."}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>Fechas</SectionTitle>
          <div className="surface-card grid gap-4 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inicio">Desde</Label>
              <Input
                id="inicio"
                type="date"
                value={inicio}
                onChange={(e) => {
                  setInicio(e.target.value);
                  if (fin < e.target.value) setFin(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fin">Hasta</Label>
              <Input
                id="fin"
                type="date"
                value={fin}
                min={inicio}
                onChange={(e) => setFin(e.target.value)}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Total solicitado: <strong className="text-foreground">{dias} día(s)</strong>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>Detalle</SectionTitle>
          <div className="surface-card space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica brevemente el motivo de tu solicitud"
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soporte">Documento de soporte (enlace o referencia)</Label>
              <Input
                id="soporte"
                value={soporte}
                onChange={(e) => setSoporte(e.target.value)}
                placeholder="Ej. certificado médico entregado en físico a RR.HH."
              />
              <p className="text-xs text-muted-foreground">
                Si no lo tienes ahora, indícalo aquí y entrégalo a Recursos Humanos.
              </p>
            </div>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Al enviar declaras que la información es verdadera. La ausencia solo queda justificada
          cuando la solicitud aparece como <strong>Aprobada</strong>.
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          <Send className="mr-2 h-5 w-5" />
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </form>
    </AppShell>
  );
}
