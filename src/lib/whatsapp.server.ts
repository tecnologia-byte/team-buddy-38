/** Comunicación con el puente de WhatsApp (Baileys + QR). Solo servidor. */

type Estado = { conectado: boolean; numero: string; qr: string };

const limpiar = (url: string) => url.trim().replace(/\/+$/, "");

async function llamar(puente: string, ruta: string, cuerpo?: unknown, tokenParam?: string) {
  const token = tokenParam?.trim() || process.env["WHATSAPP_PUENTE_TOKEN"] || "ivad-secret-token";
  const res = await fetch(`${limpiar(puente)}${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Puente-Token": token },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`Puente ${res.status}: ${texto.slice(0, 200)}`);
  return texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
}

/** Estado de la conexión y código QR pendiente de escanear. */
export async function estadoPuente(puente: string, token?: string): Promise<Estado> {
  const d = await llamar(puente, "/estado", undefined, token);
  return {
    conectado: Boolean(d["conectado"]),
    numero: String(d["numero"] ?? ""),
    qr: String(d["qr"] ?? ""),
  };
}

/** Envía un mensaje de WhatsApp al número indicado (con código de país). */
export async function enviarWhatsapp(puente: string, para: string, texto: string, token?: string) {
  await llamar(puente, "/enviar", { para, texto }, token);
  return { ok: true as const };
}

/** Cierra la sesión actual para poder vincular otro teléfono. */
export async function cerrarPuente(puente: string, token?: string) {
  await llamar(puente, "/salir", {}, token);
  return { ok: true as const };
}

