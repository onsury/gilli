'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { clientDb as db } from '../../../lib/firebase-client';
import { saveOwnerEdits } from '../../../lib/claims';

function DashboardInner() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('business');
  const phone = searchParams.get('phone');

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Editable fields
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerHours, setOwnerHours] = useState('');
  const [ownerDescription, setOwnerDescription] = useState('');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('');
  const [ownerWebsite, setOwnerWebsite] = useState('');
  const [ownerInstagram, setOwnerInstagram] = useState('');

  useEffect(() => {
    async function load() {
      if (!businessId || !phone) {
        setError('Invalid access. Please claim your shop first.');
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'businesses', businessId));
        if (!snap.exists()) {
          setError('Shop not found');
          setLoading(false);
          return;
        }
        const data = snap.data();

        // Security check — the phone on URL must match the claimed_by_phone
        if (data.claimed_by_phone !== phone) {
          setError('You are not authorised to edit this shop. Only the verified owner can access the dashboard.');
          setLoading(false);
          return;
        }

        setBusiness({ id: snap.id, ...data });

        // Pre-fill any existing owner edits
        setOwnerPhone(data.owner_phone || '');
        setOwnerHours(data.owner_hours || '');
        setOwnerDescription(data.owner_description || '');
        setOwnerWhatsapp(data.owner_whatsapp || '');
        setOwnerWebsite(data.owner_website || '');
        setOwnerInstagram(data.owner_instagram || '');

        setLoading(false);
      } catch (e) {
        setError('Error loading shop: ' + e.message);
        setLoading(false);
      }
    }
    load();
  }, [businessId, phone]);

  async function handleSave() {
    setStatus('');
    setSaving(true);
    try {
      await saveOwnerEdits(businessId, {
        owner_phone: ownerPhone.trim(),
        owner_hours: ownerHours.trim(),
        owner_description: ownerDescription.trim(),
        owner_whatsapp: ownerWhatsapp.trim(),
        owner_website: ownerWebsite.trim(),
        owner_instagram: ownerInstagram.trim(),
      });
      setStatus('Saved! Your changes are live on Gully.');
    } catch (e) {
      setStatus('Could not save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={s.page}><div style={s.container}><p>Loading your dashboard...</p></div></div>;
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <header style={s.header}>
            <Link href="/" style={s.homeLink}>← Gully</Link>
            <h1 style={s.title}>Dashboard</h1>
          </header>
          <div style={s.errorBox}>
            <p>{error}</p>
            <Link href="/" style={s.btnSecondary}>← Back to Gully</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <Link href="/" style={s.homeLink}>← Gully</Link>
          <h1 style={s.title}>{business.name}</h1>
          <p style={s.subtitle}>
            <span style={s.verifiedBadge}>✓ Verified owner</span> · {business.pincode}
          </p>
        </header>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>Free listing</h2>
          <p style={s.sectionHelper}>
            Edit the details customers see on your Gully page. Changes save immediately.
          </p>

          <label style={s.label}>Phone number (visible to customers)</label>
          <input
            value={ownerPhone}
            onChange={e => setOwnerPhone(e.target.value)}
            placeholder="+91 98765 43210"
            style={s.input}
          />

          <label style={s.label}>Opening hours</label>
          <input
            value={ownerHours}
            onChange={e => setOwnerHours(e.target.value)}
            placeholder="e.g., Mon-Sat 9 AM - 9 PM, Sunday closed"
            style={s.input}
          />

          <label style={s.label}>About your shop (1-2 sentences)</label>
          <textarea
            value={ownerDescription}
            onChange={e => setOwnerDescription(e.target.value)}
            placeholder="e.g., Family-run sweet shop since 1982. Known for Mysore Pak and ghee-roast dosai."
            rows={3}
            style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={saving ? s.btnDisabled : s.btnPrimary}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>

          {status && <p style={s.status}>{status}</p>}
        </div>

        <div style={s.premiumSection}>
          <h2 style={s.sectionTitle}>Gully Premium — ₹299/month</h2>
          <p style={s.sectionHelper}>
            Unlock more ways to reach neighbourhood customers:
          </p>
          <ul style={s.featureList}>
            <li>Up to 5 photos of your shop</li>
            <li>Multiple videos on your listing</li>
            <li>Menu / catalog PDF upload</li>
            <li>WhatsApp &quot;Chat Now&quot; button</li>
            <li>Priority placement in your pincode&apos;s category searches</li>
            <li>Monthly visibility reports</li>
          </ul>
          <button style={s.btnPremium} disabled>
            Upgrade to Premium (coming soon)
          </button>
          <p style={s.premiumNote}>
            We&apos;re finalising the payment flow. Meanwhile, your free listing is active and visible.
          </p>
        </div>

        <div style={s.footer}>
          <Link href={'/pincode/' + business.pincode} style={s.footerLink}>
            ← View your shop&apos;s pincode page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={s.page}><div style={s.container}><p>Loading...</p></div></div>}>
      <DashboardInner />
    </Suspense>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#1a1a1a' },
  container: { maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' },
  header: { borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 28 },
  homeLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 12 },
  title: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 14, color: '#666', margin: '8px 0 0' },
  verifiedBadge: { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, color: '#fff', background: '#22863a', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em' },
  section: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, margin: '0 0 6px' },
  sectionHelper: { fontSize: 13, color: '#666', margin: '0 0 18px' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, margin: '14px 0 6px', color: '#333' },
  input: { width: '100%', padding: 10, fontSize: 15, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' },
  btnPrimary: { marginTop: 20, width: '100%', padding: 12, fontSize: 15, fontWeight: 700, background: '#e85d26', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnDisabled: { marginTop: 20, width: '100%', padding: 12, fontSize: 15, fontWeight: 700, background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, cursor: 'not-allowed' },
  btnSecondary: { marginTop: 12, width: '100%', padding: 10, fontSize: 13, background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block', boxSizing: 'border-box' },
  btnPremium: { width: '100%', padding: 12, fontSize: 15, fontWeight: 700, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'not-allowed', opacity: 0.7 },
  status: { marginTop: 14, padding: 10, fontSize: 13, background: '#e8f5e9', color: '#1b5e20', borderRadius: 6 },
  premiumSection: { background: '#fff8f0', border: '1px solid #f4d9b8', borderRadius: 12, padding: 24, marginBottom: 20 },
  featureList: { fontSize: 14, lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 },
  premiumNote: { fontSize: 11, color: '#888', margin: '10px 0 0', textAlign: 'center' },
  footer: { textAlign: 'center', paddingTop: 16 },
  footerLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#888', textDecoration: 'underline' },
  errorBox: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, textAlign: 'center' },
};
