import { useEffect, useState } from "react";
import { Mail, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  VolantePago,
  volanteVacio,
  numero,
  type DatosVolante,
  type LineaVolante,
} from "@/components/volante-pago";
import { enviarReciboFn } from "@/lib/correo.functions";
import { FirmaPad } from "@/components/firma-pad";
import { usePortal, firmaVigente } from "@/lib/portal-store";


const dosDigitos = (n: number) => String(n).padStart(2, "0");
const fechaCorta = (d: Date) => `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;

/** Correlativo automático del comprobante: IVAD-AAAA-0001, continúa donde quedó. */
const siguienteComprobante = () => {
  const anio = new Date().getFullYear();
  const clave = `ivad-comprobante-${anio}`;
  let n = 1;
  try {
    n = Number(localStorage.getItem(clave) ?? "0") + 1;
    localStorage.setItem(clave, String(n));
  } catch {
    n = Math.floor(Math.random() * 9999) + 1;
  }
  return `IVAD-${anio}-${String(n).padStart(4, "0")}`;
};

/** Datos que el sistema llena solo: comprobante, fecha de emisión y período del mes en curso. */
const datosAutomaticos = () => {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return {
    comprobante: siguienteComprobante(),
    fechaEmision: fechaCorta(hoy),
    periodoDesde: fechaCorta(inicio),
    periodoHasta: fechaCorta(fin),
  };
};

/** Plantilla editable del volante de pago: Contabilidad elige al colaborador y llena el resto a mano. */
export function VolanteEditor() {
  const { colaboradores } = usePortal();
  const [datos, setDatos] = useState<DatosVolante>(volanteVacio);
  const [seleccion, setSeleccion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const elegido = colaboradores.find((c) => c.id === seleccion);

  // Numeración y fechas automáticas al abrir la plantilla.
  useEffect(() => {
    setDatos((d) => (d.comprobante ? d : { ...d, ...datosAutomaticos() }));
  }, []);

  const nuevoVolante = () => {
    setDatos({ ...volanteVacio, ...datosAutomaticos() });
    setSeleccion("");
  };

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
      codigo: d.codigo || `EMP-${String(colaboradores.indexOf(c) + 1).padStart(3, "0")}`,
      firma: firmaVigente(c) ? c.firma : undefined,
      firmaFecha: firmaVigente(c) ? c.firmaActualizada : undefined,
      ingresos: d.ingresos.map((l, i) =>
        i === 0 && !l.monto && c.salario ? { ...l, monto: String(c.salario) } : l,
      ),
    }));
  };

  const enviarPorCorreo = async () => {
    if (!elegido?.email) {
      toast.error("Selecciona un colaborador con correo registrado.");
      return;
    }
    setEnviando(true);
    try {
      const limpiar = (lineas: LineaVolante[]) =>
        lineas
          .filter((l) => l.concepto.trim() || l.monto.trim())
          .map((l) => ({ concepto: l.concepto, monto: numero(l.monto) }));
      const res = await enviarReciboFn({
        data: {
          para: elegido.email,
          comprobante: datos.comprobante,
          fechaEmision: datos.fechaEmision,
          periodoDesde: datos.periodoDesde,
          periodoHasta: datos.periodoHasta,
          nombre: datos.nombre || elegido.nombre,
          cedula: datos.cedula,
          codigo: datos.codigo,
          cargo: datos.cargo,
          departamento: datos.departamento,
          ingreso: datos.ingreso,
          banco: datos.banco,
          seguridadSocial: datos.seguridadSocial,
          ingresos: limpiar(datos.ingresos),
          deducciones: limpiar(datos.deducciones),
          ...(datos.firma ? { firma: datos.firma } : {}),
          ...(datos.firmaFecha ? { firmaFecha: datos.firmaFecha } : {}),
        },
      });
      if (res.ok) toast.success(`Recibo enviado a ${elegido.email} desde nomina@ivadsrl.com`);
      else toast.error(res.error ?? "No se pudo enviar el recibo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el recibo");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="surface-card space-y-4 p-4 print:hidden">
        <div>
          <h3 className="font-display font-bold text-foreground">Volante de pago editable</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecciona al colaborador (trae su firma digital automáticamente) y completa a mano los
            montos, porcentajes y demás datos. El comprobante se enumera solo, la fecha de emisión y
            el período se llenan con el mes en curso, y los totales y el neto se calculan solos.
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
                {c.firma ? " · firma permanente" : " · sin firma"}
              </option>
            ))}
          </select>
        </div>

        {elegido && !elegido.firma ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {elegido.nombre} todavía no tiene firma registrada: recógela en la pestaña Firmas para
            que aparezca en el volante.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            label="Comprobante No. (automático)"
            valor={datos.comprobante}
            al={(v) => set("comprobante", v)}
          />
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
          <Button type="button" variant="outline" disabled={enviando} onClick={enviarPorCorreo}>
            <Mail className="mr-2 h-4 w-4" />
            {enviando ? "Enviando…" : "Enviar recibo por correo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={nuevoVolante}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Nuevo volante (nuevo número)
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
