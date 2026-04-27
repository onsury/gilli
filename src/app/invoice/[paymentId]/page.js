import { adminDb } from '../../../lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { paymentId } = await params;
  return { title: 'Invoice ' + paymentId + ' -- Gully / Madraz Buzz Media' };
}

export default async function InvoicePage({ params }) {
  const { paymentId } = await params;
  const snap = await adminDb.collection('payments').where('paymentId', '==', paymentId).limit(1).get();
  if (snap.empty) notFound();
  const payment = snap.docs[0].data();
  const bizSnap = await adminDb.collection('businesses').doc(payment.businessId).get();
  const biz = bizSnap.exists ? bizSnap.data() : {};
  const invoiceNum = 'GULLY-' + new Date(payment.paidAt?.toDate?.() || Date.now()).getFullYear() + '-' + paymentId.slice(-6).toUpperCase();
  const paidDate = payment.paidAt?.toDate ? payment.paidAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const expiryDate = payment.expiresAt ? new Date(payment.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '--';
  const amount = (payment.amount || 49900) / 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f0; font-family: 'Inter', sans-serif; }
        .invoice-wrap { max-width: 780px; margin: 40px auto; background: #fff; box-shadow: 0 4px 40px rgba(0,0,0,0.08); }
        .no-print { background: #1a1a1a; padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; }
        .no-print a { color: #e85d26; font-size: 13px; text-decoration: none; font-family: 'Inter', sans-serif; }
        .no-print button { background: #e85d26; color: #fff; border: none; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 6px; font-family: 'Inter', sans-serif; }
        .invoice { padding: 52px 56px; }
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 52px; padding-bottom: 32px; border-bottom: 2px solid #1a1a1a; }
        .inv-brand-logo { font-family: 'Playfair Display', Georgia, serif; font-size: 40px; font-weight: 900; letter-spacing: -0.03em; color: #1a1a1a; line-height: 1; }
        .inv-brand-sub { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #e85d26; margin-top: 4px; }
        .inv-brand-url { font-size: 12px; color: #888; margin-top: 2px; }
        .inv-title-block { text-align: right; }
        .inv-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1a1a1a; }
        .inv-num { font-size: 13px; color: #e85d26; font-weight: 600; margin-top: 4px; letter-spacing: 0.05em; }
        .inv-date { font-size: 12px; color: #888; margin-top: 4px; }
        .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 48px; }
        .inv-party-label { font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }
        .inv-party-name { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
        .inv-party-detail { font-size: 13px; color: #555; line-height: 1.6; }
        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .inv-table th { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #888; padding: 10px 0; border-bottom: 1px solid #e0ddd8; text-align: left; }
        .inv-table th:last-child { text-align: right; }
        .inv-table td { padding: 16px 0; border-bottom: 1px solid #f0ede8; font-size: 14px; color: #1a1a1a; vertical-align: top; }
        .inv-table td:last-child { text-align: right; font-weight: 600; }
        .inv-item-desc { font-size: 12px; color: #888; margin-top: 3px; }
        .inv-totals { display: flex; justify-content: flex-end; margin-bottom: 48px; }
        .inv-totals-inner { width: 260px; }
        .inv-total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
        .inv-total-row.grand { border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #1a1a1a; font-family: 'Playfair Display', serif; }
        .inv-total-row.grand span:last-child { color: #e85d26; }
        .inv-status { display: flex; align-items: center; gap: 10px; background: #f0faf4; border: 1px solid #c3e6cb; border-radius: 8px; padding: 14px 20px; margin-bottom: 48px; }
        .inv-status-dot { width: 10px; height: 10px; background: #22863a; border-radius: 50%; flex-shrink: 0; }
        .inv-status-text { font-size: 13px; font-weight: 600; color: #22863a; }
        .inv-status-sub { font-size: 12px; color: #555; margin-left: auto; }
        .inv-payment-details { background: #faf9f6; border-radius: 8px; padding: 20px 24px; margin-bottom: 48px; }
        .inv-payment-label { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-bottom: 12px; }
        .inv-payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .inv-payment-item { display: flex; flex-direction: column; gap: 2px; }
        .inv-payment-key { font-size: 11px; color: #aaa; font-weight: 500; }
        .inv-payment-val { font-size: 13px; color: #1a1a1a; font-weight: 600; }
        .inv-footer { border-top: 1px solid #e0ddd8; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .inv-footer-note { font-size: 12px; color: #888; line-height: 1.6; max-width: 360px; }
        .inv-footer-brand { text-align: right; }
        .inv-footer-logo { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 900; color: #1a1a1a; }
        .inv-footer-url { font-size: 11px; color: #e85d26; margin-top: 2px; }
        @media print {
          body { background: #fff; }
          .no-print { display: none; }
          .invoice-wrap { box-shadow: none; margin: 0; max-width: 100%; }
          .invoice { padding: 32px 40px; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
      <div className="invoice-wrap">
        <div className="no-print">
          <Link href="/dashboard">Back to Dashboard</Link>
          <button id="print-btn">Download PDF</button>
          <script dangerouslySetInnerHTML={{ __html: "document.getElementById('print-btn').onclick = () => window.print();" }} />
        </div>
        <div className="invoice">
          <div className="inv-header">
            <div>
              <div className="inv-brand-logo">Gully</div>
              <div className="inv-brand-sub">Madraz Buzz Media</div>
              <div className="inv-brand-url">mygully.in</div>
            </div>
            <div className="inv-title-block">
              <div className="inv-title">Tax Invoice</div>
              <div className="inv-num">{invoiceNum}</div>
              <div className="inv-date">Date: {paidDate}</div>
            </div>
          </div>
          <div className="inv-parties">
            <div>
              <div className="inv-party-label">From</div>
              <div className="inv-party-name">Madraz Buzz Media</div>
              <div className="inv-party-detail">mygully.in<br />Chennai, Tamil Nadu, India<br />hello@mygully.in</div>
            </div>
            <div>
              <div className="inv-party-label">Bill To</div>
              <div className="inv-party-name">{biz.name || 'Shop Owner'}</div>
              <div className="inv-party-detail">
                {biz.address || ''}<br />
                {payment.phone || ''}<br />
                {biz.city || ''}{biz.pincode ? ' - ' + biz.pincode : ''}
              </div>
            </div>
          </div>
          <div className="inv-status">
            <div className="inv-status-dot" />
            <div className="inv-status-text">Payment Received</div>
            <div className="inv-status-sub">Payment ID: {payment.paymentId}</div>
          </div>
          <table className="inv-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Period</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Gully Premium Listing
                  <div className="inv-item-desc">Priority placement - WhatsApp button - Verified badge - {biz.pincode}</div>
                </td>
                <td>{paidDate}<br /><span style={{fontSize: 12, color: '#888'}}>to {expiryDate}</span></td>
                <td>Rs. {amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="inv-totals">
            <div className="inv-totals-inner">
              <div className="inv-total-row"><span>Subtotal</span><span>Rs. {amount.toFixed(2)}</span></div>
              <div className="inv-total-row"><span>GST (0% -- below threshold)</span><span>Rs. 0.00</span></div>
              <div className="inv-total-row grand"><span>Total Paid</span><span>Rs. {amount.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="inv-payment-details">
            <div className="inv-payment-label">Payment Details</div>
            <div className="inv-payment-grid">
              <div className="inv-payment-item"><span className="inv-payment-key">Payment ID</span><span className="inv-payment-val">{payment.paymentId}</span></div>
              <div className="inv-payment-item"><span className="inv-payment-key">Order ID</span><span className="inv-payment-val">{payment.orderId}</span></div>
              <div className="inv-payment-item"><span className="inv-payment-key">Method</span><span className="inv-payment-val">Razorpay</span></div>
              <div className="inv-payment-item"><span className="inv-payment-key">Valid Until</span><span className="inv-payment-val">{expiryDate}</span></div>
            </div>
          </div>
          <div className="inv-footer">
            <div className="inv-footer-note">This is a computer-generated invoice and does not require a signature.<br />For queries: hello@mygully.in</div>
            <div className="inv-footer-brand">
              <div className="inv-footer-logo">Gully</div>
              <div className="inv-footer-url">mygully.in</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
