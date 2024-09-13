const Jimp = require('jimp');
import { MessageContext, PhotoAttachment, VK } from 'vk-io';
import { getMessagesFromFirestore } from './aiResponder';
import { memeTemplates } from '../memeTemplates';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

console.log(Jimp);

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

    const image = await Jimp.read(randomTemplate);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

    image.print(
      font,
      10, // X coordinate
      10, // Y coordinate
      {
        text: memeText,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      },
      image.bitmap.width - 20, // Max width of the text area
      image.bitmap.height // Max height of the text area
    );

    const outputFileName = `${uuidv4()}.jpg`;
    const outputPath = path.resolve('/tmp', outputFileName);
    await image.writeAsync(outputPath);

    const photo = await vk.upload.messagePhoto({
      source: {
        value: fs.createReadStream(outputPath),
        filename: 'meme.jpg'
      }
    });

    fs.unlinkSync(outputPath); // Deleting file after sending

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
