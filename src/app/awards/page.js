'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, getDocs, limit, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { clientDb as db } from '../../lib/firebase-client';
import { PINCODE_AREAS } from '../../lib/chennai-pincodes';
import { parseVideoUrl } from '../../lib/video';
 
function isValidPincode(p) {
  return /^[1-8]\d{5}$/.test(p);
}
 
function mostCommonArea(nominees) {
  if (!nominees.length) return null;
  const counts = {};
  for (const n of nominees) {
    const a = (n.area || '').trim();
    if (!a) continue;
    counts[a] = (counts[a] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || null;
}
 
function getVotedSet() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('mygully_voted') || '[]';
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}
 
function markVoted(id) {
  if (typeof window === 'undefined') return;
  const s = getVotedSet();
  s.add(id);
  localStorage.setItem('mygully_voted', JSON.stringify([...s]));
}
 
function AwardsPageInner() {
  const searchParams = useSearchParams();
  const urlPincode = searchParams.get('pincode');
  const initialPincode = (urlPincode && isValidPincode(urlPincode)) ? urlPincode : '600028';
 
  const [nominees, setNominees] = useState([]);
  const [pincode, setPincode] = useState(initialPincode);
  const [pincodeInput, setPincodeInput] = useState(initialPincode);
  const [topPincodes, setTopPincodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(new Set());
  const [votingId, setVotingId] = useState(null);
 
  useEffect(() => { setVoted(getVotedSet()); }, []);
 
  const fetchNominees = useCallback(async () => {
    if (!isValidPincode(pincode)) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'awards_nominations'),
        where('pincode', '==', pincode),
        orderBy('votes', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      setNominees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [pincode]);
 
  const fetchTopPincodes = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'awards_nominations'),
        orderBy('created_at', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      const counts = {};
      snap.docs.forEach(d => {
        const p = d.data().pincode;
        if (p) counts[p] = (counts[p] || 0) + 1;
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([p, c]) => ({ pincode: p, count: c }));
      setTopPincodes(top);
    } catch (e) {
      console.error(e);
    }
  }, []);
 
  useEffect(() => { fetchNominees(); }, [fetchNominees]);
  useEffect(() => { fetchTopPincodes(); }, [fetchTopPincodes]);
 
  function submitPincode() {
    const p = pincodeInput.trim();
    if (!isValidPincode(p)) {
      alert('Please enter a valid Chennai pincode (6 digits starting with 600)');
      return;
    }
    setPincode(p);
  }
 
  async function vote(nomId) {
    if (voted.has(nomId) || votingId) return;
    setVotingId(nomId);
    try {
      const voteId = 'web_' + (typeof window !== 'undefined' ? (localStorage.getItem('mygully_session') || (() => {
        const s = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('mygully_session', s);
        return s;
      })()) : 'anon');
      const voteDocId = nomId + '_' + voteId;
      await setDoc(doc(db, 'awards_votes', voteDocId), {
        nomination_id: nomId,
        voter: voteId,
        pincode,
        source: 'web',
        created_at: new Date(),
      });
      await updateDoc(doc(db, 'awards_nominations', nomId), {
        votes: increment(1),
      });
      markVoted(nomId);
      setVoted(new Set([...voted, nomId]));
      setNominees(prev => prev
        .map(n => n.id === nomId ? { ...n, votes: (n.votes || 0) + 1 } : n)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      );
    } catch (e) {
      console.error('Vote error:', e);
      alert('Could not record vote. Please try again.');
    }
    setVotingId(null);
  }
 
  function shareOnWhatsApp(n) {
    const text = `Vote for ${n.nomination} (${n.category || 'local favourite'}) in the Best Gully Awards 2026 — ${n.street || ''}${n.street ? ', ' : ''}${n.area || n.pincode}. Vote at https://mygully.in/awards?pincode=${n.pincode}`;
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    if (typeof window !== 'undefined') window.open(url, '_blank');
  }
 
  const dbArea = PINCODE_AREAS[pincode]?.name || null;
  const crowdArea = mostCommonArea(nominees);
  const headerArea = crowdArea || dbArea;
  const showSubtitle = crowdArea && dbArea && crowdArea !== dbArea;
 
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>🏆 Best Gully Awards 2026</h1>
        <p style={{ color: '#666', fontSize: 16, marginTop: 8 }}>Chennai&apos;s first pincode-based neighbourhood awards — crowdsourced by residents</p>
      </div>
 
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Enter a Chennai pincode</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={pincodeInput}
            onChange={e => setPincodeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitPincode()}
            placeholder="e.g. 600028"
            maxLength={6}
            style={{ flex: 1, padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button onClick={submitPincode} style={{
            padding: '10px 20px', background: '#e85d26', color: '#fff', border: 'none',
            borderRadius: 8, fontWeight: 600, cursor: 'pointer'
          }}>View</button>
        </div>
      </div>
 
      {topPincodes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Most active pincodes</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {topPincodes.map(({ pincode: p, count }) => (
              <button key={p} onClick={() => { setPincode(p); setPincodeInput(p); }} style={{
                padding: '6px 12px', borderRadius: 16, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 12,
                background: pincode === p ? '#e85d26' : '#f0f0f0',
                color: pincode === p ? '#fff' : '#333',
              }}>
                {p} · {count}
              </button>
            ))}
          </div>
        </div>
      )}
 
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          {pincode}{headerArea ? ` · ${headerArea}` : ''}
        </h2>
        {showSubtitle && <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>also known as {dbArea}</p>}
      </div>
 
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link href="/awards/nominate" style={{
          display: 'inline-block', padding: '10px 24px', background: '#e85d26',
          color: '#fff', borderRadius: 24, fontWeight: 600, textDecoration: 'none',
          fontSize: 14
        }}>
          + Nominate a Business
        </Link>
      </div>
 
      {loading && <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>}
 
      {!loading && nominees.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <p style={{ fontSize: 20 }}>No nominations yet for {pincode}</p>
          <p>Be the first! <Link href="/awards/nominate" style={{ color: '#e85d26', fontWeight: 600 }}>Nominate a business that deserves to win</Link></p>
        </div>
      )}
 
      <div>
        {nominees.map((n, i) => {
          const hasVoted = voted.has(n.id);
          const isVoting = votingId === n.id;
          return (
            <div key={n.id} style={{
              background: '#fff', border: '1px solid #eee', borderRadius: 12,
              padding: 16, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18,
                  background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#f0f0f0',
                  color: i < 3 ? '#fff' : '#666',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{n.nomination}</h3>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {n.category && <span style={{ fontWeight: 600, color: '#e85d26' }}>{n.category}</span>}
                    {n.category && n.street ? ' · ' : ''}
                    {n.street}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#e85d26' }}>{n.votes || 0}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>votes</div>
                </div>
              </div>
              {n.video_url && parseVideoUrl(n.video_url) && (
                <div style={{ marginTop: 12, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, background: '#000' }}>
                  <iframe
                    src={parseVideoUrl(n.video_url).embedUrl}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen
                    loading='lazy'
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => vote(n.id)}
                  disabled={hasVoted || isVoting}
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600,
                    borderRadius: 8, border: 'none', cursor: (hasVoted || isVoting) ? 'default' : 'pointer',
                    background: hasVoted ? '#d4edda' : isVoting ? '#ccc' : '#e85d26',
                    color: hasVoted ? '#155724' : '#fff',
                  }}
                >
                  {hasVoted ? '✓ Voted' : isVoting ? 'Voting...' : 'Vote'}
                </button>
                <button
                  onClick={() => shareOnWhatsApp(n)}
                  style={{
                    padding: '8px 12px', fontSize: 13, fontWeight: 600,
                    borderRadius: 8, border: '1px solid #25d366', cursor: 'pointer',
                    background: '#fff', color: '#25d366',
                  }}
                >
                  Share
                </button>
              </div>
            </div>
          );
        })}
      </div>
 
      <div style={{ marginTop: 32, background: '#1a1a2e', borderRadius: 12, padding: 20, textAlign: 'center', color: '#fff' }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>How voting works</p>
        <p style={{ fontSize: 14, color: '#aaa', margin: 0 }}>Click <strong style={{ color: '#fff' }}>Vote</strong> on any business. One vote per person per business. Vote for as many as you like.</p>
      </div>
    </div>
  );
}
 
export default function AwardsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#999', fontFamily: 'sans-serif' }}>Loading awards...</div>}>
      <AwardsPageInner />
    </Suspense>
  );
}
 