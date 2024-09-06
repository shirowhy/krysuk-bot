import { db } from '../firebase';

interface ChatSettings {
  responseChance: number;
}

export const getMessagesCountFromFirestore = async (): Promise<number> => {
  try {
    const messagesRef = db.collection('messages');
    const snapshot = await messagesRef.get();
    return snapshot.size;
  } catch (error) {
    console.error('Error getting messages count from Firestore:', error);
    return 0;
  }
};

export const getChatSettings = async (chatId: number): Promise<ChatSettings> => {
  const settingsRef = db.collection('chat_settings').doc(chatId.toString());
  const docSnap = await settingsRef.get();

  if (docSnap.exists) {
    return docSnap.data() as ChatSettings;
  } else {
    return { responseChance: 30 };
  }
};

export const updateChatSettings = async (chatId: number, newSettings: Partial<ChatSettings>): Promise<void> => {
  const settingsRef = db.collection('chat_settings').doc(chatId.toString());

  const docSnap = await settingsRef.get();
  if (docSnap.exists) {
    const currentSettings = docSnap.data() as ChatSettings;
    const updatedSettings = { ...currentSettings, ...newSettings };
    await settingsRef.set(updatedSettings, { merge: true });
  } else {
    await settingsRef.set(newSettings);
  }
};
