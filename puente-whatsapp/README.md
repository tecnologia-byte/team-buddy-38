# Puente de WhatsApp del Portal IVAD

Este pequeño programa conecta el WhatsApp de la empresa **escaneando un código QR**,
igual que cuando vinculas WhatsApp Web. No usa la API de Meta ni tokens.

Debe quedar **encendido siempre** (una PC de la oficina o un servidor pequeño);
si se apaga, se corta el envío de mensajes por WhatsApp.

## 1. Instalar

Necesitas Node.js 20 o superior.

```bash
cd puente-whatsapp
npm install
```

## 2. Encender

Elige una clave secreta (cualquier texto largo) y guárdala: la misma se pega en el portal.

```bash
PUENTE_TOKEN=tu-clave-secreta PORTAL_URL=https://personalivad.ivadsrl.com npm start
```

Queda escuchando en `http://localhost:8787`.

## 3. Hacerlo visible para el portal

El portal necesita alcanzar el puente por internet. Dos opciones:

- **Servidor con dominio**: publícalo detrás de HTTPS, por ejemplo `https://wa.ivadsrl.com`.
- **Prueba rápida**: usa un túnel, por ejemplo `npx localtunnel --port 8787`
  o `cloudflared tunnel --url http://localhost:8787`, y copia la dirección que te dé.

## 4. Conectar el WhatsApp

1. En el portal entra a **Administradores → WhatsApp**.
2. Pega la dirección del puente y guárdala.
3. Aparecerá el **código QR**: en tu teléfono abre WhatsApp → Dispositivos vinculados →
   Vincular un dispositivo, y escanéalo.
4. Cuando el portal muestre "Conectado", los avisos empiezan a salir por WhatsApp
   a quienes hayan elegido ese canal.

La clave secreta (`PUENTE_TOKEN`) también se guarda en el portal como secreto
`WHATSAPP_PUENTE_TOKEN`, para que nadie más pueda enviar mensajes por tu WhatsApp.
