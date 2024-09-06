import axios from 'axios';
import { MessageContext } from 'vk-io';
import { getChatSettings } from '../config/config';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';

interface Message {
  text: string;
  senderId: number;
  date: string;
}

const preprocessText = (text: string): string => {
  return text.trim();
};

export const saveMessageToFirestore = async (messageData: any) => {
  try {
    const docRef = await addDoc(collection(db, "messages"), messageData);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getMessagesFromFirestore = async (limitNumber: number = 10): Promise<Message[]> => {
  const messages: Message[] = [];
  try {
    const q = query(collection(db, "messages"), orderBy("date", "desc"), limit(limitNumber));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      messages.push(doc.data() as Message);
    });
  } catch (e) {
    console.error("Error getting messages: ", e);
  }
  return messages;
};

const generateAIResponse = async (messageText: string, chatContext: string): Promise<string | null> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key is not defined');
    }

    const preprocessedText = preprocessText(messageText);

    if (!preprocessedText) {
      return null;
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'Ты являешься участником чата, говорящим на русском языке. Тебя зовут Глитч или Крысюк. Могут называть просто крыс, это тоже будет про тебя. Твои ответы должны быть осмысленными, релевантными текущей беседе и максимально естественными. Всегда старайся поддерживать тему разговора и избегай шаблонных приветствий и вообще любых шаблонов, вообще не пиши "Привет"! Подумайте о тоне и теме чата, у тебя должна быть относительно дерзкая и смелая личность' },
        { role: 'user', content: chatContext },
        { role: 'user', content: preprocessedText },
      ],
      max_tokens: 100,
      temperature: 0.5,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to generate AI response:', error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error('Failed to generate AI response:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    return null;
  }
};

export const handleAIResponse = async (context: MessageContext) => {
  const chatId = context.chatId;
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping AI response.');
    return;
  }

  const chatSettings = getChatSettings(chatId);
  const responseChance = chatSettings.responseChance || 30;
  const randomValue = Math.random() * 100;

  if (randomValue > responseChance) {
    return;
  }

  const previousMessages = await getMessagesFromFirestore(15);
  const chatContext = previousMessages.map(msg => `${msg.senderId}: ${msg.text}`).join('\n');

  const aiResponse = await generateAIResponse(context.text?.trim() || '', chatContext);

  console.log('Generated AI response:', aiResponse);
  if (aiResponse) {
    await context.send(aiResponse);
  } else {
    console.log('AI did not generate a response.');
  }

  await saveMessageToFirestore({
    text: context.text?.trim(),
    senderId: context.senderId,
    date: new Date().toISOString(),
  });
};
