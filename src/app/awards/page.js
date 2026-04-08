'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { clientDb as db } from '../../lib/firebase-client';

const PINCODES = {
  "600028": "RA Puram / Santhome",
  "600040": "Anna Nagar",
  "600017": "T Nagar",
  "600001": "Parrys / George Town",
  "600004": "Mylapore",
};

export default function AwardsPage() {
  const [nominees, setNominees] = useState([]);
  const [pincode, setPincode] = useState("600028");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchNominees(); }, [pincode]);

  async function fetchNominees() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "awards_nominations"),
        where("pincode", "==", pincode),
        orderBy("votes", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      setNominees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>🏆 Best Gully Awards 2026</h1>
        <p style={{ color: '#666', fontSize: 16, marginTop: 8 }}>India's first pincode-based neighbourhood awards — voted by residents on WhatsApp</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
        {Object.entries(PINCODES).map(([pin, name]) => (
          <button key={pin} onClick={() => setPincode(pin)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13,
            background: pincode === pin ? '#e85d26' : '#f0f0f0',
            color: pincode === pin ? '#fff' : '#333',
          }}>
            {pin} · {name}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff8f0', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#333' }}>
          Vote on WhatsApp — send <strong>vote {pincode}</strong> to your Gilli number
        </p>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>}

      {!loading && nominees.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <p style={{ fontSize: 20 }}>No nominations yet for {pincode}</p>
          <p>Be the first! Send <strong>nominate [business name]</strong> on WhatsApp</p>
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
              <span style={{ fontSize: 12, color: '#888' }}>{n.area} · {n.pincode}</span>
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
        <p style={{ fontSize: 14, color: '#aaa', margin: 0 }}>Send <strong style={{ color: '#fff' }}>vote {pincode}</strong> to your Gilli WhatsApp number and follow the steps. Takes 30 seconds.</p>
      </div>
    </div>
  );
}