import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { DateTime } from 'luxon';

export const fandomMapping: Record<string, string> = {
  'генш': 'gensh',
  'титосы': 'AOT',
  'ззз': 'zzz'
};

export const handleIdentityCommand = async (context: MessageContext, vk: VK) => {
  const chatId = context.chatId?.toString();
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping identity response.');
    return;
  }

  const initiatorInfo = await vk.api.users.get({
    user_ids: [context.senderId.toString()]
  });

  const initiatorId = context.senderId.toString();
  const initiatorName = initiatorInfo[0].first_name;

  const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
  const todayDate = nowInMoscow.toISODate();

  const messageText = context.text?.trim().toLowerCase();
  const commandParts = messageText?.split(' ');
  const command = commandParts?.[2]; // 'кто я' or 'кто все'

  if (command === 'все') {
    await handleShowAllIdentities(context);
    return;
  }

  const fandom = commandParts?.[3]; // 'генш' or 'титосы' or 'ззз'

  if (!fandom || !(fandom in fandomMapping)) {
    await context.send('Это чё? Такого фэндома нет. Попробуй "Глитч кто я генш", "Глитч кто я титосы" или "Глитч кто я ззз"');
    return;
  }

  const collectionName = fandomMapping[fandom];
  const userDocRef = db.collection(`${collectionName}_identity_logs`).doc(initiatorId);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data();
    const lastGeneratedDate = userData?.[`${collectionName}_lastGeneratedDate`];
    const lastResponse = userData?.[`${collectionName}_lastResponse`];

    if (lastGeneratedDate === todayDate) {
      await context.send(lastResponse);
      return;
    }
  }

  const adjectivesDoc = await db.collection(`phrase_lists_${collectionName}`).doc('adjectives').get();
  const subjectsDoc = await db.collection(`phrase_lists_${collectionName}`).doc('subjects').get();
  const actionsDoc = await db.collection(`phrase_lists_${collectionName}`).doc('actions').get();

  if (!adjectivesDoc.exists || !subjectsDoc.exists || !actionsDoc.exists) {
    console.error('One or more documents are missing from Firestore.');
    await context.send('ЖЕСТЬ. Что-то пошло не так. Попробуй еще раз позже');
    return;
  }

  const adjectives = adjectivesDoc.data()?.data?.adjectives || [];
  const subjects = subjectsDoc.data()?.data?.subjects || [];
  const actions = actionsDoc.data()?.data?.actions || [];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

  const gender = randomSubject.gender === 'female' ? 'female' : 'male';

  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  const actionText = gender === 'female'
    ? randomAction['action-name-female']
    : randomAction['action-name-male'];

  const response = `${initiatorName}, ты — ${randomAdjective[`adjective-name-${gender}`]} ${randomSubject.name} ${actionText}`;

  await userDocRef.set({
    [`${collectionName}_lastGeneratedDate`]: todayDate,
    [`${collectionName}_lastResponse`]: response,
  });

  await context.send(response);
};

const handleShowAllIdentities = async (context: MessageContext) => {
  const chatId = context.chatId?.toString();
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping show all identities response.');
    return;
  }

  const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
  const todayDate = nowInMoscow.toISODate();

  let response = '';

  for (const [fandomKey, collectionName] of Object.entries(fandomMapping)) {
    const logsSnapshot = await db.collection(`${collectionName}_identity_logs`)
      .where(`${collectionName}_lastGeneratedDate`, '==', todayDate)
      .get();

    if (!logsSnapshot.empty) {
      response += `${fandomKey.toUpperCase()}:\n`;
      logsSnapshot.forEach(doc => {
        const userData = doc.data();
        const name = userData.name || 'Неизвестный';
        const lastResponse = userData[`${collectionName}_lastResponse`];
        response += `${name} — ${lastResponse}\n`;
      });
      response += '\n';
    }
  }

  if (!response.trim()) {
    response = 'Сегодня ни один фэндом еще не был вызван.';
  }

  await context.send(response.trim());
};