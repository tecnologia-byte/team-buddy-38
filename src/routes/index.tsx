import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [email, setEmail] = useState("ana.rodriguez@ivad.com.do");
  const [clave, setClave] = useState("demo1234");

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
            navigate({ to: "/inicio" });
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
          <Button type="submit" className="w-full">
            Iniciar sesión
          </Button>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
              Usuarios de prueba (toca uno para autocompletar)
            </p>
            <ul className="space-y-2">
              {usuariosDemo.map((u) => (
                <li key={u.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setClave(u.clave);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                      email === u.email ? "border-primary bg-secondary" : "border-border"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {u.iniciales}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {u.nombre}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {u.email} · {u.clave}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      {u.rol}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
