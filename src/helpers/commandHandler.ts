import { MessageContext, PhotoAttachment, VK } from 'vk-io';
import { commands, Command } from '../commands';
import { commandImages } from '../commandImages';
import { getChatSettings, updateChatSettings } from '../config/config';
import axios from 'axios';

const commandCases: Record<Command, 'именительный' | 'винительный' | 'дательный' | 'родительный'> = {
  'погладить': 'винительный',
  'потрогать траву': 'именительный',
  'обнять': 'винительный',
  'поцеловать': 'винительный',
  'засосать': 'винительный',
  'укусить': 'винительный',
  'лизнуть': 'винительный',
  'херак': 'винительный',
  'отмудохать': 'винительный',
  'пятюня': 'дательный',
  'пожать руку': 'дательный',
  'закопать': 'винительный',
  'жамк': 'родительный',
  'съесть': 'винительный',
  'откусить': 'дательный',
  'аминь': 'дательный',
  'обезвредить': 'винительный',
  'очистить': 'родительный',
  'шишка': 'именительный',
  'проверить шанс': 'именительный',
  'установить шанс': 'винительный', // Новая команда
};

const formatNameForCase = (name: string, caseType: 'именительный' | 'винительный' | 'дательный' | 'родительный'): string => {
  switch (caseType) {
    case 'винительный':
      return formatNameForAccusativeCase(name);
    case 'дательный':
      return formatNameForDativeCase(name);
    case 'родительный':
      return formatNameForGenitiveCase(name);
    default:
      return name;
  }
};

const formatNameForAccusativeCase = (name: string): string => {
  const lastChar = name.slice(-1);
  let formattedName = name;

  switch (lastChar) {
    case 'а':
      formattedName = name.slice(0, -1) + 'у';
      break;
    case 'я':
      formattedName = name.slice(0, -1) + 'ю';
      break;
    default:
      formattedName = name;
  }
  return formattedName;
};

const formatNameForDativeCase = (name: string): string => {
  const lastChar = name.slice(-1);
  let formattedName = name;

  switch (lastChar) {
    case 'а':
    case 'я':
      formattedName = name.slice(0, -1) + 'е';
      break;
  }
  return formattedName;
};

const formatNameForGenitiveCase = (name: string): string => {
  const lastChar = name.slice(-1);
  let formattedName = name;

  switch (lastChar) {
    case 'а':
      formattedName = name.slice(0, -1) + 'ы';
      break;
    case 'я':
      formattedName = name.slice(0, -1) + 'и';
      break;
  }
  return formattedName;
};

export const handleCommand = async (
  context: MessageContext,
  vk: VK,
  command: Command,
  targetUser: string
) => {
  const chatId = context.chatId;
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping command handling.');
    return;
  }

  const initiatorInfo = await vk.api.users.get({
    user_ids: [context.senderId.toString()]
  });

  const initiatorName = initiatorInfo[0].first_name;

  if (command === 'проверить шанс') {
    const chatSettings = getChatSettings(chatId);
    const responseChance = chatSettings.responseChance || 30;
    await context.send(`Текущий шанс ответа бота: ${responseChance}%`);
    return;
  }

  if (command === 'установить шанс') {
    const chanceValue = parseInt(targetUser, 10);
    if (isNaN(chanceValue) || chanceValue < 0 || chanceValue > 100) {
      await context.send(`Пожалуйста, укажите корректное значение шанса от 0 до 100.`);
      return;
    }
    updateChatSettings(chatId, { responseChance: chanceValue });
    await context.send(`Шанс ответа бота установлен на: ${chanceValue}%`);
    return;
  }

  let formattedTargetUser = targetUser;
  if (context.replyMessage) {
    const replyUserId = context.replyMessage.senderId;
    const replyUser = await vk.api.users.get({ user_ids: [replyUserId.toString()] });
    if (replyUser && replyUser.length > 0) {
      const name = replyUser[0].first_name;
      const caseType = commandCases[command];

      formattedTargetUser = formatNameForCase(name, caseType);
    }
  }

  const responseMessage = `${initiatorName} ${commands[command]} ${formattedTargetUser}`;
  const images = commandImages[command];

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