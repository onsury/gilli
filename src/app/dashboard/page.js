'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sanitiseShopEdit } from '../../lib/sanitise';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { clientDb } from '../../lib/firebase-client';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { clientApp } from '../../lib/firebase-client';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [shops, setShops] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('listing');
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  async function sendOTP() {
    const digits = phone.replace(/\D/g, '');
    const full = digits.startsWith('91') ? '+' + digits : '+91' + digits;
    try {
      const auth = getAuth(clientApp);
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, full, window.recaptchaVerifier);
      setConfirm(result);
      setStep('otp');
      setMsg('OTP sent to ' + full);
    } catch (e) { setMsg('Error: ' + e.message); }
  }

  async function verifyOTP() {
    try {
      await confirm.confirm(otp);
      const digits = phone.replace(/\D/g, '');
      const full = digits.startsWith('91') ? '+' + digits : '+91' + digits;
      setAuthPhone(full);
      setAuthed(true);
      loadData(full);
    } catch (e) { setMsg('Invalid OTP.'); }
  }

  async function loadData(ph) {
    setLoading(true);
    try {
      const bSnap = await getDocs(query(collection(clientDb, 'businesses'), where('claimed_by_phone', '==', ph)));
      const shopList = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setShops(shopList);
      const paymentResults = await Promise.all(
        shopList.map(shop =>
          getDocs(query(collection(clientDb, 'payments'), where('businessId', '==', shop.id)))
            .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data(), shopName: shop.name })))
        )
      );
      setPayments(paymentResults.flat());
      const analyticsResults = await Promise.all(
        shopList.map(shop =>
          getDocs(query(collection(clientDb, 'analytics_events'), where('businessId', '==', shop.id)))
            .then(snap => snap.docs.map(d => d.data()))
        )
      );
      const ev = {};
      analyticsResults.flat().forEach(data => {
        if (data.event) ev[data.event] = (ev[data.event] || 0) + 1;
      });
      setEvents(ev);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveEdit(shopId) {
    setSaving(true);
    try {
      const cleanData = sanitiseShopEdit(editData);
      await updateDoc(doc(clientDb, 'businesses', shopId), { ...cleanData, owner_edited_at: new Date().toISOString() });
      setEditing(null);
      loadData(authPhone);
    } catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  }

  if (!authed) return (
    <div style={d.page}>
      <div id="recaptcha-container" />
      <div style={d.loginBox}>
        <Link href="/" style={d.back}>Gully</Link>
        <h1 style={d.loginTitle}>Shop Owner Dashboard</h1>
        <p style={d.loginSub}>Login with the phone number you used to claim your shop</p>
        {step === 'phone' ? (
          <>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" style={d.input} type="tel" />
            <button onClick={sendOTP} style={d.btn}>Send OTP</button>
          </>
        ) : (
          <>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" style={d.input} maxLength={6} />
            <button onClick={verifyOTP} style={d.btn}>Verify and Login</button>
          </>
        )}
        {msg && <p style={d.msg}>{msg}</p>}
      </div>
    </div>
  );

  return (
    <div style={d.page}>
      <div style={d.header}>
        <Link href="/" style={d.headerLogo}>Gully</Link>
        <span style={d.headerPhone}>{authPhone}</span>
      </div>
      <div style={d.container}>
        <div style={d.tabs}>
          {[['listing','My Listing'],['analytics','Analytics'],['billing','Billing']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ ...d.tab, borderBottom: tab === id ? '2px solid #e85d26' : '2px solid transparent', color: tab === id ? '#1a1a1a' : '#888', fontWeight: tab === id ? 700 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        {loading && <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#888' }}>Loading...</p>}

        {tab === 'listing' && (
          <div>
            {shops.length === 0 && !loading && (
              <div style={d.emptyBox}>
                <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 15, color: '#555', marginBottom: 16 }}>No claimed shops found for this number.</p>
                <Link href="/" style={d.btn}>Find your shop on Gully</Link>
              </div>
            )}
            {shops.map(shop => (
              <div key={shop.id} style={d.shopCard}>
                <div style={d.shopHeader}>
                  <div>
                    <h2 style={d.shopName}>{shop.name}</h2>
                    <p style={d.shopMeta}>{shop.category} · {shop.pincode}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {shop.premium && <span style={d.premiumBadge}>PREMIUM</span>}
                    <Link href={'/shop/' + shop.id} style={d.viewBtn} target="_blank">View listing</Link>
                  </div>
                </div>
                {editing === shop.id ? (
                  <div style={d.editForm}>
                    <label style={d.label}>WhatsApp Number</label>
                    <input style={d.input} value={editData.owner_whatsapp || ''} onChange={e => setEditData({ ...editData, owner_whatsapp: e.target.value })} placeholder="WhatsApp number" />
                    <label style={d.label}>Phone Number</label>
                    <input style={d.input} value={editData.owner_phone || ''} onChange={e => setEditData({ ...editData, owner_phone: e.target.value })} placeholder="Phone number" />
                    <label style={d.label}>Opening Hours</label>
                    <input style={d.input} value={editData.owner_hours || ''} onChange={e => setEditData({ ...editData, owner_hours: e.target.value })} placeholder="e.g. Mon-Sat 9am-9pm" />
                    <label style={d.label}>About your shop</label>
                    <textarea style={{ ...d.input, height: 80, resize: 'vertical' }} value={editData.owner_description || ''} onChange={e => setEditData({ ...editData, owner_description: e.target.value })} placeholder="Describe what you sell..." />
                    <label style={d.label}>Website (optional)</label>
                    <input style={d.input} value={editData.owner_website || ''} onChange={e => setEditData({ ...editData, owner_website: e.target.value })} placeholder="https://yourwebsite.com" />
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button onClick={() => saveEdit(shop.id)} disabled={saving} style={d.btn}>{saving ? 'Saving...' : 'Save Changes'}</button>
                      <button onClick={() => setEditing(null)} style={d.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={d.infoGrid}>
                      <div style={d.infoItem}><span style={d.infoLabel}>WhatsApp</span><span style={d.infoValue}>{shop.owner_whatsapp || '--'}</span></div>
                      <div style={d.infoItem}><span style={d.infoLabel}>Phone</span><span style={d.infoValue}>{shop.owner_phone || '--'}</span></div>
                      <div style={d.infoItem}><span style={d.infoLabel}>Hours</span><span style={d.infoValue}>{shop.owner_hours || '--'}</span></div>
                      <div style={d.infoItem}><span style={d.infoLabel}>Website</span><span style={d.infoValue}>{shop.owner_website || '--'}</span></div>
                    </div>
                    {shop.owner_description && <p style={d.desc}>{shop.owner_description}</p>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button onClick={() => { setEditing(shop.id); setEditData({ owner_whatsapp: shop.owner_whatsapp || '', owner_phone: shop.owner_phone || '', owner_hours: shop.owner_hours || '', owner_description: shop.owner_description || '', owner_website: shop.owner_website || '' }); }} style={d.editBtn}>
                        Edit Details
                      </button>
                      {!shop.premium && (
                        <Link href={'/premium?businessId=' + shop.id + '&name=' + encodeURIComponent(shop.name) + '&phone=' + authPhone} style={d.upgradeBtn}>
                          Upgrade to Premium Rs.499/mo
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <h2 style={d.sectionTitle}>Your Shop Analytics</h2>
            {Object.keys(events).length === 0 ? (
              <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#888' }}>Analytics will appear here as customers visit your listing.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {Object.entries(events).map(([event, count]) => (
                  <div key={event} style={d.statCard}>
                    <div style={d.statNum}>{count.toLocaleString()}</div>
                    <div style={d.statLbl}>{event.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'billing' && (
          <div>
            <h2 style={d.sectionTitle}>Billing and Plan</h2>
            {shops.map(shop => (
              <div key={shop.id} style={d.billingCard}>
                <div style={d.billingHeader}>
                  <span style={d.billingShop}>{shop.name}</span>
                  <span style={{ ...d.premiumBadge, background: shop.premium ? '#22863a' : '#888' }}>
                    {shop.premium ? 'PREMIUM' : 'FREE'}
                  </span>
                </div>
                {shop.premium ? (
                  <div>
                    <p style={d.billingDetail}>Plan: Premium listing — Rs.499/month</p>
                    <p style={d.billingDetail}>Expires: {shop.premium_expires ? new Date(shop.premium_expires).toLocaleDateString('en-IN') : '--'}</p>
                    <Link href={'/premium?businessId=' + shop.id + '&name=' + encodeURIComponent(shop.name) + '&phone=' + authPhone} style={{ ...d.btn, display: 'inline-block', marginTop: 16, textDecoration: 'none', width: 'auto', padding: '12px 24px' }}>
                      Renew Premium
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p style={d.billingDetail}>You are on the free plan.</p>
                    <p style={d.billingDetail}>Upgrade to Premium for WhatsApp button, verified badge, and priority placement.</p>
                    <Link href={'/premium?businessId=' + shop.id + '&name=' + encodeURIComponent(shop.name) + '&phone=' + authPhone} style={{ ...d.btn, display: 'inline-block', marginTop: 16, textDecoration: 'none', width: 'auto', padding: '12px 24px' }}>
                      Upgrade to Premium Rs.499/mo
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Georgia, serif' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

const d = {
  page: { minHeight: '100vh', background: '#faf9f6', fontFamily: 'Georgia, serif', color: '#1a1a1a' },
  header: { background: '#1a1a1a', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLogo: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 24, fontWeight: 900, color: '#fff', textDecoration: 'none' },
  headerPhone: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#aaa' },
  container: { maxWidth: 800, margin: '0 auto', padding: '32px 20px 60px' },
  tabs: { display: 'flex', borderBottom: '1px solid #e0ddd8', marginBottom: 32 },
  tab: { padding: '12px 20px', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontFamily: 'Playfair Display, Georgia, serif', fontSize: 15, marginBottom: -1 },
  loginBox: { maxWidth: 400, margin: '80px auto', padding: 40, background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8', textAlign: 'center' },
  back: { display: 'block', fontFamily: 'Playfair Display, Georgia, serif', fontSize: 28, fontWeight: 900, color: '#1a1a1a', textDecoration: 'none', marginBottom: 16 },
  loginTitle: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, margin: '0 0 8px' },
  loginSub: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#888', margin: '0 0 24px', lineHeight: 1.5 },
  input: { width: '100%', padding: '12px 14px', border: '1.5px solid #d0cdc8', borderRadius: 8, fontSize: 14, fontFamily: 'Arial, sans-serif', marginBottom: 12, boxSizing: 'border-box', background: '#fff', color: '#1a1a1a' },
  btn: { display: 'block', width: '100%', padding: 14, background: '#e85d26', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' },
  cancelBtn: { padding: '12px 20px', background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'Arial, sans-serif' },
  msg: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#888', marginTop: 12 },
  shopCard: { background: '#fff', border: '1px solid #e0ddd8', borderRadius: 12, padding: 24, marginBottom: 20 },
  shopHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  shopName: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, margin: 0 },
  shopMeta: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#888', margin: '4px 0 0' },
  premiumBadge: { display: 'inline-block', background: '#e85d26', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 700, letterSpacing: '0.1em' },
  viewBtn: { padding: '8px 14px', background: 'transparent', color: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: 8, fontSize: 13, fontFamily: 'Arial, sans-serif', fontWeight: 600, textDecoration: 'none' },
  editBtn: { padding: '10px 18px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Arial, sans-serif' },
  upgradeBtn: { padding: '10px 18px', background: '#e85d26', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Arial, sans-serif', textDecoration: 'none' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  infoItem: { background: '#faf9f6', borderRadius: 8, padding: '10px 14px' },
  infoLabel: { display: 'block', fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 4 },
  infoValue: { fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#1a1a1a' },
  desc: { fontFamily: 'Georgia, serif', fontSize: 14, color: '#444', fontStyle: 'italic', marginTop: 12, lineHeight: 1.6 },
  editForm: { borderTop: '1px solid #f0f0f0', paddingTop: 20, marginTop: 16 },
  label: { display: 'block', fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: 6, marginTop: 12 },
  emptyBox: { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8' },
  sectionTitle: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 24 },
  statCard: { background: '#fff', border: '1px solid #e0ddd8', borderRadius: 12, padding: '20px 16px', textAlign: 'center' },
  statNum: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 36, fontWeight: 900, color: '#e85d26', marginBottom: 4 },
  statLbl: { fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' },
  billingCard: { background: '#fff', border: '1px solid #e0ddd8', borderRadius: 12, padding: 24, marginBottom: 16 },
  billingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  billingShop: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 18, fontWeight: 700 },
  billingDetail: { fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#555', margin: '4px 0' },
};
