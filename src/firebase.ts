import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const raw = process.env.FIREBASE_CREDENTIALS;
if (!raw) {
  throw new Error('FIREBASE_CREDENTIALS is not set');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(raw);
  if (typeof serviceAccount !== 'object' || serviceAccount === null) {
    throw new Error('Parsed FIREBASE_CREDENTIALS is not an object');
  }
} catch (err: any) {
  console.error('Failed to parse FIREBASE_CREDENTIALS:', err.message);
  throw err;
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore(app);
export const collectionRef = db.collection('collection_name');
