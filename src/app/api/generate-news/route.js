import { NextResponse } from "next/server";
import { generateDailyNews } from "../../../lib/news-generator.js";

const CRON_SECRET = process.env.CRON_SECRET || "gully-news-2026";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const pincode = body.pincode || null;

    console.log(`[generate-news] Starting — pincode: ${pincode || "all pilot pincodes"}`);
    const results = await generateDailyNews(pincode);

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[generate-news] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Gully News Generator",
    schedule: "Every 6 hours",
    pilot_pincodes: ["600028", "600040", "600017", "600001", "600004"],
    usage: "POST with Authorization: Bearer gully-news-2026",
  });
}