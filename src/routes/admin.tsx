import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Banknote,
  Camera,
  Check,
  LifeBuoy,
  Lock,
  MessageSquare,
  PenLine,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { FirmaPad } from "@/components/firma-pad";
import { ReciboPago } from "@/components/recibo-pago";
import { VolanteEditor } from "@/components/volante-editor";
import { VolantesBandeja, type VolanteGuardado } from "@/components/volantes-bandeja";
import { MimiChat } from "@/components/mimi-chat";
import { usePortal } from "@/lib/portal-store";
import { pesos, roles, type Cuenta } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { SelloVerificado, VerificacionPerfil } from "@/components/verificado";
import { enviarReciboFn } from "@/lib/correo.functions";
import {
  estadoWhatsappFn,
  enviarWhatsappFn,
  desvincularWhatsappFn,
} from "@/lib/whatsapp.functions";

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
  const { esAdmin, esContable, esNomina, sesion } = usePortal();
  const [pestana, setPestana] = useState(esNomina ? "contabilidad" : "firmas");
  const [editando, setEditando] = useState<VolanteGuardado | null>(null);
  const [refrescos, setRefrescos] = useState(0);


  if (!esAdmin && !esContable) {
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
            Administrador o Contabilidad pueden ver la nómina y los procesos financieros del
            personal.
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
        <Tabs value={pestana} onValueChange={setPestana}>
          <TabsList
            className={`grid w-full print:hidden ${esNomina ? "grid-cols-5" : "grid-cols-1"}`}
          >
            {esNomina ? <TabsTrigger value="contabilidad">Nómina</TabsTrigger> : null}
            {esNomina ? <TabsTrigger value="volante">Volante</TabsTrigger> : null}
            {esNomina ? <TabsTrigger value="guardados">Guardados</TabsTrigger> : null}
            {esNomina ? <TabsTrigger value="mimi">Mimi</TabsTrigger> : null}
            <TabsTrigger value="firmas">Firmas</TabsTrigger>
          </TabsList>
          {esAdmin ? (
            <>
              <TabsList className="mt-2 grid w-full grid-cols-4 print:hidden">
                <TabsTrigger value="fotos">Fotos</TabsTrigger>
                <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
                <TabsTrigger value="soporte">Soporte</TabsTrigger>
                <TabsTrigger value="accesos">Accesos</TabsTrigger>
              </TabsList>
              <TabsList className="mt-2 grid w-full grid-cols-5 print:hidden">
                <TabsTrigger value="verificados">Verificados</TabsTrigger>
                <TabsTrigger value="avisos">Avisos</TabsTrigger>
                <TabsTrigger value="tareas">Tareas</TabsTrigger>
                <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              </TabsList>
            </>
          ) : null}

          {esNomina ? (
            <>
              <TabsContent value="contabilidad" className="mt-4">
                <Contabilidad />
              </TabsContent>
              <TabsContent value="volante" className="mt-4">
                <VolanteEditor
                  inicial={editando}
                  onGuardado={() => setRefrescos((n) => n + 1)}
                />
              </TabsContent>
              <TabsContent value="guardados" className="mt-4">
                <VolantesBandeja
                  key={refrescos}
                  onEditar={(v) => {
                    setEditando(v);
                    setPestana("volante");
                  }}
                />
              </TabsContent>
              <TabsContent value="mimi" className="mt-4">
                <MimiChat />
              </TabsContent>
            </>
          ) : null}
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
          <TabsContent value="verificados" className="mt-4">
            <Verificados />
          </TabsContent>
          <TabsContent value="avisos" className="mt-4">
            <EnviarAvisos />
          </TabsContent>
          <TabsContent value="tareas" className="mt-4">
            <TareasPanel />
          </TabsContent>
          <TabsContent value="solicitudes" className="mt-4">
            <SolicitudesPanel />
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-4">
            <AdminWhatsApp />
          </TabsContent>

        </Tabs>
      </div>
    </AppShell>
  );
}

/** Envía el recibo de un pago al colaborador según su canal preferido (Correo, WhatsApp o Ambos). */
async function enviarReciboPago(
  pago: { periodo: string; monto: number; id: string },
  c: {
    nombre: string;
    email: string;
    cargo: string;
    area: string;
    ingreso: string;
    whatsapp?: string | null | undefined;
    canalAvisos?: string | null | undefined;
    firma?: string | undefined;
    firmaActualizada?: string | undefined;
  },
  puenteUrl?: string,
  puenteToken?: string,
) {
  const canal = (c.canalAvisos ?? "correo") as "correo" | "whatsapp" | "ambos" | "ninguno";
  const comprobante = `IVAD-${pago.id.slice(0, 8).toUpperCase()}`;

  const res = await enviarReciboFn({
    data: {
      para: c.email || "",
      whatsapp: c.whatsapp ?? undefined,
      canalAvisos: canal,
      puenteWhatsappUrl: puenteUrl,
      puenteWhatsappToken: puenteToken,
      comprobante,
      fechaEmision: new Date().toLocaleDateString("es-DO"),
      periodoDesde: pago.periodo,
      periodoHasta: pago.periodo,
      nombre: c.nombre,
      cargo: c.cargo,
      departamento: c.area,
      ingreso: c.ingreso,
      ingresos: [{ concepto: "Salario neto del período", monto: pago.monto }],
      deducciones: [],
      ...(c.firma ? { firma: c.firma } : {}),
      ...(c.firmaActualizada ? { firmaFecha: c.firmaActualizada } : {}),
    },
  }).catch((e: unknown) => ({
    ok: false as const,
    medios: "",
    error: e instanceof Error ? e.message : "Error al despachar el recibo",
  }));

  return res;
}

function Contabilidad() {
  const { pagos, colaboradores, actualizarPago, puenteWhatsappUrl, puenteWhatsappToken } = usePortal();
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
              onClick={async () => {
                for (const p of pagos.filter((x) => x.recibo === "No enviado")) {
                  await actualizarPago(p.id, { recibo: "Enviado", estado: "Pagado" });
                  const col = colaboradores.find((x) => x.id === p.colaboradorId);
                  if (col) await enviarReciboPago(p, col, puenteWhatsappUrl, puenteWhatsappToken).catch(() => undefined);
                }
                toast.success("Recibos despachados según las preferencias de cada colaborador");
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
                        onClick={async () => {
                          await actualizarPago(p.id, { recibo: "Enviado", estado: "Pagado" });
                          const res = await enviarReciboPago(p, c, puenteWhatsappUrl, puenteWhatsappToken).catch((e) => ({
                            ok: false as const,
                            medios: "",
                            error: e instanceof Error ? e.message : "Error de envío",
                          }));
                          if (res.ok) {
                            if ("advertencia" in res && res.advertencia) {
                              toast.warning(`Recibo enviado por ${"medios" in res && res.medios ? res.medios : "Correo"}, pero falló: ${res.advertencia}`);
                            } else {
                              toast.success(`Recibo enviado por ${"medios" in res && res.medios ? res.medios : "Correo"} a ${c.nombre}`);
                            }
                          } else {
                            toast.error(res.error ?? "No se pudo enviar el recibo");
                          }
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
  const { colaboradores, pagos, guardarFirma, borrarFirma, pedirRenovarFirma } = usePortal();
  const [activo, setActivo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const conFirma = colaboradores.filter((c) => c.firma).length;
  const sinFirma = colaboradores.filter((c) => !c.firma).length;

  const abrir = (id: string) => {
    setActivo(id);
    setAcepta(false);
  };

  return (
    <div className="space-y-5">
      <div className="surface-card p-4">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-accent" />
          <h3 className="font-display font-bold text-foreground">Firmas digitales</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          La firma recogida queda <strong>permanente</strong>: no hay que volver a firmar en cada
          pago. Si en algún caso hace falta renovarla, se le avisa al colaborador. El sistema la
          coloca automáticamente en el espacio de <strong>“Recibí conforme”</strong> del volante de
          pago.
        </p>
        <p className="mt-2 text-xs font-semibold text-foreground">
          {conFirma} de {colaboradores.length} colaboradores con firma registrada
          {sinFirma > 0 ? ` · ${sinFirma} sin firma` : ""}
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
                texto={c.firma ? "Firma permanente" : "Sin firma"}
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
                  Registrada el {c.firmaActualizada ?? "—"} · vigencia permanente
                </p>
                {c.firmaConsentimiento ? (
                  <p className="text-center text-[11px] text-muted-foreground">
                    Compromiso aceptado el {c.firmaConsentimiento}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => (abierto ? setActivo(null) : abrir(c.id))}
              >
                {abierto ? "Cerrar" : c.firma ? "Volver a firmar" : "Recoger firma"}
              </Button>
              {c.firma ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const r = await pedirRenovarFirma(c.id);
                    if (r.ok) toast.success(`Le avisamos a ${c.nombre} que debe firmar de nuevo`);
                    else toast.error(r.error ?? "No se pudo avisar");
                  }}
                >
                  Pedir renovar firma
                </Button>
              ) : null}
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
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-border bg-secondary/50 p-3 text-[11px] leading-relaxed text-foreground">
                  <p className="font-semibold uppercase">Compromiso de firma digital</p>
                  <p className="mt-1 text-muted-foreground">
                    {c.nombre || "El colaborador"} autoriza a IVAD SRL a usar esta firma digital en
                    el espacio de “Recibí conforme” de sus volantes de pago y documentos personales.
                    La firma queda <strong>permanente</strong>: se mantiene vigente hasta que él
                    mismo o Administración la revoque. Si en algún caso hace falta renovarla, se le
                    avisará por el portal.
                  </p>
                  <label className="mt-2 flex items-start gap-2">
                    <Checkbox
                      checked={acepta}
                      onCheckedChange={(v) => setAcepta(v === true)}
                      className="mt-0.5"
                    />
                    <span>Leí y acepto el compromiso de firma digital.</span>
                  </label>
                </div>
                <FirmaPad
                  guardando={guardando}
                  etiqueta={acepta ? "Guardar firma" : "Acepta el compromiso"}
                  onGuardar={async (dataUrl) => {
                    if (!acepta) {
                      toast.error("El colaborador debe aceptar el compromiso antes de firmar");
                      return;
                    }
                    setGuardando(true);
                    const r = await guardarFirma(c.id, dataUrl);
                    setGuardando(false);
                    if (r.ok) {
                      toast.success(`Firma de ${c.nombre} guardada de forma permanente`);
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
  telefono: "",
  whatsapp: "",
  canalAvisos: "correo",
};

function CuentasUsuarios() {
  const { cuentas, colaboradores, sesion, guardarCuenta, eliminarCuenta } = usePortal();
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
            {editando ? "Editar credenciales y contacto" : "Crear credenciales de usuario"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Los usuarios no pueden registrarse por su cuenta: aquí digitas su correo, datos de contacto,
          contraseña y método donde recibirán sus avisos y volantes de pago.
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-telefono">Teléfono</Label>
            <Input
              id="c-telefono"
              placeholder="Ej: 809-555-1234"
              value={form.telefono ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-whatsapp">WhatsApp (ej: +1 849 425 2220 ó 8494252220)</Label>
            <Input
              id="c-whatsapp"
              placeholder="+1 849 425 2220"
              value={form.whatsapp ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-canal">Canal para recibir avisos y volante de pago</Label>
          <select
            id="c-canal"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={form.canalAvisos ?? "correo"}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                canalAvisos: e.target.value as "correo" | "whatsapp" | "ambos" | "ninguno",
              }))
            }
          >
            <option value="correo">Solo Correo electrónico</option>
            <option value="whatsapp">Solo WhatsApp</option>
            <option value="ambos">Correo y WhatsApp (Ambos)</option>
            <option value="ninguno">Solo en el portal</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            Define por dónde se le enviará el comprobante de pago de nómina y las notificaciones al colaborador.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">Correo corporativo (acceso)</Label>
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
          <Label htmlFor="c-clave">
            {editando ? "Nueva contraseña (opcional)" : "Contraseña provisional"}
          </Label>
          <Input
            id="c-clave"
            value={form.clave}
            onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))}
            placeholder={editando ? "Dejar en blanco para mantener la actual" : "Mínimo 6 caracteres"}
            required={!editando}
          />
          <p className="text-xs text-muted-foreground">
            Es solo para el primer acceso: al entrar, el colaborador deberá crear su propia
            contraseña e ingresarla dos veces.
          </p>
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
          {cuentas.map((u) => {
            const colab = colaboradores.find((c) => c.email.toLowerCase() === u.email.toLowerCase());
            const canal = colab?.canalAvisos ?? u.canalAvisos ?? "correo";
            const canalTexto =
              canal === "ambos"
                ? "Correo y WhatsApp"
                : canal === "whatsapp"
                ? "Solo WhatsApp"
                : canal === "ninguno"
                ? "Solo Portal"
                : "Solo Correo";

            return (
              <article key={u.email} className="surface-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar iniciales={u.iniciales} size="sm" foto={colab?.foto} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{u.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    {colab?.whatsapp ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        WA: +{colab.whatsapp} {colab.telefono ? `· Tel: ${colab.telefono}` : ""}
                      </p>
                    ) : colab?.telefono ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        Tel: {colab.telefono}
                      </p>
                    ) : null}
                  </div>
                  <Etiqueta texto={u.rol} tono="accent" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Etiqueta texto={u.cargo || "Sin cargo"} tono="muted" />
                  <Etiqueta texto={`Recibos: ${canalTexto}`} tono="accent" />
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          ...u,
                          clave: "",
                          telefono: colab?.telefono ?? u.telefono ?? "",
                          whatsapp: colab?.whatsapp ?? u.whatsapp ?? "",
                          canalAvisos: colab?.canalAvisos ?? u.canalAvisos ?? "correo",
                        });
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
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Accesos() {
  const { sesion, colaboradores, cuentas } = usePortal();
  const permisos: Record<string, string> = {
    Administrador: "Acceso total: nómina, salarios, recibos, firmas, fotos, usuarios y verificados",
    "Recursos Humanos": "Colaboradores, perfiles y revisión de fotos",
    Contabilidad: "Nómina, salarios, volantes de pago y recibos",
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

function Etiqueta({
  texto,
  tono,
}: {
  texto: string;
  tono: "success" | "accent" | "muted" | "warning";
}) {
  const clase =
    tono === "success"
      ? "bg-success/15 text-foreground"
      : tono === "accent"
        ? "bg-accent text-accent-foreground"
        : tono === "warning"
          ? "bg-destructive/15 text-destructive"
          : "bg-secondary text-secondary-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${clase}`}>{texto}</span>
  );
}

/** Otorga o retira la insignia de verificación de cada colaborador. */
function Verificados() {
  const { colaboradores, verificar } = usePortal();
  const [enCurso, setEnCurso] = useState<string | null>(null);

  const cambiar = async (id: string, valor: boolean) => {
    setEnCurso(id);
    const r = await verificar(id, valor);
    setEnCurso(null);
    if (!r.ok) toast.error(r.error ?? "No se pudo actualizar la verificación");
    else
      toast.success(
        valor ? "Insignia otorgada y notificada por correo" : "Insignia retirada del perfil",
      );
  };

  const verificados = colaboradores.filter((c) => c.verificado).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <SelloVerificado tipo="admin" className="h-7 w-7" />
          <SelloVerificado tipo="empleado" className="h-7 w-7" />
          <p className="text-sm text-foreground">
            La insignia <strong>dorada</strong> corresponde a cuentas de administración
            (Administrador, RR.HH. y Contabilidad) y la <strong>azul</strong> a colaboradores. Se
            otorga o se retira aquí y todo el equipo la ve en el directorio.
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {verificados} de {colaboradores.length} perfiles verificados. Cada cambio envía un correo
          automático al colaborador.
        </p>
      </div>

      <ul className="space-y-2">
        {colaboradores.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Avatar iniciales={c.iniciales} foto={c.foto} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">{c.nombre}</p>
                <VerificacionPerfil colaborador={c} className="h-4 w-4" />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {c.cargo || "Sin cargo"} · {c.rol ?? "Colaborador"}
              </p>
            </div>
            <Button
              size="sm"
              variant={c.verificado ? "outline" : "default"}
              disabled={enCurso === c.id}
              onClick={() => void cambiar(c.id, !c.verificado)}
            >
              {c.verificado ? (
                <>
                  <X className="mr-1 h-4 w-4" /> Quitar
                </>
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" /> Verificar
                </>
              )}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Envío de comunicados internos: a todo el personal o a un colaborador específico. */
function EnviarAvisos() {
  const { colaboradores, enviarAvisoManual } = usePortal();
  const [destino, setDestino] = useState("todos");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);

  const activos = colaboradores;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const r = await enviarAvisoManual({ destino, titulo, detalle });
    setEnviando(false);
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo enviar el aviso");
      return;
    }
    toast.success(
      r.enviados && r.enviados > 1
        ? `Aviso enviado a ${r.enviados} colaboradores`
        : "Aviso enviado",
    );
    setTitulo("");
    setDetalle("");
  };

  return (
    <div className="space-y-4">
      <SectionTitle action={`${activos.length} activos`}>Enviar notificaciones</SectionTitle>
      <p className="text-sm text-muted-foreground">
        El aviso aparece en las notificaciones del portal y también se envía por correo con el
        formato institucional de IVAD.
      </p>
      <form onSubmit={enviar} className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="a-destino">Destinatario</Label>
          <select
            id="a-destino"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          >
            <option value="todos">Todo el personal activo</option>
            {activos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.cargo || c.area}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-titulo">Título</Label>
          <Input
            id="a-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Reunión general del viernes"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-detalle">Mensaje</Label>
          <Textarea
            id="a-detalle"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Escribe el comunicado para el equipo…"
            rows={5}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={enviando}>
          <Bell className="mr-2 h-4 w-4" />
          {enviando ? "Enviando…" : "Enviar notificación"}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tareas: Administración asigna trabajo y ve el avance del colaborador.
// ---------------------------------------------------------------------------
function TareasPanel() {
  const { colaboradores, tareas, crearTarea, marcarTarea, eliminarTarea } = usePortal();
  const [colaboradorId, setColaboradorId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [vence, setVence] = useState("");
  const [prioridad, setPrioridad] = useState<"Alta" | "Media" | "Baja">("Media");
  const [filtro, setFiltro] = useState("todos");
  const [guardando, setGuardando] = useState(false);

  const nombre = (id: string) => colaboradores.find((c) => c.id === id)?.nombre ?? "Colaborador";

  const asignar = async () => {
    setGuardando(true);
    const r = await crearTarea({
      colaboradorId,
      titulo,
      detalle,
      ...(vence ? { vence } : {}),
      prioridad,
    });
    setGuardando(false);
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo asignar la tarea.");
      return;
    }
    toast.success("Tarea asignada y notificada al colaborador.");
    setTitulo("");
    setDetalle("");
    setVence("");
  };

  const lista = tareas.filter((t) => filtro === "todos" || t.colaboradorId === filtro);
  const pendientes = lista.filter((t) => !t.completada);
  const listas = lista.filter((t) => t.completada);

  const tonoPrioridad: Record<string, string> = {
    Alta: "bg-destructive text-destructive-foreground",
    Media: "bg-accent text-accent-foreground",
    Baja: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-6">
      <section className="surface-card space-y-4 p-4">
        <SectionTitle>Asignar tarea</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tarea-colab">Colaborador</Label>
            <select
              id="tarea-colab"
              value={colaboradorId}
              onChange={(e) => setColaboradorId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Selecciona…</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.cargo}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tarea-prioridad">Prioridad</Label>
            <select
              id="tarea-prioridad"
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as "Alta" | "Media" | "Baja")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tarea-titulo">Tarea</Label>
            <Input
              id="tarea-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Entregar informe de inventario"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tarea-detalle">Instrucciones (opcional)</Label>
            <Textarea
              id="tarea-detalle"
              rows={3}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Detalla lo que debe hacer el colaborador"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tarea-vence">Vence (opcional)</Label>
            <Input
              id="tarea-vence"
              type="date"
              value={vence}
              onChange={(e) => setVence(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => void asignar()} disabled={guardando}>
          {guardando ? "Asignando…" : "Asignar tarea"}
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <SectionTitle>Seguimiento</SectionTitle>
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="todos">Todo el personal</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Pendientes ({pendientes.length})
        </p>
        {pendientes.length === 0 ? (
          <p className="surface-card p-4 text-sm text-muted-foreground">Sin tareas pendientes.</p>
        ) : (
          <div className="surface-card divide-y divide-border">
            {pendientes.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{t.titulo}</p>
                  <p className="text-sm text-foreground">{nombre(t.colaboradorId)}</p>
                  {t.detalle ? (
                    <p className="text-sm text-muted-foreground">{t.detalle}</p>
                  ) : null}
                  {t.vence ? (
                    <p className="text-xs text-muted-foreground">Vence: {t.vence}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tonoPrioridad[t.prioridad]}`}
                  >
                    {t.prioridad}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void marcarTarea(t.id, true)}
                  >
                    Marcar realizada
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void eliminarTarea(t.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Realizadas ({listas.length})
        </p>
        {listas.length === 0 ? (
          <p className="surface-card p-4 text-sm text-muted-foreground">Aún nada completado.</p>
        ) : (
          <div className="surface-card divide-y divide-border">
            {listas.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground line-through">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">{nombre(t.colaboradorId)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => void eliminarTarea(t.id)}>
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solicitudes: aprobar o rechazar con un comentario para el colaborador.
// ---------------------------------------------------------------------------
const plantillasAprobado = [
  "¡Aprobado! Que te vaya muy bien y aproveches el tiempo.",
  "Aprobado. Coordina el pendiente con tu supervisor antes de salir.",
  "Aprobado. Tu certificado estará listo en Recursos Humanos.",
];
const plantillasRechazado = [
  "No podemos aprobarlo en esas fechas por la carga de trabajo. Propón otras.",
  "Falta el documento de soporte. Entrégalo y vuelve a solicitarlo.",
];

function SolicitudesPanel() {
  const { solicitudes, colaboradores, responderSolicitud } = usePortal();
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  const nombre = (id: string) => colaboradores.find((c) => c.id === id)?.nombre ?? "Colaborador";
  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente");
  const historial = solicitudes.filter((s) => s.estado !== "Pendiente");

  const tonoSolicitud: Record<string, string> = {
    Pendiente: "bg-accent text-accent-foreground",
    Aprobada: "bg-success text-success-foreground",
    Rechazada: "bg-destructive text-destructive-foreground",
    Cancelada: "bg-muted text-muted-foreground",
  };

  const responder = async (id: string, estado: "Aprobada" | "Rechazada") => {
    const r = await responderSolicitud(id, estado, comentarios[id] ?? "");
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo actualizar la solicitud.");
      return;
    }
    toast.success(`Solicitud ${estado.toLowerCase()}. El colaborador fue notificado.`);
    setComentarios((p) => ({ ...p, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Pendientes ({pendientes.length})</SectionTitle>
        {pendientes.length === 0 ? (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            No hay solicitudes pendientes.
          </p>
        ) : (
          pendientes.map((s) => (
            <article key={s.id} className="surface-card space-y-3 p-4">
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
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tonoSolicitud[s.estado]}`}
                >
                  {s.estado}
                </span>
              </div>

              <Textarea
                rows={2}
                value={comentarios[s.id] ?? ""}
                onChange={(e) => setComentarios((p) => ({ ...p, [s.id]: e.target.value }))}
                placeholder="Comentario para el colaborador"
              />
              <div className="flex flex-wrap gap-2">
                {[...plantillasAprobado, ...plantillasRechazado].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setComentarios((p) => ({ ...p, [s.id]: t }))}
                    className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground"
                  >
                    {t.length > 42 ? `${t.slice(0, 42)}…` : t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void responder(s.id, "Aprobada")}>
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void responder(s.id, "Rechazada")}
                >
                  Rechazar
                </Button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
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
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tonoSolicitud[s.estado]}`}
                >
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminWhatsApp() {
  const { puenteWhatsappUrl, puenteWhatsappToken, guardarPuenteWhatsappConfig } = usePortal();
  const [puente, setPuente] = useState(puenteWhatsappUrl);
  const [token, setToken] = useState(puenteWhatsappToken || "ivad-secret-token");
  const [guardandoPuente, setGuardandoPuente] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [estado, setEstado] = useState<{ conectado: boolean; numero: string; qr: string } | null>(null);
  const [errorPuente, setErrorPuente] = useState<string | null>(null);

  // Mensaje de prueba
  const [telefonoPrueba, setTelefonoPrueba] = useState("");
  const [textoPrueba, setTextoPrueba] = useState("¡Hola! Este es un mensaje de prueba desde el Portal IVAD.");
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);

  useEffect(() => {
    setPuente(puenteWhatsappUrl);
  }, [puenteWhatsappUrl]);

  useEffect(() => {
    if (puenteWhatsappToken) setToken(puenteWhatsappToken);
  }, [puenteWhatsappToken]);

  const consultar = async (urlTarget?: string, tokenTarget?: string) => {
    const target = (urlTarget ?? puente).trim();
    const tok = (tokenTarget ?? token).trim();
    if (!target) return;
    setConsultando(true);
    setErrorPuente(null);
    try {
      const res = await estadoWhatsappFn({ data: { puente: target, token: tok } });
      if (!res.ok) {
        setErrorPuente(res.error ?? "No se pudo conectar con el puente de WhatsApp");
        setEstado(null);
      } else {
        setEstado({
          conectado: Boolean(res.conectado),
          numero: String(res.numero ?? ""),
          qr: String(res.qr ?? ""),
        });
      }
    } catch (e) {
      setErrorPuente(e instanceof Error ? e.message : "Error al consultar estado");
      setEstado(null);
    } finally {
      setConsultando(false);
    }
  };

  useEffect(() => {
    void consultar(puente, token);
  }, [puente, token]);

  // Sondeo cada 5s si hay un QR visible para actualizar automáticamente al escanear
  useEffect(() => {
    if (estado && !estado.conectado && estado.qr) {
      const interval = setInterval(() => {
        void consultar();
      }, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [estado, puente, token]);

  const guardarConfig = async () => {
    setGuardandoPuente(true);
    const r = await guardarPuenteWhatsappConfig(puente, token);
    setGuardandoPuente(false);
    if (!r.ok) {
      toast.error(r.error ?? "No se pudo guardar la configuración");
      return;
    }
    toast.success("Configuración del puente guardada");
    await consultar(puente, token);
  };

  const desvincular = async () => {
    if (!confirm("¿Seguro que deseas desvincular el WhatsApp actual? Se cerrará la sesión y se generará un código QR nuevo.")) return;
    setDesvinculando(true);
    try {
      const res = await desvincularWhatsappFn({ data: { puente, token } });
      if (res.ok) {
        toast.success("Sesión cerrada. Generando nuevo código QR...");
        await consultar();
      } else {
        toast.error(res.error ?? "Error al desvincular");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desvincular");
    } finally {
      setDesvinculando(false);
    }
  };

  const enviarPrueba = async () => {
    const num = telefonoPrueba.replace(/\D/g, "");
    if (!num || num.length < 10) {
      toast.error("Ingresa un número válido con código de país (ej: 18095551234)");
      return;
    }
    if (!textoPrueba.trim()) {
      toast.error("Escribe un mensaje de prueba");
      return;
    }
    setEnviandoPrueba(true);
    try {
      const res = await enviarWhatsappFn({
        data: { puente, para: num, texto: textoPrueba, token },
      });
      if (res.ok) {
        toast.success("Mensaje de prueba enviado por WhatsApp");
      } else {
        toast.error(res.error ?? "No se pudo enviar el mensaje");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setEnviandoPrueba(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vinculación Directa con Código QR */}
      <section className="surface-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
          <div>
            <SectionTitle>Conectar WhatsApp Corporativo</SectionTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Escanea el código QR desde tu teléfono para vincular la cuenta y enviar avisos automáticos al personal.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void consultar()}
            disabled={consultando}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${consultando ? "animate-spin" : ""}`} />
            {consultando ? "Actualizando..." : "Actualizar QR"}
          </Button>
        </div>

        {estado?.conectado ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-950 dark:text-emerald-200 space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white font-bold shadow-md">
                <Check className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-bold text-foreground">WhatsApp Conectado y Operativo</p>
                <p className="text-sm text-muted-foreground">
                  Número activo: <strong className="font-mono text-foreground font-semibold">+{estado.numero}</strong>
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Los avisos de nómina, estados de permisos, vacaciones y tareas se enviarán automáticamente a través de este WhatsApp a los colaboradores registrados.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void desvincular()}
              disabled={desvinculando}
            >
              {desvinculando ? "Desvinculando..." : "Desvincular este teléfono"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-4">
            {estado?.qr ? (
              <div className="flex flex-col items-center justify-center space-y-4 bg-muted/20 border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-sm">
                <div className="bg-white p-3 rounded-2xl shadow-md border">
                  <img
                    src={estado.qr}
                    alt="Código QR de WhatsApp"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                  />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    Escanea este código con WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    1. Abre WhatsApp en tu celular &rarr; 2. Ajustes o Menú (&#8942;) &rarr; 3. Dispositivos vinculados &rarr; 4. Vincular un dispositivo.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-primary animate-pulse pt-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Esperando escaneo desde tu teléfono...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center max-w-sm">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Smartphone className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Preparando código QR...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {consultando ? "Generando sesión segura..." : "Haz clic en el botón para cargar el código QR."}
                  </p>
                </div>
                <Button onClick={() => void consultar()} disabled={consultando}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${consultando ? "animate-spin" : ""}`} />
                  Cargar código QR
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Prueba de Envío Directo (solo visible cuando está conectado) */}
      {estado?.conectado ? (
        <section className="surface-card p-6 space-y-4">
          <SectionTitle>Prueba de Envío Directo</SectionTitle>
          <div className="space-y-3 max-w-xl">
            <div className="space-y-1">
              <Label htmlFor="tel-prueba">Número de destino (con código de país)</Label>
              <Input
                id="tel-prueba"
                placeholder="18095551234"
                value={telefonoPrueba}
                onChange={(e) => setTelefonoPrueba(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="msg-prueba">Mensaje de prueba</Label>
              <Textarea
                id="msg-prueba"
                rows={2}
                value={textoPrueba}
                onChange={(e) => setTextoPrueba(e.target.value)}
              />
            </div>
            <Button onClick={() => void enviarPrueba()} disabled={enviandoPrueba}>
              <Send className="mr-2 h-4 w-4" />
              {enviandoPrueba ? "Enviando..." : "Enviar mensaje de prueba"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
