import axios from 'axios';
import fs from 'fs';
import { MessageContext } from 'vk-io';
import { getChatSettings } from '../config/config';

const MESSAGE_LOG_PATH = 'chat_messages.json';

const generateAIResponse = async (messageText: string, chatContext: string): Promise<string | null> => {
  try {
    const prompt = `
      You are a bot that participates in a chat. Below is the conversation context:
      ${chatContext}
      Respond to this message: "${messageText}"
      Your response should be unique, in the same style, but add your own twist.
    `;

    const response = await axios.post('https://api.openai.com/v1/completions', {
      prompt,
      model: 'text-davinci-003',
      max_tokens: 100,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Failed to generate AI response:', error);
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
    return; // Шанс не сработал, бот не отвечает
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