'use client';
import { isMobile, getContactPhone, getWhatsAppNumber, shopWhatsAppUrl, shopShareUrl } from '../../../lib/utils';

import { analytics } from '../../../lib/analytics';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { clientDb as db } from '../../../lib/firebase-client';
import { cityFromPincode } from '../../../lib/cities';
import { parseVideoUrl } from '../../../lib/video';
 
// Chennai pincode → area name map (subset of the full list in GullyHome)
const PINCODE_AREAS = {
  '600001': 'George Town / Parrys',
  '600002': 'Anna Road / Chintadripet',
  '600003': 'Park Town',
  '600004': 'Mylapore / Mandaveli',
  '600005': 'Chepauk / Triplicane',
  '600006': 'Greams Road / Teynampet',
  '600007': 'Vepery',
  '600008': 'Egmore',
  '600010': 'Kilpauk',
  '600014': 'Royapettah',
  '600017': 'T Nagar / Thyagaraya Nagar',
  '600018': 'Teynampet / Abiramapuram',
  '600020': 'Adyar / Indira Nagar',
  '600024': 'Kodambakkam',
  '600026': 'Vadapalani',
  '600028': 'RA Puram / Santhome / Foreshore',
  '600031': 'Chetput',
  '600034': 'Nungambakkam',
  '600040': 'Anna Nagar',
  '600041': 'Tiruvanmiyur / Palavakkam',
  '600042': 'Velachery',
  '600043': 'Chromepet',
  '600044': 'Pallavaram',
  '600050': 'Padi',
  '600083': 'Ashok Nagar',
  '600119': 'Sholinganallur',
};
 
function isMobile(phone) {
  if (!phone || phone.trim() === '-' || phone.trim() === '') return false;
  const digits = phone.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('91') && local.length === 12) local = local.slice(2);
  if (local.startsWith('0') && local.length === 11) local = local.slice(1);
  return /^[6-9]\d{9}$/.test(local);
}

function isValidPincode(p) {
  return /^[1-8]\d{5}$/.test(p);
}
 
export default function PincodePage() {
  const params = useParams();
  const pincode = params?.code;
 
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [displayCount, setDisplayCount] = useState(50);
 
  useEffect(() => {
    if (!isValidPincode(pincode)) {
      setError('Invalid pincode');
      setLoading(false);
      return;
    }
 
    async function fetchShops() {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'businesses'),
          where('pincode', '==', pincode),
          limit(500)
        );
        const snap = await getDocs(q);
        // Select only safe public fields. No phone, no address, no source.
        const safeShops = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Unnamed',
            category: data.category || 'Other',
            category_name: data.category_name || data.category || 'Other',
            address: (data.address && data.address !== '-') ? data.address : '',
            video_url: data.video_url || '',
            claimed: data.claimed === true,
            verified: data.verified === true,
            owner_phone: data.owner_phone || '',
            owner_hours: data.owner_hours || '',
            owner_description: data.owner_description || '',
            owner_whatsapp: data.owner_whatsapp || '',
            phone: data.phone || data.mobile || data.tel || '',
            area: data.area || '',
          };
        });
        setShops(safeShops);
        analytics.pincodeView(pincode, cityFromPincode(pincode));
      } catch (e) {
        console.error(e);
        setError('Could not load shops for this pincode.');
      } finally {
        setLoading(false);
      }
    }
 
    fetchShops();
  }, [pincode]);
 
  // Group shops by category_name
  const { grouped, categories } = useMemo(() => {
    const map = {};
    shops.forEach(s => {
      const cat = s.category_name || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    // Sort categories by count descending
    const cats = Object.keys(map).sort((a, b) => map[b].length - map[a].length);
    return { grouped: map, categories: cats };
  }, [shops]);
 
  const allVisible = useMemo(() => {
    if (selectedCategory === 'All') return shops;
    return grouped[selectedCategory] || [];
  }, [selectedCategory, shops, grouped]);

  const visibleShops = useMemo(() => {
    return allVisible.slice(0, displayCount);
  }, [allVisible, displayCount]);

  const hasMore = allVisible.length > displayCount;
 
  const areaName = PINCODE_AREAS[pincode] || null;
 
  if (error) {
    return (
      <div style={styles.pageWithNav}>
      <nav style={styles.stickyNav}>
        <Link href='/' style={styles.stickyLogo}>Gully</Link>
        <Link href='/' style={styles.stickyBack}>← All cities & pincodes</Link>
      </nav>
        <div style={styles.container}>
          <h1 style={styles.error}>⚠️ {error}</h1>
          <Link href="/" style={styles.backLink}>← Back to home</Link>
        </div>
      </div>
    );
  }
 
  return (
    <div style={styles.pageWithNav}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <Link href='/' style={styles.masthead}>
            <span style={styles.mastheadLogo}>Gully</span>
            <span style={styles.mastheadBack}>← all pincodes</span>
          </Link>
          <h1 style={styles.title}>
            {pincode}
          </h1>
          {cityFromPincode(pincode) && (
            <p style={styles.cityBadge}>{cityFromPincode(pincode)}</p>
          )}
          {areaName && <p style={styles.subtitle}>{areaName}</p>}
          <p style={styles.tagline}>
            {loading
              ? 'Loading neighbourhood shops...'
              : `${shops.length} shops in your neighbourhood`}
          </p>
        </div>
 
        {/* Category filter chips */}
        {!loading && categories.length > 0 && (
          <div style={styles.chipRow}>
            <button
              style={selectedCategory === 'All' ? styles.chipActive : styles.chip}
              onClick={() => { setSelectedCategory('All'); setDisplayCount(50); }}
            >
              All ({shops.length})
            </button>
            {categories.slice(0, 20).map(cat => (
              <button
                key={cat}
                style={selectedCategory === cat ? styles.chipActive : styles.chip}
                onClick={() => { setSelectedCategory(cat); setDisplayCount(50); }}
              >
                {cat} ({grouped[cat].length})
              </button>
            ))}
          </div>
        )}
 
        {/* Shop list */}
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : visibleShops.length === 0 ? (
          <div style={styles.empty}>
            <h3 style={{ margin: '0 0 10px' }}>We don't have shops for {pincode}{cityFromPincode(pincode) ? ' (' + cityFromPincode(pincode) + ')' : ''} yet — help us add them.</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>
              Help build the directory — add a shop you know in this neighbourhood.
            </p>
            <Link href={`/awards/nominate?pincode=${pincode}`} style={styles.ctaBtn}>
              + Add a Shop
            </Link>
          </div>
        ) : (
          <>
            <div style={styles.shopGrid}>
              {visibleShops.map(shop => (
                <div key={shop.id} style={styles.shopCard}>
                  <div style={styles.shopName}>{shop.name}</div>
                  <div style={styles.shopMeta}>
                    <span style={styles.categoryTag}>{shop.category_name}</span>
                    {shop.area && <span style={styles.areaTag}>📍 {shop.area}</span>}
                  </div>
                  {shop.address && <div style={styles.addressLine}>{shop.address}</div>}

                  {shop.verified && (
                    <div style={styles.verifiedBadge}>✓ Verified by owner</div>
                  )}

                  {shop.owner_description && (
                    <div style={styles.ownerDescription}>{shop.owner_description}</div>
                  )}

                  {(shop.owner_phone || shop.owner_hours) && (
                    <div style={styles.ownerMeta}>
                      {shop.owner_phone && <span style={styles.ownerPhone}>📞 {shop.owner_phone}</span>}
                      {shop.owner_phone && shop.owner_hours && <span> · </span>}
                      {shop.owner_hours && <span style={styles.ownerHours}>🕒 {shop.owner_hours}</span>}
                    </div>
                  )}

                  {shop.claimed === false && (
                    <Link href={'/claim/' + shop.id} style={styles.claimLink}>
                      I own this shop — claim your listing →
                    </Link>
                  )}

                  {shop.video_url && parseVideoUrl(shop.video_url) && (
                    <div style={styles.videoWrap}>
                      <iframe
                        src={parseVideoUrl(shop.video_url).embedUrl}
                        style={styles.videoEmbed}
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                        loading='lazy'
                      />
                    </div>
                  )}

                  <div style={styles.actionRow}>
                    <Link href={'/shop/' + shop.id} style={styles.viewBtn}>
                      View details
                    </Link>
                    <a
                      href={'https://wa.me/?text=' + encodeURIComponent('Check out ' + shop.name + ' on Gully — https://mygully.in/shop/' + shop.id)}
                      target='_blank'
                      rel='noopener noreferrer'
                      style={styles.shareBtn}
onClick={() => analytics.shareClick(shop.id, pincode, cityFromPincode(pincode))}
                    >
                      Share on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
 
            {hasMore && (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <button
                  onClick={() => setDisplayCount(n => n + 50)}
                  style={{ padding: '12px 32px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Load more shops ({allVisible.length - displayCount} remaining)
                </button>
              </div>
            )}

            {/* Add a shop CTA */}
            <div style={styles.addMoreSection}>
              <h3 style={{ margin: '0 0 8px' }}>Missing a favourite shop?</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>
                Add it to the directory — your neighbourhood&apos;s list gets better with every contribution.
              </p>
              <Link href={`/awards/nominate?pincode=${pincode}`} style={styles.ctaBtn}>
                + Add a Shop to {pincode}
              </Link>
            </div>
          </>
        )}
 
        {/* Footer nav */}
        <div style={styles.footerNav}>
          <Link href="/" style={styles.footerLink}>← All pincodes</Link>
          <Link href="/awards" style={styles.footerLink}>Gully Awards →</Link>
        </div>
      </div>
    </div>
  );
}
 
// Inline styles — matches Gully's newspaper aesthetic
const styles = {
  page: {
    minHeight: '100vh',
    background: '#fafaf7',
    fontFamily: 'Georgia, serif',
    paddingTop: 52,
  },
  stickyNav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: '#faf9f6',
    borderBottom: '2px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
  },
  stickyLogo: {
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: '#1a1a1a',
    textDecoration: 'none',
  },
  stickyBack: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fontWeight: 700,
    color: '#e85d26',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  pageWithNav: {
    minHeight: '100vh',
    background: '#fafaf7',
    fontFamily: 'Georgia, serif',
    paddingTop: 52,
  },
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 18px 60px',
  },
  header: {
    borderBottom: '2px solid #1a1a1a',
    paddingBottom: 20,
    marginBottom: 24,
  },
  homeLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 12 },
  masthead: { display: 'block', textDecoration: 'none', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  mastheadLogo: { display: 'block', fontFamily: 'Playfair Display, Georgia, serif', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 },
  mastheadBack: { display: 'block', fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#e85d26', letterSpacing: '0.05em', fontWeight: 700 },
  title: {
    fontSize: 44,
    fontWeight: 800,
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  cityBadge: { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e85d26', marginTop: 8, marginBottom: 4 },
  subtitle: {
    fontSize: 22,
    fontStyle: 'italic',
    color: '#444',
    margin: '0 0 6px',
  },
  tagline: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    color: '#888',
    margin: 0,
    letterSpacing: '0.03em',
  },
  chipRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #e5e5e0',
  },
  chip: {
    padding: '6px 12px',
    borderRadius: 16,
    border: '1px solid #d5d5d0',
    background: '#fff',
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 500,
    color: '#555',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  chipActive: {
    padding: '6px 12px',
    borderRadius: 16,
    border: '1px solid #e85d26',
    background: '#e85d26',
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  shopGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
    marginBottom: 32,
  },
  shopCard: {
    background: '#fff',
    padding: '14px 16px',
    borderRadius: 8,
    border: '1px solid #e5e5e0',
  },
  shopName: {
    fontFamily: 'Georgia, serif',
    fontSize: 17,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 1.25,
  },
  shopMeta: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryTag: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    color: '#e85d26',
    background: '#fff3e0',
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  areaTag: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    color: '#666',
  },
  addressLine: { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#666', marginTop: 6, lineHeight: 1.4 },
  videoWrap: { marginTop: 10, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, background: '#000' },
  verifiedBadge: { display: 'inline-block', fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', background: '#22863a', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em', marginTop: 8 },
  ownerDescription: { fontSize: 13, color: '#333', fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 },
  ownerMeta: { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#444', marginTop: 6 },
  ownerPhone: { fontWeight: 600 },
  ownerHours: { color: '#666' },
  claimLink: { display: 'inline-block', fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#888', textDecoration: 'underline', marginTop: 8, cursor: 'pointer' },
  actionRow: { display: 'flex', gap: 8, marginTop: 12 },
  viewBtn: { flex: 1, textAlign: 'center', padding: '8px 10px', fontSize: 12, fontWeight: 600, background: 'transparent', color: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: 6, textDecoration: 'none' },
  waBtn: { flex: 1, textAlign: 'center', padding: '8px 10px', fontSize: 12, fontWeight: 600, background: '#25D366', color: '#fff', borderRadius: 6, textDecoration: 'none' },
  callBtn: { flex: 1, textAlign: 'center', padding: '8px 10px', fontSize: 12, fontWeight: 600, background: '#1a1a1a', color: '#fff', borderRadius: 6, textDecoration: 'none' },
  shareBtn: { flex: 1, textAlign: 'center', padding: '8px 10px', fontSize: 12, fontWeight: 600, background: '#25D366', color: '#fff', borderRadius: 6, textDecoration: 'none' },
  videoEmbed: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  addMoreSection: {
    background: '#fff8f3',
    padding: '20px 18px',
    borderRadius: 12,
    border: '1px solid #f0d5c0',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaBtn: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#e85d26',
    color: '#fff',
    borderRadius: 22,
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#444',
  },
  error: {
    color: '#c94a1a',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    color: '#666',
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
  },
  footerNav: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTop: '1px solid #e5e5e0',
  },
  footerLink: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    color: '#666',
    textDecoration: 'none',
  },
};
