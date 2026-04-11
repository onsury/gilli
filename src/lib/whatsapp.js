// src/lib/whatsapp.js
// Meta WhatsApp Cloud API — send messages, download media

import config from "./config.js";
// Detect which provider to use
const USE_TWILIO = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
const META_API_URL = `https://graph.facebook.com/${config.meta.apiVersion}/${config.meta.phoneNumberId}/messages`;
const META_MEDIA_URL = `https://graph.facebook.com/${config.meta.apiVersion}`;

// ============================================
// SEND MESSAGES
// ============================================

export async function sendTextMessage(to, text) {
  if (USE_TWILIO) {
    if (text.length > 1600) {
      const parts = splitMessage(text, 1600);
      for (const part of parts) await sendViaTwilio(to, part);
      return;
    }
    return await sendViaTwilio(to, text);
  }
  // Fall back to Meta
  if (text.length > 4000) {
    const parts = splitMessage(text, 4000);
    for (const part of parts) await _sendText(to, part);
    return;
  }
  return await _sendText(to, text);
}
async function sendViaTwilio(to, text) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_FROM,
        To: `whatsapp:+${to}`,
        Body: text,
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) console.error("Twilio send error:", JSON.stringify(data));
  return data;
}
async function _sendText(to, text) {
  const response = await fetch(META_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  const data = await response.json();
  if (!response.ok) console.error("WhatsApp send error:", JSON.stringify(data));
  return data;
}

export async function sendButtonMessage(to, bodyText, buttons) {
  const response = await fetch(META_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map((btn, i) => ({
            type: "reply",
            reply: { id: btn.id || `btn_${i}`, title: btn.title.substring(0, 20) },
          })),
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) console.error("WhatsApp button error:", JSON.stringify(data));
  return data;
}

export async function sendListMessage(to, headerText, bodyText, buttonText, sections) {
  const response = await fetch(META_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        action: { button: buttonText, sections },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) console.error("WhatsApp list error:", JSON.stringify(data));
  return data;
}

export async function markAsRead(messageId) {
  await fetch(META_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

// ============================================
// DOWNLOAD MEDIA (for file uploads, voice notes, images)
// ============================================

export async function getMediaUrl(mediaId) {
  const response = await fetch(`${META_MEDIA_URL}/${mediaId}`, {
    headers: { Authorization: `Bearer ${config.meta.accessToken}` },
  });
  const data = await response.json();
  return data.url;
}

export async function downloadMedia(mediaId) {
  // Step 1: Get the media URL
  const url = await getMediaUrl(mediaId);
  if (!url) return null;

  // Step 2: Download the file
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.meta.accessToken}` },
  });

  if (!response.ok) {
    console.error("Media download failed:", response.status);
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

// ============================================
// HELPERS
// ============================================

function splitMessage(text, maxLen) {
  const parts = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    parts.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}
