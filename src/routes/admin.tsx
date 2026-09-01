import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Camera,
  Check,
  LifeBuoy,
  Lock,
  PenLine,
  Receipt,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { FirmaPad } from "@/components/firma-pad";
import { ReciboPago } from "@/components/recibo-pago";
import { usePortal } from "@/lib/portal-store";
import { pesos, roles, type Cuenta } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <TabsTrigger value="firmas">Firmas</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
          </TabsList>
          <TabsList className="mt-2 grid w-full grid-cols-3">
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="soporte">Soporte</TabsTrigger>
            <TabsTrigger value="accesos">Accesos</TabsTrigger>
          </TabsList>

          <TabsContent value="contabilidad" className="mt-4">
            <Contabilidad />
          </TabsContent>
          <TabsContent value="firmas" className="mt-4">
            <Firmas />
          </TabsContent>
          <TabsContent value="soporte" className="mt-4">
            <CasosSoporte />
          </TabsContent>
          <TabsContent value="fotos" className="mt-4">
            <RevisionFotos />
          </TabsContent>
          <TabsContent value="usuarios" className="mt-4">
            <CuentasUsuarios />
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

function Firmas() {
  const { colaboradores, pagos, guardarFirma, borrarFirma } = usePortal();
  const [activo, setActivo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const conFirma = colaboradores.filter((c) => c.firma).length;

  return (
    <div className="space-y-5">
      <div className="surface-card p-4">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold text-foreground">Firmas digitales</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Recoge la firma de cada colaborador una sola vez. El sistema la coloca automáticamente en
          el espacio de <strong>“Recibido por”</strong> de su recibo de pago.
        </p>
        <p className="mt-2 text-xs font-semibold text-foreground">
          {conFirma} de {colaboradores.length} colaboradores con firma registrada
        </p>
      </div>

      {colaboradores.map((c) => {
        const pago = pagos.find((p) => p.colaboradorId === c.id);
        const abierto = activo === c.id;
        return (
          <article key={c.id} className="surface-card p-4">
            <div className="flex items-center gap-3">
              <Avatar iniciales={c.iniciales} size="sm" foto={c.foto} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{c.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{c.cargo || "Sin cargo"}</p>
              </div>
              <Etiqueta
                texto={c.firma ? "Firmado" : "Sin firma"}
                tono={c.firma ? "success" : "muted"}
              />
            </div>

            {c.firma ? (
              <div className="mt-3 rounded-lg border border-border bg-card p-2">
                <img
                  src={c.firma}
                  alt={`Firma digital de ${c.nombre}`}
                  className="mx-auto max-h-16 object-contain"
                />
                <p className="mt-1 text-center text-[11px] text-muted-foreground">
                  Registrada el {c.firmaActualizada ?? "—"}
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setActivo(abierto ? null : c.id)}>
                {abierto ? "Cerrar" : c.firma ? "Volver a firmar" : "Recoger firma"}
              </Button>
              {c.firma ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const r = await borrarFirma(c.id);
                    if (r.ok) toast.info(`Firma de ${c.nombre} eliminada`);
                    else toast.error(r.error ?? "No se pudo eliminar");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            {abierto ? (
              <div className="mt-3">
                <FirmaPad
                  guardando={guardando}
                  etiqueta="Guardar firma"
                  onGuardar={async (dataUrl) => {
                    setGuardando(true);
                    const r = await guardarFirma(c.id, dataUrl);
                    setGuardando(false);
                    if (r.ok) {
                      toast.success(`Firma de ${c.nombre} guardada`);
                      setActivo(null);
                    } else {
                      toast.error(r.error ?? "No se pudo guardar la firma");
                    }
                  }}
                />
              </div>
            ) : null}

            {pago ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-primary underline">
                  Ver recibo con la firma
                </summary>
                <div className="mt-2">
                  <ReciboPago pago={pago} colaborador={c} />
                </div>
              </details>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function CasosSoporte() {
  const { tickets, responderTicket } = usePortal();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  if (tickets.length === 0) {
    return (
      <div className="surface-card p-6 text-center">
        <LifeBuoy className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-3 font-semibold text-foreground">No hay casos de soporte</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Las quejas y dudas enviadas desde la página de Soporte aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <article key={t.id} className="surface-card p-4">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{t.asunto}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t.nombre} · {t.categoria} · {t.fecha}
              </p>
            </div>
            <Etiqueta texto={t.estado} tono={t.estado === "Resuelto" ? "success" : "accent"} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{t.mensaje}</p>
          {t.respuesta ? (
            <p className="mt-2 rounded-lg bg-brand-soft p-2 text-sm text-foreground">
              <strong>Respuesta:</strong> {t.respuesta}
            </p>
          ) : (
            <>
              <Textarea
                className="mt-3"
                rows={2}
                placeholder="Escribe la respuesta al colaborador"
                value={respuestas[t.id] ?? ""}
                onChange={(e) =>
                  setRespuestas((p) => ({ ...p, [t.id]: e.target.value.slice(0, 1000) }))
                }
              />
              <Button
                size="sm"
                className="mt-2"
                onClick={async () => {
                  const texto = (respuestas[t.id] ?? "").trim();
                  if (texto.length < 3) {
                    toast.error("Escribe una respuesta");
                    return;
                  }
                  const r = await responderTicket(t.id, texto);
                  if (r.ok) toast.success("Respuesta enviada al colaborador");
                  else toast.error(r.error ?? "No se pudo responder");
                }}
              >
                Responder y resolver
              </Button>
            </>
          )}
        </article>
      ))}
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

const cuentaVacia: Cuenta = {
  email: "",
  clave: "",
  nombre: "",
  rol: "Colaborador",
  cargo: "",
  iniciales: "",
};

function CuentasUsuarios() {
  const { cuentas, sesion, guardarCuenta, eliminarCuenta } = usePortal();
  const [form, setForm] = useState<Cuenta>(cuentaVacia);
  const [editando, setEditando] = useState<string | null>(null);

  const limpiar = () => {
    setForm(cuentaVacia);
    setEditando(null);
  };

  return (
    <div className="space-y-5">
      <form
        className="surface-card space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await guardarCuenta(form, editando ?? undefined);
          if (!r.ok) {
            toast.error(r.error ?? "No se pudo guardar la cuenta");
            return;
          }
          toast.success(
            editando ? "Credenciales actualizadas" : `Cuenta creada para ${form.nombre}`,
          );
          limpiar();
        }}
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold text-foreground">
            {editando ? "Editar credenciales" : "Crear credenciales de usuario"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Los usuarios no pueden registrarse por su cuenta: aquí digitas su correo, contraseña y
          rol de acceso.
        </p>
        <div className="space-y-2">
          <Label htmlFor="c-nombre">Nombre completo</Label>
          <Input
            id="c-nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-cargo">Cargo</Label>
          <Input
            id="c-cargo"
            value={form.cargo}
            onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">Correo corporativo</Label>
          <Input
            id="c-email"
            type="email"
            placeholder="nombre@ivad.com.do"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-clave">Contraseña asignada</Label>
          <Input
            id="c-clave"
            value={form.clave}
            onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-rol">Rol de acceso</Label>
          <select
            id="c-rol"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.rol}
            onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as Cuenta["rol"] }))}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {editando ? "Guardar cambios" : "Crear cuenta"}
          </Button>
          {editando ? (
            <Button type="button" variant="outline" onClick={limpiar}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <section>
        <SectionTitle>Cuentas registradas ({cuentas.length})</SectionTitle>
        <div className="space-y-3">
          {cuentas.map((u) => (
            <article key={u.email} className="surface-card p-4">
              <div className="flex items-center gap-3">
                <Avatar iniciales={u.iniciales} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{u.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Etiqueta texto={u.rol} tono="accent" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Etiqueta texto={u.cargo || "Sin cargo"} tono="muted" />
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({ ...u, clave: "" });
                      setEditando(u.email);
                    }}
                  >
                    Editar
                  </Button>
                  {u.email !== sesion.email ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const r = await eliminarCuenta(u.email);
                        if (r.ok) toast.info(`Acceso de ${u.nombre} eliminado`);
                        else toast.error(r.error ?? "No se pudo eliminar");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Accesos() {
  const { sesion, colaboradores, cuentas } = usePortal();
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
      {cuentas.map((u) => (
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
