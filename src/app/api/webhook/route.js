// src/app/api/webhook/route.js

import config from "@/lib/config.js";
import { routeMessage } from "@/lib/handlers/router.js";

export const dynamic = "force-dynamic";

// ✅ GET → Webhook verification
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("🔍 Webhook verification attempt:", { mode, token });

  if (mode === "subscribe" && token === config.meta.verifyToken) {
    console.log("✅ Webhook verified successfully");
    return new Response(challenge, { status: 200 });
  }

  console.error("❌ Webhook verification failed");
  return new Response("Forbidden", { status: 403 });
}

// ✅ POST → Incoming WhatsApp messages
export async function POST(request) {
  try {
    const body = await request.json();

    console.log("📩 Incoming webhook:", JSON.stringify(body));

    if (body.object !== "whatsapp_business_account") {
      return new Response(JSON.stringify({ status: "not_whatsapp" }), { status: 200 });
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (!value?.messages || value.messages.length === 0) {
      return new Response(JSON.stringify({ status: "no_messages" }), { status: 200 });
    }

    const message = value.messages[0];
    const senderPhone = message.from;

    console.log(`📲 Message from ${senderPhone}: type=${message.type}`);

    await routeMessage(senderPhone, message);

    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response(JSON.stringify({ status: "error" }), { status: 200 });
  }
}