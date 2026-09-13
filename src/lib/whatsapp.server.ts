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

/** Estado de la conexión y código QR devuelto por Baileys para escanear. */
export async function estadoPuente(puente: string, token?: string): Promise<Estado> {
  try {
    const d = await llamar(puente, "/estado", undefined, token);
    if (d && (d["qr"] || d["conectado"])) {
      return {
        conectado: Boolean(d["conectado"]),
        numero: String(d["numero"] ?? ""),
        qr: String(d["qr"] ?? ""),
      };
    }
  } catch {
    // Si el puente externo no responde o está iniciando, reporta desconectado
  }

  return {
    conectado: false,
    numero: "",
    qr: "",
  };
}

export type EnviarWhatsappParams = {
  puente?: string | undefined;
  para: string;
  texto: string;
  token?: string | undefined;
  doc?: { documentoBase64?: string; nombreArchivo?: string; mimetype?: string } | undefined;
};

/** Envía un mensaje o documento (PDF) de WhatsApp al número indicado (con código de país). */
export async function enviarWhatsapp(
  puenteOParams: string | EnviarWhatsappParams,
  para?: string,
  texto?: string,
  token?: string,
  doc?: { documentoBase64?: string; nombreArchivo?: string; mimetype?: string },
) {
  let puente = "";
  let paraFinal = "";
  let textoFinal = "";
  let tokenFinal: string | undefined = undefined;
  let docFinal = doc;

  if (typeof puenteOParams === "object" && puenteOParams !== null) {
    puente = puenteOParams.puente || process.env["WHATSAPP_PUENTE_URL"] || "http://localhost:8787";
    paraFinal = puenteOParams.para;
    textoFinal = puenteOParams.texto;
    tokenFinal = puenteOParams.token;
    docFinal = puenteOParams.doc;
  } else {
    puente = puenteOParams || process.env["WHATSAPP_PUENTE_URL"] || "http://localhost:8787";
    paraFinal = para ?? "";
    textoFinal = texto ?? "";
    tokenFinal = token;
  }

  await llamar(
    puente,
    "/enviar",
    {
      para: paraFinal,
      texto: textoFinal,
      ...(docFinal?.documentoBase64 ? { documentoBase64: docFinal.documentoBase64 } : {}),
      ...(docFinal?.nombreArchivo ? { nombreArchivo: docFinal.nombreArchivo } : {}),
      ...(docFinal?.mimetype ? { mimetype: docFinal.mimetype } : {}),
    },
    tokenFinal,
  );
  return { ok: true as const };
}

/** Cierra la sesión actual para poder vincular otro teléfono. */
export async function cerrarPuente(puente: string, token?: string) {
  await llamar(puente, "/salir", {}, token);
  return { ok: true as const };
}


