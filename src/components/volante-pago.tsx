import logo from "@/assets/ivad-logo.png.asset.json";
import { pesos } from "@/lib/data";

export type LineaVolante = { concepto: string; monto: string };

export type DatosVolante = {
  comprobante: string;
  fechaEmision: string;
  periodoDesde: string;
  periodoHasta: string;
  nombre: string;
  cedula: string;
  codigo: string;
  cargo: string;
  departamento: string;
  ingreso: string;
  banco: string;
  seguridadSocial: string;
  ingresos: LineaVolante[];
  deducciones: LineaVolante[];
  firma?: string | undefined;
  firmaFecha?: string | undefined;
};

export const volanteVacio: DatosVolante = {
  comprobante: "",
  fechaEmision: "",
  periodoDesde: "",
  periodoHasta: "",
  nombre: "",
  cedula: "",
  codigo: "",
  cargo: "",
  departamento: "",
  ingreso: "",
  banco: "",
  seguridadSocial: "",
  ingresos: [
    { concepto: "Salario Base del Período", monto: "" },
    { concepto: "Horas Extras", monto: "" },
    { concepto: "", monto: "" },
    { concepto: "", monto: "" },
  ],
  deducciones: [
    { concepto: "Aporte AFP - Fondo de Pensiones (2.87%)", monto: "" },
    { concepto: "Aporte SFS - Seguro de Salud (3.04%)", monto: "" },
    { concepto: "Retención ISR - DGII", monto: "" },
    { concepto: "", monto: "" },
  ],
};

export const numero = (valor: string) => {
  const n = Number(String(valor).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const sumaLineas = (lineas: LineaVolante[]) =>
  lineas.reduce((s, l) => s + numero(l.monto), 0);

/** Volante oficial de pago de IVAD SRL, listo para imprimir con la firma digital del colaborador. */
export function VolantePago({ datos }: { datos: DatosVolante }) {
  const bruto = sumaLineas(datos.ingresos);
  const deducido = sumaLineas(datos.deducciones);
  const neto = bruto - deducido;
  const filas = Math.max(datos.ingresos.length, datos.deducciones.length);

  return (
    <div
      id="volante-imprimible"
      className="mx-auto w-full max-w-[860px] bg-card p-5 text-[11px] leading-snug text-foreground print:max-w-none print:p-0"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary pb-3">
        <div className="flex items-start gap-3">
          <img src={logo.url} alt="Logo de IVAD Home & Goods" className="h-20 w-20 shrink-0 object-contain print:h-24 print:w-24" />
          <div>
            <p className="font-display text-sm font-bold text-primary">
              IVAD SRL (IVAD Home &amp; Goods)
            </p>
            <p className="text-foreground">RNC: 102334112 • Est. 1996</p>
            <p className="max-w-[320px] text-foreground">
              Ave. 27 de Febrero #142, frente a Ave. Erick Ekman, Santiago de los Caballeros, R.D.
            </p>
            <p className="text-foreground">Tel: (829) 938-7732 • Email: info@ivadsrl.com</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-bold uppercase text-primary">
            Volante oficial de pago
          </p>
          <p className="text-foreground">Comprobante No: {datos.comprobante || "—"}</p>
          <p className="text-foreground">Fecha de Emisión: {datos.fechaEmision || "—"}</p>
          <p className="text-foreground">
            Período: {datos.periodoDesde || "—"} al {datos.periodoHasta || "—"}
          </p>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <Dato termino="Colaborador" valor={datos.nombre} />
        <Dato termino="Cédula de Identidad" valor={datos.cedula} />
        <Dato termino="Código Empleado" valor={datos.codigo} />
        <Dato termino="Cargo / Puesto" valor={datos.cargo} />
        <Dato termino="Departamento" valor={datos.departamento} />
        <Dato termino="Fecha de Ingreso" valor={datos.ingreso} />
        <Dato termino="Banco / Cuenta" valor={datos.banco} />
        <Dato termino="Seguridad Social" valor={datos.seguridadSocial} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TablaConceptos
          titulo="Concepto de ingresos"
          lineas={datos.ingresos}
          filas={filas}
          totalTexto="Total ingresos brutos:"
          total={bruto}
        />
        <TablaConceptos
          titulo="Deducciones de ley & retenciones"
          lineas={datos.deducciones}
          filas={filas}
          totalTexto="Total deducciones:"
          total={deducido}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-md bg-primary px-4 py-3 text-primary-foreground">
        <p className="font-display text-xs font-bold uppercase tracking-wide">
          Neto a pagar al colaborador:
        </p>
        <p className="font-display text-base font-bold">RD$ {pesos(neto)}</p>
      </div>

      <p className="mt-5 text-justify text-[10px] text-foreground">
        Certifico haber recibido de IVAD SRL (RNC 102334112) la suma neta arriba indicada por
        concepto de pago de salarios correspondiente al período especificado, encontrándome conforme
        con los ingresos devengados y las deducciones reglamentarias de Ley aplicadas (Seguridad
        Social Ley 87-01 e Impuesto Sobre la Renta DGII).
      </p>

      <div className="mt-16 grid grid-cols-2 gap-8 print:mt-24">
        <div className="text-center">
          <div className="flex h-16 items-end justify-center">
            {datos.firma ? (
              <img
                src={datos.firma}
                alt={`Firma digital de ${datos.nombre}`}
                className="max-h-16 object-contain"
              />
            ) : null}
          </div>
          <div className="border-t border-foreground/60 pt-1">
            <p className="font-semibold uppercase">Firma del colaborador</p>
            <p className="text-[10px] text-foreground">
              Recibí Conforme{datos.cedula ? ` • Céd. ${datos.cedula}` : ""}
            </p>
            {datos.firma && datos.firmaFecha ? (
              <p className="text-[10px] text-foreground">
                Firma digital registrada el {datos.firmaFecha}
              </p>
            ) : null}
          </div>
        </div>
        <div className="text-center">
          <div className="h-16" />
          <div className="border-t border-foreground/60 pt-1">
            <p className="font-semibold uppercase">Por IVAD SRL</p>
            <p className="text-[10px] text-foreground">Administración &amp; Gestión Humana</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex gap-2 border-b border-dashed border-border py-1">
      <span className="font-semibold text-foreground/80">{termino}:</span>
      <span className="min-w-0 flex-1 truncate font-medium">{valor || "—"}</span>
    </div>
  );
}

function TablaConceptos({
  titulo,
  lineas,
  filas,
  totalTexto,
  total,
}: {
  titulo: string;
  lineas: LineaVolante[];
  filas: number;
  totalTexto: string;
  total: number;
}) {
  const vacias = Array.from({ length: Math.max(0, filas - lineas.length) });
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between gap-2 bg-secondary px-2 py-1.5">
        <p className="font-semibold uppercase text-primary">{titulo}</p>
        <p className="whitespace-nowrap font-semibold text-primary">Monto (RD$)</p>
      </div>
      <div>
        {lineas.map((l, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 border-t border-border px-2 py-1"
          >
            <span>{l.concepto || "—"}</span>
            <span className="whitespace-nowrap font-medium">
              {l.concepto || l.monto ? `RD$ ${pesos(numero(l.monto))}` : "—"}
            </span>
          </div>
        ))}
        {vacias.map((_, i) => (
          <div key={`v-${i}`} className="flex justify-between border-t border-border px-2 py-1">
            <span>—</span>
            <span>—</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t-2 border-primary bg-secondary/60 px-2 py-1.5">
        <p className="font-display font-bold uppercase text-primary">{totalTexto}</p>
        <p className="whitespace-nowrap font-display font-bold text-primary">RD$ {pesos(total)}</p>
      </div>
    </div>
  );
}
