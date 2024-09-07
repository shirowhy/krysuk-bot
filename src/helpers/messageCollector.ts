import { MessageContext } from 'vk-io';
import { db } from '../firebase';

export const collectMessage = async (context: MessageContext) => {
  const message = {
    text: context.text?.trim(),
    senderId: context.senderId,
    date: new Date().toISOString(),
  };

  try {
    const docRef = await db.collection('messages').add(message);
    console.log('Message saved with ID:', docRef.id);
  } catch (e) {
    console.error('Error saving message:', e as Error);
    const error = e as Error;
    if (error.message.includes('NOT_FOUND')) {
      console.error('Resource not found. Please ensure that the Firestore collection exists.');
    }
  }
};