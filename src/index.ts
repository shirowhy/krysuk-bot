import { VK } from 'vk-io';
import { config } from './config/config';
import { handleCommand } from './helpers/commandHandler';
import { handleAIResponse } from './helpers/aiResponder';
import { commands, Command } from './commands';
import { collectMessage } from './helpers/messageCollector';
import { saveMessageToFirestore } from './helpers/aiResponder';

const vk = new VK({
  token: config.token
});

const { updates } = vk;

updates.on('message_new', async (context) => {
  console.log('Received a new message...');

  collectMessage(context);
  await saveMessageToFirestore({
    text: context.text?.trim() || '',
    senderId: context.senderId,
    date: new Date().toISOString(),
  });

  if (context.isOutbox) {
    return;
  }

  const messageText = context.text?.trim().toLowerCase();

  if (!messageText) {
    return;
  }

  let command: Command | undefined;

  if (messageText.startsWith('установить шанс')) {
    command = 'установить шанс';
  } else if (messageText.startsWith('проверить шанс')) {
    command = 'проверить шанс';
  } else if (messageText.startsWith('глитч, че по интеллекту')) {
    command = 'глитч, че по интеллекту';
  } else {
    const parts = messageText.split(' ');
    if (parts.length >= 2) {
      const possibleCommand = parts.slice(0, 2).join(' ') as Command;
      if (possibleCommand in commands) {
        command = possibleCommand;
      } else {
        command = parts[0] as Command;
      }
    } else {
      command = parts[0] as Command;
    }
  }

  console.log('Detected command:', command);

  if (command && command in commands) {
    const targetUser = messageText.slice(command.length).trim();
    await handleCommand(context, vk, command, targetUser);
  } else {
    await handleAIResponse(context);
  }
});

updates.start().then(() => {
  console.log('Bot started successfully!');
}).catch(console.error);
