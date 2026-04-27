import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { clientDb } from './firebase-client';

function getSessionId() {
  try {
    let sid = sessionStorage.getItem('gully_sid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('gully_sid', sid);
    }
    return sid;
  } catch (e) {
    return 'unknown';
  }
}

async function track(event, data = {}) {
  try {
    await addDoc(collection(clientDb, 'analytics_events'), {
      event,
      ...data,
      session: getSessionId(),
      timestamp: serverTimestamp(),
      ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : '',
    });
  } catch (e) {
    // Silently fail
  }
}

export const analytics = {
  pincodeView: (pincode, city) =>
    track('pincode_view', { pincode, city: city || 'unknown' }),
  shopView: (businessId, pincode, city, name) =>
    track('shop_view', { businessId, pincode, city: city || 'unknown', name: name || '' }),
  whatsappClick: (businessId, pincode, city) =>
    track('whatsapp_click', { businessId, pincode, city: city || 'unknown' }),
  callClick: (businessId, pincode, city) =>
    track('call_click', { businessId, pincode, city: city || 'unknown' }),
  shareClick: (businessId, pincode, city) =>
    track('share_click', { businessId, pincode, city: city || 'unknown' }),
  nominateClick: (pincode) =>
    track('nominate_click', { pincode }),
  claimClick: (businessId, pincode) =>
    track('claim_click', { businessId, pincode }),
  premiumClick: (businessId, pincode) =>
    track('premium_click', { businessId, pincode }),
};
