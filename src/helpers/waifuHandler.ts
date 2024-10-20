import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { DateTime } from 'luxon';

interface Husband {
    name: string;
}

export const handleHusbandCommand = async (context: MessageContext, vk: VK, commandText: string) => {
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

    if (commandText.startsWith('глитч все мужья')) {
        await handleShowAllHusbands(context);
        return;
    }

    if (commandText.startsWith('глитч мой гача муж')) {
        await assignHusband(context, initiatorName);
        return;
    }
};

const assignHusband = async (context: MessageContext, initiatorName: string) => {
    const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
    const todayDate = nowInMoscow.toISODate();

    const assignedHusbandDoc = await db.collection('assigned_husbands').doc(context.senderId.toString()).get();
    if (assignedHusbandDoc.exists) {
        const assignedHusbandData = assignedHusbandDoc.data();
        const lastAssignedDate = assignedHusbandData?.dateAssigned;

        if (lastAssignedDate === todayDate) {
            const response = `${initiatorName}, твой муж — ${assignedHusbandData?.name}`;
            await context.send(response);
            return;
        }
    }

    const husbandsDoc = await db.collection('husbands').doc('names').get();
    if (!husbandsDoc.exists) {
        console.error('Husbands document is missing in Firestore.');
        await context.send('Ой, что-то пошло не так. Попробуй позже!');
        return;
    }

    const husbandsData = husbandsDoc.data();
    const husbands = (husbandsData?.data?.names || []) as Husband[];

    if (husbands.length === 0 || !husbands.every(h => h.name)) {
        console.error('Invalid data format: Expected array of objects with a "name" field.');
        await context.send('Ой, данные с мужьями повреждены. Попробуй позже!');
        return;
    }

    const randomHusband = husbands[Math.floor(Math.random() * husbands.length)].name;

    await db.collection('assigned_husbands').doc(context.senderId.toString()).set({
        name: randomHusband,
        userName: initiatorName,
        dateAssigned: todayDate,
    });

    const response = `${initiatorName}, твой муж — ${randomHusband}`;
    await context.send(response);
};

const handleShowAllHusbands = async (context: MessageContext) => {
    const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
    const todayDate = nowInMoscow.toISODate();

    const husbandsSnapshot = await db.collection('assigned_husbands')
        .where('dateAssigned', '==', todayDate)
        .get();

    if (husbandsSnapshot.empty) {
        await context.send('Сегодня ещё нет сладких парочек.');
        return;
    }

    let response = 'Сегодняшние пары:\n';

    husbandsSnapshot.forEach(doc => {
        const husbandData = doc.data();
        response += `${husbandData.name}/${husbandData.userName}\n`;
    });

    await context.send(response.trim());
};