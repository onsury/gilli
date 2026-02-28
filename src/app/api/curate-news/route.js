import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const PROMPT = `You are a Chennai neighbourhood news curator. Generate exactly 15 current, realistic, and diverse news items from across Chennai. Each item must be specific to a real Chennai neighbourhood and pincode.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Each object must have:
- "title": compelling headline (max 15 words)
- "summary": 2-3 sentence description with specific details (names, numbers, locations)
- "category": one of: temple, food, safety, business, education, politics, culture, sports, health, tech, cinema
- "area": specific Chennai neighbourhood name
- "pincodes": array of 1-2 relevant Chennai pincodes (600001-600119)
- "type": one of: article, alert, deal, video
- "source": realistic source name (The Hindu, Dinamalar, Times of India, ET Chennai, Sportstar, Dinamani, News Today, NDTV Chennai, Gully Heritage Desk, Gully Films, Gully People)
- "breaking": true only for 1 urgent item, false for rest
- "urgent": true only for 1 safety alert, false for rest
- "templeOfDay": true for exactly 1 temple item, false for rest
- "hasVideo": true for exactly 1 item, false for rest
- "gilliDeal": true for exactly 2 food/business deals, false for rest
- "sponsored": same as gilliDeal value

Rules:
- Cover at least 10 different pincodes across North, Central, South, and West Chennai
- Include 1 temple of the day with historical details (7+ century old temples preferred)
- Include 1 breaking/urgent news
- Include 2 Gilli deals (local shop offers, restaurant specials)
- Include 1 video item about a visual Chennai story
- Mix categories: at least 2 culture, 2 business, 1 sports, 1 education, 1 health, 1 tech
- Make content feel CURRENT — reference today's date, "this weekend", "from Monday", etc.
- Use real Chennai landmarks, roads, areas
- Keep summaries factual and specific with numbers where possible`;

async function callGemini() {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content from Gemini');

  // Clean markdown fences if present
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

async function clearOldFeed() {
  // Delete feed items older than 24 hours
  const feedRef = collection(db, 'feed');
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oldItems = await getDocs(
    query(feedRef, where('createdAt', '<', Timestamp.fromDate(cutoff)))
  );
  const { deleteDoc } = await import('firebase/firestore');
  const deletes = oldItems.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletes);
  return oldItems.size;
}

export async function POST(request) {
  // Simple auth — pass ?key=your-secret in URL or skip for dev
  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get('key');
  const expectedKey = process.env.CURATION_SECRET || 'curate2026';
  
  if (authKey !== expectedKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Generate news via Gemini
    const newsItems = await callGemini();

    if (!Array.isArray(newsItems) || newsItems.length === 0) {
      return Response.json({ error: 'Gemini returned no items' }, { status: 500 });
    }

    // Clear old content
    const deleted = await clearOldFeed();

    // Write to Firestore
    const feedRef = collection(db, 'feed');
    const now = new Date();
    const timeLabels = [
      "15 min ago", "30 min ago", "45 min ago", "1 hour ago", "1 hour ago",
      "2 hours ago", "2 hours ago", "3 hours ago", "3 hours ago", "4 hours ago",
      "5 hours ago", "5 hours ago", "6 hours ago", "7 hours ago", "8 hours ago",
    ];

    const writes = newsItems.map((item, i) => {
      const score = item.templeOfDay ? 98 :
                    item.breaking ? 97 :
                    item.urgent ? 95 :
                    item.gilliDeal ? 80 :
                    item.hasVideo ? 85 :
                    90 - (i * 2);

      return addDoc(feedRef, {
        ...item,
        city: "chennai",
        homepage_score: score,
        engagement: { views: Math.floor(Math.random() * 20000) + 500, shares: Math.floor(Math.random() * 2000) + 50 },
        publishedAt: timeLabels[i] || `${i + 1} hours ago`,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
      });
    });

    await Promise.all(writes);

    return Response.json({
      success: true,
      message: `Curated ${newsItems.length} news items. Deleted ${deleted} old items.`,
      count: newsItems.length,
    });
  } catch (err) {
    console.error('Curation error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  // Trigger curation via GET too (for easy browser/cron testing)
  return POST(request);
}