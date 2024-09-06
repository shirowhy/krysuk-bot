import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

interface ChatSettings {
  responseChance: number;
}

export const getMessagesCountFromFirestore = async (): Promise<number> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'messages'));
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting messages count from Firestore:', error);
    return 0;
  }
};

export const getChatSettings = async (chatId: number): Promise<ChatSettings> => {
  const settingsRef = doc(db, 'chat_settings', chatId.toString());
  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return docSnap.data() as ChatSettings;
  } else {
    return { responseChance: 30 };
  }
};

export const updateChatSettings = async (chatId: number, newSettings: Partial<ChatSettings>): Promise<void> => {
  const settingsRef = doc(db, 'chat_settings', chatId.toString());

  const docSnap = await getDoc(settingsRef);
  if (docSnap.exists()) {
    const currentSettings = docSnap.data() as ChatSettings;
    const updatedSettings = { ...currentSettings, ...newSettings };
    await setDoc(settingsRef, updatedSettings);
  } else {
    await setDoc(settingsRef, newSettings);
  }
};