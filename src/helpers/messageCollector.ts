import fs from 'fs';
import { MessageContext } from 'vk-io';

const MESSAGE_LOG_PATH = 'chat_messages.json';

export const collectMessage = (context: MessageContext) => {
  const message = {
    text: context.text?.trim(),
    senderId: context.senderId,
    date: new Date().toISOString(),
  };

  let messages = [];

  if (fs.existsSync(MESSAGE_LOG_PATH)) {
    const rawData = fs.readFileSync(MESSAGE_LOG_PATH, 'utf8');
    messages = JSON.parse(rawData);
  }

  messages.push(message);

  fs.writeFileSync(MESSAGE_LOG_PATH, JSON.stringify(messages, null, 2));
};
