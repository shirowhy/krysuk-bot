import { MessageContext } from 'vk-io';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const collectMessage = async (context: MessageContext) => {
  const message = {
    text: context.text?.trim(),
    senderId: context.senderId,
    date: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, "messages"), message);
    console.log("Message saved with ID: ", docRef.id);
  } catch (e) {
    console.error("Error saving message: ", e);
  }
};
