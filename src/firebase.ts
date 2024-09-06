import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './krysuk-bot-425703e66f81.json';

const app = initializeApp({
  credential: cert(serviceAccount as any)
});

export const db = getFirestore(app);

export const collectionRef = db.collection('collection_name');
