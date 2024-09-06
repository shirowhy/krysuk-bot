import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const getMessagesCountFromFirestore = async (): Promise<number> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'messages'));
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting messages count from Firestore:', error);
    return 0;
  }
};