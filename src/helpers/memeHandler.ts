import axios from 'axios';
import { MessageContext } from 'vk-io';
import { getMessagesFromFirestore } from './aiResponder';
import { memeTemplates } from '../memeTemplates';

export const handleMemeCommand = async (context: MessageContext) => {
  try {
    const chatId = context.chatId?.toString();
    if (!chatId) {
      console.warn('Chat ID is undefined, skipping meme generation.');
      return;
    }

    const messages = await getMessagesFromFirestore(chatId, 10);
    const randomMessages = messages.map(msg => msg.text);
    const memeText = randomMessages.join(' ').substring(0, 100);

    const randomTemplate = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];

    let memeUrl;
    if (randomTemplate.startsWith('http')) {
      memeUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(memeText)}.jpg?background=${encodeURIComponent(randomTemplate)}`;
    } else {
      memeUrl = `https://api.memegen.link/images/${randomTemplate}/${encodeURIComponent(memeText)}.jpg`;
    }

    const response = await axios.get(memeUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    const photo = await context.uploadPhoto({
      source: imageBuffer,
      filename: 'meme.jpg',
    });

    await context.send({
      message: 'Вот ваш мем!',
      attachment: `photo${photo.ownerId}_${photo.id}`
    });

  } catch (error) {
    console.error('Failed to generate meme:', error);
    await context.send('Произошла ошибка при генерации мема.');
  }
};