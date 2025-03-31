import { commands, Command } from '../commands';
import { eventModeFirstOfAprilChats } from '../config/config';

export function getFirstOfAprilReaction(command: Command, from: string, to: string, chatId: string): string {
  if (!eventModeFirstOfAprilChats.includes(chatId)) {
    return `${from} ${commands[command]} ${to}`;
  }

  const availableCommands = Object.keys(commands).filter((c) => c !== command) as Command[];
  const random = availableCommands[Math.floor(Math.random() * availableCommands.length)];
  const base = commands[random];

  const randomEndings = [
    'так, что чуть глаза из орбит не повылезли',
    'и тот начал подозрительно мурлыкать',
    'так, что даже стены покраснели',
    ', а воздух наполнился ароматом весёлой безысходности',
    'и вызвал духов Крысиных Предков',
    'настолько мощно, что чайник вскипел сам собой',
  ];

  const ending = randomEndings[Math.floor(Math.random() * randomEndings.length)];

  return `${from} ${base} ${to}, ${ending}`;
}
