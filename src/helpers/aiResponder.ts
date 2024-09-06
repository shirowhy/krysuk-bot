import axios from 'axios';
import fs from 'fs';
import { MessageContext } from 'vk-io';
import { getChatSettings } from '../config/config';

const MESSAGE_LOG_PATH = 'chat_messages.json';

const preprocessText = (text: string): string => {
  return text.trim();
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
        { role: 'system', content: 'Ты являешься участником чата, говорящим на русском языке. Твои ответы должны быть осмысленными, релевантными текущей беседе и максимально естественными. Всегда старайся поддерживать тему разговора и избегай шаблонных приветствий и вообще любых шаблонов. Подумайте о тоне и теме чата, например о Genshin Impact, Zenless Zone Zero, аниме, мемах и прочем. Но главное, просто отвечай в тему и по-живому, у тебя должна быть личность' },
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

  let chatContext = '';

  if (fs.existsSync(MESSAGE_LOG_PATH)) {
    const rawData = fs.readFileSync(MESSAGE_LOG_PATH, 'utf8');
    const messages = JSON.parse(rawData);
    chatContext = messages.map((msg: any) => `${msg.senderId}: ${msg.text}`).join('\n');
  }

  const aiResponse = await generateAIResponse(context.text?.trim() || '', chatContext);

  console.log('Generated AI response:', aiResponse);
  if (aiResponse) {
    await context.send(aiResponse);
  } else {
    console.log('AI did not generate a response.');
  }
};
