import { VK } from 'vk-io';
import { config, getChatSettings, saveChatSettings } from './config/config';
import { handleCommand } from './helpers/commandHandler';
import { handleAIResponse } from './helpers/aiResponder';
import { commands, Command } from './commands';
import { collectMessage } from './helpers/messageCollector';

const vk = new VK({
  token: config.token
});

const { updates } = vk;

updates.on('message_new', async (context) => {
  console.log('Received a new message...');
  collectMessage(context);

  if (context.isOutbox) {
    return;
  }

  const messageText = context.text?.trim();

  if (!messageText) {
    return;
  }

  const parts = messageText.toLowerCase().split(' ');

  if (parts[0] === 'установить' && parts[1] === 'шанс' && parts[2]) {
    const newChance = parseInt(parts[2], 10);

    if (!isNaN(newChance) && newChance >= 0 && newChance <= 100) {
      const chatId = context.chatId;
      if (chatId) {
        const chatSettings = getChatSettings(chatId);
        chatSettings.responseChance = newChance;
        saveChatSettings(chatId, chatSettings);

        await context.send(`Шанс ответа установлен на ${newChance}%`);
      } else {
        await context.send('Ошибка: не удалось определить ID чата.');
      }
    } else {
      await context.send('Ошибка: укажите валидное значение шанса (от 0 до 100).');
    }
    return;
  }

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
