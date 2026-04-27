import crypto from 'crypto';
const SECRET = process.env.INVOICE_TOKEN_SECRET || 'gully-invoice-secret-change-me';
export function generateInvoiceToken(paymentId) {
  return crypto.createHmac('sha256', SECRET).update(paymentId).digest('hex').slice(0, 16);
}
export function verifyInvoiceToken(paymentId, token) {
  if (!token || !paymentId) return false;
  const expected = generateInvoiceToken(paymentId);
  const a = Buffer.from(expected.padEnd(64, '0'));
  const b = Buffer.from(token.padEnd(64, '0').slice(0, 64));
  try {
    return crypto.timingSafeEqual(a, b) && token === expected;
  } catch { return false; }
}
export function invoiceUrl(paymentId) {
  const token = generateInvoiceToken(paymentId);
  return 'https://mygully.in/invoice/' + paymentId + '?t=' + token;
}
