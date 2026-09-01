import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LifeBuoy, Send, X } from "lucide-react";
import { AppShell, AppHeader, BrandLogo, SectionTitle } from "@/components/app-shell";
import { usePortal } from "@/lib/portal-store";
import { soporteIaFn } from "@/lib/soporte.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte al Colaborador — Portal IVAD" },
      {
        name: "description",
        content:
          "Centro de soporte de IVAD: preguntas frecuentes sobre nómina, permisos y firma digital, formulario de contacto y asistente con IA.",
      },
      { property: "og:title", content: "Soporte al Colaborador — Portal IVAD" },
      {
        property: "og:description",
        content: "Resuelve dudas y quejas con las preguntas frecuentes, el asistente con IA o el formulario de contacto.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://personalivad.ivadsrl.com/soporte" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://personalivad.ivadsrl.com/soporte" }],
  }),
  component: Soporte,
});

const faqs = [
  {
    q: "¿Cómo solicito mis vacaciones?",
    a: "Entra a Solicitudes → Vacaciones, elige las fechas y envía. Tu supervisor recibe la solicitud y RR.HH. la confirma. Verás el estado en la misma pantalla y una notificación cuando sea aprobada.",
  },
  {
    q: "¿Dónde veo mi recibo de pago?",
    a: "En Nómina encuentras el histórico por período. Cuando Contabilidad envía el recibo recibes una notificación; el recibo lleva tu firma digital en el espacio de 'Recibido por'.",
  },
  {
    q: "¿Cómo registro mi firma digital?",
    a: "La firma se recoge en Administradores → Firmas. Si aún no tienes firma registrada, escribe por este formulario o pásate por Administración para firmar desde el portal.",
  },
  {
    q: "¿Por qué rechazaron mi foto de perfil?",
    a: "Las fotos pasan por aprobación de Administración/RR.HH. Si no cumple con el marco institucional recibes una notificación con el motivo y puedes subir otra desde Mi Perfil.",
  },
  {
    q: "Olvidé mi contraseña, ¿qué hago?",
    a: "Las credenciales las administra el equipo de Tecnología. Abre un caso aquí con la categoría 'Acceso al portal' y te asignan una nueva contraseña.",
  },
  {
    q: "¿Cómo corrijo un marcaje de asistencia?",
    a: "Reporta el día y la hora correcta en el formulario con la categoría 'Asistencia'. RR.HH. valida con tu supervisor y ajusta el registro.",
  },
];

const categorias = [
  "General",
  "Nómina y pagos",
  "Vacaciones y permisos",
  "Asistencia",
  "Acceso al portal",
  "Queja o reclamación",
];

function Soporte() {
  const { sesion, crearTicket, misTickets } = usePortal();
  const [categoria, setCategoria] = useState(categorias[0]!);
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <AppShell wide>
      <AppHeader titulo="Soporte" subtitulo="Preguntas, quejas y asistencia" volver />
      <div className="space-y-6 px-4 py-5 pb-24 md:grid md:grid-cols-2 md:items-start md:gap-8 md:space-y-0 md:px-8 md:py-8">
        <section className="brand-gradient rounded-2xl p-4 text-primary-foreground md:col-span-2 md:p-6">
          <LifeBuoy className="h-6 w-6 text-accent" />
          <h1 className="mt-2 font-display text-lg font-bold">¿En qué te ayudamos?</h1>
          <p className="mt-1 text-sm opacity-90">
            Busca tu duda en las preguntas frecuentes, pregúntale al asistente de soporte o envíanos tu
            caso: Recursos Humanos y Administración lo responden desde el portal.
          </p>
        </section>

        <section>
          <SectionTitle>Preguntas frecuentes</SectionTitle>
          <div className="surface-card px-4">
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section>
          <SectionTitle>Formulario de contacto</SectionTitle>
          <form
            className="surface-card space-y-3 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (asunto.trim().length < 3 || mensaje.trim().length < 10) {
                toast.error("Completa el asunto y describe tu caso.");
                return;
              }
              setEnviando(true);
              const r = await crearTicket({
                categoria,
                asunto: asunto.trim(),
                mensaje: mensaje.trim(),
              });
              setEnviando(false);
              if (!r.ok) {
                toast.error(r.error ?? "No se pudo enviar tu caso");
                return;
              }
              toast.success("Caso enviado. Te responderemos por notificaciones.");
              setAsunto("");
              setMensaje("");
            }}
          >
            <p className="text-xs text-muted-foreground">
              Enviando como <strong className="text-foreground">{sesion.nombre}</strong> ·{" "}
              {sesion.email}
            </p>
            <div className="space-y-2">
              <Label htmlFor="s-categoria">Categoría</Label>
              <select
                id="s-categoria"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-asunto">Asunto</Label>
              <Input
                id="s-asunto"
                value={asunto}
                maxLength={150}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Ej. No recibí el recibo de julio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-mensaje">Cuéntanos con detalle</Label>
              <Textarea
                id="s-mensaje"
                rows={4}
                maxLength={2000}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Describe la queja o duda, con fechas y montos si aplica."
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar caso"}
            </Button>
          </form>
        </section>

        {misTickets.length > 0 ? (
          <section className="md:col-span-2">
            <SectionTitle>Mis casos ({misTickets.length})</SectionTitle>
            <div className="space-y-3">
              {misTickets.map((t) => (
                <article key={t.id} className="surface-card p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{t.asunto}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.categoria} · {t.fecha}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        t.estado === "Resuelto"
                          ? "bg-success/15 text-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {t.estado}
                    </span>
                  </div>
                  {t.respuesta ? (
                    <p className="mt-2 rounded-lg bg-brand-soft p-2 text-sm text-foreground">
                      <strong>Respuesta:</strong> {t.respuesta}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <ChatIA />
    </AppShell>
  );
}

type MensajeIA = { rol: "user" | "assistant"; texto: string };

const saludo: MensajeIA = {
  rol: "assistant",
  texto:
    "¡Hola! Soy el asistente de soporte de IVAD. Pregúntame sobre vacaciones, nómina, asistencia, firma digital o acceso al portal.",
};

function ChatIA() {
  const preguntar = useServerFn(soporteIaFn);
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeIA[]>([saludo]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes, abierto]);

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || pensando) return;
    const historial = [...mensajes, { rol: "user" as const, texto: limpio }];
    setMensajes(historial);
    setTexto("");
    setPensando(true);
    try {
      const r = await preguntar({
        data: { mensajes: historial.slice(-12).map((m) => ({ rol: m.rol, texto: m.texto })) },
      });
      setMensajes((prev) => [
        ...prev,
        {
          rol: "assistant",
          texto: r.ok
            ? r.texto
            : `${r.error} También puedes enviar tu caso por el formulario de contacto.`,
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          rol: "assistant",
          texto: "No pude conectarme. Envía tu caso por el formulario de contacto, por favor.",
        },
      ]);
    } finally {
      setPensando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente de soporte"}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary shadow-[var(--shadow-card)] md:bottom-6 md:right-6"
      >
        {abierto ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <BrandLogo className="h-full w-full" />
        )}
      </button>

      {abierto ? (
        <div className="fixed bottom-36 right-4 z-40 flex h-[26rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] md:bottom-24 md:right-6 md:h-[32rem] md:w-[24rem]">
          <header className="brand-gradient flex items-center gap-2 px-3 py-3 text-primary-foreground">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
              <BrandLogo className="h-full w-full" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold">Asistente IVAD</p>
              <p className="text-[11px] opacity-80">Soporte al colaborador · 24/7</p>
            </div>
          </header>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.rol === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-brand-soft text-foreground"
                }`}
              >
                {m.texto}
              </div>
            ))}
            {pensando ? (
              <p className="w-fit rounded-2xl bg-brand-soft px-3 py-2 text-sm text-muted-foreground">
                Escribiendo…
              </p>
            ) : null}
            <div ref={finRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <Input
              value={texto}
              maxLength={500}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje para el asistente"
            />
            <Button type="submit" size="icon" disabled={pensando || texto.trim().length === 0}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
