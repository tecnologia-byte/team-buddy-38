/**
 * Puente de WhatsApp del Portal IVAD.
 *
 * Se conecta a WhatsApp mediante:
 * 1. Código QR nítido con alto contraste y compatibilidad estándar con WhatsApp Web (Ubuntu Chrome).
 * 2. Código de vinculación numérico de 8 caracteres (Pairing Code) para vincular por número de teléfono
 *    sin depender de la cámara.
 *
 * Optimizado para evitar errores de sincronización y desconexiones:
 * - Consulta dinámica de la última versión del protocolo de WhatsApp Web (fetchLatestBaileysVersion).
 * - syncFullHistory: false para que el teléfono no intente transferir años de historial ni se congele.
 * - Registro de logs en memoria accesibles vía /logs para diagnóstico inmediato.
 */
import { createServer } from "node:http";
import fs from "node:fs";
import { Boom } from "@hapi/boom";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";

const TOKEN = process.env.PUENTE_TOKEN?.trim() || "ivad-secret-token";
const PORT = Number(process.env.PORT ?? 8787);
const PORTAL_URL = process.env.PORTAL_URL?.trim() || "https://personalivad.ivadsrl.com";
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL?.trim() || "https://puente-whatsapp-ivad.onrender.com/ping";

// Buffer de logs en memoria para diagnóstico
const logs = [];
function log(...args) {
  const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  const line = `[${new Date().toISOString()}] ${msg}`;
  logs.push(line);
  if (logs.length > 100) logs.shift();
  console.log(line);
}

log(`[Puente WhatsApp] Iniciando servidor en puerto ${PORT}...`);

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

    // Obtener la versión de WhatsApp Web más reciente para evitar rechazos de protocolo
    let waVersion = [2, 3000, 1015901307];
    try {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      waVersion = version;
      log(`[Puente WhatsApp] Versión WhatsApp Web: ${waVersion.join(".")} (última: ${isLatest})`);
    } catch (e) {
      log(`[Puente WhatsApp] Usando versión fija de respaldo: ${waVersion.join(".")} (${e.message})`);
    }

    sock = makeWASocket({
      version: waVersion,
      auth: state,
      logger: pino({ level: "silent" }),
      // Firma de Ubuntu Chrome: la más compatible y ampliamente aceptada por WhatsApp Web
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      // Desactivar sincronización de historial completo para que la vinculación sea instantánea
      // y no cause el error "debes permitir que permanezca conectado a Internet"
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      markOnlineOnConnect: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (u) => {
      const { connection, lastDisconnect, qr } = u;

      if (qr) {
        try {
          estado.qr = await QRCode.toDataURL(qr, {
            margin: 3,
            width: 440,
            errorCorrectionLevel: "M",
            color: { dark: "#0b141a", light: "#ffffff" },
          });
          estado.conectado = false;
          log("[Puente WhatsApp] Nuevo QR criptográfico emitido y listo para escanear.");
        } catch (err) {
          log("[Puente WhatsApp] Error generando QR:", err.message);
        }
      }

      if (connection === "open") {
        estado.conectado = true;
        estado.qr = "";
        estado.codigo = "";
        estado.numero = sock.user?.id?.split(":")[0] ?? "";
        log(`[Puente WhatsApp] ¡WhatsApp Conectado exitosamente! Número: +${estado.numero}`);
      }

      if (connection === "close") {
        estado.conectado = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        log(`[Puente WhatsApp] Conexión cerrada. Código de estado: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut) {
          log("[Puente WhatsApp] Sesión cerrada o desvinculada. Limpiando credenciales...");
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
          if (data?.respuesta) {
            await sock.sendMessage(m.key.remoteJid, { text: data.respuesta });
          }
          if (data?.doc?.documentoBase64) {
            await sock.sendMessage(m.key.remoteJid, {
              document: Buffer.from(data.doc.documentoBase64, "base64"),
              mimetype: data.doc.mimetype || "application/pdf",
              fileName: data.doc.nombreArchivo || "volante-de-pago.pdf",
            });
          }
        } catch (e) {
          log("[Puente WhatsApp] No se pudo responder con IA:", e.message);
        }
      }
    });
  } catch (err) {
    log("[Puente WhatsApp] Error al inicializar socket de Baileys:", err.message);
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

  // Endpoint de logs para diagnóstico rápido
  if (req.url === "/logs" && req.method === "GET") {
    res.writeHead(200);
    return res.end(JSON.stringify(logs));
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
      log(`[Puente WhatsApp] Solicitando código de vinculación para: ${numLimpio}`);
      const rawCode = await sock.requestPairingCode(numLimpio);
      const formateado = rawCode?.match(/.{1,4}/g)?.join("-") || rawCode;
      estado.codigo = formateado;
      log(`[Puente WhatsApp] Código de vinculación generado: ${formateado}`);
      return res.end(JSON.stringify({ ok: true, codigo: formateado }));
    } catch (e) {
      log("[Puente WhatsApp] Error al generar código de vinculación:", e.message);
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
    log(
      `[Puente WhatsApp] Petición de envío a: ${jid} (para: "${para}", conectado=${estado.conectado}, doc=${Boolean(documentoBase64)})`,
    );

    if (!estado.conectado) {
      log(`[Puente WhatsApp] Intento de envío fallido: WhatsApp no está conectado.`);
      res.writeHead(409);
      return res.end(
        JSON.stringify({
          error: "WhatsApp no está conectado. Escanea el código QR o vincula con el código en Administración > WhatsApp.",
        }),
      );
    }

    try {
      if (documentoBase64) {
        const buffer = Buffer.from(
          documentoBase64.replace(/^data:[^;]+;base64,/, ""),
          "base64",
        );
        log(`[Puente WhatsApp] Enviando documento "${nombreArchivo || "documento.pdf"}" (${buffer.length} bytes) a ${jid}...`);
        await sock.sendMessage(jid, {
          document: buffer,
          mimetype: mimetype || "application/pdf",
          fileName: nombreArchivo || "documento.pdf",
          caption: texto ? String(texto) : undefined,
        });
        log(`[Puente WhatsApp] Documento enviado exitosamente a ${jid}`);
      } else {
        log(`[Puente WhatsApp] Enviando texto a ${jid}...`);
        await sock.sendMessage(jid, { text: String(texto ?? "") });
        log(`[Puente WhatsApp] Texto enviado exitosamente a ${jid}`);
      }
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      log(`[Puente WhatsApp] Error al enviar a ${jid}:`, e.message);
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
    log("[Puente WhatsApp] Sesión cerrada y credenciales limpiadas a petición.");
    setTimeout(() => {
      conectando = false;
      conectar();
    }, 1500);
    return res.end(JSON.stringify({ ok: true }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Ruta no encontrada" }));
}).listen(PORT, () => {
  log(`[Puente WhatsApp] Servidor escuchando en http://localhost:${PORT}`);
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
