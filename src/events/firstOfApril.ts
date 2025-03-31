import { commands, Command, interactionCommands } from '../commands';
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

  const availableCommands = interactionCommands.filter((c) => c !== command);
  const selectedCommand: Command = isEventMode
    ? availableCommands[Math.floor(Math.random() * availableCommands.length)]
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
  const availableCommands = interactionCommands.filter((c) => c !== original);
  return availableCommands[Math.floor(Math.random() * availableCommands.length)];
}
