import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, FileText, LogOut, Mail, Phone, Shield, Umbrella } from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { usuarioActual } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Mi Perfil — Portal IVAD" },
      {
        name: "description",
        content: "Datos laborales, contacto, balance de vacaciones y documentos del colaborador de IVAD.",
      },
      { property: "og:title", content: "Mi Perfil — Portal IVAD" },
      { property: "og:description", content: "Consulta y actualiza tu información como colaborador de IVAD." },
    ],
  }),
  component: Perfil,
});

const documentos = ["Carta de trabajo", "Contrato laboral", "Constancia de sueldo", "Recibos de nómina"];

function Perfil() {
  const u = usuarioActual;
  const total = u.vacacionesDisponibles + u.vacacionesTomadas;

  return (
    <AppShell>
      <AppHeader titulo="Mi Perfil" />
      <div className="brand-gradient px-4 pb-16 pt-2 text-primary-foreground">
        <div className="flex items-center gap-4">
          <Avatar iniciales={u.iniciales} size="lg" estado="activo" />
          <div>
            <h2 className="font-display text-xl font-bold">{u.nombre}</h2>
            <p className="text-sm text-accent">{u.cargo}</p>
            <p className="text-xs opacity-70">
              {u.area} · Código {u.codigo}
            </p>
          </div>
        </div>
      </div>

      <div className="-mt-12 space-y-5 px-4">
        <section className="surface-card p-4">
          <SectionTitle>Balance de vacaciones</SectionTitle>
          <Progress value={(u.vacacionesTomadas / total) * 100} />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Umbrella className="h-4 w-4" /> {u.vacacionesTomadas} días tomados
            </span>
            <span className="font-semibold text-foreground">{u.vacacionesDisponibles} disponibles</span>
          </div>
          <Link to="/solicitudes" className="mt-4 block">
            <Button className="w-full">Solicitar vacaciones</Button>
          </Link>
        </section>

        <section className="surface-card divide-y divide-border p-4">
          <SectionTitle>Información laboral</SectionTitle>
          <Dato icon={Briefcase} label="Fecha de ingreso" valor={u.ingreso} />
          <Dato icon={Shield} label="Supervisor" valor={u.supervisor} />
          <Dato icon={Mail} label="Correo" valor={u.email} />
          <Dato icon={Phone} label="Teléfono" valor={u.telefono} />
        </section>

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
