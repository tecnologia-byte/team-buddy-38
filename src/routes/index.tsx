import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IVAD Portal del Colaborador — Acceso" },
      {
        name: "description",
        content:
          "Accede al portal de gestión de personal de IVAD Home & Goods: perfiles, solicitudes, asistencia, nómina y calendario.",
      },
      { property: "og:title", content: "IVAD Portal del Colaborador — Acceso" },
      {
        property: "og:description",
        content: "Portal interno de IVAD Home & Goods para la gestión del personal.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { autenticar, crearPrimerAdmin, portalVacio, cargando } = usePortal();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [modoForzado, setModoForzado] = useState<"login" | "registro" | null>(null);

  const registro = modoForzado ? modoForzado === "registro" : portalVacio && !cargando;

  return (
    <div className="brand-gradient flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="h-28 w-28" />
          <h1 className="mt-5 font-display text-2xl font-bold text-primary-foreground">
            Portal del Colaborador
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Gestión de personal · IVAD Home &amp; Goods
          </p>
        </div>

        <form
          className="surface-card space-y-4 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setError("");
            const r = registro
              ? await crearPrimerAdmin({ email, clave, nombre, cargo: cargo || "Administración" })
              : await autenticar(email, clave);
            setEnviando(false);
            if (r.ok) navigate({ to: "/inicio" });
            else setError(r.error ?? "No se pudo iniciar sesión.");
          }}
        >
          {registro ? (
            <div className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-primary">
              El portal está vacío. Crea la primera cuenta de administrador para empezar a registrar
              al personal.
            </div>
          ) : null}

          {registro ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Administración"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Correo corporativo o WhatsApp / Teléfono</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ivadsrl.com ó 809-555-1234"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clave">Contraseña</Label>
            <Input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </div>
          {registro ? null : (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox defaultChecked /> Recordarme
              </label>
              <span className="font-medium text-primary">¿Olvidaste tu clave?</span>
            </div>
          )}
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando
              ? "Procesando…"
              : registro
                ? "Crear cuenta de administrador"
                : "Iniciar sesión"}
          </Button>

          {registro && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setModoForzado("login")}
                className="text-xs text-primary underline hover:opacity-80"
              >
                ¿Ya tienes una cuenta? Iniciar sesión normalmente
              </button>
            </div>
          )}

          <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Las credenciales son creadas por un administrador. Si no tienes acceso, comunícate con
            Recursos Humanos.
          </p>
        </form>
      </div>
    </div>
  );
}
