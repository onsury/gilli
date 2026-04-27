export function isMobile(phone) {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!trimmed || trimmed === '-' || trimmed === '--') return false;
  const digits = trimmed.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('91') && local.length === 12) local = local.slice(2);
  if (local.startsWith('0') && local.length === 11) local = local.slice(1);
  return /^[6-9]\d{9}$/.test(local);
}

export function getContactPhone(shop) {
  const candidates = [shop.owner_phone, shop.phone, shop.mobile, shop.tel];
  return candidates.find(p => p && p.trim() && p.trim() !== '-' && p.trim() !== '--') || '';
}

export function getWhatsAppNumber(shop) {
  if (shop.owner_whatsapp) return shop.owner_whatsapp;
  const phone = getContactPhone(shop);
  return isMobile(phone) ? phone : '';
}

export function formatForTel(phone) {
  if (!phone) return '';
  return phone.replace(/\s/g, '');
}

export function formatForWhatsApp(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return '91' + local.slice(-10);
}

export function shopWhatsAppUrl(phone, shopName) {
  const formatted = formatForWhatsApp(phone);
  const msg = encodeURIComponent('Hi, I found ' + shopName + ' on mygully.in and would like to enquire.');
  return 'https://wa.me/' + formatted + '?text=' + msg;
}

export function shopShareUrl(shopId, shopName) {
  const text = encodeURIComponent('Check out ' + shopName + ' on Gully -- https://mygully.in/shop/' + shopId);
  return 'https://wa.me/?text=' + text;
}
