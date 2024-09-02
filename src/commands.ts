import { MessageContext, VK } from 'vk-io';

export type Command = 'погладить' | 'потрогать' | 'обнять' | 'поцеловать' | 'херакнуть';

export const commands: Record<Command, string> = {
  погладить: 'погладил(а)',
  потрогать: 'потрогал(а)',
  обнять: 'обнял(а)',
  поцеловать: 'поцеловал(а)',
  херакнуть: 'херакнул(а)'
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
  const initiatorId = context.senderId;

  const initiatorLink = `@id${initiatorId} (${initiatorName})`;

  const target = targetUser.startsWith('@') ? targetUser : targetUser;

  const action = commands[command];

  await context.send(`${initiatorLink} ${action} ${target}`);
};
