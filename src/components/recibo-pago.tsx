import { pesos } from "@/lib/data";
import type { Colaborador, Pago } from "@/lib/portal-store";

/** Recibo de pago con la firma digital del colaborador en el espacio de "Recibido por". */
export function ReciboPago({ pago, colaborador }: { pago: Pago; colaborador: Colaborador }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm">
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div>
          <p className="font-display text-base font-bold text-foreground">IVAD Home &amp; Goods</p>
          <p className="text-xs text-muted-foreground">Recibo de pago de nómina</p>
        </div>
        <p className="text-xs text-muted-foreground">{pago.periodo}</p>
      </div>

      <dl className="mt-3 space-y-1.5">
        <Fila termino="Colaborador" valor={colaborador.nombre} />
        <Fila termino="Cargo" valor={colaborador.cargo || "—"} />
        <Fila termino="Área" valor={colaborador.area || "—"} />
        <Fila termino="Monto neto" valor={`RD$ ${pesos(pago.monto)}`} />
        <Fila termino="Estado" valor={pago.estado} />
      </dl>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recibido por
        </p>
        <div className="mt-1 flex h-20 items-end justify-center border-b border-foreground/50">
          {colaborador.firma ? (
            <img
              src={colaborador.firma}
              alt={`Firma digital de ${colaborador.nombre}`}
              className="max-h-20 object-contain"
            />
          ) : (
            <span className="pb-2 text-xs italic text-muted-foreground">
              Firma digital pendiente
            </span>
          )}
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          {colaborador.nombre}
          {colaborador.firmaActualizada ? ` · firma registrada el ${colaborador.firmaActualizada}` : ""}
        </p>
      </div>
    </div>
  );
}

function Fila({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{termino}</dt>
      <dd className="font-medium text-foreground">{valor}</dd>
    </div>
  );
}
