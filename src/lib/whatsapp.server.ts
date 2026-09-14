/** Comunicación con el puente de WhatsApp (Baileys + QR). Solo servidor. */

type Estado = { conectado: boolean; numero: string; qr: string };

const limpiar = (url: string) => url.trim().replace(/\/+$/, "");

/**
 * Llama al puente. El servidor gratuito se "duerme" y el primer intento puede
 * tardar hasta un minuto en despertar, por eso reintentamos con paciencia.
 */
async function llamar(puente: string, ruta: string, cuerpo?: unknown, tokenParam?: string) {
  const token = tokenParam?.trim() || process.env["WHATSAPP_PUENTE_TOKEN"] || "ivad-secret-token";
  const url = `${limpiar(puente)}${ruta}`;
  const intentos = 3;
  let ultimo = "";

  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, {
        method: cuerpo ? "POST" : "GET",
        headers: { "Content-Type": "application/json", "X-Puente-Token": token },
        ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
        signal: AbortSignal.timeout(55_000),
      });
      const texto = await res.text();
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        ultimo = `Puente ${res.status}: el servidor del puente está despertando`;
      } else if (!res.ok) {
        throw new Error(`Puente ${res.status}: ${texto.slice(0, 200)}`);
      } else {
        return texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("Puente 4")) throw e;
      ultimo = msg;
    }
    if (i < intentos - 1) await new Promise((r) => setTimeout(r, 2500));
  }

  throw new Error(ultimo || "El puente de WhatsApp no responde");
}

/** Estado de la conexión y código QR devuelto por Baileys para escanear. */
export async function estadoPuente(puente: string, token?: string): Promise<Estado> {
  const d = await llamar(puente, "/estado", undefined, token);
  return {
    conectado: Boolean(d["conectado"]),
    numero: String(d["numero"] ?? ""),
    qr: String(d["qr"] ?? ""),
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

  let paraLimpia = (paraFinal ?? "").replace(/\D/g, "");
  if (paraLimpia.length === 10 && (paraLimpia.startsWith("809") || paraLimpia.startsWith("829") || paraLimpia.startsWith("849"))) {
    paraLimpia = "1" + paraLimpia;
  }

  await llamar(
    puente,
    "/enviar",
    {
      para: paraLimpia,
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


