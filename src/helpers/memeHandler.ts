import sharp from 'sharp';
import { MessageContext, PhotoAttachment, VK } from 'vk-io';
import { getMessagesFromFirestore } from './aiResponder';
import { memeTemplates } from '../memeTemplates';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

export const handleMemeCommand = async (context: MessageContext, vk: VK) => {
  try {
    const chatId = context.chatId?.toString();
    if (!chatId) {
      console.warn('Chat ID is undefined, skipping meme generation.');
      return;
    }

    const messages = await getMessagesFromFirestore(chatId, 10);
    const randomMessages = messages.map(msg => msg.text);
    console.log('Random messages for meme:', randomMessages);
    const memeText = randomMessages.join(' ').substring(0, 50);

    const randomTemplate = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];

    const imageBuffer = await sharp(randomTemplate).toBuffer();
    const image = await loadImage(imageBuffer);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0);

    ctx.font = '32px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillText(memeText, canvas.width / 2, 10, canvas.width - 20);

    const outputFileName = `${uuidv4()}.jpg`;
    const outputPath = path.resolve('/tmp', outputFileName);
    const outputBuffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(outputPath, outputBuffer);

    const photo = await vk.upload.messagePhoto({
      source: {
        value: fs.createReadStream(outputPath),
        filename: 'meme.jpg'
      }
    });

    fs.unlinkSync(outputPath);

    if (!photo || !(photo instanceof PhotoAttachment)) {
      console.error('Failed to upload photo or incorrect photo type received.');
      await context.send('Произошла ошибка при загрузке изображения.');
      return;
    }

    const attachment = `photo${photo.ownerId}_${photo.id}`;
    await context.send({
      message: 'Вот твой мем!',
      attachment: attachment
    });

  } catch (error) {
    console.error('Failed to generate meme:', error);
    await context.send('Произошла ошибка при генерации мема.');
  }
};