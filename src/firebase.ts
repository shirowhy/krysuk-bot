import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const raw = process.env.FIREBASE_CREDENTIALS;
if (!raw) {
  throw new Error('FIREBASE_CREDENTIALS is not set');
}

const serviceAccount = JSON.parse(raw);

const app = initializeApp({
  credential: cert(serviceAccount as any)
});

export const db = getFirestore(app);

export const collectionRef = db.collection('collection_name');
