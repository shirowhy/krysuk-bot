import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { DateTime } from 'luxon';

export const handleHusbandCommand = async (context: MessageContext, vk: VK) => {
  const chatId = context.chatId?.toString();
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping husband response.');
    return;
  }

  const initiatorInfo = await vk.api.users.get({
    user_ids: [context.senderId.toString()],
    lang: 'ru',
  });

  const initiatorName = initiatorInfo[0].first_name;

  const messageText = context.text?.trim().toLowerCase();
  const commandParts = messageText?.split(' ');
  const command = commandParts?.[2]; // 'мой гача муж' or 'все мужья'

  if (command === 'все мужья') {
    await handleShowAllHusbands(context, vk);
    return;
  }

  // Fetch the names from Firestore
  const husbandsDoc = await db.collection('husbands').doc('names').get();
  if (!husbandsDoc.exists) {
    console.error('Husbands document is missing in Firestore.');
    await context.send('Ой, что-то пошло не так. Попробуй позже!');
    return;
  }

  const husbands = husbandsDoc.data()?.names || [];
  
  // Select a random husband, assuming each entry is an object with a 'name' field
  const randomHusband = husbands[Math.floor(Math.random() * husbands.length)].name;

  // Save the assigned husband in Firestore for this user
  await db.collection('assigned_husbands').doc(context.senderId.toString()).set({
    name: randomHusband,
    userName: initiatorName,
    dateAssigned: DateTime.now().toISODate(),
  });

  const response = `${initiatorName}, твой муж — ${randomHusband}`;
  await context.send(response);
};

const handleShowAllHusbands = async (context: MessageContext, vk: VK) => {
  const chatId = context.chatId?.toString();
  if (!chatId) {
    console.warn('Chat ID is undefined, skipping show all husbands response.');
    return;
  }

  const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
  const todayDate = nowInMoscow.toISODate();

  // Fetch all assigned husbands for the current day
  const husbandsSnapshot = await db.collection('assigned_husbands')
    .where('dateAssigned', '==', todayDate)
    .get();

  if (husbandsSnapshot.empty) {
    await context.send('Сегодня ещё нет сладких парочек.');
    return;
  }

  let response = 'Сегодняшние пары:\n';

  for (const doc of husbandsSnapshot.docs) {
    const husbandData = doc.data();
    response += `${husbandData.name}/${husbandData.userName}\n`;
  }

  await context.send(response.trim());
};