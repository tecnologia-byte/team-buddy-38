/** Comunicación con el puente de WhatsApp (Baileys + QR / Pairing Code). Solo servidor. */

type Estado = { conectado: boolean; numero: string; qr: string; codigo?: string };

const URL_PUENTE_PREDETERMINADA = "https://puente-whatsapp-ivad.onrender.com";

const limpiar = (url: string) => (url || URL_PUENTE_PREDETERMINADA).trim().replace(/\/+$/, "");

/**
 * Llama al puente. El servidor gratuito en Render se duerme por inactividad
 * y el primer intento puede tardar hasta 45 segundos en despertar; reintentamos con paciencia.
 */
async function llamar(puente: string, ruta: string, cuerpo?: unknown, tokenParam?: string) {
  const urlBase = limpiar(puente || process.env["WHATSAPP_PUENTE_URL"] || URL_PUENTE_PREDETERMINADA);
  const token = tokenParam?.trim() || process.env["WHATSAPP_PUENTE_TOKEN"] || "ivad-secret-token";
  const url = `${urlBase}${ruta}`;
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

/** Estado de la conexión, código QR y código de vinculación devuelto por el puente. */
export async function estadoPuente(puente: string, token?: string): Promise<Estado> {
  try {
    const d = await llamar(puente, "/estado", undefined, token);
    if (d && (d["qr"] || d["conectado"] || d["codigo"])) {
      return {
        conectado: Boolean(d["conectado"]),
        numero: String(d["numero"] ?? ""),
        qr: String(d["qr"] ?? ""),
        codigo: String(d["codigo"] ?? ""),
      };
    }
  } catch {
    // Si el puente externo no responde o está iniciando, reporta desconectado
  }

  return {
    conectado: false,
    numero: "",
    qr: "",
    codigo: "",
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
    puente = puenteOParams.puente || process.env["WHATSAPP_PUENTE_URL"] || URL_PUENTE_PREDETERMINADA;
    paraFinal = puenteOParams.para;
    textoFinal = puenteOParams.texto;
    tokenFinal = puenteOParams.token;
    docFinal = puenteOParams.doc;
  } else {
    puente = puenteOParams || process.env["WHATSAPP_PUENTE_URL"] || URL_PUENTE_PREDETERMINADA;
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

/** Solicita un código de vinculación de 8 dígitos para vincular por número sin necesidad de cámara. */
export async function pedirCodigoVinculacion(
  puente: string,
  numero: string,
  token?: string,
): Promise<{ codigo: string }> {
  let numLimpio = (numero ?? "").replace(/\D/g, "");
  if (numLimpio.length === 10 && (numLimpio.startsWith("809") || numLimpio.startsWith("829") || numLimpio.startsWith("849"))) {
    numLimpio = "1" + numLimpio;
  }
  const d = await llamar(puente, "/codigo", { numero: numLimpio }, token);
  return { codigo: String(d["codigo"] ?? "") };
}

/** Cierra la sesión actual para poder vincular otro teléfono. */
export async function cerrarPuente(puente: string, token?: string) {
  await llamar(puente, "/salir", {}, token);
  return { ok: true as const };
}
