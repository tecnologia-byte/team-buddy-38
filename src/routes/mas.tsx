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
} from "lucide-react";
import { AppShell, AppHeader, Avatar, SectionTitle } from "@/components/app-shell";
import { usuarioActual } from "@/lib/data";

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
] as const;

const extras = [
  { label: "Directorio de áreas", icon: Building2 },
  { label: "Capacitaciones", icon: GraduationCap },
  { label: "Políticas y reglamento", icon: ShieldCheck },
  { label: "Soporte técnico", icon: LifeBuoy },
  { label: "Configuración", icon: Settings },
];

function Mas() {
  return (
    <AppShell>
      <AppHeader titulo="Más" />
      <div className="space-y-6 px-4 py-5">
        <Link to="/perfil" className="surface-card flex items-center gap-3 p-4">
          <Avatar iniciales={usuarioActual.iniciales} estado="activo" />
          <div>
            <p className="font-display font-bold text-foreground">{usuarioActual.nombre}</p>
            <p className="text-sm text-accent">{usuarioActual.cargo}</p>
            <p className="text-xs text-muted-foreground">{usuarioActual.email}</p>
          </div>
        </Link>

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
