import { MessageContext } from 'vk-io';
const Jimp = require('jimp');
import { memeTemplates } from '../memeTemplates';
import { getMessagesFromFirestore } from './aiResponder';

export const handleMemeCommand = async (context: MessageContext) => {
  const chatId = context.chatId?.toString();
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping meme generation.');
    return;
  }

  try {
    const messages = await getMessagesFromFirestore(chatId, 10);

    const randomMessages = messages.map((msg) => msg.text);
    const memeText = randomMessages.join(' ').substring(0, 100);

    if (!memeText) {
      await context.send('Не удалось сгенерировать текст для мема.');
      return;
    }

    const randomTemplate = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];

    const image = await Jimp.read(randomTemplate);

    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

    const textWidth = image.bitmap.width - 40;
    const textHeight = Jimp.measureTextHeight(font, memeText, textWidth);

    image.print(
      font,
      20,
      image.bitmap.height - textHeight - 20,
      {
        text: memeText,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      },
      textWidth,
      textHeight
    );

    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    const photo = await context.uploadPhoto({
      source: buffer,
      filename: 'meme.png',
    });

    await context.send({
      attachment: `photo${photo.ownerId}_${photo.id}`
    });
  } catch (error) {
    console.error('Failed to generate meme:', error);
    await context.send('Произошла ошибка при генерации мема.');
  }
};
