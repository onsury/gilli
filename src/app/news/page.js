'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { clientDb as db } from '../../lib/firebase-client';
import { PINCODE_AREAS } from '../../lib/chennai-pincodes';
 
const ACTIVE_PINCODES = [
  '600001', '600004', '600017', '600018', '600020',
  '600024', '600028', '600031', '600034', '600040',
  '600041', '600042', '600050', '600083', '600119',
];
 
function isValidPincode(p) {
  return /^600\d{3}$/.test(p);
}
 
function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
 
function NewsPageInner() {
  const searchParams = useSearchParams();
  const urlPincode = searchParams.get('pincode');
  const initialPincode = (urlPincode && isValidPincode(urlPincode)) ? urlPincode : '600028';
 
  const [items, setItems] = useState([]);
  const [pincode, setPincode] = useState(initialPincode);
  const [pincodeInput, setPincodeInput] = useState(initialPincode);
  const [loading, setLoading] = useState(false);
 
  const fetchNews = useCallback(async () => {
    if (!isValidPincode(pincode)) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'feed'),
        where('pincodes', 'array-contains', pincode),
        orderBy('homepage_score', 'desc'),
        limit(25)
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setItems([]);
    }
    setLoading(false);
  }, [pincode]);
 
  useEffect(() => { fetchNews(); }, [fetchNews]);
 
  function submitPincode() {
    const p = pincodeInput.trim();
    if (!isValidPincode(p)) {
      alert('Please enter a valid Chennai pincode (6 digits starting with 600)');
      return;
    }
    setPincode(p);
  }
 
  const areaName = PINCODE_AREAS[pincode]?.name || '';
 
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📰 Gully News</h1>
        <p style={{ color: '#666', fontSize: 15, marginTop: 8 }}>Chennai neighbourhood news, by pincode. Updated daily.</p>
      </div>
 
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Your pincode</label>
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
 
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Covered pincodes</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ACTIVE_PINCODES.map(p => (
            <button key={p} onClick={() => { setPincode(p); setPincodeInput(p); }} style={{
              padding: '5px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 11,
              background: pincode === p ? '#e85d26' : '#f0f0f0',
              color: pincode === p ? '#fff' : '#444',
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>
 
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          {pincode}{areaName ? ` · ${areaName}` : ''}
        </h2>
      </div>
 
      {loading && <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>}
 
      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
          <p style={{ fontSize: 17 }}>No news yet for {pincode}</p>
          <p style={{ fontSize: 13 }}>Fresh neighbourhood news arrives daily at 7 AM. Check back tomorrow.</p>
        </div>
      )}
 
      {!loading && items.map(item => (
        <article key={item.id} style={{
          background: '#fff', border: '1px solid #eee', borderRadius: 12,
          padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {item.breaking && <span style={{ background: '#dc3545', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>BREAKING</span>}
            {item.urgent && <span style={{ background: '#ffc107', color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>ALERT</span>}
            {item.category && <span style={{ background: '#fff3e0', color: '#e85d26', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{item.category}</span>}
            <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>{timeAgo(item.createdAt)}</span>
          </div>
 
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{item.title}</h3>
          <p style={{ margin: '0 0 10px', fontSize: 14, color: '#444', lineHeight: 1.5 }}>{item.summary}</p>
 
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#888' }}>
            {item.area && <span>📍 {item.area}</span>}
            {item.source && <span>· {item.source}</span>}
          </div>
        </article>
      ))}
 
      <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link href={`/awards?pincode=${pincode}`} style={{
          padding: '10px 18px', background: '#e85d26', color: '#fff', borderRadius: 20,
          fontWeight: 600, textDecoration: 'none', fontSize: 13
        }}>🏆 Vote in Best Gully Awards</Link>
      </div>
    </div>
  );
}
 
export default function NewsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#999', fontFamily: 'sans-serif' }}>Loading news...</div>}>
      <NewsPageInner />
    </Suspense>
  );
}