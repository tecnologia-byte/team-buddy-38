/** Genera el HTML del volante/recibo de pago para adjuntarlo al correo (solo servidor). */

export type LineaCorreo = { concepto: string; monto: number };

export type VolanteCorreo = {
  comprobante: string;
  fechaEmision: string;
  periodoDesde: string;
  periodoHasta: string;
  nombre: string;
  cedula?: string | undefined;
  codigo?: string | undefined;
  cargo?: string | undefined;
  departamento?: string | undefined;
  ingreso?: string | undefined;
  banco?: string | undefined;
  seguridadSocial?: string | undefined;
  ingresos: LineaCorreo[];
  deducciones: LineaCorreo[];
  firma?: string | undefined;
  firmaFecha?: string | undefined;
  firmaEmpresa?: string | undefined;
  firmaEmpresaNombre?: string | undefined;
  firmaEmpresaCargo?: string | undefined;

};

const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const pesosCorreo = (n: number) =>
  n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fila = (a: string, b: string) => `
  <tr>
    <td style="padding:6px 8px;border-bottom:1px solid #e3e8ef;color:#0d1b2a;">${esc(a)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #e3e8ef;text-align:right;white-space:nowrap;color:#0d1b2a;">RD$ ${b}</td>
  </tr>`;

const dato = (k: string, v?: string) =>
  v ? `<div style="font-size:12px;color:#0d1b2a;"><strong>${esc(k)}:</strong> ${esc(v)}</div>` : "";

/** Documento HTML completo del recibo, apto para imprimir o guardar como PDF. */
export function volanteHtml(d: VolanteCorreo) {
  const bruto = d.ingresos.reduce((s, l) => s + l.monto, 0);
  const deducido = d.deducciones.reduce((s, l) => s + l.monto, 0);
  const neto = bruto - deducido;

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><title>Recibo ${esc(d.comprobante)}</title></head>
<body style="margin:0;padding:24px;background:#ffffff;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;border:1px solid #d7dee8;border-radius:12px;overflow:hidden;">
    <div style="background:#12233d;color:#ffffff;padding:18px 20px;">
      <div style="font-size:16px;font-weight:700;letter-spacing:.5px;">IVAD HOME &amp; GOODS, SRL</div>
      <div style="font-size:12px;color:#e2b446;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Volante de pago de nómina</div>
    </div>
    <div style="padding:16px 20px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#0d1b2a;">
        <div>${dato("Comprobante No.", d.comprobante)}${dato("Fecha de emisión", d.fechaEmision)}</div>
        <div>${dato("Período", `${d.periodoDesde} al ${d.periodoHasta}`)}</div>
      </div>
      <hr style="border:0;border-top:1px solid #e3e8ef;margin:12px 0;" />
      ${dato("Colaborador", d.nombre)}
      ${dato("Cédula", d.cedula)}
      ${dato("Código", d.codigo)}
      ${dato("Cargo", d.cargo)}
      ${dato("Departamento", d.departamento)}
      ${dato("Fecha de ingreso", d.ingreso)}
      ${dato("Banco / cuenta", d.banco)}
      ${dato("Seguridad social", d.seguridadSocial)}

      <h3 style="font-size:13px;text-transform:uppercase;color:#12233d;margin:16px 0 6px;">Ingresos</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
        ${d.ingresos.filter((l) => l.concepto || l.monto).map((l) => fila(l.concepto, pesosCorreo(l.monto))).join("")}
        ${fila("Total ingresos brutos", pesosCorreo(bruto))}
      </table>

      <h3 style="font-size:13px;text-transform:uppercase;color:#12233d;margin:16px 0 6px;">Deducciones</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
        ${d.deducciones.filter((l) => l.concepto || l.monto).map((l) => fila(l.concepto, pesosCorreo(l.monto))).join("")}
        ${fila("Total deducciones", pesosCorreo(deducido))}
      </table>

      <div style="margin-top:16px;background:#f6f8fb;border:1px solid #d7dee8;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;">
        <strong style="color:#12233d;">NETO A RECIBIR</strong>
        <strong style="color:#12233d;">RD$ ${pesosCorreo(neto)}</strong>
      </div>

      <div style="margin-top:28px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5a6c82;">Recibí conforme</div>
        <div style="height:70px;border-bottom:1px solid #0d1b2a;margin:6px auto 4px;max-width:300px;">
          ${d.firma ? `<img src="${d.firma}" alt="Firma de ${esc(d.nombre)}" style="max-height:68px;display:block;margin:0 auto;" />` : ""}
        </div>
        <div style="font-size:11px;color:#0d1b2a;">${esc(d.nombre)}${d.firmaFecha ? ` · firma registrada el ${esc(d.firmaFecha)}` : ""}</div>
      </div>

      <div style="margin-top:24px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5a6c82;">Por IVAD SRL</div>
        <div style="height:70px;border-bottom:1px solid #0d1b2a;margin:6px auto 4px;max-width:300px;">
          ${d.firmaEmpresa ? `<img src="${d.firmaEmpresa}" alt="Firma por IVAD SRL" style="max-height:68px;display:block;margin:0 auto;" />` : ""}
        </div>
        <div style="font-size:11px;color:#0d1b2a;">${esc(d.firmaEmpresaNombre ?? "Administración & Gestión Humana")}${d.firmaEmpresaCargo ? ` · ${esc(d.firmaEmpresaCargo)}` : ""}</div>
      </div>

    </div>
  </div>
</body></html>`;
}
