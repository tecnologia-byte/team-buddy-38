/** Envío de correos institucionales de IVAD (solo servidor). */
const GATEWAY = "https://connector-gateway.lovable.dev/resend";

const LOGO = "https://team-buddy-38.lovable.app/favicon.png";
const PORTAL = "https://personalivad.ivadsrl.com";

export type CorreoDatos = {
  para: string;
  nombre?: string;
  titulo: string;
  detalle?: string | undefined;
  etiqueta?: string | undefined;
  enlace?: string | undefined;
  enlaceTexto?: string | undefined;
  /** Muestra la leyenda con las dos insignias de verificación. */
  insignias?: boolean;
};

const escapar = (t: string) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const insignia = (color: string, borde: string, titulo: string, texto: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
    <tr>
      <td style="width:34px;vertical-align:top;">
        <div style="width:26px;height:26px;border-radius:50%;background:${color};border:2px solid ${borde};color:#ffffff;font-size:14px;font-weight:700;line-height:26px;text-align:center;">&#10003;</div>
      </td>
      <td style="vertical-align:top;">
        <div style="font-size:14px;font-weight:700;color:#0d1b2a;">${titulo}</div>
        <div style="font-size:13px;line-height:1.5;color:#20344d;">${texto}</div>
      </td>
    </tr>
  </table>`;

const leyendaInsignias = `
  <div style="margin-top:18px;padding:16px;border:1px solid #e3e8ef;border-radius:12px;background:#f9fbfd;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7a5410;margin-bottom:12px;">Insignias del portal</div>
    ${insignia("#d9a92e", "#b6871a", "Insignia dorada", "Cuentas de Administración, Recursos Humanos y Contabilidad.")}
    ${insignia("#1d6fe0", "#134d9e", "Insignia azul", "Colaboradores activos con su expediente verificado.")}
  </div>`;

/** Correo institucional de IVAD: encabezado azul con logo, contenido y pie. */
export function plantilla(d: CorreoDatos) {
  const nombre = d.nombre ? escapar(d.nombre.split(" ")[0] ?? d.nombre) : "colaborador";
  const url = d.enlace ? `${PORTAL}${d.enlace.startsWith("/") ? d.enlace : `/${d.enlace}`}` : PORTAL;
  const cta = escapar(d.enlaceTexto ?? "Abrir el portal");
  const detalle = escapar(d.detalle ?? "").replace(/\n/g, "<br />");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapar(d.titulo)}</title></head>
<body style="margin:0;padding:24px 12px;background:#eef1f6;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0d1b2a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(13,27,42,.10);">
    <tr>
      <td style="background:#12233d;padding:26px 24px;text-align:center;">
        <img src="${LOGO}" alt="IVAD Home &amp; Goods" width="72" height="72" style="display:block;margin:0 auto 10px;border-radius:50%;background:#12233d;" />
        <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:.5px;">IVAD HOME &amp; GOODS</div>
        <div style="color:#e2b446;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Portal del Colaborador</div>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 24px 8px;">
        <span style="display:inline-block;background:#f6e6bd;color:#7a5410;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 10px;border-radius:999px;">${escapar(d.etiqueta ?? "Notificación")}</span>
        <h1 style="margin:14px 0 6px;font-size:21px;line-height:1.3;color:#0d1b2a;">${escapar(d.titulo)}</h1>
        <p style="margin:0 0 14px;font-size:15px;color:#0d1b2a;">Hola ${nombre},</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#20344d;">${detalle}</p>
        ${d.insignias ? leyendaInsignias : ""}
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px 28px;">
        <a href="${url}" style="display:inline-block;background:#12233d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:10px;">${cta}</a>
      </td>
    </tr>
    <tr>
      <td style="background:#f6f8fb;padding:18px 24px;text-align:center;font-size:11px;line-height:1.6;color:#5a6c82;">
        Este es un mensaje automático del Portal del Colaborador de IVAD SRL.<br />
        El correo de acceso solo puede cambiarlo Administración, Recursos Humanos o Contabilidad.
      </td>
    </tr>
  </table>
</body></html>`;
}

/** Envía el correo por el gateway de Resend. */
export async function enviarCorreoInstitucional(d: CorreoDatos) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return { ok: false as const, error: "Correo no configurado" };

  const from = process.env["RESEND_FROM"] ?? "IVAD Portal <portal@ivadsrl.com>";

  const res = await fetch(`${GATEWAY}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to: [d.para],
      subject: `${d.titulo} · IVAD`,
      html: plantilla(d),
    }),
  });

  if (!res.ok) {
    const cuerpo = await res.text();
    console.error(`Resend falló [${res.status}]: ${cuerpo}`);
    return { ok: false as const, error: `Resend ${res.status}: ${cuerpo.slice(0, 300)}` };
  }
  return { ok: true as const };
}
