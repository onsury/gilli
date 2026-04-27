'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { clientDb as db, clientApp } from '../../../lib/firebase-client';
import { recordClaim } from '../../../lib/claims';

export default function ClaimPage() {
  const { businessId } = useParams();
  const router = useRouter();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [status, setStatus] = useState('');

  const recaptchaRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'businesses', businessId));
        if (!snap.exists()) {
          setError('Shop not found');
          setLoading(false);
          return;
        }
        const data = snap.data();
        setBusiness({ id: snap.id, ...data });
        if (data.claimed) {
          setError('This shop has already been claimed. If this is your shop and you need to update your claim, please email hello@mygully.in.');
        }
        setLoading(false);
      } catch (e) {
        setError('Error loading shop: ' + e.message);
        setLoading(false);
      }
    }
    load();
  }, [businessId]);

  // Recaptcha initialized inline in sendOtp for proper timing

  async function sendOtp() {
    setStatus('');
    if (!phone || phone.length < 10) {
      setStatus('Please enter a valid phone number with country code (e.g., +919876543210)');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('+') ? phone.replace(/\s/g, '') : '+91' + digits;
    setSendingOtp(true);
    try {
      const auth = getAuth(clientApp);
      // Clear any stale verifier
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
      // Create fresh verifier
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
      recaptchaRef.current = verifier;
      await verifier.render();
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(result);
      setStep('otp');
      setStatus('OTP sent to ' + fullPhone);
    } catch (e) {
      console.error('OTP send error:', e);
      setStatus('Could not send OTP: ' + (e.message || e.code || 'Unknown error'));
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    setStatus('');
    if (!otp || otp.length < 6) {
      setStatus('Please enter the 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      await confirmationResult.confirm(otp);
      const fullPhone = phone.startsWith('+') ? phone : '+91' + phone.replace(/\D/g, '');
      await recordClaim(businessId, fullPhone, ownerName);
      setStep('done');
      setStatus('Shop claimed! Redirecting to edit dashboard...');
      setTimeout(() => {
        router.push('/claim/dashboard?business=' + businessId + '&phone=' + encodeURIComponent(fullPhone));
      }, 1500);
    } catch (e) {
      setStatus('OTP incorrect or expired: ' + (e.message || e.code));
    } finally {
      setVerifyingOtp(false);
    }
  }

  if (loading) {
    return <div style={s.page}><div style={s.container}><p>Loading...</p></div></div>;
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <header style={s.header}>
            <Link href="/" style={s.homeLink}>← Gully</Link>
            <h1 style={s.title}>Claim your shop</h1>
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
          <h1 style={s.title}>Claim your shop</h1>
          <p style={s.subtitle}>You&apos;re claiming <strong>{business.name}</strong> in {business.pincode}</p>
        </header>

        {step === 'phone' && (
          <div style={s.formBox}>
            <label style={s.label}>Your name (shop owner)</label>
            <input
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="e.g., Ramesh Kumar"
              style={s.input}
            />

            <label style={s.label}>Your mobile number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g., 9876543210 or +919876543210"
              style={s.input}
              type="tel"
            />
            <p style={s.helper}>We&apos;ll send a 6-digit OTP via SMS to verify you own this shop.</p>

            <div id="recaptcha-container"></div>

            <button
              onClick={sendOtp}
              disabled={sendingOtp || !phone || !ownerName}
              style={(sendingOtp || !phone || !ownerName) ? s.btnDisabled : s.btnPrimary}
            >
              {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>

            {status && <p style={s.status}>{status}</p>}
          </div>
        )}

        {step === 'otp' && (
          <div style={s.formBox}>
            <p style={{ marginBottom: 16, color: '#555' }}>
              Enter the 6-digit code sent to {phone}
            </p>
            <label style={s.label}>OTP</label>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              style={s.input}
              maxLength={6}
            />
            <button
              onClick={verifyOtp}
              disabled={verifyingOtp || otp.length < 6}
              style={(verifyingOtp || otp.length < 6) ? s.btnDisabled : s.btnPrimary}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify & claim shop'}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setStatus(''); }} style={s.btnSecondary}>
              ← Change number
            </button>
            {status && <p style={s.status}>{status}</p>}
          </div>
        )}

        {step === 'done' && (
          <div style={s.formBox}>
            <h2 style={{ color: '#22863a' }}>✓ Shop claimed!</h2>
            <p>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#1a1a1a' },
  container: { maxWidth: 560, margin: '0 auto', padding: '40px 20px 60px' },
  header: { borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 28 },
  homeLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 12 },
  title: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 14, color: '#666', margin: '8px 0 0' },
  formBox: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, margin: '12px 0 6px', color: '#333' },
  input: { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' },
  helper: { fontSize: 11, color: '#888', margin: '4px 0 12px' },
  btnPrimary: { marginTop: 16, width: '100%', padding: 12, fontSize: 15, fontWeight: 700, background: '#e85d26', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnDisabled: { marginTop: 16, width: '100%', padding: 12, fontSize: 15, fontWeight: 700, background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, cursor: 'not-allowed' },
  btnSecondary: { marginTop: 10, width: '100%', padding: 10, fontSize: 13, background: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block', boxSizing: 'border-box' },
  status: { marginTop: 14, padding: 10, fontSize: 13, background: '#fff8f0', borderRadius: 6 },
  errorBox: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, textAlign: 'center' },
};
