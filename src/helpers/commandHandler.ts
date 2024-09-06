import { MessageContext, PhotoAttachment, VK } from 'vk-io';
import { commands, Command } from '../commands';
import { commandImages } from '../commandImages';
import axios from 'axios';
import { saveChatSettings } from '../config/config';

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
  const initiatorInfo = await vk.api.users.get({
    user_ids: [context.senderId.toString()]
  });

  const initiatorName = initiatorInfo[0].first_name;

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

export const handleSetChanceCommand = async (context: MessageContext, vk: VK, parts: string[]) => {
  if (parts[0] === 'установить' && parts[1] === 'шанс' && parts.length === 3) {
    const newChance = parseInt(parts[2], 10);

    if (!isNaN(newChance) && newChance >= 0 && newChance <= 100) {
      saveChatSettings(context.chatId!, { responseChance: newChance });
      await context.send(`Шанс ответа установлен на ${newChance}%`);
    } else {
      await context.send('Введите корректное значение для шанса (от 0 до 100).');
    }
    return true;
  }
  return false;
};
