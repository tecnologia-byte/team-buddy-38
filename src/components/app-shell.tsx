import { usePortal } from "@/lib/portal-store";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Home,
  Menu,
  Plus,
  Users,
  MoreHorizontal,
  ChevronLeft,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import logoAsset from "@/assets/ivad-logo.png.asset.json";

export function BrandLogo({ className = "h-10 w-10" }: { className?: string }) {
  return <img src={logoAsset.url} alt="IVAD Home & Goods" className={`${className} rounded-full`} />;
}

export function AppHeader({
  titulo,
  subtitulo,
  volver,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  volver?: boolean;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { misAvisos } = usePortal();
  const nuevos = misAvisos.filter((a) => a.nuevo).length;
  return (
    <header className="brand-gradient text-primary-foreground">
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        {volver ? (
          <button
            type="button"
            onClick={() => router.history.back()}
            className="-ml-1 p-1 opacity-90"
            aria-label="Volver"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : (
          <Link to="/mas" className="-ml-1 p-1 opacity-90" aria-label="Menú">
            <Menu className="h-6 w-6" />
          </Link>
        )}
        <div className="flex-1 text-center">
          <h1 className="font-display text-lg font-semibold">{titulo}</h1>
          {subtitulo ? <p className="text-xs opacity-70">{subtitulo}</p> : null}
        </div>
        <Link to="/notificaciones" className="relative p-1 opacity-90" aria-label="Notificaciones">
          <Bell className="h-6 w-6" />
          {nuevos > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {nuevos}
            </span>
          ) : null}
        </Link>
      </div>
      {children}
    </header>
  );
}

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/equipo", label: "Equipo", icon: Users },
  { to: "/mas", label: "Más", icon: MoreHorizontal },
] as const;

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-lg items-end justify-around border-t border-border bg-card px-2 pb-2 pt-2 shadow-[var(--shadow-nav)]">
      {navItems.slice(0, 2).map((item) => (
        <NavLink key={item.to} {...item} active={pathname.startsWith(item.to)} />
      ))}
      <Link
        to="/solicitudes"
        className="flex flex-col items-center gap-1"
        aria-label="Crear solicitud"
      >
        <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
          <Plus className="h-7 w-7" />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">Solicitar</span>
      </Link>
      {navItems.slice(2).map((item) => (
        <NavLink key={item.to} {...item} active={pathname.startsWith(item.to)} />
      ))}
    </nav>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex w-16 flex-col items-center gap-1 py-1 ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { cargando, sesionActiva } = usePortal();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !sesionActiva) void router.navigate({ to: "/" });
  }, [cargando, sesionActiva, router]);

  if (cargando || !sesionActiva) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <div className="flex-1 pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}


export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-base font-bold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function Avatar({
  iniciales,
  estado,
  size = "md",
  foto,
}: {
  iniciales: string;
  estado?: "activo" | "ausente" | "vacaciones" | undefined;
  size?: "sm" | "md" | "lg";
  foto?: string | undefined;
}) {
  const dims = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-9 w-9" : "h-14 w-14";
  const color =
    estado === "activo" ? "bg-success" : estado === "vacaciones" ? "bg-accent" : "bg-muted-foreground";
  return (
    <div className="relative shrink-0">
      <div
        className={`${dims} flex items-center justify-center overflow-hidden rounded-full bg-card ring-4 ring-accent ring-offset-2 ring-offset-background`}
      >
        {foto ? (
          <img src={foto} alt={`Foto de ${iniciales}`} className="h-full w-full object-cover" />
        ) : (
          <img
            src={logoAsset.url}
            alt={`Perfil de ${iniciales}`}
            className="h-full w-full object-contain"
          />
        )}
      </div>



      {estado ? (
        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${color}`}
        />
      ) : null}
    </div>
  );
}
