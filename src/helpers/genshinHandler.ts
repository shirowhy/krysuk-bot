import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { handleAIResponse } from './aiResponder';

export const handleGenshinIdentityCommand = async (context: MessageContext, vk: VK) => {
  const chatId = context.chatId?.toString();
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping Genshin identity response.');
    return;
  }

  const initiatorInfo = await vk.api.users.get({
    user_ids: [context.senderId.toString()]
  });

  const initiatorName = initiatorInfo[0].first_name;

  const randomValue = Math.random() * 100;
  if (randomValue < 25) {
    console.log('Generating AI gensh response instead of fixed response...');
    await handleAIResponse(context, true);
    return;
  }

  const adjectivesDoc = await db.collection('phrase_lists_gensh').doc('adjectives').get();
  const subjectsDoc = await db.collection('phrase_lists_gensh').doc('subjects').get();
  const actionsDoc = await db.collection('phrase_lists_gensh').doc('actions').get();

  if (!adjectivesDoc.exists || !subjectsDoc.exists || !actionsDoc.exists) {
    console.error('One or more documents are missing from Firestore.');
    await context.send('ЖЕСТЬ. Что-то пошло не так. Попробуй еще раз позже');
    return;
  }

  const adjectives = adjectivesDoc.data()?.list || [];
  const subjects = subjectsDoc.data()?.list || [];
  const actions = actionsDoc.data()?.list || [];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];

  const gender = randomSubject.gender === 'female' ? 'female' : 'male';

  const response = `${initiatorName}, ты — ${randomAdjective[`adjective-name-${gender}`]} ${randomSubject.name} ${randomAction[`action-name-${gender}`]}`;

  await context.send(response);
};
