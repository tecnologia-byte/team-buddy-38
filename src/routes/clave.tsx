import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/clave")({
  head: () => ({
    meta: [
      { title: "Crear tu contraseña — IVAD Portal del Colaborador" },
      {
        name: "description",
        content:
          "Reemplaza la contraseña provisional que te asignó Administración por una contraseña personal para entrar al portal de IVAD.",
      },
      { property: "og:title", content: "Crear tu contraseña — IVAD Portal del Colaborador" },
      {
        property: "og:description",
        content: "Define la contraseña con la que entrarás al Portal del Colaborador de IVAD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CrearClave,
});

function CrearClave() {
  const navigate = useNavigate();
  const { cargando, sesionActiva, claveProvisional, sesion, establecerClave, cerrarSesion } =
    usePortal();
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (cargando) return;
    if (!sesionActiva) void navigate({ to: "/" });
    else if (!claveProvisional) void navigate({ to: "/inicio" });
  }, [cargando, sesionActiva, claveProvisional, navigate]);

  return (
    <div className="brand-gradient flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="h-24 w-24" />
          <h1 className="mt-5 font-display text-2xl font-bold text-primary-foreground">
            Crea tu contraseña
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            {sesion.nombre !== "Sin sesión" ? sesion.nombre : "Portal del Colaborador"}
          </p>
        </div>

        <form
          className="surface-card space-y-4 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setEnviando(true);
            const r = await establecerClave(clave, confirmacion);
            setEnviando(false);
            if (r.ok) navigate({ to: "/inicio" });
            else setError(r.error ?? "No se pudo guardar la contraseña.");
          }}
        >
          <div className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-primary">
            La contraseña que te dio Administración era provisional. Escribe ahora la contraseña que
            usarás de aquí en adelante e ingrésala dos veces.
          </div>

          <div className="space-y-2">
            <Label htmlFor="nueva">Nueva contraseña</Label>
            <Input
              id="nueva"
              type="password"
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repetir">Repite la contraseña</Label>
            <Input
              id="repetir"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar mi contraseña"}
          </Button>

          <button
            type="button"
            className="w-full border-t border-border pt-4 text-center text-xs text-muted-foreground"
            onClick={async () => {
              await cerrarSesion();
              navigate({ to: "/" });
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
