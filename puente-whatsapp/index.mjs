/**
 * Puente de WhatsApp del Portal IVAD.
 *
 * Se conecta a WhatsApp escaneando un codigo QR (igual que "vincular dispositivo"),
 * sin tokens ni cuentas de Meta. Debe quedar encendido en una PC o servidor.
 *
 * Configuracion por variables de entorno:
 *   PUENTE_TOKEN   clave secreta compartida con el portal (obligatoria)
 *   PORT           puerto local (por defecto 8787)
 *   PORTAL_URL     URL del portal para pedirle respuestas con IA (opcional)
 *
 * Endpoints:
 *   GET  /estado   -> { conectado, numero, qr }   (qr = imagen PNG en base64)
 *   POST /enviar   -> { para: "18095551234", texto: "..." }
 *   POST /salir    -> cierra la sesion y genera un QR nuevo
 */
import { createServer } from "node:http";
import { Boom } from "@hapi/boom";
import baileys from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

const TOKEN = process.env.PUENTE_TOKEN ?? "";
const PORT = Number(process.env.PORT ?? 8787);
const PORTAL_URL = process.env.PORTAL_URL ?? "";

if (!TOKEN) {
  console.error("Falta PUENTE_TOKEN. Ejemplo: PUENTE_TOKEN=miclave npm start");
  process.exit(1);
}

const estado = { conectado: false, numero: "", qr: "" };
let sock = null;

async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState("./sesion-whatsapp");
  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Portal IVAD", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    if (u.qr) {
      estado.qr = await QRCode.toDataURL(u.qr, { margin: 1, width: 320 });
      estado.conectado = false;
      console.log("QR nuevo listo: abrelo en Administracion del portal y escanealo.");
    }
    if (u.connection === "open") {
      estado.conectado = true;
      estado.qr = "";
      estado.numero = sock.user?.id?.split(":")[0] ?? "";
      console.log("WhatsApp conectado como", estado.numero);
    }
    if (u.connection === "close") {
      estado.conectado = false;
      const code = new Boom(u.lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) setTimeout(conectar, 3000);
      else console.log("Sesion cerrada. Reinicia el puente para generar un QR nuevo.");
    }
  });

  // Respuestas automaticas con IA a los mensajes que escriban los colaboradores.
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
        console.error("No se pudo responder con IA:", e.message);
      }
    }
  });
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

const numeroWa = (n) => `${String(n).replace(/\D/g, "")}@s.whatsapp.net`;

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Puente-Token");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  if (req.headers["x-puente-token"] !== TOKEN) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: "Token invalido" }));
  }

  if (req.url === "/estado") return res.end(JSON.stringify(estado));

  if (req.url === "/enviar" && req.method === "POST") {
    const { para, texto } = await leerCuerpo(req);
    if (!estado.conectado) {
      res.writeHead(409);
      return res.end(JSON.stringify({ error: "WhatsApp no esta conectado" }));
    }
    try {
      await sock.sendMessage(numeroWa(para), { text: String(texto ?? "") });
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  if (req.url === "/salir" && req.method === "POST") {
    try {
      await sock?.logout();
    } catch {
      /* ignorar */
    }
    estado.conectado = false;
    setTimeout(conectar, 1000);
    return res.end(JSON.stringify({ ok: true }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Ruta no encontrada" }));
}).listen(PORT, () => console.log(`Puente escuchando en http://localhost:${PORT}`));

conectar();
