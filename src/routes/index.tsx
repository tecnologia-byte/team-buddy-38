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
  const { autenticar } = usePortal();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

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
          onSubmit={(e) => {
            e.preventDefault();
            if (autenticar(email, clave)) {
              setError("");
              navigate({ to: "/inicio" });
            } else {
              setError("Correo o contraseña incorrectos. Solicítalos a un administrador.");
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Correo corporativo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ivad.com.do"
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
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox defaultChecked /> Recordarme
            </label>
            <span className="font-medium text-primary">¿Olvidaste tu clave?</span>
          </div>
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Iniciar sesión
          </Button>

          <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Las credenciales son creadas por un administrador. Si no tienes acceso, comunícate con
            Recursos Humanos.
          </p>
        </form>
      </div>
    </div>
  );
}
