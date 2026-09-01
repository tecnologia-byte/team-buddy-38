import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Briefcase,
  Camera,
  Clock,
  FileText,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Shield,
  Umbrella,
  XCircle,
} from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { usuarioActual } from "@/lib/data";
import { usePortal } from "@/lib/portal-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Mi Perfil — Portal IVAD" },
      {
        name: "description",
        content: "Datos laborales, foto de perfil, balance de vacaciones y documentos del colaborador de IVAD.",
      },
      { property: "og:title", content: "Mi Perfil — Portal IVAD" },
      { property: "og:description", content: "Consulta tu información como colaborador de IVAD." },
    ],
  }),
  component: Perfil,
});

const documentos = ["Carta de trabajo", "Contrato laboral", "Constancia de sueldo", "Recibos de nómina"];

function Perfil() {
  const { sesion, colaboradorActual, esRRHH, subirFoto } = usePortal();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const c = colaboradorActual;
  const total = usuarioActual.vacacionesDisponibles + usuarioActual.vacacionesTomadas;

  const elegirFoto = (archivo?: File | null) => {
    if (!archivo || !c) return;
    if (!archivo.type.startsWith("image/")) {
      toast.error("Selecciona una imagen (JPG o PNG)");
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 2 MB");
      return;
    }
    setSubiendo(true);
    const lector = new FileReader();
    lector.onload = () => {
      subirFoto(c.id, String(lector.result));
      setSubiendo(false);
      toast.success("Foto enviada a revisión de Recursos Humanos");
    };
    lector.onerror = () => {
      setSubiendo(false);
      toast.error("No se pudo leer la imagen");
    };
    lector.readAsDataURL(archivo);
  };

  return (
    <AppShell>
      <AppHeader titulo="Mi Perfil" />
      <div className="brand-gradient px-4 pb-16 pt-2 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              iniciales={c?.iniciales ?? sesion.iniciales}
              size="lg"
              estado={c?.estado ?? "activo"}
              foto={c?.foto}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => elegirFoto(e.target.files?.[0])}
            />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold">{c?.nombre ?? sesion.nombre}</h2>
            <p className="text-sm text-accent">{c?.cargo ?? sesion.cargo}</p>
            <p className="text-xs opacity-70">
              {c?.area ?? "—"} · Rol {sesion.rol}
            </p>
          </div>
        </div>
      </div>

      <div className="-mt-12 space-y-5 px-4">
        <section className="surface-card p-4">
          <SectionTitle>Foto de perfil</SectionTitle>
          {c?.estadoFoto === "pendiente" ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Tu foto está en revisión. Se publicará cuando Recursos Humanos la apruebe.
            </p>
          ) : c?.estadoFoto === "rechazada" ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              {c.motivoRechazo ?? "Tu foto anterior no aplica dentro del marco del perfil."} Sube
              otra foto para volver a enviarla.
            </p>
          ) : c?.estadoFoto === "aprobada" ? (
            <p className="text-sm text-muted-foreground">
              Tu foto está aprobada y visible en el directorio del equipo.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no tienes foto. Sube una foto frontal, con fondo claro y rostro visible; debe ser
              aprobada por Recursos Humanos antes de publicarse.
            </p>
          )}
          <Button
            className="mt-3 w-full"
            variant="outline"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            {subiendo ? "Procesando..." : "Subir foto para aprobación"}
          </Button>
        </section>

        <section className="surface-card p-4">
          <SectionTitle>Balance de vacaciones</SectionTitle>
          <Progress value={(usuarioActual.vacacionesTomadas / total) * 100} />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Umbrella className="h-4 w-4" /> {usuarioActual.vacacionesTomadas} días tomados
            </span>
            <span className="font-semibold text-foreground">
              {usuarioActual.vacacionesDisponibles} disponibles
            </span>
          </div>
          <Link to="/solicitudes" className="mt-4 block">
            <Button className="w-full">Solicitar vacaciones</Button>
          </Link>
        </section>

        <section className="surface-card divide-y divide-border p-4">
          <SectionTitle
            action={
              esRRHH ? (
                <Link
                  to="/rrhh/colaboradores"
                  className="flex items-center gap-1 text-xs font-medium text-primary underline"
                >
                  <Pencil className="h-3 w-3" /> Editar en RR.HH.
                </Link>
              ) : null
            }
          >
            Información laboral
          </SectionTitle>
          <Dato icon={Briefcase} label="Año de ingreso" valor={c?.ingreso ?? usuarioActual.ingreso} />
          <Dato icon={Shield} label="Área" valor={c?.area ?? "—"} />
          <Dato icon={Mail} label="Correo" valor={c?.email ?? sesion.email} />
          <Dato icon={Phone} label="Teléfono" valor={c?.telefono ?? "—"} />
        </section>

        {!esRRHH ? (
          <p className="px-1 text-xs text-muted-foreground">
            Los datos laborales (nombre, cargo y área) solo pueden ser modificados por Recursos
            Humanos.
          </p>
        ) : null}

        <section className="surface-card p-4">
          <SectionTitle>Mis documentos</SectionTitle>
          <ul className="divide-y divide-border">
            {documentos.map((d) => (
              <li key={d} className="flex items-center gap-3 py-3">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm text-foreground">{d}</span>
                <span className="ml-auto text-xs font-medium text-primary">Descargar</span>
              </li>
            ))}
          </ul>
        </section>

        <Link to="/" className="block">
          <Button variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}

function Dato({
  icon: Icon,
  label,
  valor,
}: {
  icon: typeof Briefcase;
  label: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="h-4 w-4 text-accent" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-right text-sm font-semibold text-foreground">{valor}</span>
    </div>
  );
}
