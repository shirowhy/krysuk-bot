import { commands, Command } from '../commands';
import { eventModeFirstOfAprilChats } from '../config/config';
import { getRandomSillyEnding } from '../helpers/getRandomSillyEnding';

interface ReactionResult {
  text: string;
  command: Command;
}

export async function getFirstOfAprilReaction(
  command: Command,
  from: string,
  to: string,
  chatId: string
): Promise<ReactionResult> {
  const isEventMode = eventModeFirstOfAprilChats.includes(chatId);

  const selectedCommand: Command = isEventMode
    ? (Object.keys(commands).filter((c) => c !== command)[Math.floor(Math.random() * (Object.keys(commands).length - 1))] as Command)
    : command;

  const base = commands[selectedCommand];

  try {
    const ending = isEventMode ? await getRandomSillyEnding(from, base, to) : '';
    const message = isEventMode
      ? `${from} ${base} ${to}, ${ending}`
      : `${from} ${base} ${to}`;
    return {
      text: message,
      command: selectedCommand,
    };
  } catch (err) {
    return {
      text: `${from} ${base} ${to}, и случилось что-то очень странное`,
      command: selectedCommand,
    };
  }
}

export function getFirstOfAprilRandomCommand(original: Command): Command {
  const availableCommands = Object.keys(commands).filter((c) => c !== original) as Command[];
  return availableCommands[Math.floor(Math.random() * availableCommands.length)];
}
