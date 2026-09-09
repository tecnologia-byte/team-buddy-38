import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Lock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { z } from "zod";
import { AppShell, AppHeader, Avatar } from "@/components/app-shell";
import { usePortal, type Colaborador } from "@/lib/portal-store";
import { areas } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/rrhh/colaboradores")({
  head: () => ({
    meta: [
      { title: "Gestión de colaboradores — RR.HH. IVAD" },
      {
        name: "description",
        content:
          "Pantalla de Recursos Humanos de IVAD para crear y editar colaboradores: nombre, cargo, área y datos de contacto.",
      },
      { property: "og:title", content: "Gestión de colaboradores — RR.HH. IVAD" },
      {
        property: "og:description",
        content: "Crea y edita el expediente de cada colaborador de IVAD Home & Goods.",
      },
    ],
  }),
  component: GestionColaboradores,
});

const esquema = z.object({
  nombre: z.string().trim().min(3, "Nombre demasiado corto").max(80),
  cargo: z.string().trim().min(2, "Indica el cargo").max(80),
  area: z.string().trim().min(2, "Indica el área").max(60),
  email: z.string().trim().email("Correo inválido").max(120),
  telefono: z.string().trim().max(30),
  salario: z.coerce.number().min(0).max(1000000),
});

type Borrador = {
  id?: string;
  nombre: string;
  cargo: string;
  area: string;
  email: string;
  telefono: string;
  salario: string;
  estado: Colaborador["estado"];
};

const vacio: Borrador = {
  nombre: "",
  cargo: "",
  area: areas[0]!,
  email: "",
  telefono: "",
  salario: "45000",
  estado: "activo",
};

function GestionColaboradores() {
  const { esRRHH, esNomina, sesion, colaboradores, guardarColaborador, eliminarColaborador } =
    usePortal();
  const [busqueda, setBusqueda] = useState("");
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  if (!esRRHH) {
    return (
      <AppShell>
        <AppHeader titulo="Colaboradores" subtitulo="Acceso restringido" volver />
        <div className="px-4 py-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Lock className="h-7 w-7 text-primary" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">Área de RR.HH.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu rol ({sesion.rol}) no permite crear o editar expedientes. Inicia sesión como
            Administración, Recursos Humanos o Contabilidad.
          </p>
          <Link to="/inicio" className="mt-6 inline-block">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const lista = colaboradores.filter((c) =>
    `${c.nombre} ${c.cargo} ${c.area}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const guardar = async () => {
    if (!borrador) return;
    const r = esquema.safeParse(borrador);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message;
      });
      setErrores(errs);
      return;
    }
    setErrores({});
    const { salario, ...resto } = r.data;
    const res = await guardarColaborador({
      ...resto,
      ...(esNomina ? { salario } : {}),
      estado: borrador.estado,
      id: borrador.id,
    });
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo guardar");
      return;
    }
    toast.success("Colaborador actualizado");
    setBorrador(null);
  };


  return (
    <AppShell>
      <AppHeader titulo="Colaboradores" subtitulo="Recursos Humanos" volver>
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-full bg-primary-foreground/12 px-3 py-2">
            <Search className="h-4 w-4 opacity-70" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cargo o área"
              className="w-full bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none"
            />
          </div>
        </div>
      </AppHeader>

      <div className="space-y-3 px-4 py-5">
        <Link to="/admin" className="block">
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Nuevo colaborador (crear acceso)
          </Button>
        </Link>
        <p className="px-1 text-xs text-muted-foreground">
          Los colaboradores se agregan creando su acceso en Administradores → Usuarios; luego puedes
          completar aquí su expediente.
        </p>


        {lista.map((c) => (
          <article key={c.id} className="surface-card flex items-center gap-3 p-4">
            <Avatar iniciales={c.iniciales} size="sm" estado={c.estado} foto={c.foto} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{c.nombre}</p>
              <p className="truncate text-xs text-accent">{c.cargo}</p>
              <p className="truncate text-xs text-muted-foreground">{c.area}</p>
              {c.claveProvisional && c.claveProvisionalTexto ? (
                <ClaveProvisional clave={c.claveProvisionalTexto} />
              ) : null}
              {c.estadoFoto === "pendiente" ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary">
                  <Camera className="h-3 w-3" /> Foto en revisión
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={`Editar ${c.nombre}`}
              className="p-2 text-primary"
              onClick={() =>
                setBorrador({
                  id: c.id,
                  nombre: c.nombre,
                  cargo: c.cargo,
                  area: c.area,
                  email: c.email,
                  telefono: c.telefono,
                  salario: String(c.salario),
                  estado: c.estado,
                })
              }
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Eliminar ${c.nombre}`}
              className="p-2 text-destructive"
              onClick={() => {
                eliminarColaborador(c.id);
                toast.info(`${c.nombre} fue retirado del listado`);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>

      <Dialog open={borrador !== null} onOpenChange={(o) => !o && setBorrador(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{borrador?.id ? "Editar colaborador" : "Nuevo colaborador"}</DialogTitle>
          </DialogHeader>
          {borrador ? (
            <div className="space-y-3">
              <Campo
                id="nombre"
                label="Nombre completo"
                valor={borrador.nombre}
                error={errores["nombre"]}
                onChange={(v) => setBorrador({ ...borrador, nombre: v })}
              />
              <Campo
                id="cargo"
                label="Cargo"
                valor={borrador.cargo}
                error={errores["cargo"]}
                onChange={(v) => setBorrador({ ...borrador, cargo: v })}
              />
              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={borrador.area}
                  onValueChange={(v) => setBorrador({ ...borrador, area: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Campo
                  id="email"
                  label="Correo corporativo (acceso)"
                  valor={borrador.email}
                  error={errores["email"]}
                  onChange={(v) => setBorrador({ ...borrador, email: v })}
                />
                <p className="text-xs text-muted-foreground">
                  Al cambiarlo, el colaborador inicia sesión con el correo nuevo y recibe un aviso
                  en esa dirección. El colaborador no puede cambiarlo por su cuenta.
                </p>
              </div>
              <Campo
                id="telefono"
                label="Teléfono"
                valor={borrador.telefono}
                error={errores["telefono"]}
                onChange={(v) => setBorrador({ ...borrador, telefono: v })}
              />
              {esNomina ? (
                <Campo
                  id="salario"
                  label="Salario mensual (RD$)"
                  valor={borrador.salario}
                  error={errores["salario"]}
                  onChange={(v) => setBorrador({ ...borrador, salario: v })}
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  El salario solo lo administra el personal autorizado de nómina.
                </p>
              )}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={borrador.estado}
                  onValueChange={(v) =>
                    setBorrador({ ...borrador, estado: v as Colaborador["estado"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="vacaciones">Vacaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrador(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/** Muestra la contraseña provisional; deja de existir cuando el colaborador crea la suya. */
function ClaveProvisional({ clave }: { clave: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground">
        {visible ? clave : "••••••••"}
      </span>
      <button
        type="button"
        className="text-[11px] font-medium text-primary underline"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Ocultar" : "Ver clave provisional"}
      </button>
      <button
        type="button"
        className="text-[11px] font-medium text-primary underline"
        onClick={() => {
          void navigator.clipboard?.writeText(clave);
          toast.success("Clave provisional copiada");
        }}
      >
        Copiar
      </button>
    </div>
  );
}

function Campo({
  id,
  label,
  valor,
  error,
  onChange,
}: {
  id: string;
  label: string;
  valor: string;
  error?: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={valor} onChange={(e) => onChange(e.target.value)} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
