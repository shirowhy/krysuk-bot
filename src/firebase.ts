import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const raw = process.env.FIREBASE_CREDENTIALS;
if (!raw) {
  throw new Error('Missing FIREBASE_CREDENTIALS');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error('Failed to parse FIREBASE_CREDENTIALS:', err);
  throw err;
}

const app = initializeApp({
  credential: cert(serviceAccount as any)
});

export const db = getFirestore(app);
export const collectionRef = db.collection('collection_name');
