import { VK } from 'vk-io';
import { config, updateChatSettings } from './config/config';
import { handleCommand } from './helpers/commandHandler';
import { handleAIResponse } from './helpers/aiResponder';
import { commands, Command } from './commands';
import { collectMessage } from './helpers/messageCollector';

const vk = new VK({
  token: config.token
});

const { updates } = vk;

updates.on('message_new', async (context) => {
  collectMessage(context);
  console.log('Received a new message...');

  if (context.isOutbox) {
    return;
  }

  const messageText = context.text?.trim();

  if (!messageText) {
    return;
  }

  if (messageText.startsWith('!setChance')) {
    const parts = messageText.split(' ');
    const newChance = parseInt(parts[1], 10);

    if (!isNaN(newChance) && newChance >= 0 && newChance <= 100) {
      updateChatSettings(context.chatId!, { responseChance: newChance });
      await context.send(`Шанс ответа установлен на ${newChance}%`);
    } else {
      await context.send('Пожалуйста, укажите корректный шанс (от 0 до 100).');
    }
    return;
  }

  const parts = messageText.toLowerCase().split(' ');
  let command: Command | undefined;

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

  if (command && command in commands) {
    const targetUser = parts.slice(command.split(' ').length).join(' ');
    await handleCommand(context, vk, command, targetUser);
  } else {
    await handleAIResponse(context);
  }
});

updates.start().then(() => {
  console.log('Bot started successfully!');
}).catch(console.error);
