import { createCanvas, loadImage } from 'canvas';
import { MessageContext } from 'vk-io';
import { memeTemplates } from '../memeTemplates';
import { getMessagesFromFirestore } from './aiResponder';

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

    if (!memeText) {
      await context.send('Не удалось сгенерировать текст для мема.');
      return;
    }

    const randomTemplate = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];

    const image = await loadImage(randomTemplate);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, image.width, image.height);

    ctx.font = '32px sans-serif';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    const textX = 20;
    const textY = image.height - 40;
    ctx.strokeText(memeText, textX, textY);
    ctx.fillText(memeText, textX, textY);

    const buffer = canvas.toBuffer('image/jpeg');
    const photo = await context.uploadPhoto({
      source: buffer,
      filename: 'meme.jpg',
    });

    await context.send({
      attachment: `photo${photo.ownerId}_${photo.id}`,
    });
  } catch (error) {
    console.error('Failed to generate meme:', error);
    await context.send('Произошла ошибка при генерации мема.');
  }
};
