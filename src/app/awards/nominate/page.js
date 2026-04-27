'use client';
import { useState, useEffect } from 'react';
import { parseVideoUrl } from '../../../lib/video';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { clientDb as db } from '../../../lib/firebase-client';
import { PINCODE_AREAS } from '../../../lib/chennai-pincodes';
 
const CATEGORIES = [
  'Provisions',
  'Restaurant',
  'Sweet shop',
  'Textiles',
  'Medical store',
  'Stainless steel',
  'Hardware',
  'Salon',
  'Electronics',
  'Tea shop',
  'Bakery',
  'Pharmacy',
  'Printing',
  'Jewelry',
  'Stationery',
  'Sari shop',
  'Mobile shop',
  'Flower shop',
  'Coffee shop',
  'Other',
];
 
function isValidPincode(p) {
  return /^600\d{3}$/.test(p);
}
 
export default function Nominate() {
  const router = useRouter();
  const [pincode, setPincode] = useState('');
  const [business, setBusiness] = useState('');
  const [category, setCategory] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [areaSuggested, setAreaSuggested] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  useEffect(() => {
    if (isValidPincode(pincode)) {
      const suggested = PINCODE_AREAS[pincode]?.name || '';
      setAreaSuggested(suggested);
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
    if (!business.trim() || !category || !street.trim() || !phone.trim()) {
      setStatus('Please fill all required fields (marked *).');
      return;
    }
    setSubmitting(true);
    setStatus('Submitting...');
    try {
      const nominationLower = business.trim().toLowerCase();
      const streetLower = street.trim().toLowerCase();
 
      // Dedup: same name + same street + same category + same pincode = duplicate
      const existingQ = query(
        collection(db, 'awards_nominations'),
        where('pincode', '==', pincode),
        where('nomination_lower', '==', nominationLower)
      );
      const snap = await getDocs(existingQ);
      const duplicate = snap.docs.find(d => {
        const data = d.data();
        return data.street_lower === streetLower && data.category === category;
      });
      if (duplicate) {
        setStatus('This business is already nominated. Redirecting to leaderboard...');
        setTimeout(() => router.push('/awards?pincode=' + pincode), 1500);
        return;
      }
 
      await addDoc(collection(db, 'awards_nominations'), {
        nomination: business.trim(),
        nomination_lower: nominationLower,
        category,
        street: street.trim(),
        street_lower: streetLower,
        pincode,
        area: area.trim() || areaSuggested || '',
        area_suggested: areaSuggested || '',
        owner_name: ownerName.trim() || '',
        business_phone: businessPhone.trim() || '',
        nominated_by: phone.trim(),
        video_url: videoUrl.trim() || '',
        votes: 0,
        source: 'web',
        created_at: serverTimestamp(),
      });
      setStatus('Nominated! Redirecting to leaderboard...');
      setTimeout(() => router.push('/awards?pincode=' + pincode), 1500);
    } catch (e) {
      setStatus('Error: ' + e.message);
      setSubmitting(false);
    }
  }
 
  const pincodeValid = isValidPincode(pincode);
  const inputStyle = { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginTop: 16, fontWeight: 600 };
 
  return (
    <div style={{ maxWidth: 540, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Nominate a Business</h1>
      <p style={{ color: '#666', marginTop: 8 }}>Best Gully Awards 2026 — tell us who deserves to win in your neighbourhood.</p>
 
      <label style={{ ...labelStyle, marginTop: 20 }}>Pincode *</label>
      <input
        value={pincode}
        onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="e.g. 600028"
        maxLength={6}
        style={inputStyle}
      />
      {pincode && !pincodeValid && (
        <p style={{ fontSize: 12, color: '#c00', marginTop: 4 }}>Must be a Chennai pincode (6 digits starting with 600)</p>
      )}
 
      <label style={labelStyle}>
        Area / Neighbourhood name
        {areaSuggested && <span style={{ fontWeight: 400, fontSize: 12, color: '#999', marginLeft: 8 }}>(suggested: {areaSuggested})</span>}
      </label>
      <input
        value={area}
        onChange={e => setArea(e.target.value)}
        placeholder="What do locals call this area?"
        style={inputStyle}
      />
      <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Edit if you have a better local name.</p>
 
      <label style={labelStyle}>Business name *</label>
      <input
        value={business}
        onChange={e => setBusiness(e.target.value)}
        placeholder="e.g. Sri Murugan Stores"
        style={inputStyle}
      />
 
      <label style={labelStyle}>Category *</label>
      <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
        <option value="">-- Select category --</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
 
      <label style={labelStyle}>Street / Road / Landmark *</label>
      <input
        value={street}
        onChange={e => setStreet(e.target.value)}
        placeholder="e.g. Edward Elliot's Road, near Santhome Basilica"
        style={inputStyle}
      />
      <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Helps distinguish businesses with similar names.</p>
 
      <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#555' }}>
          Optional details (not shown publicly)
        </p>
        <p style={{ fontSize: 11, color: '#888', margin: '0 0 16px' }}>
          Owner details will not be displayed publicly and will only be used to contact the business if they win an award.
        </p>
 
        <label style={{ ...labelStyle, marginTop: 0 }}>Owner&apos;s name</label>
        <input
          value={ownerName}
          onChange={e => setOwnerName(e.target.value)}
          placeholder="If you know it"
          style={inputStyle}
        />
 
        <label style={labelStyle}>Business phone</label>
        <input
          value={businessPhone}
          onChange={e => setBusinessPhone(e.target.value)}
          placeholder="Shop's contact number"
          style={inputStyle}
        />
      </div>
 
      <label style={{ ...labelStyle, marginTop: 24 }}>Your phone *</label>
      <input
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="+91..."
        style={inputStyle}
      />
      <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>So we can thank you and keep duplicates out.</p>

      <label style={{ marginTop: 20, display: 'block', fontSize: 14, fontWeight: 600 }}>Video link <span style={{ fontWeight: 400, color: '#888' }}>(YouTube or Instagram Reel, optional)</span></label>
      <input
        value={videoUrl}
        onChange={e => setVideoUrl(e.target.value)}
        placeholder='https://youtube.com/... or https://instagram.com/reel/...'
        style={inputStyle}
      />
      <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Share a video of this shop if you have one on YouTube or Instagram.</p>

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