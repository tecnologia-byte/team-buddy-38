import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, FileSignature, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";

export const Route = createFileRoute("/politica-firmas")({
  head: () => ({
    meta: [
      { title: "Política de firmas digitales — Portal IVAD" },
      {
        name: "description",
        content:
          "Cómo IVAD usa, protege y limita la firma digital de cada colaborador en los volantes de pago, y qué debe hacer el personal para mantener su cuenta segura.",
      },
      { property: "og:title", content: "Política de firmas digitales — Portal IVAD" },
      {
        property: "og:description",
        content:
          "Uso responsable de la firma digital, confidencialidad de los volantes de pago y reporte de incidentes de seguridad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PoliticaFirmas,
});

function PoliticaFirmas() {
  return (
    <AppShell>
      <AppHeader
        titulo="Política de firmas"
        subtitulo="Firmas digitales y seguridad de tu cuenta"
        volver
      />
      <div className="space-y-5 px-4 py-5">
        <section className="surface-card p-4">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-accent" />
            <h1 className="font-display text-lg font-bold text-foreground">
              Uso de tu firma digital
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            La firma que registras en el portal se usa únicamente para completar el espacio de
            <strong> “recibido”</strong> en tus documentos personales de IVAD: volantes de pago,
            recibos, constancias y comunicaciones internas relacionadas contigo. Cada volante de
            pago que se te emita llevará tu firma en ese espacio.
          </p>
        </section>

        <section>
          <SectionTitle>Compromiso de IVAD</SectionTitle>
          <div className="surface-card divide-y divide-border">
            <Punto icon={ShieldCheck} titulo="No se clona ni se reutiliza">
              Tu firma no se copia, no se replica en documentos ajenos a ti, ni se usa para
              autorizar nada distinto a tus propios documentos.
            </Punto>
            <Punto icon={Lock} titulo="No se divulga entre departamentos">
              Ni el departamento de Tecnología ni ningún otro departamento comparte tu firma con
              terceros. Solo la ven las personas de Administración y Contabilidad que emiten tus
              documentos.
            </Punto>
            <Punto icon={FileSignature} titulo="Vigencia permanente">
              Tu firma queda registrada de forma <strong>permanente</strong>, así no tienes que
              firmar en cada pago. Si en algún caso hace falta renovarla, te lo notificaremos por el
              portal.
            </Punto>
          </div>
        </section>

        <section className="surface-card border border-destructive/30 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-display font-bold text-foreground">Lo que no podemos garantizar</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Una vez el documento firmado está en tus manos (descargado, impreso o recibido por
            correo o WhatsApp), IVAD no puede controlar lo que pase con él. Si el documento se
            comparte, se reenvía o se publica desde tu lado, IVAD no se hace responsable del uso que
            terceros le den a tu firma.
          </p>
        </section>

        <section>
          <SectionTitle>Tus responsabilidades</SectionTitle>
          <ol className="surface-card divide-y divide-border">
            <Numero n={1} titulo="No compartir documentos">
              No envíes, reenvíes ni publiques tus volantes de pago, recibos ni ningún documento con
              tu firma. Tampoco compartas capturas de pantalla del portal ni tu contraseña.
            </Numero>
            <Numero n={2} titulo="Reportar cualquier incidente de seguridad">
              Si te roban o pierdes el teléfono, si alguien más usó tu sesión, si recibes correos o
              mensajes sospechosos o si notas algo raro en tu cuenta, repórtalo de inmediato desde
              <strong> Soporte</strong> o al chat de Recursos Humanos. Bloquearemos el acceso y
              anularemos la firma registrada para proteger tu cuenta.
            </Numero>
            <Numero n={3} titulo="Cuidar tu acceso">
              Usa una contraseña propia (la provisional que te dio Administración deja de funcionar
              cuando creas la tuya), no la anotes en lugares visibles y cierra sesión en equipos
              compartidos.
            </Numero>
          </ol>
        </section>

        <section className="surface-card p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent" />
            <h2 className="font-display font-bold text-foreground">Reportar un incidente</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Entra a <strong>Soporte</strong> y abre un caso con la categoría “Seguridad”, o escribe
            al chat de Recursos Humanos. Mientras más rápido lo reportes, menor es el riesgo para tu
            cuenta y tus documentos.
          </p>
        </section>

        <p className="px-1 pb-2 text-xs text-muted-foreground">
          Al registrar tu firma en el portal aceptas esta política. IVAD Home &amp; Goods puede
          actualizarla y avisará por el canal que tengas elegido.
        </p>
      </div>
    </AppShell>
  );
}

function Punto({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof ShieldCheck;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function Numero({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 p-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
