/** Genera el recibo de pago de IVAD en PDF (solo servidor). */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { VolanteCorreo } from "./volante-correo.server";
import { pesosCorreo } from "./volante-correo.server";

const NAVY = rgb(0.07, 0.135, 0.239);
const DORADO = rgb(0.886, 0.706, 0.275);
const GRIS = rgb(0.35, 0.42, 0.51);
const LINEA = rgb(0.84, 0.87, 0.91);

/** Devuelve el PDF del volante de pago como base64, listo para adjuntar al correo. */
export async function volantePdfBase64(d: VolanteCorreo): Promise<string> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recibo de pago ${d.comprobante}`);
  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = pagina.getSize();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 46;
  let y = height - 0;

  // Encabezado
  pagina.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: NAVY });
  pagina.drawText("IVAD HOME & GOODS, SRL", {
    x: M,
    y: height - 44,
    size: 16,
    font: negrita,
    color: rgb(1, 1, 1),
  });
  pagina.drawText("RNC: 102334112  ·  Ave. 27 de Febrero #142, Santiago de los Caballeros, R.D.", {
    x: M,
    y: height - 60,
    size: 8.5,
    font: normal,
    color: rgb(0.85, 0.88, 0.93),
  });
  pagina.drawText("VOLANTE OFICIAL DE PAGO DE NOMINA", {
    x: M,
    y: height - 80,
    size: 10,
    font: negrita,
    color: DORADO,
  });

  y = height - 122;

  const texto = (t: string, x: number, size = 9.5, font = normal, color = NAVY) =>
    pagina.drawText(t, { x, y, size, font, color });

  const derecha = (t: string, xFin: number, size = 9.5, font = normal, color = NAVY) =>
    pagina.drawText(t, { x: xFin - font.widthOfTextAtSize(t, size), y, size, font, color });

  // Datos del comprobante
  texto(`Comprobante No.: ${d.comprobante || "—"}`, M);
  derecha(`Fecha de emisión: ${d.fechaEmision || "—"}`, width - M);
  y -= 14;
  texto(`Período: ${d.periodoDesde || "—"} al ${d.periodoHasta || "—"}`, M);
  y -= 18;

  pagina.drawLine({
    start: { x: M, y },
    end: { x: width - M, y },
    thickness: 1,
    color: LINEA,
  });
  y -= 18;

  // Datos del colaborador en dos columnas
  const datos: [string, string][] = [
    ["Colaborador", d.nombre || "—"],
    ["Cédula", d.cedula || "—"],
    ["Código empleado", d.codigo || "—"],
    ["Cargo / puesto", d.cargo || "—"],
    ["Departamento", d.departamento || "—"],
    ["Fecha de ingreso", d.ingreso || "—"],
    ["Banco / cuenta", d.banco || "—"],
    ["Seguridad social", d.seguridadSocial || "—"],
  ];
  const colX = [M, width / 2 + 6];
  datos.forEach(([k, v], i) => {
    const x = colX[i % 2]!;
    if (i % 2 === 0 && i > 0) y -= 15;
    pagina.drawText(`${k}:`, { x, y, size: 8.5, font: negrita, color: GRIS });
    pagina.drawText(v, {
      x: x + 92,
      y,
      size: 9,
      font: normal,
      color: NAVY,
      maxWidth: width / 2 - 100,
    });
  });
  y -= 26;

  // Tablas de conceptos
  const tabla = (titulo: string, lineas: { concepto: string; monto: number }[], total: string) => {
    pagina.drawRectangle({
      x: M,
      y: y - 4,
      width: width - M * 2,
      height: 18,
      color: rgb(0.949, 0.965, 0.98),
    });
    pagina.drawText(titulo.toUpperCase(), { x: M + 6, y: y + 1, size: 9, font: negrita, color: NAVY });
    pagina.drawText("MONTO (RD$)", {
      x: width - M - 6 - negrita.widthOfTextAtSize("MONTO (RD$)", 9),
      y: y + 1,
      size: 9,
      font: negrita,
      color: NAVY,
    });
    y -= 20;

    const visibles = lineas.filter((l) => l.concepto || l.monto);
    for (const l of visibles) {
      pagina.drawText(l.concepto || "—", { x: M + 6, y, size: 9, font: normal, color: NAVY });
      const monto = pesosCorreo(l.monto);
      pagina.drawText(monto, {
        x: width - M - 6 - normal.widthOfTextAtSize(monto, 9),
        y,
        size: 9,
        font: normal,
        color: NAVY,
      });
      y -= 8;
      pagina.drawLine({
        start: { x: M, y },
        end: { x: width - M, y },
        thickness: 0.5,
        color: LINEA,
      });
      y -= 12;
    }

    pagina.drawText(total.toUpperCase(), { x: M + 6, y, size: 9, font: negrita, color: NAVY });
    y -= 22;
  };

  const bruto = d.ingresos.reduce((s, l) => s + l.monto, 0);
  const deducido = d.deducciones.reduce((s, l) => s + l.monto, 0);
  const neto = bruto - deducido;

  tabla("Concepto de ingresos", d.ingresos, `Total ingresos brutos: RD$ ${pesosCorreo(bruto)}`);
  tabla(
    "Deducciones de ley & retenciones",
    d.deducciones,
    `Total deducciones: RD$ ${pesosCorreo(deducido)}`,
  );

  // Neto
  y -= 10;
  pagina.drawRectangle({ x: M, y: y - 8, width: width - M * 2, height: 30, color: NAVY });
  pagina.drawText("NETO A PAGAR AL COLABORADOR:", {
    x: M + 10,
    y: y + 3,
    size: 10.5,
    font: negrita,
    color: rgb(1, 1, 1),
  });
  const netoTexto = `RD$ ${pesosCorreo(neto)}`;
  pagina.drawText(netoTexto, {
    x: width - M - 10 - negrita.widthOfTextAtSize(netoTexto, 12),
    y: y + 2,
    size: 12,
    font: negrita,
    color: DORADO,
  });
  y -= 42;

  // Certificación
  const certificacion =
    "Certifico haber recibido de IVAD SRL (RNC 102334112) la suma neta arriba indicada por concepto de pago de " +
    "salarios correspondiente al período especificado, encontrándome conforme con los ingresos devengados y las " +
    "deducciones reglamentarias de Ley aplicadas (Seguridad Social Ley 87-01 e Impuesto Sobre la Renta DGII).";
  pagina.drawText(certificacion, {
    x: M,
    y,
    size: 8.5,
    font: normal,
    color: NAVY,
    lineHeight: 12,
    maxWidth: width - M * 2,
  });
  // Bloque de firmas anclado a la parte inferior de la página
  y = 150;

  // Firma del colaborador
  if (d.firma?.startsWith("data:image/png;base64,")) {
    try {
      const png = await pdf.embedPng(d.firma);
      const escala = Math.min(150 / png.width, 52 / png.height);
      pagina.drawImage(png, {
        x: M + 10,
        y: y + 6,
        width: png.width * escala,
        height: png.height * escala,
      });
    } catch {
      // firma inválida: se deja el espacio en blanco
    }
  }

  const anchoFirma = 200;

  // Firma por IVAD SRL (Administración y Gestión Humana)
  if (d.firmaEmpresa?.startsWith("data:image/png;base64,")) {
    try {
      const png = await pdf.embedPng(d.firmaEmpresa);
      const escala = Math.min(150 / png.width, 52 / png.height);
      pagina.drawImage(png, {
        x: width - M - anchoFirma + 10,
        y: y + 6,
        width: png.width * escala,
        height: png.height * escala,
      });
    } catch {
      // firma inválida: se deja el espacio en blanco
    }
  }

  pagina.drawLine({
    start: { x: M, y },
    end: { x: M + anchoFirma, y },
    thickness: 0.8,
    color: NAVY,
  });
  pagina.drawLine({
    start: { x: width - M - anchoFirma, y },
    end: { x: width - M, y },
    thickness: 0.8,
    color: NAVY,
  });
  y -= 12;
  pagina.drawText("FIRMA DEL COLABORADOR", { x: M, y, size: 8.5, font: negrita, color: NAVY });
  pagina.drawText("POR IVAD SRL", {
    x: width - M - anchoFirma,
    y,
    size: 8.5,
    font: negrita,
    color: NAVY,
  });
  y -= 11;
  pagina.drawText(`Recibí conforme${d.cedula ? ` · Céd. ${d.cedula}` : ""}`, {
    x: M,
    y,
    size: 8,
    font: normal,
    color: GRIS,
  });
  pagina.drawText("Administración & Gestión Humana", {
    x: width - M - anchoFirma,
    y,
    size: 8,
    font: normal,
    color: GRIS,
  });
  if (d.firmaFecha) {
    y -= 10;
    pagina.drawText(`Firma digital registrada el ${d.firmaFecha}`, {
      x: M,
      y,
      size: 8,
      font: normal,
      color: GRIS,
    });
  }

  return pdf.saveAsBase64();
}
