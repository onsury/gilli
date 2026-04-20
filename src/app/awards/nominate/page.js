'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { clientDb as db } from '../../../lib/firebase-client';
import { PINCODE_AREAS } from '../../../lib/chennai-pincodes';
 
function isValidPincode(p) {
  return /^600\d{3}$/.test(p);
}
 
export default function Nominate() {
  const router = useRouter();
  const [pincode, setPincode] = useState('');
  const [business, setBusiness] = useState('');
  const [area, setArea] = useState('');
  const [areaSuggested, setAreaSuggested] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  // When pincode changes, pre-fill area from our map as a suggestion
  useEffect(() => {
    if (isValidPincode(pincode)) {
      const suggested = PINCODE_AREAS[pincode]?.name || '';
      setAreaSuggested(suggested);
      // Only auto-fill area if user hasn't typed anything custom yet
      if (!area || area === areaSuggested) {
        setArea(suggested);
      }
    } else {
      setAreaSuggested('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);
 
  async function submit() {
    if (!isValidPincode(pincode)) {
      setStatus('Please enter a valid Chennai pincode (6 digits starting with 600).');
      return;
    }
    if (!business.trim() || !phone.trim()) {
      setStatus('Please fill business name and phone.');
      return;
    }
    setSubmitting(true);
    setStatus('Submitting...');
    try {
      // Client-side dedup: exact lowercase match in same pincode
      const existingQ = query(
        collection(db, 'awards_nominations'),
        where('pincode', '==', pincode),
        where('nomination_lower', '==', business.trim().toLowerCase())
      );
      const snap = await getDocs(existingQ);
      if (!snap.empty) {
        setStatus('This business is already nominated in ' + pincode + '. Redirecting to leaderboard...');
        setTimeout(() => router.push('/awards'), 1500);
        return;
      }
      await addDoc(collection(db, 'awards_nominations'), {
        nomination: business.trim(),
        nomination_lower: business.trim().toLowerCase(),
        pincode,
        area: area.trim() || areaSuggested || '',
        area_suggested: areaSuggested || '',
        votes: 0,
        nominated_by: phone.trim(),
        source: 'web',
        created_at: serverTimestamp(),
      });
      setStatus('Nominated! Redirecting to leaderboard...');
      setTimeout(() => router.push('/awards'), 1500);
    } catch (e) {
      setStatus('Error: ' + e.message);
      setSubmitting(false);
    }
  }
 
  const pincodeValid = isValidPincode(pincode);
 
  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Nominate a Business</h1>
      <p style={{ color: '#666', marginTop: 8 }}>Best Gully Awards 2026 — tell us who deserves to win in your neighbourhood.</p>
 
      <label style={{ display: 'block', marginTop: 20, fontWeight: 600 }}>Pincode *</label>
      <input
        value={pincode}
        onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="e.g. 600028"
        maxLength={6}
        style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      {pincode && !pincodeValid && (
        <p style={{ fontSize: 12, color: '#c00', marginTop: 4 }}>Must be a Chennai pincode (6 digits starting with 600)</p>
      )}
 
      <label style={{ display: 'block', marginTop: 16, fontWeight: 600 }}>
        Area / Neighbourhood name
        {areaSuggested && <span style={{ fontWeight: 400, fontSize: 12, color: '#999', marginLeft: 8 }}>(we suggest: {areaSuggested})</span>}
      </label>
      <input
        value={area}
        onChange={e => setArea(e.target.value)}
        placeholder="What do locals call this area?"
        style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Edit if you have a better local name than our suggestion.</p>
 
      <label style={{ display: 'block', marginTop: 16, fontWeight: 600 }}>Business name *</label>
      <input
        value={business}
        onChange={e => setBusiness(e.target.value)}
        placeholder="e.g. Saravana Stores"
        style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
 
      <label style={{ display: 'block', marginTop: 16, fontWeight: 600 }}>Your phone *</label>
      <input
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="+91..."
        style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
 
      <button
        onClick={submit}
        disabled={submitting || !pincodeValid}
        style={{
          marginTop: 24, width: '100%', padding: 14, fontSize: 16, fontWeight: 700,
          background: (submitting || !pincodeValid) ? '#ccc' : '#e85d26',
          color: '#fff', border: 'none', borderRadius: 8,
          cursor: (submitting || !pincodeValid) ? 'not-allowed' : 'pointer'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Nomination'}
      </button>
 
      {status && <p style={{ marginTop: 16, padding: 12, background: '#fff8f0', borderRadius: 8 }}>{status}</p>}
    </div>
  );
}