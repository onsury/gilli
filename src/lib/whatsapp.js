// src/lib/whatsapp.js
// Meta WhatsApp Cloud API — send messages, download media

import config from "./config.js";

const META_API_URL = `https://graph.facebook.com/${config.meta.apiVersion}/${config.meta.phoneNumberId}/messages`;
const META_MEDIA_URL = `https://graph.facebook.com/${config.meta.apiVersion}`;

// ============================================
// SEND MESSAGES
// ============================================

export async function sendTextMessage(to, text) {
  // WhatsApp text messages max 4096 chars — split if needed
  if (text.length > 4000) {
    const parts = splitMessage(text, 4000);
    for (const part of parts) {
      await _sendText(to, part);
    }
    return;
  }
  return await _sendText(to, text);
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