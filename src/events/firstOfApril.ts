import { commands, Command } from '../commands';
import { eventModeFirstOfAprilChats } from '../config/config';
import { getRandomSillyEnding } from '../helpers/getRandomSillyEnding';

export async function getFirstOfAprilReaction(
  command: Command,
  from: string,
  to: string,
  chatId: string
): Promise<string> {
  if (!eventModeFirstOfAprilChats.includes(chatId)) {
    return `${from} ${commands[command]} ${to}`;
  }

  const availableCommands = Object.keys(commands).filter((c) => c !== command) as Command[];
  const random = availableCommands[Math.floor(Math.random() * availableCommands.length)];
  const base = commands[random];

  try {
    const ending = await getRandomSillyEnding(from, base, to);
    return `${from} ${base} ${to}, ${ending}`;
  } catch (err) {
    return `${from} ${base} ${to}, и случилось что-то очень странное`;
  }
}

export function getFirstOfAprilRandomCommand(original: Command): Command {
  const availableCommands = Object.keys(commands).filter((c) => c !== original) as Command[];
  return availableCommands[Math.floor(Math.random() * availableCommands.length)];
}
