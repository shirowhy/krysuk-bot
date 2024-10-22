import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { DateTime } from 'luxon';

interface Partner {
    name: string;
}

export const handlePartnerCommand = async (context: MessageContext, vk: VK, commandText: string) => {
    const chatId = context.chatId?.toString();
    if (!chatId) {
        console.warn('Chat ID is undefined, skipping response.');
        return;
    }

    const initiatorInfo = await vk.api.users.get({
        user_ids: [context.senderId.toString()],
        lang: 'ru',
    });

    const initiatorName = initiatorInfo[0].first_name;

    if (commandText.startsWith('глитч все пары')) {
        await handleShowAllPairs(context, chatId);
        return;
    }

    if (commandText.startsWith('глитч мой гача муж')) {
        await assignPartner(context, initiatorName, `husbands`, `assigned_husbands_${chatId}`, 'твой муж');
        return;
    }

    if (commandText.startsWith('глитч моя гача жена')) {
        await assignPartner(context, initiatorName, `wives`, `assigned_wives_${chatId}`, 'твоя жена');
        return;
    }
};

const assignPartner = async (
    context: MessageContext, 
    initiatorName: string, 
    partnerCollection: string, 
    assignedCollection: string, 
    responseText: string
) => {
    const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
    const todayDate = nowInMoscow.toISODate();

    const assignedDoc = await db.collection(assignedCollection).doc(context.senderId.toString()).get();
    if (assignedDoc.exists) {
        const assignedData = assignedDoc.data();
        const lastAssignedDate = assignedData?.dateAssigned;

        if (lastAssignedDate === todayDate) {
            const response = `${initiatorName}, ${responseText} — ${assignedData?.name}`;
            await context.send(response);
            return;
        }
    }

    const partnersDoc = await db.collection(partnerCollection).doc('names').get();
    if (!partnersDoc.exists) {
        console.error(`${partnerCollection} document is missing in Firestore.`);
        await context.send('Ой, что-то пошло не так. Попробуй позже!');
        return;
    }

    const partnersData = partnersDoc.data();
    const partners = (partnersData?.data?.names || []) as Partner[];

    if (partners.length === 0 || !partners.every(p => p.name)) {
        console.error(`Invalid data format: Expected array of objects with a "name" field in ${partnerCollection}.`);
        await context.send('Ой, данные повреждены. Попробуй позже!');
        return;
    }

    const randomPartner = partners[Math.floor(Math.random() * partners.length)].name;

    await db.collection(assignedCollection).doc(context.senderId.toString()).set({
        name: randomPartner,
        userName: initiatorName,
        dateAssigned: todayDate,
    });

    const response = `${initiatorName}, ${responseText} — ${randomPartner}`;
    await context.send(response);
};

const handleShowAllPairs = async (context: MessageContext, chatId: string) => {
    const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
    const todayDate = nowInMoscow.toISODate();

    // Fetch all assigned husbands for this chat
    const husbandsSnapshot = await db.collection(`assigned_husbands_${chatId}`)
        .where('dateAssigned', '==', todayDate)
        .get();

    // Fetch all assigned wives for this chat
    const wivesSnapshot = await db.collection(`assigned_wives_${chatId}`)
        .where('dateAssigned', '==', todayDate)
        .get();

    if (husbandsSnapshot.empty && wivesSnapshot.empty) {
        await context.send('Сегодня ещё нет назначенных пар.');
        return;
    }

    let response = 'СЕГОДНЯШНИЕ ПАРЫ\n\n';

    // Handle husbands section
    if (!husbandsSnapshot.empty) {
        response += 'Мужья:\n';
        husbandsSnapshot.forEach(doc => {
            const husbandData = doc.data();
            response += `${husbandData.name} / ${husbandData.userName}\n`;
        });
        response += '\n';
    }

    // Handle wives section
    if (!wivesSnapshot.empty) {
        response += 'Жены:\n';
        wivesSnapshot.forEach(doc => {
            const wifeData = doc.data();
            response += `${wifeData.userName} / ${wifeData.name}\n`;
        });
    }

    await context.send(response.trim());
};