import axios from 'axios';
import fs from 'fs';
import { MessageContext } from 'vk-io';
import { getChatSettings } from '../config/config';

const MESSAGE_LOG_PATH = 'chat_messages.json';

const generateAIResponse = async (messageText: string, chatContext: string): Promise<string | null> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key is not defined');
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        {
          role: 'user', content: `
          Below is the conversation context:
          ${chatContext}
          Respond to this message: "${messageText}"
          Your response should be unique, in the same style, but add your own twist. The answers may be ridiculous or cheeky, but not offensive.
        ` }
      ],
      max_tokens: 100,
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

  if (aiResponse) {
    await context.send(aiResponse);
  }
};
