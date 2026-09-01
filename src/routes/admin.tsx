import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Camera,
  Check,
  Lock,
  Receipt,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { usePortal } from "@/lib/portal-store";
import { pesos, usuariosDemo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administradores — Portal IVAD" },
      {
        name: "description",
        content:
          "Panel restringido de IVAD: contabilidad de nómina, emisión de pagos y recibos, y aprobación de fotos de perfil.",
      },
      { property: "og:title", content: "Administradores — Portal IVAD" },
      {
        property: "og:description",
        content: "Contabilidad, pagos de nómina y controles administrativos de IVAD Home & Goods.",
      },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { esAdmin, sesion } = usePortal();

  if (!esAdmin) {
    return (
      <AppShell>
        <AppHeader titulo="Administradores" subtitulo="Acceso restringido" volver />
        <div className="px-4 py-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Lock className="h-7 w-7 text-primary" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">Área restringida</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu rol actual es <strong>{sesion.rol}</strong>. Solo los usuarios con rol
            Administrador pueden ver contabilidad y procesos financieros del personal.
          </p>
          <Link to="/inicio" className="mt-6 inline-block">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader titulo="Administradores" subtitulo="Contabilidad y controles internos" volver />
      <div className="space-y-6 px-4 py-5">
        <Tabs defaultValue="contabilidad">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contabilidad">Nómina</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="accesos">Accesos</TabsTrigger>
          </TabsList>

          <TabsContent value="contabilidad" className="mt-4">
            <Contabilidad />
          </TabsContent>
          <TabsContent value="fotos" className="mt-4">
            <RevisionFotos />
          </TabsContent>
          <TabsContent value="accesos" className="mt-4">
            <Accesos />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Contabilidad() {
  const { pagos, colaboradores, actualizarPago } = usePortal();
  const totalPeriodo = pagos.reduce((s, p) => s + p.monto, 0);
  const pendientes = pagos.filter((p) => p.estado === "Pendiente");
  const recibosFaltantes = pagos.filter((p) => p.recibo === "No enviado");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Metrica icon={Banknote} valor={`RD$ ${pesos(totalPeriodo)}`} label="Total del período" />
        <Metrica icon={Receipt} valor={String(pendientes.length)} label="Pagos pendientes" />
        <Metrica icon={BadgeCheck} valor={String(recibosFaltantes.length)} label="Recibos por enviar" />
      </div>

      <section>
        <SectionTitle
          action={
            <button
              type="button"
              className="text-xs font-medium text-primary underline"
              onClick={() => {
                pagos
                  .filter((p) => p.recibo === "No enviado")
                  .forEach((p) => actualizarPago(p.id, { recibo: "Enviado", estado: "Pagado" }));
                toast.success("Recibos enviados a todos los colaboradores");
              }}
            >
              Enviar todos
            </button>
          }
        >
          Pagos del personal
        </SectionTitle>
        <div className="space-y-3">
          {pagos.map((p) => {
            const c = colaboradores.find((x) => x.id === p.colaboradorId);
            if (!c) return null;
            return (
              <article key={p.id} className="surface-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar iniciales={c.iniciales} size="sm" foto={c.foto} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{c.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.cargo} · {p.periodo}
                    </p>
                  </div>
                  <p className="font-display font-bold text-foreground">RD$ {pesos(p.monto)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Etiqueta
                    texto={p.estado}
                    tono={p.estado === "Pagado" ? "success" : "accent"}
                  />
                  <Etiqueta
                    texto={`Recibo: ${p.recibo}`}
                    tono={p.recibo === "Enviado" ? "success" : "muted"}
                  />
                  <div className="ml-auto flex gap-2">
                    {p.estado === "Pendiente" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          actualizarPago(p.id, { estado: "Pagado" });
                          toast.success(`Pago de ${c.nombre} marcado como pagado`);
                        }}
                      >
                        Marcar pagado
                      </Button>
                    ) : null}
                    {p.recibo === "No enviado" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          actualizarPago(p.id, { recibo: "Enviado", estado: "Pagado" });
                          toast.success(`Recibo enviado a ${c.email}`);
                        }}
                      >
                        Enviar recibo
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RevisionFotos() {
  const { fotosPendientes, aprobarFoto, rechazarFoto } = usePortal();
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  if (fotosPendientes.length === 0) {
    return (
      <div className="surface-card p-6 text-center">
        <Camera className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-3 font-semibold text-foreground">No hay fotos por revisar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando un colaborador suba una foto de perfil, aparecerá aquí para su aprobación.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fotosPendientes.map((c) => (
        <article key={c.id} className="surface-card p-4">
          <div className="flex items-center gap-3">
            <img
              src={c.fotoPendiente}
              alt={`Foto propuesta por ${c.nombre}`}
              className="h-16 w-16 rounded-full border-2 border-accent object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{c.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">{c.cargo}</p>
            </div>
          </div>
          <Textarea
            className="mt-3"
            rows={2}
            placeholder="Motivo del rechazo (opcional)"
            value={motivos[c.id] ?? ""}
            onChange={(e) => setMotivos((p) => ({ ...p, [c.id]: e.target.value.slice(0, 200) }))}
          />
          <div className="mt-3 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                aprobarFoto(c.id);
                toast.success(`Foto de ${c.nombre} aprobada`);
              }}
            >
              <Check className="mr-1 h-4 w-4" /> Aprobar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                rechazarFoto(
                  c.id,
                  (motivos[c.id] ?? "").trim() ||
                    "La foto no cumple con el marco de perfil institucional.",
                );
                toast.info(`Se notificó a ${c.nombre} que la foto no aplica`);
              }}
            >
              <X className="mr-1 h-4 w-4" /> No aplica
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Accesos() {
  const { sesion, colaboradores } = usePortal();
  const permisos: Record<string, string> = {
    Administrador: "Contabilidad, nómina, recibos, fotos y colaboradores",
    "Recursos Humanos": "Colaboradores, perfiles y revisión de fotos",
    Supervisor: "Aprobación de solicitudes de su equipo",
    Colaborador: "Su perfil, asistencia y solicitudes",
  };

  return (
    <div className="space-y-3">
      <div className="surface-card flex items-center gap-3 p-4">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <p className="text-sm text-muted-foreground">
          Sesión activa: <strong className="text-foreground">{sesion.nombre}</strong> ({sesion.rol})
        </p>
      </div>
      {usuariosDemo.map((u) => (
        <article key={u.email} className="surface-card p-4">
          <div className="flex items-center gap-3">
            <Avatar iniciales={u.iniciales} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{u.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <Etiqueta texto={u.rol} tono="accent" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{permisos[u.rol]}</p>
        </article>
      ))}
      <div className="surface-card flex items-center gap-3 p-4">
        <Users className="h-5 w-5 text-accent" />
        <p className="text-sm text-muted-foreground">
          {colaboradores.length} colaboradores registrados en la nómina.
        </p>
      </div>
    </div>
  );
}

function Metrica({
  icon: Icon,
  valor,
  label,
}: {
  icon: typeof Banknote;
  valor: string;
  label: string;
}) {
  return (
    <div className="surface-card p-3">
      <Icon className="h-4 w-4 text-accent" />
      <p className="mt-2 font-display text-sm font-bold leading-tight text-foreground">{valor}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function Etiqueta({ texto, tono }: { texto: string; tono: "success" | "accent" | "muted" }) {
  const clase =
    tono === "success"
      ? "bg-success/15 text-foreground"
      : tono === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-secondary text-secondary-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${clase}`}>{texto}</span>
  );
}
