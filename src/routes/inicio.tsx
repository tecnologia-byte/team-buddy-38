import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  Megaphone,
  ShieldCheck,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { AppShell, Avatar, BrandLogo, SectionTitle } from "@/components/app-shell";
import { anuncios } from "@/lib/data";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio — Portal IVAD" },
      {
        name: "description",
        content: "Resumen diario del personal de IVAD: empleados activos, asistencias, tareas y solicitudes.",
      },
      { property: "og:title", content: "Inicio — Portal IVAD" },
      { property: "og:description", content: "Resumen diario del personal de IVAD Home & Goods." },
    ],
  }),
  component: Inicio,
});

const accesos = [
  { to: "/perfil", label: "Mi Perfil", icon: User },
  { to: "/equipo", label: "Equipo", icon: Users },
  { to: "/asistencia", label: "Asistencia", icon: CalendarCheck },
  { to: "/tareas", label: "Tareas", icon: ClipboardList },
  { to: "/nomina", label: "Nómina", icon: DollarSign },
] as const;



function Inicio() {
  const { sesion, colaboradorActual, esAdmin, esRRHH, misAvisos, fotosPendientes } = usePortal();
  const { colaboradores, pagos } = usePortal();
  const nuevos = misAvisos.filter((a) => a.nuevo).length;
  const resumen = [
    {
      valor: String(colaboradores.filter((c) => c.estado === "activo").length),
      label: "Empleados activos",
      cta: "Ver equipo",
      to: "/equipo",
      tono: "primary",
      icon: Users,
    },
    {
      valor: "0",
      label: "Asistencias registradas",
      cta: "Ver asistencia",
      to: "/asistencia",
      tono: "accent",
      icon: CalendarCheck,
    },
    {
      valor: "0",
      label: "Tareas pendientes",
      cta: "Ver tareas",
      to: "/tareas",
      tono: "primary",
      icon: ClipboardList,
    },
    {
      valor: String(pagos.filter((p) => p.estado === "Pendiente").length),
      label: "Pagos pendientes",
      cta: "Ver nómina",
      to: "/nomina",
      tono: "accent",
      icon: DollarSign,
    },
  ] as const;
  const primerNombre = (colaboradorActual?.nombre ?? sesion.nombre).split(" ")[0];
  return (
    <AppShell>
      <div className="brand-gradient px-4 pb-24 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <BrandLogo className="h-28 w-28" />
          <Link
            to="/notificaciones"
            className="relative p-2 opacity-90"
            aria-label="Notificaciones"
          >
            <Bell className="h-6 w-6" />
            {nuevos > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {nuevos}
              </span>
            ) : null}
          </Link>
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">¡Hola, {primerNombre}!</h1>
            <p className="mt-1 text-sm font-semibold opacity-90">Bienvenida a IVAD</p>
            <p className="mt-1 text-sm opacity-70">
              Aquí tienes un resumen de lo que sucede hoy.
            </p>
          </div>
          <Avatar
            iniciales={colaboradorActual?.iniciales ?? sesion.iniciales}
            size="lg"
            foto={colaboradorActual?.foto}
            fondoLogo
          />
        </div>
      </div>

      <div className="-mt-20 space-y-6 px-4">
        <div className="surface-card grid grid-cols-5 gap-1 p-4">
          {accesos.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight text-foreground">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {esAdmin || esRRHH ? (
          <section>
            <SectionTitle>Gestión interna</SectionTitle>
            <div className="space-y-3">
              {esAdmin ? (
                <Link to="/admin" className="surface-card flex items-center gap-3 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">Administradores</span>
                    <span className="block text-xs text-muted-foreground">
                      Contabilidad de nómina, pagos y recibos del personal
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
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <UserCog className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      Gestión de colaboradores
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Crear y editar nombre, cargo y área
                    </span>
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle>Resumen del día</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {resumen.map((item) => (
              <Link key={item.label} to={item.to} className="surface-card flex flex-col gap-3 p-4">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    item.tono === "accent"
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">{item.valor}</p>
                  <p className="text-sm leading-tight text-muted-foreground">{item.label}</p>
                </div>
                <span className="mt-auto flex items-center justify-between text-xs font-medium text-primary">
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle action={<span className="text-xs font-medium text-primary underline">Ver todos</span>}>
            Anuncios
          </SectionTitle>
          <div className="space-y-3">
            {anuncios.map((a) => (
              <article key={a.titulo} className="brand-gradient rounded-xl p-4 text-primary-foreground">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary-foreground/25">
                    <Megaphone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-accent" /> {a.titulo}
                    </p>
                    <p className="mt-1 text-sm opacity-80">{a.detalle}</p>
                    <p className="mt-1 text-xs opacity-60">{a.fecha}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
