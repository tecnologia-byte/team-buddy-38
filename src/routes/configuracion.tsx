import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Laptop, Lock, Mail, Moon, ShieldCheck, Smartphone, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePortal } from "@/lib/portal-store";
import { supabase } from "@/integrations/supabase/client";
import { guardarTemaLocal, huellaDispositivo, nombreDispositivo, type Tema } from "@/lib/tema";
import { confirmarCodigoFn, guardarPreferenciasFn, solicitarCodigoFn } from "@/lib/seguridad.functions";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — Portal IVAD" },
      {
        name: "description",
        content:
          "Elige el tema de la app, cambia tu contraseña con código de verificación, confirma tu correo personal y ajusta la seguridad de tu cuenta en el Portal IVAD.",
      },
      { property: "og:title", content: "Configuración — Portal IVAD" },
      {
        property: "og:description",
        content: "Apariencia, contraseña, correo verificado y seguridad de tu cuenta IVAD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Configuracion,
});

type Dispositivo = { id: string; nombre: string; huella: string; ultimo_acceso: string };

function Configuracion() {
  const { colaboradorActual, recargar } = usePortal();
  const [tema, setTema] = useState<Tema>(colaboradorActual?.tema ?? "sistema");
  const [alertaAcceso, setAlertaAcceso] = useState(Boolean(colaboradorActual?.alertaAcceso));
  const [verificarDispositivo, setVerificarDispositivo] = useState(
    Boolean(colaboradorActual?.verificarDispositivo),
  );

  const [codigoClave, setCodigoClave] = useState("");
  const [pedidoClave, setPedidoClave] = useState(false);
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");

  const [correo, setCorreo] = useState(colaboradorActual?.correoAlterno ?? "");
  const [codigoCorreo, setCodigoCorreo] = useState("");
  const [pedidoCorreo, setPedidoCorreo] = useState(false);

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [ocupado, setOcupado] = useState("");

  useEffect(() => {
    if (!colaboradorActual) return;
    setTema(colaboradorActual.tema);
    setAlertaAcceso(colaboradorActual.alertaAcceso);
    setVerificarDispositivo(colaboradorActual.verificarDispositivo);
    setCorreo(colaboradorActual.correoAlterno ?? "");
  }, [colaboradorActual]);

  const cargarDispositivos = async () => {
    const { data } = await supabase
      .from("dispositivos_confiables")
      .select("id, nombre, huella, ultimo_acceso")
      .order("ultimo_acceso", { ascending: false });
    setDispositivos((data as Dispositivo[]) ?? []);
  };

  useEffect(() => {
    void cargarDispositivos();
  }, []);

  const elegirTema = async (nuevo: Tema) => {
    setTema(nuevo);
    guardarTemaLocal(nuevo);
    await guardarPreferenciasFn({ data: { tema: nuevo } });
    void recargar();
  };

  const cambiarSeguridad = async (cambios: {
    alertaAcceso?: boolean;
    verificarDispositivo?: boolean;
  }) => {
    if (cambios.alertaAcceso !== undefined) setAlertaAcceso(cambios.alertaAcceso);
    if (cambios.verificarDispositivo !== undefined)
      setVerificarDispositivo(cambios.verificarDispositivo);
    const r = await guardarPreferenciasFn({ data: cambios });
    if (!r.ok) toast.error(r.error ?? "No se pudo guardar");
    else toast.success("Ajuste guardado");
    void recargar();
  };

  const huellaActual = typeof window !== "undefined" ? huellaDispositivo() : "";

  return (
    <AppShell>
      <AppHeader titulo="Configuración" subtitulo="Apariencia, cuenta y seguridad" volver />
      <div className="space-y-6 px-4 py-5">
        <section>
          <SectionTitle>Apariencia</SectionTitle>
          <div className="surface-card grid grid-cols-3 gap-2 p-3">
            {(
              [
                { valor: "claro", label: "Claro", icon: Sun },
                { valor: "oscuro", label: "Oscuro", icon: Moon },
                { valor: "sistema", label: "Automático", icon: Laptop },
              ] as const
            ).map(({ valor, label, icon: Icon }) => (
              <button
                key={valor}
                type="button"
                onClick={() => void elegirTema(valor)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-xs font-medium ${
                  tema === valor
                    ? "border-accent bg-brand-soft text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Cambiar mi contraseña</SectionTitle>
          <div className="surface-card space-y-3 p-4">
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Te enviamos un código de 6 dígitos a tu correo para confirmar que eres tú.
            </p>
            {!pedidoClave ? (
              <Button
                className="w-full"
                disabled={ocupado === "clave"}
                onClick={async () => {
                  setOcupado("clave");
                  const r = await solicitarCodigoFn({ data: { proposito: "clave" } });
                  setOcupado("");
                  if (!r.ok) return toast.error(r.error ?? "No se pudo enviar el código");
                  setPedidoClave(true);
                  toast.success(`Código enviado a ${r.correo}`);
                }}
              >
                {ocupado === "clave" ? "Enviando…" : "Enviarme el código"}
              </Button>
            ) : (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (clave !== repetir) return toast.error("Las contraseñas no coinciden");
                  setOcupado("clave2");
                  const r = await confirmarCodigoFn({
                    data: { proposito: "clave", codigo: codigoClave, clave },
                  });
                  setOcupado("");
                  if (!r.ok) return toast.error(r.error ?? "No se pudo cambiar");
                  toast.success("Contraseña actualizada");
                  setPedidoClave(false);
                  setClave("");
                  setRepetir("");
                  setCodigoClave("");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="cod-clave">Código recibido</Label>
                  <Input
                    id="cod-clave"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigoClave}
                    onChange={(e) => setCodigoClave(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nueva-clave">Nueva contraseña</Label>
                  <Input
                    id="nueva-clave"
                    type="password"
                    minLength={6}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep-clave">Repite la contraseña</Label>
                  <Input
                    id="rep-clave"
                    type="password"
                    minLength={6}
                    value={repetir}
                    onChange={(e) => setRepetir(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={ocupado === "clave2"}>
                  {ocupado === "clave2" ? "Guardando…" : "Guardar contraseña"}
                </Button>
              </form>
            )}
          </div>
        </section>

        <section>
          <SectionTitle>Mi correo personal</SectionTitle>
          <div className="surface-card space-y-3 p-4">
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {colaboradorActual?.correoAlternoVerificado
                ? `Verificado: ${colaboradorActual.correoAlterno}`
                : "Escribe tu correo y confírmalo con el código que te enviaremos. Solo un correo verificado recibe avisos y recibos."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@correo.com"
              />
            </div>
            {!pedidoCorreo ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled={ocupado === "correo" || !correo.includes("@")}
                onClick={async () => {
                  setOcupado("correo");
                  const r = await solicitarCodigoFn({
                    data: { proposito: "correo", destino: correo },
                  });
                  setOcupado("");
                  if (!r.ok) return toast.error(r.error ?? "No se pudo enviar el código");
                  setPedidoCorreo(true);
                  toast.success(`Código enviado a ${r.correo}`);
                }}
              >
                {ocupado === "correo" ? "Enviando…" : "Enviar código de verificación"}
              </Button>
            ) : (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setOcupado("correo2");
                  const r = await confirmarCodigoFn({
                    data: { proposito: "correo", codigo: codigoCorreo },
                  });
                  setOcupado("");
                  if (!r.ok) return toast.error(r.error ?? "No se pudo verificar");
                  toast.success("Correo verificado");
                  setPedidoCorreo(false);
                  setCodigoCorreo("");
                  void recargar();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="cod-correo">Código recibido</Label>
                  <Input
                    id="cod-correo"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigoCorreo}
                    onChange={(e) => setCodigoCorreo(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={ocupado === "correo2"}>
                  {ocupado === "correo2" ? "Verificando…" : "Verificar mi correo"}
                </Button>
              </form>
            )}
          </div>
        </section>

        <section>
          <SectionTitle>Seguridad</SectionTitle>
          <div className="surface-card divide-y divide-border">
            <div className="flex items-start gap-3 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Avisarme de cada acceso</p>
                <p className="text-xs text-muted-foreground">
                  Recibes un correo cada vez que alguien entra a tu cuenta.
                </p>
              </div>
              <Switch
                checked={alertaAcceso}
                onCheckedChange={(v) => void cambiarSeguridad({ alertaAcceso: v })}
              />
            </div>
            <div className="flex items-start gap-3 p-4">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Pedir código en dispositivos nuevos
                </p>
                <p className="text-xs text-muted-foreground">
                  Si entras desde un teléfono o computadora que no conocemos, pedimos un código
                  enviado a tu correo.
                </p>
              </div>
              <Switch
                checked={verificarDispositivo}
                onCheckedChange={(v) => void cambiarSeguridad({ verificarDispositivo: v })}
              />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Mis dispositivos</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {dispositivos.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Aún no hay dispositivos guardados en tu cuenta.
              </p>
            ) : (
              dispositivos.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-4">
                  <Smartphone className="h-4 w-4 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {d.nombre || "Dispositivo"}
                      {d.huella === huellaActual ? " · este" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Último acceso: {new Date(d.ultimo_acceso).toLocaleString("es-DO")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Quitar dispositivo"
                    onClick={async () => {
                      await supabase.from("dispositivos_confiables").delete().eq("id", d.id);
                      await cargarDispositivos();
                      toast.success("Dispositivo eliminado");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Este dispositivo: {typeof window !== "undefined" ? nombreDispositivo() : ""}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
