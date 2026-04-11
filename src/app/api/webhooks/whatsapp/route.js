// src/app/api/webhooks/route.js
// Twilio WhatsApp webhook — bridges Twilio format to Gilli router

import { routeMessage } from "../../lib/handlers/router.js";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const body = formData.get("Body") || "";
    const from = formData.get("From") || "";

    // Twilio sends from as "whatsapp:+919566075910" — clean it
    const phone = from.replace("whatsapp:", "").replace("+", "");

    console.log(`[Twilio] From: ${phone} | Message: ${body.substring(0, 50)}`);

    // Build message object in same format as Meta webhook
    const message = {
      type: "text",
      text: { body: body.trim() },
      id: `twilio_${Date.now()}`,
      from: phone,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // Route through the main Gilli router
    await routeMessage(phone, message);

    // Twilio expects empty TwiML response — actual reply sent via router
    return new Response(
      `<Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );

  } catch (error) {
    console.error("[Twilio webhook] Error:", error);
    return new Response(
      `<Response><Message>Sorry, something went wrong. Please try again.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" }, status: 200 }
    );
  }
}

export async function GET() {
  return new Response("Gully Twilio Webhook — POST only", { status: 200 });
}
