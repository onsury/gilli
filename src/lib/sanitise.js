export function sanitiseText(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').replace(/[<>]/g, '').trim();
}
export function sanitisePhone(input, maxLength = 20) {
  if (!input || typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/[^\d\s+\-()]/g, '').trim();
}
export function sanitiseUrl(input, maxLength = 200) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.slice(0, maxLength).trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  if (/javascript:|data:/i.test(trimmed)) return '';
  return trimmed;
}
export function sanitiseShort(input, maxLength = 100) {
  return sanitiseText(input, maxLength);
}
export function sanitiseShopEdit(data) {
  const clean = {};
  if (data.owner_description !== undefined) clean.owner_description = sanitiseText(data.owner_description, 500);
  if (data.owner_hours !== undefined) clean.owner_hours = sanitiseShort(data.owner_hours, 100);
  if (data.owner_phone !== undefined) clean.owner_phone = sanitisePhone(data.owner_phone, 20);
  if (data.owner_whatsapp !== undefined) clean.owner_whatsapp = sanitisePhone(data.owner_whatsapp, 20);
  if (data.owner_website !== undefined) clean.owner_website = sanitiseUrl(data.owner_website, 200);
  if (data.owner_instagram !== undefined) clean.owner_instagram = sanitiseShort(data.owner_instagram, 60);
  return clean;
}
