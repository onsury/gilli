import { adminDb } from '../../../lib/firebase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function isMobile(phone) {
  if (!phone || phone.trim() === '-' || phone.trim() === '') return false;
  const digits = phone.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('91') && local.length === 12) local = local.slice(2);
  if (local.startsWith('0') && local.length === 11) local = local.slice(1);
  return /^[6-9]\d{9}$/.test(local);
}

export async function generateMetadata({ params }) {
  const { businessId } = await params;
  try {
    const snap = await adminDb.collection('businesses').doc(businessId).get();
    if (!snap.exists) return { title: 'Shop not found — Gully' };
    const d = snap.data();
    const title = `${d.name} — ${d.area || 'Chennai'} · Gully`;
    const parts = [];
    if (d.category_name || d.category) parts.push(d.category_name || d.category);
    if (d.area) parts.push(d.area);
    if (d.pincode) parts.push(d.pincode);
    const description = d.owner_description ||
      `${parts.join(' · ')}. Find neighbourhood shops on Gully — honoured by the people who shop there.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://mygully.in/shop/${businessId}`,
        siteName: 'Gully',
        type: 'website',
        images: [{ url: 'https://mygully.in/og-default.png', width: 1200, height: 630, alt: 'Gully' }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['https://mygully.in/og-default.png'],
      },
    };
  } catch (e) {
    return { title: 'Gully — Chennai neighbourhood shops' };
  }
}

export default async function ShopDetailPage({ params }) {
  const { businessId } = await params;
  const snap = await adminDb.collection('businesses').doc(businessId).get();
  if (!snap.exists) notFound();
  const shop = { id: snap.id, ...snap.data() };

  const rawPhone = shop.owner_phone || shop.phone || shop.mobile || shop.tel || '';
  const contactPhone = (rawPhone.trim() === '-' || rawPhone.trim() === '--') ? '' : rawPhone.trim();
  const contactWa = shop.owner_whatsapp || (isMobile(contactPhone) ? contactPhone : '');
  const isLandline = contactPhone.length > 0 && !isMobile(contactPhone);
  const waMessage = encodeURIComponent('Hi, I found ' + shop.name + ' on mygully.in and would like to enquire.');
  const shareText = `Check out ${shop.name} on Gully — https://mygully.in/shop/${businessId}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <Link href="/" style={s.homeLink}>← Gully</Link>
          <h1 style={s.title}>{shop.name}</h1>
          {shop.verified && <div style={s.verifiedBadge}>✓ Verified by owner</div>}
          <p style={s.subtitle}>
            {shop.category_name || shop.category || 'Shop'}
            {shop.area ? ` · ${shop.area}` : ''}
            {shop.pincode ? ` · ${shop.pincode}` : ''}
          </p>
        </header>

        <div style={s.card}>
          {shop.owner_description && (
            <p style={s.description}>{shop.owner_description}</p>
          )}

          {shop.address && (
            <div style={s.row}>
              <span style={s.label}>Address</span>
              <span style={s.value}>{shop.address}</span>
            </div>
          )}

          {isLandline && (
            <div style={s.row}>
              <span style={s.label}>Phone</span>
              <span style={s.value}>{contactPhone}</span>
            </div>
          )}

          {shop.owner_hours && (
            <div style={s.row}>
              <span style={s.label}>Hours</span>
              <span style={s.value}>{shop.owner_hours}</span>
            </div>
          )}



          {shop.owner_website && (
            <div style={s.row}>
              <span style={s.label}>Website</span>
              <a href={shop.owner_website.startsWith('http') ? shop.owner_website : `https://${shop.owner_website}`} target="_blank" rel="noopener noreferrer" style={s.link}>
                Visit website →
              </a>
            </div>
          )}
        </div>

        <div style={s.actionRow}>
          {contactWa && (
            <a
              href={'https://wa.me/' + contactWa.replace(/\D/g, '') + '?text=' + waMessage}
              target="_blank"
              rel="noopener noreferrer"
              style={s.waBtn}
            >
              WhatsApp
            </a>
          )}
          {isLandline && (
            <a
              href={'tel:' + contactPhone.replace(/\s/g, '')}
              style={s.callBtn}
            >
              Call
            </a>
          )}
          {!contactWa && !isLandline && (
            <Link href={'/claim/' + shop.id} style={s.callBtn}>
              Claim to add contact
            </Link>
          )}
        </div>
        <div style={s.shareSection}>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={s.shareBtn}>
            📤 Share this shop
          </a>
          <Link href={'/pincode/' + shop.pincode} style={s.pincodeBtn}>
            See more shops in {shop.pincode} →
          </Link>
        </div>

        {!shop.claimed && (
          <div style={s.claimCta}>
            <p style={s.claimText}>Do you own {shop.name}?</p>
            <Link href={`/claim/${shop.id}`} style={s.claimBtn}>
              Claim your listing →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#1a1a1a' },
  container: { maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' },
  header: { borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 28 },
  homeLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 12 },
  title: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' },
  verifiedBadge: { display: 'inline-block', fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', background: '#22863a', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#666', margin: '10px 0 0' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 20 },
  description: { fontSize: 16, fontStyle: 'italic', lineHeight: 1.6, color: '#333', margin: '0 0 20px', paddingBottom: 16, borderBottom: '1px solid #f0f0f0' },
  row: { display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 },
  label: { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', minWidth: 90 },
  value: { flex: 1, color: '#1a1a1a' },
  link: { flex: 1, color: '#e85d26', textDecoration: 'none' },
  actionRow: { display: 'flex', gap: 10, marginBottom: 12 },
  waBtn: { flex: 1, textAlign: 'center', padding: 14, fontSize: 15, fontWeight: 700, background: '#25D366', color: '#fff', borderRadius: 8, textDecoration: 'none' },
  callBtn: { flex: 1, textAlign: 'center', padding: 14, fontSize: 15, fontWeight: 700, background: '#1a1a1a', color: '#fff', borderRadius: 8, textDecoration: 'none' },
  shareSection: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  shareBtn: { display: 'block', textAlign: 'center', padding: 14, fontSize: 15, fontWeight: 700, background: '#25D366', color: '#fff', borderRadius: 8, textDecoration: 'none' },
  pincodeBtn: { display: 'block', textAlign: 'center', padding: 12, fontSize: 14, background: 'transparent', color: '#e85d26', border: '1px solid #e85d26', borderRadius: 8, textDecoration: 'none' },
  claimCta: { background: '#fff8f0', border: '1px solid #f4d9b8', borderRadius: 12, padding: 20, textAlign: 'center' },
  claimText: { fontSize: 14, color: '#555', margin: '0 0 10px' },
  claimBtn: { display: 'inline-block', padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#1a1a1a', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 8, textDecoration: 'none' },
};
