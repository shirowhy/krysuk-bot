import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

interface ChatSettings {
  responseChance?: number;
}

interface AllSettings {
  [key: number]: ChatSettings;
}

export const config = {
  token: process.env.TOKEN || ''
};

export const saveChatSettings = (chatId: number, settings: ChatSettings) => {
  const settingsPath = 'settings.json';
  let allSettings: AllSettings = {};

  if (fs.existsSync(settingsPath)) {
    const rawData = fs.readFileSync(settingsPath, 'utf8');
    allSettings = JSON.parse(rawData) as AllSettings;
  }

  allSettings[chatId] = settings;
  fs.writeFileSync(settingsPath, JSON.stringify(allSettings, null, 2));
};

export const getChatSettings = (chatId: number): ChatSettings => {
  const settingsPath = 'settings.json';
  let allSettings: AllSettings = {};

  if (fs.existsSync(settingsPath)) {
    const rawData = fs.readFileSync(settingsPath, 'utf8');
    allSettings = JSON.parse(rawData) as AllSettings;
  }

  return allSettings[chatId] || {};
};

export const updateChatSettings = (chatId: number, newSettings: object) => {
  const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  settings.chats[chatId] = { ...settings.chats[chatId], ...newSettings };
  fs.writeFileSync('settings.json', JSON.stringify(settings, null, 2));
};