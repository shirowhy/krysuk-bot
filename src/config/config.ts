import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export const config = {
  token: process.env.TOKEN || ''
};

export const getChatSettings = (chatId: number) => {
  const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  return settings.chats[chatId] || settings.default;
};

export const updateChatSettings = (chatId: number, newSettings: object) => {
  const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  settings.chats[chatId] = { ...settings.chats[chatId], ...newSettings };
  fs.writeFileSync('settings.json', JSON.stringify(settings, null, 2));
};