import { VK } from 'vk-io';
import { config } from './config/config';
import { handleCommand } from './helpers/commandHandler';
import { handleAIResponse } from './helpers/aiResponder';
import { commands, Command } from './commands';
import { collectMessage } from './helpers/messageCollector';
import { fandomMapping, handleIdentityCommand } from './helpers/identityHandler';

const vk = new VK({
  token: config.token
});

const { updates } = vk;

updates.on('message_new', async (context) => {
  const commandText = context.text?.trim().toLowerCase() || '';
  const messageText = context.text?.trim();

  console.log(`Received a new message: ${messageText}`);

  if (context.isOutbox) {
    return;
  }

  if (!messageText) {
    return;
  }

  let command: Command | undefined;
  const parts = commandText.split(' ');

  if (messageText.startsWith('глитч кто')) {
    console.log('Detected command: глитч кто');

    const commandParts = messageText.split(' ');
    const possibleFandom = commandParts[3];

    if (possibleFandom && !(possibleFandom in fandomMapping)) {
      console.log('Unknown fandom, delegating to AI...');
      await handleAIResponse(context, true);
      return;
    }

    await handleIdentityCommand(context, vk);
    return;
  }

  if (messageText.startsWith('установить шанс')) {
    console.log('Detected command: установить шанс');
    await handleCommand(context, vk, 'установить шанс', messageText.slice('установить шанс'.length).trim());
    return;
  }

  if (messageText.startsWith('проверить шанс')) {
    console.log('Detected command: проверить шанс');
    await handleCommand(context, vk, 'проверить шанс', '');
    return;
  }

  if (messageText.startsWith('глитч, че по интеллекту')) {
    console.log('Detected command: глитч, че по интеллекту');
    await handleCommand(context, vk, 'глитч, че по интеллекту', '');
    return;
  }

  if (messageText.startsWith('крысюк') || messageText.startsWith('глитч') || messageText.startsWith('крыс')) {
    console.log('Bot was mentioned, generating AI response...');
    await handleAIResponse(context, true);
    return;
  }

  if (messageText !== command) {
    collectMessage(context);
  }

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
    console.log('Detected command:', command);
    const targetUser = messageText.slice(command.length).trim();
    await handleCommand(context, vk, command, targetUser);
  } else {
    console.log('No command detected, generating AI response...');
    await handleAIResponse(context);
  }
});

updates.start().then(() => {
  console.log('Bot started successfully!');
}).catch(console.error);
