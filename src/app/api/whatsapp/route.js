import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PINCODE_AREAS } from '../../../lib/chennai-pincodes';
 
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ;
 
function isValidPincode(p) {
  return /^600\d{3}$/.test(p);
}
 
function areaFor(pincode) {
  return PINCODE_AREAS[pincode]?.name || '';
}
 
// GET — webhook verification
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}
 
// POST — incoming messages
export async function POST(req) {
  try {
    const rawBody = await req.text();
    
    // Verify Meta signature — prevents forged payloads
    const signature = req.headers.get('x-hub-signature-256');
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error('META_APP_SECRET not set — rejecting webhook');
      return new Response('Unauthorised', { status: 401 });
    }
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    if (!signature || signature !== expected) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorised', { status: 401 });
    }
    
    const body = JSON.parse(rawBody);
    let from = '', text = '';
 
    if (body.entry?.[0]?.changes) {
      const msg = body.entry[0].changes[0]?.value?.messages?.[0];
      if (!msg) return NextResponse.json({ ok: true });
      from = msg.from;
      text = msg.text?.body || '';
    } else if (body.from) {
      from = body.from;
      text = typeof body.text === 'string' ? body.text : body.text?.body || '';
    } else {
      return NextResponse.json({ ok: true });
    }
 
    const reply = await routeMessage(from, text.trim());
    await sendWhatsApp(from, reply);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
 
async function routeMessage(from, text) {
  const parts = text.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
 
  if (cmd === 'nominate' && parts.length >= 3) {
    return handleNominate(from, parts[1], parts.slice(2).join(' '));
  }
  if (cmd === 'vote' && parts.length >= 3) {
    return handleVote(from, parts[1], parts.slice(2).join(' '));
  }
  if (cmd === 'vote' && parts.length === 2) {
    return showNominees(parts[1]);
  }
  return helpText();
}
 
async function handleNominate(from, pincode, business) {
  if (!isValidPincode(pincode)) {
    return `🏘️ ${pincode} doesn't look like a Chennai pincode. Try a 6-digit pincode starting with 600.`;
  }
  const existing = await adminDb.collection('awards_nominations')
    .where('pincode', '==', pincode)
    .where('nomination_lower', '==', business.toLowerCase())
    .limit(1).get();
  if (!existing.empty) {
    return `✓ "${business}" is already nominated in ${pincode}.\n\nVote for it:\nvote ${pincode} ${business}`;
  }
  const area = areaFor(pincode);
  await adminDb.collection('awards_nominations').add({
    nomination: business,
    nomination_lower: business.toLowerCase(),
    pincode,
    area,
    area_suggested: area,
    votes: 0,
    nominated_by: from,
    source: 'whatsapp',
    created_at: FieldValue.serverTimestamp(),
  });
  return `🏆 Nominated! "${business}" is now on the list for ${pincode}${area ? ' (' + area + ')' : ''}.\n\nGet friends to vote:\nvote ${pincode} ${business}`;
}
 
async function handleVote(from, pincode, business) {
  if (!isValidPincode(pincode)) {
    return `🏘️ ${pincode} doesn't look like a Chennai pincode.`;
  }
  const snap = await adminDb.collection('awards_nominations')
    .where('pincode', '==', pincode)
    .where('nomination_lower', '==', business.toLowerCase())
    .limit(1).get();
  if (snap.empty) {
    return `❌ "${business}" isn't nominated yet in ${pincode}.\n\nNominate first:\nnominate ${pincode} ${business}`;
  }
  const doc = snap.docs[0];
  const voteKey = `${doc.id}_${from}`;
  const already = await adminDb.collection('awards_votes').doc(voteKey).get();
  if (already.exists) {
    return `✓ You've already voted for "${business}". One vote per person.`;
  }
  await adminDb.collection('awards_votes').doc(voteKey).set({
    nomination_id: doc.id,
    voter: from,
    pincode,
    created_at: FieldValue.serverTimestamp(),
  });
  await doc.ref.update({ votes: FieldValue.increment(1) });
  const newCount = (doc.data().votes || 0) + 1;
  return `🗳️ Vote recorded! "${business}" now has ${newCount} vote${newCount !== 1 ? 's' : ''}.\n\nLeaderboard: https://gully.in/awards`;
}
 
async function showNominees(pincode) {
  if (!isValidPincode(pincode)) return `${pincode} doesn't look like a Chennai pincode.`;
  const snap = await adminDb.collection('awards_nominations')
    .where('pincode', '==', pincode)
    .orderBy('votes', 'desc')
    .limit(5).get();
  const area = areaFor(pincode);
  if (snap.empty) {
    return `No nominations yet in ${pincode}${area ? ' (' + area + ')' : ''}.\n\nBe first:\nnominate ${pincode} [business name]`;
  }
  const list = snap.docs.map((d, i) => {
    const n = d.data();
    return `${i + 1}. ${n.nomination} — ${n.votes || 0} votes`;
  }).join('\n');
  return `🏆 Top in ${pincode}${area ? ' (' + area + ')' : ''}:\n\n${list}\n\nVote: vote ${pincode} [business]`;
}
 
function helpText() {
  return `👋 Best Gully Awards 2026\n\nChennai's first pincode-based neighbourhood awards — open to all 130+ Chennai pincodes.\n\n📝 Nominate:\nnominate [pincode] [business]\n\n🗳️ Vote:\nvote [pincode] [business]\n\n📊 See leaderboard:\nvote [pincode]\n\nExample:\nnominate 600028 Saravana Stores`;
}
 
async function sendWhatsApp(to, message) {
  const apiKey = process.env.AISENSY_API_KEY;
  if (!apiKey) {
    console.log(`[DRY RUN] → ${to}\n${message}\n`);
    return;
  }
  try {
    const res = await fetch('https://backend.aisensy.com/direct-apis/t1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to,
        type: 'text',
        text: { body: message },
      }),
    });
    if (!res.ok) console.error('AiSensy send failed:', await res.text());
  } catch (e) {
    console.error('Send error:', e);
  }
}