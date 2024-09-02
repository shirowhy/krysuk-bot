import { MessageContext, VK } from 'vk-io';

export type Command = 'погладить' | 'потрогать' | 'обнять' | 'поцеловать' | 'засосать' | 'укусить' | 'херак' | 'пятюня' | 'пожать руку' | 'закопать' | 'жамк' | 'съесть' | 'откусить';

export const commands: Record<Command, string> = {
  'погладить': 'погладил(а)',
  'потрогать': 'потрогал(а)',
  'обнять': 'обнял(а)',
  'поцеловать': 'поцеловал(а)',
  'засосать': 'засосал(а)',
  'укусить': 'укусил(а)',
  'херак': 'херакнул(а)',
  'пятюня': 'дал(а) пятюню',
  'пожать руку': 'пожал(а) руку',
  'закопать': 'закопала',
  'жамк': 'потрогал(а) бубсы',
  'съесть': 'съел(а)',
  'откусить': 'откусил(а) жопу',
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

  const target = targetUser.startsWith('@') ? targetUser : targetUser;

  const action = commands[command];

  await context.send(`${initiatorName} ${action} ${target}`);
};
