import admin from 'firebase-admin';
 
let _adminDb = null;
 
function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FB_ADMIN_PROJECT_ID,
        clientEmail: process.env.FB_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FB_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
}
 
export const adminDb = new Proxy({}, {
  get(_, prop) {
    if (!_adminDb) _adminDb = getAdmin().firestore();
    return _adminDb[prop];
  }
});
 
export default { get app() { return getAdmin(); } };
 
