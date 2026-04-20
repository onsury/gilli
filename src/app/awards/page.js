'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { clientDb as db } from '../../lib/firebase-client';
import { PINCODE_AREAS } from '../../lib/chennai-pincodes';
 
function isValidPincode(p) {
  return /^600\d{3}$/.test(p);
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
 
export default function AwardsPage() {
  const [nominees, setNominees] = useState([]);
  const [pincode, setPincode] = useState('600028');
  const [pincodeInput, setPincodeInput] = useState('600028');
  const [topPincodes, setTopPincodes] = useState([]);
  const [loading, setLoading] = useState(false);
 
  useEffect(() => { fetchNominees(); }, [pincode]);
  useEffect(() => { fetchTopPincodes(); }, []);
 
  async function fetchNominees() {
    if (!isValidPincode(pincode)) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'awards_nominations'),
        where('pincode', '==', pincode),
        orderBy('votes', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      setNominees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
 
  async function fetchTopPincodes() {
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
  }
 
  function submitPincode() {
    const p = pincodeInput.trim();
    if (!isValidPincode(p)) {
      alert('Please enter a valid Chennai pincode (6 digits starting with 600)');
      return;
    }
    setPincode(p);
  }
 
  const dbArea = PINCODE_AREAS[pincode]?.name || null;
  const crowdArea = mostCommonArea(nominees);
  const headerArea = crowdArea || dbArea;
  const showSubtitle = crowdArea && dbArea && crowdArea !== dbArea;
 
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>🏆 Best Gully Awards 2026</h1>
        <p style={{ color: '#666', fontSize: 16, marginTop: 8 }}>Chennai's first pincode-based neighbourhood awards — crowdsourced by residents</p>
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
        {nominees.map((n, i) => (
          <div key={n.id} style={{
            background: '#fff', border: '1px solid #eee', borderRadius: 12,
            padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18,
              background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#f0f0f0',
              color: i < 3 ? '#fff' : '#666',
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{n.nomination}</h3>
              <span style={{ fontSize: 12, color: '#888' }}>{n.area || '—'} · {n.pincode}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#e85d26' }}>{n.votes || 0}</div>
              <div style={{ fontSize: 11, color: '#999' }}>votes</div>
            </div>
          </div>
        ))}
      </div>
 
      <div style={{ marginTop: 32, background: '#1a1a2e', borderRadius: 12, padding: 20, textAlign: 'center', color: '#fff' }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>How to vote</p>
        <p style={{ fontSize: 14, color: '#aaa', margin: 0 }}>Send <strong style={{ color: '#fff' }}>vote {pincode} [business name]</strong> to Gilli WhatsApp.</p>
      </div>
    </div>
  );
}