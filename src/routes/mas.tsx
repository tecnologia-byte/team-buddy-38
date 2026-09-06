import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileCheck,
  GraduationCap,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/mas")({
  head: () => ({
    meta: [
      { title: "Más opciones — Portal IVAD" },
      {
        name: "description",
        content: "Accede a todos los módulos de gestión de personal de IVAD: nómina, asistencia, RR.HH. y más.",
      },
      { property: "og:title", content: "Más opciones — Portal IVAD" },
      { property: "og:description", content: "Menú completo del portal de personal de IVAD Home & Goods." },
    ],
  }),
  component: Mas,
});

const modulos = [
  { to: "/perfil", label: "Mi Perfil", desc: "Datos, documentos y vacaciones", icon: User },
  { to: "/asistencia", label: "Asistencia", desc: "Marcaje e historial", icon: CalendarCheck },
  { to: "/tareas", label: "Tareas", desc: "Pendientes asignados", icon: ClipboardList },
  { to: "/nomina", label: "Nómina", desc: "Histórico de pagos", icon: DollarSign },
  { to: "/solicitudes", label: "Solicitudes", desc: "Permisos y aprobaciones", icon: FileCheck },
  { to: "/chat", label: "Chat con RR.HH.", desc: "Consultas al departamento", icon: MessageSquare },
  {
    to: "/politica-firmas",
    label: "Política de firmas",
    desc: "Uso y cuidado de tu firma digital",
    icon: ShieldCheck,
  },
  {
    to: "/soporte",
    label: "Soporte",
    desc: "Preguntas frecuentes, casos y asistente IA",
    icon: LifeBuoy,
  },
] as const;

const extras = [
  { label: "Directorio de áreas", icon: Building2 },
  { label: "Capacitaciones", icon: GraduationCap },
  { label: "Configuración", icon: Settings },
];

function Mas() {
  const { sesion, colaboradorActual, esAdmin, esRRHH, fotosPendientes } = usePortal();
  return (
    <AppShell>
      <AppHeader titulo="Más" />
      <div className="space-y-6 px-4 py-5">
        <Link to="/perfil" className="surface-card flex items-center gap-3 p-4">
          <Avatar
            iniciales={colaboradorActual?.iniciales ?? sesion.iniciales}
            estado="activo"
            foto={colaboradorActual?.foto}
          />
          <div>
            <p className="font-display font-bold text-foreground">
              {colaboradorActual?.nombre ?? sesion.nombre}
            </p>
            <p className="text-sm text-accent">{colaboradorActual?.cargo ?? sesion.cargo}</p>
            <p className="text-xs text-muted-foreground">{sesion.email}</p>
          </div>
        </Link>

        {esRRHH || esAdmin ? (
          <section>
            <SectionTitle>Gestión interna</SectionTitle>
            <div className="space-y-3">
              {esAdmin ? (
                <Link to="/admin" className="surface-card flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">Administradores</span>
                    <span className="block text-xs text-muted-foreground">
                      Contabilidad, pagos de nómina, recibos y aprobación de fotos
                    </span>
                  </span>
                  {fotosPendientes.length > 0 ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {fotosPendientes.length}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              {esRRHH ? (
                <Link to="/rrhh/colaboradores" className="surface-card flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      Gestión de colaboradores
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Crear y editar nombre, cargo, área y datos de contacto
                    </span>
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle>Módulos</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {modulos.map(({ to, label, desc, icon: Icon }) => (
              <Link key={to} to={to} className="surface-card flex flex-col gap-2 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-foreground">{label}</span>
                <span className="text-xs leading-tight text-muted-foreground">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Otros recursos</SectionTitle>
          <div className="surface-card divide-y divide-border">
            {extras.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <Icon className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </Link>
      </div>
    </AppShell>
  );
}
