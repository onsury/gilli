// src/app/api/webhook/route.js

import { NextResponse } from "next/server";
import config from "@/lib/config.js";
import { routeMessage } from "@/lib/handlers/router.js";

export const dynamic = 'force-dynamic';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === config.meta.verifyToken) {
    console.log("Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "not_whatsapp" }, { status: 200 });
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;

    if (!value?.messages || value.messages.length === 0) {
      return NextResponse.json({ status: "no_messages" }, { status: 200 });
    }

    const message = value.messages[0];
    const senderPhone = message.from;

    console.log("Message from " + senderPhone + ": type=" + message.type);

    routeMessage(senderPhone, message).catch(function(err) {
      console.error("Route error for " + senderPhone + ":", err);
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}