'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase-client';

const CATEGORIES = [
  'All', 'Restaurants', 'Clinics', 'Fast Foods',
  'Home Appliances Service Centres', 'Decorators & Contractors',
  'Ice Cream Parlours', 'Coffee Shops & Coffee Bars',
  'Chinese Restaurants', 'Chettinad Restaurants'
];

const PILOT_PINCODES = {
  '600028': 'RA Puram',
  '600040': 'Anna Nagar',
  '600017': 'T Nagar',
  '600001': 'Parrys',
  '600004': 'Mylapore',
};

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPincode, setSelectedPincode] = useState('600028');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchBusinesses(); }, [selectedPincode, selectedCategory]);

  async function fetchBusinesses() {
    setLoading(true);
    setError('');
    try {
      const ref = collection(db, 'businesses');
      const q = selectedCategory === 'All'
        ? query(ref, where('pincode', '==', selectedPincode), limit(100))
        : query(ref, where('pincode', '==', selectedPincode), where('category_name', '==', selectedCategory), limit(100));
      const snap = await getDocs(q);
      setBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  }

  const filtered = businesses.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function waLink(mobile) {
    const c = mobile?.replace(/\D/g, '');
    if (!c || c.length < 10) return null;
    return 'https://wa.me/91' + c.slice(-10);
  }
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Gully Business Directory</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Chennai businesses by pincode</p>

      <p style={{ fontWeight: 600, marginBottom: 8 }}>Select Neighbourhood:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(PILOT_PINCODES).map(([pin, name]) => (
          <button key={pin} onClick={() => setSelectedPincode(pin)} style={{
            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 12,
            background: selectedPincode === pin ? '#e85d26' : '#f0f0f0',
            color: selectedPincode === pin ? '#fff' : '#333',
          }}>
            {pin} - {name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
            padding: '6px 12px', borderRadius: 16, border: '1px solid #ddd',
            cursor: 'pointer', fontSize: 12,
            background: selectedCategory === cat ? '#1a1a2e' : '#fff',
            color: selectedCategory === cat ? '#fff' : '#555',
          }}>
            {cat}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search by name or address..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
      />

      {!loading && <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>{filtered.length} businesses in {selectedPincode}{selectedCategory !== 'All' ? ' - ' + selectedCategory : ''}</p>}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>}
      {error && <div style={{ padding: 16, background: '#fff3f3', borderRadius: 8, color: '#c00', marginBottom: 16 }}>{error}</div>}

      <div>
        {filtered.map(biz => (
          <div key={biz.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{biz.name}</h3>
                <span style={{ fontSize: 11, background: '#f0f4ff', color: '#3355cc', padding: '2px 8px', borderRadius: 10 }}>{biz.category_name}</span>
              </div>
              {biz.rating && biz.rating !== '' && (
                <div style={{ background: '#f0fff4', color: '#1a8a3a', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{biz.rating} stars</div>
              )}
            </div>
            {biz.address && <p style={{ margin: '8px 0 4px', fontSize: 13, color: '#555' }}>{biz.address}{biz.area ? ', ' + biz.area : ''}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {biz.tel && biz.tel !== '-' && (
                <a href={'tel:' + biz.tel} style={{ padding: '6px 12px', background: '#f5f5f5', borderRadius: 8, fontSize: 12, color: '#333', textDecoration: 'none' }}>{biz.tel}</a>
              )}
              {biz.mobile && biz.mobile !== '-' && waLink(biz.mobile) && (
                <a href={waLink(biz.mobile)} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: '#25d366', borderRadius: 8, fontSize: 12, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a>
              )}
              {!biz.claimed && (
                <button style={{ padding: '6px 12px', background: '#fff', border: '1px dashed #e85d26', borderRadius: 8, fontSize: 12, color: '#e85d26', cursor: 'pointer' }}>Claim this listing</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>No businesses found</div>
      )}
    </div>
  );
}