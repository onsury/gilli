'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, getDocs, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clientDb } from '../../lib/firebase-client';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { clientApp } from '../../lib/firebase-client';

const SUPERADMIN = '+919566075910';

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [premium, setPremium] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    const digits = phone.replace(/\D/g, '');
    const full = digits.startsWith('91') ? '+' + digits : '+91' + digits;
    if (full !== SUPERADMIN) { setMsg('Unauthorised.'); return; }
    try {
      const auth = getAuth(clientApp);
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, full, window.recaptchaVerifier);
      setConfirm(result);
      setStep('otp');
      setMsg('OTP sent.');
    } catch (e) { setMsg('Error: ' + e.message); }
  }

  async function verifyOTP() {
    try {
      await confirm.confirm(otp);
      setAuthed(true);
      load();
    } catch (e) { setMsg('Invalid OTP.'); }
  }

  async function load() {
    setLoading(true);
    try {
      const pSnap = await getDocs(query(collection(clientDb, 'payments'), orderBy('paidAt', 'desc'), limit(100)));
      setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const bSnap = await getDocs(query(collection(clientDb, 'businesses'), where('premium', '==', true), limit(200)));
      const shops = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPremium(shops);
      const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      setExpiring(shops.filter(s => s.premium_expires && s.premium_expires <= in7 && s.premium_expires >= now));
      const aSnap = await getDocs(query(collection(clientDb, 'analytics_events'), orderBy('timestamp', 'desc'), limit(2000)));
      const ev = {};
      aSnap.docs.forEach(d => { const e = d.data().event; ev[e] = (ev[e] || 0) + 1; });
      setEvents(ev);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function togglePremium(shopId, current) {
    await updateDoc(doc(clientDb, 'businesses', shopId), { premium: !current, premium_toggled_at: serverTimestamp() });
    load();
  }

  async function extendPremium(shopId) {
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await updateDoc(doc(clientDb, 'businesses', shopId), { premium_expires: exp, premium_extended_by: 'superadmin' });
    load();
  }

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0) / 100;

  if (!authed) return (
    <div style={s.page}>
      <div id="recaptcha-container" />
      <div style={s.loginBox}>
        <div style={s.logo}>Gully</div>
        <div style={s.logoSub}>Madraz Buzz Media · Superadmin</div>
        {step === 'phone' ? (
          <>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" style={s.input} type="tel" />
            <button onClick={sendOTP} style={s.btn}>Send OTP</button>
          </>
        ) : (
          <>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" style={s.input} maxLength={6} />
            <button onClick={verifyOTP} style={s.btn}>Verify & Enter</button>
          </>
        )}
        {msg && <p style={s.msg}>{msg}</p>}
      </div>
    </div>
  );

  return (
    <div style={s.layout}>
      <div style={s.sidebar}>
        <div style={s.logo}>Gully</div>
        <div style={s.logoSub}>Madraz Buzz Media</div>
        <div style={s.logoSub}>Superadmin Panel</div>
        <nav style={s.nav}>
          {[['payments','Payments'],['premium','Premium Shops'],['expiring','Expiring Soon'],['analytics','Analytics']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...s.navItem, background: tab === id ? '#e85d26' : 'transparent', color: tab === id ? '#fff' : '#999' }}>
              {label}
            </button>
          ))}
        </nav>
        <div style={s.statBox}>
          <div style={s.stat}><div style={s.statN}>Rs.{totalRevenue.toFixed(0)}</div><div style={s.statL}>Revenue</div></div>
          <div style={s.stat}><div style={s.statN}>{premium.length}</div><div style={s.statL}>Premium</div></div>
          <div style={s.stat}><div style={s.statN}>{expiring.length}</div><div style={s.statL}>Expiring</div></div>
        </div>
      </div>

      <div style={s.main}>
        {loading && <p style={{ color: '#888', fontFamily: 'Arial, sans-serif', fontSize: 13 }}>Loading...</p>}

        {tab === 'payments' && (
          <div>
            <h2 style={s.h2}>Payment History ({payments.length})</h2>
            <div style={s.table}>
              <div style={{ ...s.row, background: '#222', fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span>Shop</span><span>Phone</span><span>Amount</span><span>Date</span><span>Payment ID</span>
              </div>
              {payments.map(p => (
                <div key={p.id} style={s.row}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#aaa' }}>{(p.businessId || '').slice(0, 14)}...</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 13 }}>{p.phone}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#4caf50', fontWeight: 700 }}>Rs.{((p.amount || 0) / 100).toFixed(0)}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#aaa' }}>{p.paidAt && p.paidAt.toDate ? p.paidAt.toDate().toLocaleDateString('en-IN') : '--'}</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#aaa' }}>{(p.paymentId || '').slice(0, 18)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'premium' && (
          <div>
            <h2 style={s.h2}>Premium Shops ({premium.length})</h2>
            <div style={s.table}>
              <div style={{ ...s.row, background: '#222', fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <span>Name</span><span>Pincode</span><span>Expires</span><span>Status</span><span>Actions</span>
              </div>
              {premium.map(p => (
                <div key={p.id} style={s.row}>
                  <span style={{ fontWeight: 600, fontFamily: 'Georgia, serif', fontSize: 14 }}>{p.name}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 13 }}>{p.pincode}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: p.premium_expires < new Date().toISOString() ? '#f44336' : '#aaa' }}>
                    {p.premium_expires ? new Date(p.premium_expires).toLocaleDateString('en-IN') : '--'}
                  </span>
                  <span>
                    <span style={{ background: p.premium ? '#4caf50' : '#555', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
                      {p.premium ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => togglePremium(p.id, p.premium)} style={s.actBtn}>{p.premium ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => extendPremium(p.id)} style={{ ...s.actBtn, background: '#333' }}>+30 days</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'expiring' && (
          <div>
            <h2 style={s.h2}>Expiring in 7 Days ({expiring.length})</h2>
            {expiring.length === 0 && <p style={{ color: '#888', fontFamily: 'Arial, sans-serif', fontSize: 14 }}>No shops expiring soon.</p>}
            <div style={s.table}>
              {expiring.map(p => (
                <div key={p.id} style={{ ...s.row, borderLeft: '3px solid #e85d26' }}>
                  <span style={{ fontWeight: 600, fontFamily: 'Georgia, serif' }}>{p.name}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 13 }}>{p.pincode}</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#f44336', fontWeight: 700 }}>
                    {p.premium_expires ? new Date(p.premium_expires).toLocaleDateString('en-IN') : '--'}
                  </span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 13 }}>{p.premium_phone}</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <a href={'https://wa.me/' + (p.premium_phone || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('Hi, your Gully Premium listing for ' + p.name + ' expires on ' + (p.premium_expires ? new Date(p.premium_expires).toLocaleDateString('en-IN') : '') + '. Renew at mygully.in/premium?businessId=' + p.id)}
                      target="_blank" rel="noopener noreferrer"
                      style={{ ...s.actBtn, background: '#25D366', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                      WhatsApp
                    </a>
                    <button onClick={() => extendPremium(p.id)} style={{ ...s.actBtn, background: '#333' }}>Extend Free</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <h2 style={s.h2}>Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {Object.entries(events).map(([event, count]) => (
                <div key={event} style={{ background: '#1a1a1a', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid #2a2a2a' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#e85d26', fontFamily: 'Georgia, serif' }}>{count.toLocaleString()}</div>
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>{event.replace(/_/g, ' ')}</div>
                </div>
              ))}
              {Object.keys(events).length === 0 && <p style={{ color: '#888', fontFamily: 'Arial, sans-serif', fontSize: 14 }}>No analytics data yet. Events will appear as users visit the site.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' },
  layout: { display: 'flex', minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Georgia, serif' },
  sidebar: { width: 220, background: '#1a1a1a', borderRight: '1px solid #2a2a2a', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 4 },
  logo: { fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 2 },
  logoSub: { fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#e85d26', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 },
  nav: { marginTop: 32, display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { textAlign: 'left', padding: '10px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' },
  statBox: { marginTop: 'auto', borderTop: '1px solid #2a2a2a', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  stat: {},
  statN: { fontSize: 28, fontWeight: 900, color: '#e85d26', lineHeight: 1 },
  statL: { fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 },
  main: { flex: 1, padding: 40, overflowY: 'auto' },
  h2: { fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' },
  table: { background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a2a' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '14px 20px', borderBottom: '1px solid #2a2a2a', alignItems: 'center', gap: 8 },
  actBtn: { padding: '6px 10px', background: '#e85d26', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' },
  loginBox: { width: 340, padding: 40, background: '#1a1a1a', borderRadius: 12, textAlign: 'center' },
  input: { width: '100%', padding: '12px 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 15, fontFamily: 'Arial, sans-serif', marginBottom: 12, boxSizing: 'border-box' },
  btn: { width: '100%', padding: 14, background: '#e85d26', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' },
  msg: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#aaa', marginTop: 12 },
};
