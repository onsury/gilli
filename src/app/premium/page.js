'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
 
function PremiumContent() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);
  const params = useSearchParams();
  const router = useRouter();
  const businessId = params.get('businessId');
  const shopName = params.get('name') || 'Your Shop';
  const phone = params.get('phone') || '';
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
 
  useEffect(() => {
    if (!businessId) router.push('/');
  }, [businessId, router]);
 
  async function handlePayment() {
    setLoading(true);
    setStatus('Creating order...');
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
 
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Gully -- mygully.in',
        description: 'Premium listing -- ' + shopName,
        order_id: data.orderId,
        handler: async function(response) {
          setStatus('Verifying payment...');
          const verify = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              businessId,
              phone,
            }),
          });
          const result = await verify.json();
          if (result.success) {
            const invUrl = result.invoiceUrl || '';
            setStatus('Payment successful! Your shop is now premium.' + (invUrl ? ' Invoice: ' + invUrl : ''));
            if (invUrl) {
              setTimeout(() => window.open(invUrl, '_blank'), 1000);
            }
            setTimeout(() => router.push('/shop/' + businessId), 3000);
          } else {
            setStatus('Verification failed. Contact hello@mygully.in');
          }
          setLoading(false);
        },
        prefill: { contact: phone },
        theme: { color: '#e85d26' },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setStatus('Payment cancelled.');
          }
        }
      };
 
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setStatus('Error: ' + e.message);
      setLoading(false);
    }
  }
 
  return (
    <div style={s.page}>
      <div style={s.container}>
        <Link href="/" style={s.back}>Gully</Link>
        <div style={s.card}>
          <div style={s.badge}>PREMIUM</div>
          <h1 style={s.title}>{shopName}</h1>
          <p style={s.subtitle}>Upgrade to Gully Premium</p>
          <div style={s.features}>
            <div style={s.feature}>WhatsApp button on your listing</div>
            <div style={s.feature}>Verified owner badge</div>
            <div style={s.feature}>Priority placement in pincode</div>
            <div style={s.feature}>Editable hours and description</div>
            <div style={s.feature}>30-day listing -- renew anytime</div>
          </div>
          <div style={s.price}>
            <span style={s.amount}>Rs.499</span>
            <span style={s.period}> / month</span>
          </div>
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{ ...s.payBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Processing...' : 'Pay Rs.499 -- Go Premium'}
          </button>
          {status && <p style={s.status}>{status}</p>}
          <p style={s.note}>Secure payment via Razorpay. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
 
export default function PremiumPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <PremiumContent />
    </Suspense>
  );
}
 
const s = {
  page: { minHeight: '100vh', background: '#faf9f6', fontFamily: 'Georgia, serif' },
  container: { maxWidth: 480, margin: '0 auto', padding: '40px 20px' },
  back: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 24 },
  card: { background: '#fff', border: '2px solid #1a1a1a', borderRadius: 12, padding: 32, textAlign: 'center' },
  badge: { display: 'inline-block', fontFamily: 'Arial, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#e85d26', border: '1px solid #e85d26', padding: '4px 12px', borderRadius: 20, marginBottom: 16 },
  title: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 24, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#666', margin: '0 0 28px' },
  features: { textAlign: 'left', marginBottom: 28, background: '#faf9f6', borderRadius: 8, padding: '16px 20px' },
  feature: { fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#333', padding: '6px 0', borderBottom: '1px solid #f0f0f0' },
  price: { marginBottom: 24 },
  amount: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 48, fontWeight: 900, color: '#1a1a1a' },
  period: { fontFamily: 'Arial, sans-serif', fontSize: 16, color: '#888' },
  payBtn: { display: 'block', width: '100%', padding: '16px', background: '#e85d26', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Arial, sans-serif', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16 },
  status: { fontFamily: 'Arial, sans-serif', fontSize: 14, color: '#333', padding: '12px', background: '#fff8f0', borderRadius: 8, margin: '0 0 16px' },
  note: { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#aaa', margin: 0 },
};
 