/**
 * Puente de WhatsApp del Portal IVAD.
 *
 * Conectividad ultra-estable y persistencia total:
 * 1. Respaldo y restauración automática de credenciales en Supabase:
 *    - Al arrancar o reiniciarse el contenedor, restaura la sesión desde Supabase.
 *    - La sesión no se pierde si Render se reinicia, duerme o se actualiza.
 *    - Nunca exige escanear de nuevo salvo que el usuario presione "Desvincular" explícitamente.
 * 2. Reconexión resiliente:
 *    - Ante desconexiones temporales (código 401, 408, 440, 515, microcortes), reintenta automáticamente
 *      sin borrar las credenciales.
 * 3. Keep-Alive anti-suspensión:
 *    - Pings periódicos al router de Render cada 3 minutos para mantener el servicio despierto.
 * 4. Compatibilidad Baileys Multi-Dispositivo:
 *    - Versión dinámica más reciente de WhatsApp Web.
 *    - Sincronización instantánea de mensajes y manejo de LIDs.
 */
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Boom } from "@hapi/boom";
import {
  makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";

const TOKEN = process.env.PUENTE_TOKEN?.trim() || "ivad-secret-token";
const PORT = Number(process.env.PORT ?? 8787);
const PORTAL_URL = process.env.PORTAL_URL?.trim() || "https://personalivad.ivadsrl.com";
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL?.trim() || "https://puente-whatsapp-ivad.onrender.com/ping";
const CARPETA_SESION = "./sesion-whatsapp";

// Buffer de logs en memoria para diagnóstico accesible en /logs
const logs = [];
function log(...args) {
  const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  const line = `[${new Date().toISOString()}] ${msg}`;
  logs.push(line);
  if (logs.length > 150) logs.shift();
  console.log(line);
}

log(`[Puente WhatsApp] Inicializando servicio de WhatsApp IVAD en puerto ${PORT}...`);

const estado = {
  conectado: false,
  numero: "",
  qr: "",
  codigo: "",
  restauradoDeBaseDatos: false,
};

let sock = null;
let conectando = false;
let desvinculacionVoluntaria = false;

function normalizarNumero(n) {
  let num = String(n || "").replace(/\D/g, "");
  if (num.length === 10 && (num.startsWith("809") || num.startsWith("829") || num.startsWith("849"))) {
    num = "1" + num;
  }
  return num;
}

const numeroWa = (n) => `${normalizarNumero(n)}@s.whatsapp.net`;

// Mapeo de LIDs (Linked Device Identifiers) a números telefónicos reales
const lidToPhone = new Map([
  ["191500109537421", "18494252220"],
]);
let ultimoDestinoEnviado = { telefono: "18494252220", time: Date.now() };

// Almacén de mensajes en memoria para responder a reintentos criptográficos
const mensajeCache = new Map();
function guardarMensaje(id, message) {
  if (!id || !message) return;
  mensajeCache.set(id, message);
  if (mensajeCache.size > 1000) {
    const primerId = mensajeCache.keys().next().value;
    if (primerId) mensajeCache.delete(primerId);
  }
}

// =========================================================================
// SISTEMA DE SINCRONIZACIÓN PERSISTENTE CON SUPABASE A TRAVÉS DEL PORTAL
// =========================================================================

/** Restaura los archivos de sesión desde la base de datos Supabase si existen */
async function restaurarSesionDesdePortal() {
  try {
    const url = `${PORTAL_URL}/api/public/whatsapp/sesion?token=${encodeURIComponent(TOKEN)}`;
    log(`[Puente WhatsApp] Verificando respaldo de sesión en el portal...`);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Puente-Token": TOKEN,
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!res.ok) {
      log(`[Puente WhatsApp] No se pudo consultar la sesión del portal (HTTP ${res.status}).`);
      return false;
    }

    const data = await res.json();
    if (data?.ok && data.archivos && typeof data.archivos === "object") {
      const nombres = Object.keys(data.archivos);
      if (nombres.length > 0) {
        if (!fs.existsSync(CARPETA_SESION)) {
          fs.mkdirSync(CARPETA_SESION, { recursive: true });
        }
        for (const [nombre, contenido] of Object.entries(data.archivos)) {
          if (contenido) {
            fs.writeFileSync(path.join(CARPETA_SESION, nombre), String(contenido), "utf-8");
          }
        }
        estado.restauradoDeBaseDatos = true;
        log(`[Puente WhatsApp] 💾 ¡Sesión restaurada desde Supabase con éxito! (${nombres.length} archivos). Conectando sin necesidad de escanear QR.`);
        return true;
      }
    }
    log(`[Puente WhatsApp] No hay sesión previa guardada en base de datos. Se requerirá vinculación.`);
    return false;
  } catch (err) {
    log(`[Puente WhatsApp] Error al restaurar sesión desde portal:`, err.message);
    return false;
  }
}

let syncTimeout = null;
/** Respalda los archivos de sesión de WhatsApp hacia la base de datos Supabase de forma segura y debounced */
function sincronizarSesionHaciaPortal() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      if (!fs.existsSync(CARPETA_SESION)) return;
      const archivos = fs.readdirSync(CARPETA_SESION).filter((f) => f.endsWith(".json"));
      if (archivos.length === 0) return;

      const mapa = {};
      for (const archivo of archivos) {
        try {
          const ruta = path.join(CARPETA_SESION, archivo);
          mapa[archivo] = fs.readFileSync(ruta, "utf-8");
        } catch {
          /* ignorar archivo ocupado */
        }
      }

      if (Object.keys(mapa).length === 0) return;

      const url = `${PORTAL_URL}/api/public/whatsapp/sesion?token=${encodeURIComponent(TOKEN)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Puente-Token": TOKEN,
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ archivos: mapa }),
      });

      if (res.ok) {
        log(`[Puente WhatsApp] ☁️ Sesión de WhatsApp sincronizada y asegurada en Supabase (${Object.keys(mapa).length} archivos).`);
      } else {
        const txt = await res.text().catch(() => "");
        log(`[Puente WhatsApp] Aviso al sincronizar sesión (HTTP ${res.status}): ${txt}`);
      }
    } catch (e) {
      log(`[Puente WhatsApp] Error al sincronizar sesión hacia el portal:`, e.message);
    }
  }, 1500);
}

/** Elimina la sesión de Supabase si el usuario decide desvincular voluntariamente */
async function eliminarSesionEnPortal() {
  try {
    const url = `${PORTAL_URL}/api/public/whatsapp/sesion?token=${encodeURIComponent(TOKEN)}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        "X-Puente-Token": TOKEN,
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    log(`[Puente WhatsApp] Respaldo de sesión eliminado de Supabase.`);
  } catch (e) {
    log(`[Puente WhatsApp] Error eliminando respaldo de sesión:`, e.message);
  }
}

// =========================================================================
// CONEXIÓN Y EVENTOS DE WHATSAPP CON BAILEYS
// =========================================================================

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
    // Si la carpeta local no existe o está vacía, intentamos restaurar desde Supabase
    const tieneCredsLocales =
      fs.existsSync(CARPETA_SESION) &&
      fs.existsSync(path.join(CARPETA_SESION, "creds.json"));

    if (!tieneCredsLocales) {
      await restaurarSesionDesdePortal();
    }

    const { state, saveCreds } = await useMultiFileAuthState(CARPETA_SESION);
    const keys = makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }));

    // Obtenemos versión dinámica más reciente de WhatsApp Web
    let waVersion = [2, 3000, 1015901307];
    try {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      waVersion = version;
      log(`[Puente WhatsApp] Versión WhatsApp Web: ${waVersion.join(".")} (última: ${isLatest})`);
    } catch (e) {
      log(`[Puente WhatsApp] Usando versión de respaldo: ${waVersion.join(".")} (${e.message})`);
    }

    sock = makeWASocket({
      version: waVersion,
      auth: {
        creds: state.creds,
        keys,
      },
      logger: pino({ level: "silent" }),
      // Firma de cliente Desktop para que WhatsApp Web mantenga la sesión permanente sin caducar
      browser: ["IVAD Connect", "Desktop", "1.0.0"],
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      // Ping keep-alive al servidor de WhatsApp cada 15 segundos para evitar desconexiones por inactividad
      keepAliveIntervalMs: 15000,
      emitOwnEvents: false,
      getMessage: async (key) => {
        const guardado = mensajeCache.get(key.id);
        if (guardado?.message) return guardado.message;
        if (guardado) return guardado;
        return undefined;
      },
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      markOnlineOnConnect: true,
    });

    sock.ev.on("creds.update", async () => {
      await saveCreds();
      sincronizarSesionHaciaPortal();
    });

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
          log("[Puente WhatsApp] Código QR generado y listo para vincular en el portal.");
        } catch (err) {
          log("[Puente WhatsApp] Error generando imagen QR:", err.message);
        }
      }

      if (connection === "open") {
        estado.conectado = true;
        estado.qr = "";
        estado.codigo = "";
        estado.numero = sock.user?.id?.split(":")[0] ?? "";
        desvinculacionVoluntaria = false;
        log(`[Puente WhatsApp] 🟢 ¡WhatsApp CONECTADO y ACTIVO permanentemente! Número: +${estado.numero}`);
        // Respaldamos de inmediato la sesión confirmada
        sincronizarSesionHaciaPortal();
      }

      if (connection === "close") {
        estado.conectado = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        log(`[Puente WhatsApp] Conexión cerrada. Código de estado: ${statusCode}`);

        if (desvinculacionVoluntaria) {
          log("[Puente WhatsApp] Desvinculación manual confirmada por el usuario.");
          desvinculacionVoluntaria = false;
          estado.qr = "";
          estado.numero = "";
          estado.codigo = "";
          setTimeout(() => {
            conectando = false;
            conectar();
          }, 1500);
        } else {
          // REGLA CRÍTICA: NUNCA borrar credenciales ante desconexiones automáticas o transitorias (401/408/515).
          // Siempre reconectar para mantener el WhatsApp encendido y vinculado.
          log("[Puente WhatsApp] Reconexión automática en marcha para mantener el WhatsApp activo...");
          setTimeout(() => {
            conectando = false;
            conectar();
          }, 3000);
        }
      }
    });

    // Respuestas automáticas con IA para mensajes entrantes
    sock.ev.on("messages.upsert", async ({ messages }) => {
      if (!PORTAL_URL || !Array.isArray(messages)) return;
      for (const m of messages) {
        if (
          m.key.fromMe ||
          !m.key.remoteJid ||
          m.key.remoteJid === "status@broadcast" ||
          m.key.remoteJid.endsWith("@g.us")
        ) {
          continue;
        }

        let remitente = m.key.remoteJid.split("@")[0] || "";
        const esLid = m.key.remoteJid.endsWith("@lid");

        if (esLid) {
          const mapeado = lidToPhone.get(remitente);
          if (mapeado) {
            log(`[Puente WhatsApp] 🔄 Mapeando LID ${remitente} -> Teléfono ${mapeado}`);
            remitente = mapeado;
          } else if (ultimoDestinoEnviado.telefono && Date.now() - ultimoDestinoEnviado.time < 60 * 60 * 1000) {
            log(`[Puente WhatsApp] 🔄 Asociando LID reciente ${remitente} -> Teléfono ${ultimoDestinoEnviado.telefono}`);
            lidToPhone.set(remitente, ultimoDestinoEnviado.telefono);
            remitente = ultimoDestinoEnviado.telefono;
          }
        }

        const msg = m.message;
        if (!msg) continue;
        if (m.key?.id) {
          guardarMensaje(m.key.id, msg);
        }

        const sub =
          msg.ephemeralMessage?.message ||
          msg.viewOnceMessage?.message ||
          msg.viewOnceMessageV2?.message ||
          msg.documentWithCaptionMessage?.message ||
          msg;

        let texto = (
          sub.conversation ||
          sub.extendedTextMessage?.text ||
          sub.buttonsResponseMessage?.selectedDisplayText ||
          sub.buttonsResponseMessage?.selectedButtonId ||
          sub.templateButtonReplyMessage?.selectedId ||
          sub.listResponseMessage?.title ||
          sub.imageMessage?.caption ||
          sub.videoMessage?.caption ||
          sub.documentMessage?.caption ||
          ""
        ).trim();

        if (!texto && sub.audioMessage) {
          texto = "[Nota de voz recibida]";
        }

        if (!texto) continue;

        log(`[Puente WhatsApp] 📥 Mensaje recibido de ${remitente}: "${texto}"`);

        try {
          const urlDestino = `${PORTAL_URL}/api/public/whatsapp/entrante?token=${encodeURIComponent(TOKEN)}`;
          const res = await fetch(urlDestino, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Puente-Token": TOKEN,
              Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({ de: remitente, texto }),
          });

          if (!res.ok) {
            const txtErr = await res.text().catch(() => "");
            log(`[Puente WhatsApp] Error en webhook del portal (${res.status}): ${txtErr}`);
            continue;
          }

          const data = await res.json();
          const jidDestino =
            remitente && /^\d+$/.test(remitente) ? numeroWa(remitente) : m.key.remoteJid;

          if (data?.respuesta) {
            log(`[Puente WhatsApp] 💬 Mimi responde a ${remitente}: "${data.respuesta.slice(0, 90)}..."`);
            const enviado = await sock.sendMessage(jidDestino, { text: data.respuesta });
            if (enviado?.key?.id && enviado?.message) {
              guardarMensaje(enviado.key.id, enviado.message);
            }
          } else {
            log(`[Puente WhatsApp] Mimi procesó el mensaje de ${remitente} sin emitir respuesta (silencio/desactivada).`);
          }

          if (data?.doc?.documentoBase64) {
            log(`[Puente WhatsApp] 📄 Enviando documento PDF adjunto a ${remitente}: ${data.doc.nombreArchivo || "volante.pdf"}`);
            const enviadoDoc = await sock.sendMessage(jidDestino, {
              document: Buffer.from(data.doc.documentoBase64, "base64"),
              mimetype: data.doc.mimetype || "application/pdf",
              fileName: data.doc.nombreArchivo || "volante-de-pago.pdf",
            });
            if (enviadoDoc?.key?.id && enviadoDoc?.message) {
              guardarMensaje(enviadoDoc.key.id, enviadoDoc.message);
            }
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

// =========================================================================
// SERVIDOR HTTP REST DEL PUENTE
// =========================================================================

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Puente-Token, Authorization");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  // Endpoint de ping para mantener activo el contenedor
  if (req.url === "/ping" && req.method === "GET") {
    res.writeHead(200);
    return res.end(
      JSON.stringify({
        ok: true,
        conectado: estado.conectado,
        numero: estado.numero,
        hora: new Date().toISOString(),
        restaurado: estado.restauradoDeBaseDatos,
      }),
    );
  }

  // Endpoint de logs para diagnóstico rápido
  if (req.url === "/logs" && req.method === "GET") {
    res.writeHead(200);
    return res.end(JSON.stringify(logs));
  }

  // Validación de token de seguridad
  const headerToken = req.headers["x-puente-token"] || req.headers["authorization"]?.replace(/^bearer\s+/i, "");
  if (headerToken !== TOKEN) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: "Token inválido" }));
  }

  // Estado general de conexión, QR y código de vinculación
  if (req.url === "/estado" && req.method === "GET") {
    return res.end(JSON.stringify(estado));
  }

  // Código de Vinculación Numérico (Pairing Code)
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

  // Envío de mensajes y documentos PDF (volantes de pago)
  if (req.url === "/enviar" && req.method === "POST") {
    const { para, texto, documentoBase64, nombreArchivo, mimetype } = await leerCuerpo(req);
    const jid = numeroWa(para);
    ultimoDestinoEnviado = { telefono: normalizarNumero(para), time: Date.now() };

    if (!estado.conectado) {
      log(`[Puente WhatsApp] Intento de envío fallido: WhatsApp no está conectado.`);
      res.writeHead(409);
      return res.end(
        JSON.stringify({
          error: "WhatsApp no está conectado. Por favor verifica el estado en Administración > WhatsApp.",
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
        const enviadoDoc = await sock.sendMessage(jid, {
          document: buffer,
          mimetype: mimetype || "application/pdf",
          fileName: nombreArchivo || "documento.pdf",
          caption: texto ? String(texto) : undefined,
        });
        if (enviadoDoc?.key?.id && enviadoDoc?.message) {
          guardarMensaje(enviadoDoc.key.id, enviadoDoc.message);
        }
        log(`[Puente WhatsApp] Documento enviado exitosamente a ${jid}`);
      } else {
        log(`[Puente WhatsApp] Enviando texto a ${jid}...`);
        const enviado = await sock.sendMessage(jid, { text: String(texto ?? "") });
        if (enviado?.key?.id && enviado?.message) {
          guardarMensaje(enviado.key.id, enviado.message);
        }
        log(`[Puente WhatsApp] Texto enviado exitosamente a ${jid}`);
      }
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      log(`[Puente WhatsApp] Error al enviar a ${jid}:`, e.message);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Cierre de sesión y limpieza completa SOLO cuando el usuario solicita desvincular explícitamente
  if (req.url === "/salir" && req.method === "POST") {
    desvinculacionVoluntaria = true;
    try {
      await sock?.logout();
    } catch {
      /* ignorar */
    }
    try {
      fs.rmSync(CARPETA_SESION, { recursive: true, force: true });
    } catch {
      /* ignorar */
    }
    await eliminarSesionEnPortal();

    estado.conectado = false;
    estado.numero = "";
    estado.qr = "";
    estado.codigo = "";
    estado.restauradoDeBaseDatos = false;
    log("[Puente WhatsApp] Sesión desvinculada por solicitud del usuario y credenciales limpiadas.");
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

// Self-ping anti-suspensión cada 3 minutos para mantener el servicio activo en Render
setInterval(async () => {
  try {
    await fetch(KEEP_ALIVE_URL);
  } catch {
    /* ignorar */
  }
}, 3 * 60 * 1000);

// Iniciar conexión
conectar();
