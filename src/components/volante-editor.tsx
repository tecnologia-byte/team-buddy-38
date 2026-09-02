import { useState } from "react";
import { Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  VolantePago,
  volanteVacio,
  type DatosVolante,
  type LineaVolante,
} from "@/components/volante-pago";
import { usePortal, firmaVigente } from "@/lib/portal-store";

/** Plantilla editable del volante de pago: Contabilidad elige al colaborador y llena el resto a mano. */
export function VolanteEditor() {
  const { colaboradores } = usePortal();
  const [datos, setDatos] = useState<DatosVolante>(volanteVacio);
  const [seleccion, setSeleccion] = useState("");
  const elegido = colaboradores.find((c) => c.id === seleccion);

  const set = <K extends keyof DatosVolante>(campo: K, valor: DatosVolante[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  const setLinea = (
    grupo: "ingresos" | "deducciones",
    i: number,
    campo: keyof LineaVolante,
    valor: string,
  ) =>
    setDatos((d) => ({
      ...d,
      [grupo]: d[grupo].map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)),
    }));

  const elegir = (id: string) => {
    setSeleccion(id);
    const c = colaboradores.find((x) => x.id === id);
    if (!c) return;
    setDatos((d) => ({
      ...d,
      nombre: c.nombre,
      cargo: c.cargo,
      departamento: c.area,
      ingreso: c.ingreso,
      firma: firmaVigente(c) ? c.firma : undefined,
      firmaFecha: firmaVigente(c) ? c.firmaActualizada : undefined,
      ingresos: d.ingresos.map((l, i) =>
        i === 0 && !l.monto && c.salario ? { ...l, monto: String(c.salario) } : l,
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="surface-card space-y-4 p-4 print:hidden">
        <div>
          <h3 className="font-display font-bold text-foreground">Volante de pago editable</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecciona al colaborador (trae su firma digital automáticamente) y completa a mano los
            montos, porcentajes y demás datos. Los totales y el neto se calculan solos.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="volante-colaborador">Colaborador</Label>
          <select
            id="volante-colaborador"
            value={seleccion}
            onChange={(e) => elegir(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Selecciona un colaborador…</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {!c.firma
                  ? " · sin firma"
                  : c.firmaPermanente
                    ? " · firma permanente"
                    : c.firmaPagosRestantes > 0
                      ? ` · firma válida para ${c.firmaPagosRestantes} pago(s)`
                      : " · firma vencida, hay que recogerla otra vez"}
              </option>
            ))}
          </select>
        </div>

        {elegido && elegido.firma && !firmaVigente(elegido) ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            La firma de {elegido.nombre} cubrió sus {elegido.firmaLimitePagos} pagos y venció: recógela
            de nuevo en la pestaña Firmas para que aparezca en el volante.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Comprobante No." valor={datos.comprobante} al={(v) => set("comprobante", v)} />
          <Campo
            label="Fecha de emisión"
            valor={datos.fechaEmision}
            al={(v) => set("fechaEmision", v)}
            placeholder="2026-08-15"
          />
          <Campo
            label="Período desde"
            valor={datos.periodoDesde}
            al={(v) => set("periodoDesde", v)}
            placeholder="2026-08-01"
          />
          <Campo
            label="Período hasta"
            valor={datos.periodoHasta}
            al={(v) => set("periodoHasta", v)}
            placeholder="2026-08-15"
          />
          <Campo label="Nombre" valor={datos.nombre} al={(v) => set("nombre", v)} />
          <Campo
            label="Cédula"
            valor={datos.cedula}
            al={(v) => set("cedula", v)}
            placeholder="031-0000000-0"
          />
          <Campo
            label="Código empleado"
            valor={datos.codigo}
            al={(v) => set("codigo", v)}
            placeholder="EMP-000"
          />
          <Campo label="Cargo / puesto" valor={datos.cargo} al={(v) => set("cargo", v)} />
          <Campo
            label="Departamento"
            valor={datos.departamento}
            al={(v) => set("departamento", v)}
          />
          <Campo label="Fecha de ingreso" valor={datos.ingreso} al={(v) => set("ingreso", v)} />
          <Campo
            label="Banco / cuenta"
            valor={datos.banco}
            al={(v) => set("banco", v)}
            placeholder="Banco Popular • 0000000000"
          />
          <Campo
            label="Seguridad social"
            valor={datos.seguridadSocial}
            al={(v) => set("seguridadSocial", v)}
            placeholder="AFP Crecer • ARS Humano"
          />
        </div>

        <Grupo
          titulo="Conceptos de ingresos"
          lineas={datos.ingresos}
          al={(i, campo, v) => setLinea("ingresos", i, campo, v)}
        />
        <Grupo
          titulo="Deducciones de ley y retenciones"
          lineas={datos.deducciones}
          al={(i, campo, v) => setLinea("deducciones", i, campo, v)}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir / Guardar PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDatos(volanteVacio);
              setSeleccion("");
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Limpiar plantilla
          </Button>
        </div>
      </div>

      <div className="surface-card overflow-x-auto p-2 print:border-0 print:p-0 print:shadow-none">
        <VolantePago datos={datos} />
      </div>
    </div>
  );
}

function Campo({
  label,
  valor,
  al,
  placeholder,
}: {
  label: string;
  valor: string;
  al: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={valor}
        placeholder={placeholder}
        maxLength={160}
        onChange={(e) => al(e.target.value)}
      />
    </div>
  );
}

function Grupo({
  titulo,
  lineas,
  al,
}: {
  titulo: string;
  lineas: LineaVolante[];
  al: (i: number, campo: keyof LineaVolante, v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      {lineas.map((l, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
          <Input
            value={l.concepto}
            placeholder="Concepto (puedes incluir el % aquí)"
            maxLength={160}
            onChange={(e) => al(i, "concepto", e.target.value)}
          />
          <Input
            value={l.monto}
            inputMode="decimal"
            placeholder="0.00"
            maxLength={20}
            onChange={(e) => al(i, "monto", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
