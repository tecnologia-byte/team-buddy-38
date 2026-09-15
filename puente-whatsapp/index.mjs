/**
 * Puente de WhatsApp del Portal IVAD.
 *
 * Se conecta a WhatsApp mediante:
 * 1. Código QR nítido con alto contraste y compatibilidad estándar con WhatsApp Web (macOS Desktop).
 * 2. Código de vinculación numérico de 8 caracteres (Pairing Code) para vincular por número de teléfono
 *    sin depender de la cámara.
 *
 * Configuración por variables de entorno:
 *   PUENTE_TOKEN   clave secreta compartida con el portal (por defecto 'ivad-secret-token')
 *   PORT           puerto del servidor (por defecto 8787)
 *   PORTAL_URL     URL del portal para respuestas automáticas con IA
 *   KEEP_ALIVE_URL URL pública para autorenovar el contenedor de Render y evitar que se apague
 */
import { createServer } from "node:http";
import fs from "node:fs";
import { Boom } from "@hapi/boom";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";

const TOKEN = process.env.PUENTE_TOKEN?.trim() || "ivad-secret-token";
const PORT = Number(process.env.PORT ?? 8787);
const PORTAL_URL = process.env.PORTAL_URL?.trim() || "https://personalivad.ivadsrl.com";
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL?.trim() || "https://puente-whatsapp-ivad.onrender.com/ping";

console.log(`[Puente WhatsApp] Iniciando servidor en puerto ${PORT}...`);

const estado = {
  conectado: false,
  numero: "",
  qr: "",
  codigo: "",
};

let sock = null;
let conectando = false;

function normalizarNumero(n) {
  let num = String(n || "").replace(/\D/g, "");
  // Si tiene 10 dígitos y es de República Dominicana (809, 829, 849), le agregamos el código de país 1
  if (num.length === 10 && (num.startsWith("809") || num.startsWith("829") || num.startsWith("849"))) {
    num = "1" + num;
  }
  return num;
}

const numeroWa = (n) => `${normalizarNumero(n)}@s.whatsapp.net`;

async function conectar() {
  if (conectando) return;
  conectando = true;

  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
    } catch {
      /* ignorar */
    }
    sock = null;
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState("./sesion-whatsapp");

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      // Firma de navegador macOS Desktop reconocida por WhatsApp Web oficial
      browser: Browsers.macOS("Desktop"),
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (u) => {
      const { connection, lastDisconnect, qr } = u;

      if (qr) {
        try {
          // Genera el código QR con un margen amplio y nítido para lectura instantánea de cámara
          estado.qr = await QRCode.toDataURL(qr, {
            margin: 3,
            width: 440,
            errorCorrectionLevel: "M",
            color: { dark: "#0b141a", light: "#ffffff" },
          });
          estado.conectado = false;
          console.log("[Puente WhatsApp] Nuevo QR criptográfico generado y listo para escanear.");
        } catch (err) {
          console.error("[Puente WhatsApp] Error generando QR:", err);
        }
      }

      if (connection === "open") {
        estado.conectado = true;
        estado.qr = "";
        estado.codigo = "";
        estado.numero = sock.user?.id?.split(":")[0] ?? "";
        console.log(`[Puente WhatsApp] ¡WhatsApp Conectado exitosamente! Número: +${estado.numero}`);
      }

      if (connection === "close") {
        estado.conectado = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(`[Puente WhatsApp] Conexión cerrada. Código de desconexión: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("[Puente WhatsApp] Sesión cerrada o dispositivo desvinculado. Limpiando credenciales antiguas...");
          try {
            fs.rmSync("./sesion-whatsapp", { recursive: true, force: true });
          } catch {
            /* ignorar */
          }
          estado.qr = "";
          estado.numero = "";
          estado.codigo = "";
          setTimeout(() => {
            conectando = false;
            conectar();
          }, 2000);
        } else {
          setTimeout(() => {
            conectando = false;
            conectar();
          }, 3000);
        }
      }
    });

    // Respuestas automáticas con IA para mensajes entrantes
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify" || !PORTAL_URL) return;
      for (const m of messages) {
        if (m.key.fromMe || m.key.remoteJid?.endsWith("@g.us")) continue;
        const texto =
          m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? "";
        if (!texto) continue;
        try {
          const res = await fetch(`${PORTAL_URL}/api/public/whatsapp/entrante`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Puente-Token": TOKEN },
            body: JSON.stringify({ de: m.key.remoteJid?.split("@")[0], texto }),
          });
          const data = await res.json();
          if (data?.respuesta) await sock.sendMessage(m.key.remoteJid, { text: data.respuesta });
        } catch (e) {
          console.error("[Puente WhatsApp] No se pudo responder con IA:", e.message);
        }
      }
    });
  } catch (err) {
    console.error("[Puente WhatsApp] Error al inicializar socket de Baileys:", err);
  } finally {
    conectando = false;
  }
}

const leerCuerpo = (req) =>
  new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(d || "{}"));
      } catch {
        resolve({});
      }
    });
  });

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Puente-Token");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  // Endpoint de ping para mantener activo el contenedor de Render
  if (req.url === "/ping" && req.method === "GET") {
    res.writeHead(200);
    return res.end(
      JSON.stringify({
        ok: true,
        conectado: estado.conectado,
        numero: estado.numero,
        hora: new Date().toISOString(),
      }),
    );
  }

  // Validación de token de seguridad para endpoints privados
  if (req.headers["x-puente-token"] !== TOKEN) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: "Token invalido" }));
  }

  // Estado general de conexión, QR y código de vinculación
  if (req.url === "/estado" && req.method === "GET") {
    return res.end(JSON.stringify(estado));
  }

  // Generación de Código de Vinculación de 8 Dígitos (Pairing Code)
  if (req.url === "/codigo" && req.method === "POST") {
    const { numero } = await leerCuerpo(req);
    const numLimpio = normalizarNumero(numero);
    if (!numLimpio || numLimpio.length < 10) {
      res.writeHead(400);
      return res.end(
        JSON.stringify({
          error: "Ingresa un número telefónico válido con código de país (ej: 18494252220)",
        }),
      );
    }
    if (estado.conectado) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: `WhatsApp ya está conectado como +${estado.numero}` }));
    }

    try {
      if (!sock) await conectar();
      console.log(`[Puente WhatsApp] Solicitando código de vinculación para: ${numLimpio}`);
      const rawCode = await sock.requestPairingCode(numLimpio);
      const formateado = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;
      estado.codigo = formateado;
      console.log(`[Puente WhatsApp] Código de vinculación generado: ${formateado}`);
      return res.end(JSON.stringify({ ok: true, codigo: formateado }));
    } catch (e) {
      console.error("[Puente WhatsApp] Error al generar código de vinculación:", e.message);
      res.writeHead(500);
      return res.end(
        JSON.stringify({
          error: `No se pudo generar el código: ${e.message}`,
        }),
      );
    }
  }

  // Envío de mensajes y documentos PDF (recibos/volantes de pago)
  if (req.url === "/enviar" && req.method === "POST") {
    const { para, texto, documentoBase64, nombreArchivo, mimetype } = await leerCuerpo(req);
    const jid = numeroWa(para);
    console.log(
      `[Puente WhatsApp] Peticion de envio a: ${jid} (para original: "${para}", conectado=${estado.conectado}, documento=${Boolean(documentoBase64)})`,
    );

    if (!estado.conectado) {
      console.warn(`[Puente WhatsApp] Intento de envio fallido: WhatsApp no esta conectado.`);
      res.writeHead(409);
      return res.end(
        JSON.stringify({
          error: "WhatsApp no esta conectado. Escanea el código QR o vincula con el código en Administración > WhatsApp.",
        }),
      );
    }

    try {
      if (documentoBase64) {
        const buffer = Buffer.from(
          documentoBase64.replace(/^data:[^;]+;base64,/, ""),
          "base64",
        );
        console.log(`[Puente WhatsApp] Enviando documento "${nombreArchivo || "documento.pdf"}" (${buffer.length} bytes) a ${jid}...`);
        await sock.sendMessage(jid, {
          document: buffer,
          mimetype: mimetype || "application/pdf",
          fileName: nombreArchivo || "documento.pdf",
          caption: texto ? String(texto) : undefined,
        });
        console.log(`[Puente WhatsApp] Documento enviado exitosamente a ${jid}`);
      } else {
        console.log(`[Puente WhatsApp] Enviando texto a ${jid}...`);
        await sock.sendMessage(jid, { text: String(texto ?? "") });
        console.log(`[Puente WhatsApp] Texto enviado exitosamente a ${jid}`);
      }
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      console.error(`[Puente WhatsApp] Error al enviar a ${jid}:`, e.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Cierre de sesión y limpieza completa para generar credenciales frescas
  if (req.url === "/salir" && req.method === "POST") {
    try {
      await sock?.logout();
    } catch {
      /* ignorar */
    }
    try {
      fs.rmSync("./sesion-whatsapp", { recursive: true, force: true });
    } catch {
      /* ignorar */
    }
    estado.conectado = false;
    estado.numero = "";
    estado.qr = "";
    estado.codigo = "";
    setTimeout(() => {
      conectando = false;
      conectar();
    }, 1500);
    return res.end(JSON.stringify({ ok: true }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Ruta no encontrada" }));
}).listen(PORT, () => {
  console.log(`[Puente WhatsApp] Servidor escuchando en http://localhost:${PORT}`);
});

// Self-ping para mantener el servicio activo en Render free tier (cada 9 minutos)
setInterval(async () => {
  try {
    await fetch(KEEP_ALIVE_URL);
  } catch {
    /* ignorar */
  }
}, 9 * 60 * 1000);

conectar();

// Evita que el servidor gratuito se "duerma" y pierda la sesion de WhatsApp:
// se hace una visita a si mismo cada 10 minutos.
const AUTO_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUENTE_URL_PUBLICA || "";
if (AUTO_URL) {
  setInterval(() => {
    fetch(`${AUTO_URL.replace(/\/+$/, "")}/estado`, {
      headers: { "X-Puente-Token": TOKEN },
    })
      .then(() => console.log("[Puente WhatsApp] Auto-visita para mantenerse despierto"))
      .catch(() => {});
  }, 10 * 60 * 1000);
}
