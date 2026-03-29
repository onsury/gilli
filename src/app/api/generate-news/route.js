import { NextResponse } from "next/server";
import { generateDailyNews } from "../../../lib/news-generator.js";

const CRON_SECRET = process.env.CRON_SECRET || "gully-news-2026";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[generate-news] Starting news generation...");
    const results = await generateDailyNews();
    return NextResponse.json({
      success: true,
      message: "News generated successfully",
      results,
    });
  } catch (err) {
    console.error("[generate-news] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Gully News Generator — POST to generate news",
    pincodes: ["600028", "600040", "600017", "600001", "600004"],
  });
}