const { execSync } = require('child_process');

function getSecret(name) {
  return execSync(`gcloud secrets versions access latest --secret=${name} --project=gilli-app`, { encoding: 'utf8' });
}

process.env.FB_ADMIN_PROJECT_ID = getSecret('GILLI_PROJECT_ID').trim();
process.env.FB_ADMIN_CLIENT_EMAIL = getSecret('GILLI_CLIENT_EMAIL').trim();
process.env.FB_ADMIN_PRIVATE_KEY = getSecret('FIREBASE_PRIVATE_KEY');

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FB_ADMIN_PROJECT_ID,
    clientEmail: process.env.FB_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FB_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = admin.firestore();

(async () => {
  const snap = await db.collection('businesses').count().get();
  console.log('TOTAL businesses:', snap.data().count);
  console.log('');
  console.log('Distribution across key pincodes:');
  const pincodes = ['600001','600002','600004','600017','600018','600020','600024','600028','600031','600034','600040','600041','600042','600050','600083','600119'];
  for (const pc of pincodes) {
    const q = await db.collection('businesses').where('pincode','==',pc).count().get();
    console.log(`  ${pc}: ${q.data().count}`);
  }
  process.exit(0);
})();
