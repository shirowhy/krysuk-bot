import { VK } from 'vk-io';
import { config } from './config';
import { commands, Command } from './commands';
import { commandImages } from './commandImages';
import axios from 'axios';
import { PhotoAttachment } from 'vk-io';

const vk = new VK({
  token: config.token
});

const { updates } = vk;

updates.on('message_new', async (context) => {
  console.log('Received a new message...');

  if (context.isOutbox) {
    return;
  }

  const messageText = context.text?.trim();

  if (!messageText) {
    return;
  }

  const sendMessageWithAttachment = async (responseMessage: string, images: string[]) => {
    let attachment = '';
    if (images && images.length > 0) {
      const randomImageUrl = images[Math.floor(Math.random() * images.length)];

      try {
        const imageBuffer = (await axios.get(randomImageUrl, { responseType: 'arraybuffer' })).data;

        const photo = await vk.upload.messagePhoto({
          source: { value: imageBuffer, filename: 'image.jpg' }
        });

        if (photo instanceof PhotoAttachment) {
          attachment = `photo${photo.ownerId}_${photo.id}`;
          console.log(`Selected image ID: ${attachment}`);
        } else {
          console.error('Failed to get photo attachment');
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    await context.send({
      message: responseMessage,
      attachment: attachment
    });
  };

  if (context.isChat) {
    const parts = messageText.split(' ');
    const command = parts[0].toLowerCase() as Command;
    const targetUser = parts.slice(1).join(' ');

    if (command === 'шишка') {
      await context.send('шишка');
      return;
    }

    if (command in commands) {
      const initiatorInfo = await vk.api.users.get({ user_ids: [context.senderId.toString()] });
      const initiatorName = initiatorInfo[0].first_name;

      const responseMessage = `${initiatorName} ${commands[command]} ${targetUser}`;
      const images = commandImages[command];

      await sendMessageWithAttachment(responseMessage, images);
    }
  } else {
    const parts = messageText.split(' ');
    const command = parts[0].toLowerCase() as Command;
    const targetUser = parts.slice(1).join(' ');

    if (command in commands) {
      const initiatorInfo = await vk.api.users.get({ user_ids: [context.senderId.toString()] });
      const initiatorName = initiatorInfo[0].first_name;

      const responseMessage = `${initiatorName} ${commands[command]} ${targetUser}`;
      const images = commandImages[command];

      await sendMessageWithAttachment(responseMessage, images);
    }
  }
});

updates.start().then(() => {
  console.log('Bot started successfully!');
}).catch(console.error);
