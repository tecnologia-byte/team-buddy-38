/** Comunicación con el puente de WhatsApp (Baileys + QR). Solo servidor. */

type Estado = { conectado: boolean; numero: string; qr: string };

const limpiar = (url: string) => url.trim().replace(/\/+$/, "");

async function llamar(puente: string, ruta: string, cuerpo?: unknown) {
  const token = process.env["WHATSAPP_PUENTE_TOKEN"];
  if (!token) throw new Error("Falta configurar la clave del puente de WhatsApp");
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
export async function estadoPuente(puente: string): Promise<Estado> {
  const d = await llamar(puente, "/estado");
  return {
    conectado: Boolean(d["conectado"]),
    numero: String(d["numero"] ?? ""),
    qr: String(d["qr"] ?? ""),
  };
}

/** Envía un mensaje de WhatsApp al número indicado (con código de país). */
export async function enviarWhatsapp(puente: string, para: string, texto: string) {
  await llamar(puente, "/enviar", { para, texto });
  return { ok: true as const };
}

/** Cierra la sesión actual para poder vincular otro teléfono. */
export async function cerrarPuente(puente: string) {
  await llamar(puente, "/salir", {});
  return { ok: true as const };
}
