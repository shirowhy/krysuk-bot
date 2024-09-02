import { VK } from 'vk-io';
import { config } from './config';
import { commands, handleCommand, Command } from './commands';

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

    if (command in commands) {
      const initiatorInfo = await vk.api.users.get({ user_ids: [context.senderId.toString()] });
      const initiatorName = initiatorInfo[0].first_name;

      const responseMessage = `${initiatorName} ${commands[command]} ${targetUser}`;

      await context.send(responseMessage);
    }
  } else {
    const parts = messageText.split(' ');
    const command = parts[0].toLowerCase() as Command;
    const targetUser = parts.slice(1).join(' ');

    if (command in commands) {
      const initiatorInfo = await vk.api.users.get({ user_ids: [context.senderId.toString()] });
      const initiatorName = initiatorInfo[0].first_name;

      const responseMessage = `${initiatorName} ${commands[command]} ${targetUser}`;

      await context.send(responseMessage);
    }
  }
});

updates.start().then(() => {
  console.log('Bot started successfully!');
}).catch(console.error);
