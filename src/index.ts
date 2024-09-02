import { VK } from 'vk-io';
import { config } from './config';
import { commands, Command } from './commands';
import { commandImages } from './commandImages';

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
      let attachment = '';
      if (images && images.length > 0) {
        const randomImage = images[Math.floor(Math.random() * images.length)];
        attachment = randomImage;
      }

      await context.send({
        message: responseMessage,
        attachment: attachment
      });
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
      let attachment = '';
      if (images && images.length > 0) {
        const randomImage = images[Math.floor(Math.random() * images.length)];
        attachment = randomImage;
      }

      await context.send({
        message: responseMessage,
        attachment: attachment
      });
    }
  }
});

updates.start().then(() => {
  console.log('Bot started successfully!');
}).catch(console.error);
