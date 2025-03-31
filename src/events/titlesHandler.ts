import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { DateTime } from 'luxon';
import axios from 'axios';
import { eventModeFirstOfAprilChats } from '../config/config';

const collectionPrefix = 'title_logs_';
const openaiApiKey = process.env.OPENAI_API_KEY || '';

const DEFAULT_PROMPT = `Сгенерируй один короткий, оригинальный, абсурдный и смешной титул для человека.
Без шаблонов вроде "Кот в кедах" или "Лорд Пельменей".
Титул должен быть свежим, странным, но звучать как настоящая должность или ранг.
Только сам титул, без пояснений.`;

const RAT_PROMPT = `Сгенерируй один смешной, абсурдный и оригинальный титул крысы. Титул должен быть коротким (2-3 слова), звучать нелепо, сюрреалистично или странно, но при этом запоминаться. 
Избегай формальностей вроде “Империи”, “Доменавов” и “Маршалов”. Лучше — Король Крысельвании, Премиум крыса, микро-крыс и т.п. 
Не используй шаблон “Великий <что-то>”.
Можно использовать слово "крыса", "крыс", "крысиный", "крысельванский" и т.п. Стиль должен быть современным и мемным, не скатываться в старые никнеймы 2000х.
Без пояснений, без кавычек, только сам титул. Не использовать других животных или банальных слов.`;

export const generateAITitle = async (isRatMode: boolean): Promise<string> => {
    const prompt = isRatMode ? RAT_PROMPT : DEFAULT_PROMPT;

    const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 30,
            temperature: 1.3
        },
        {
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return res.data.choices[0].message.content.trim().replace(/^"|"$/g, '');
};

export const handleTitleCommand = async (context: MessageContext, vk: VK) => {
    const chatId = context.chatId?.toString();
    if (!chatId) return;

    const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
    const todayDate = nowInMoscow.toISODate();

    const initiatorId = context.senderId.toString();
    const initiatorInfo = await vk.api.users.get({ user_ids: [initiatorId], lang: 'ru' });
    const initiatorName = initiatorInfo[0].first_name;

    const messageText = context.text?.trim().toLowerCase();
    const commandParts = messageText?.split(' ');
    const subcommand = commandParts?.[2];

    const collectionName = `${collectionPrefix}${chatId}`;
    const userDocRef = db.collection(collectionName).doc(initiatorId);
    const userDoc = await userDocRef.get();

    if (subcommand === 'все') {
        const logsSnapshot = await db.collection(collectionName)
            .where('lastGeneratedDate', '==', todayDate)
            .get();

        if (logsSnapshot.empty) {
            await context.send('Сегодня пока никому не присвоен титул 😢');
            return;
        }

        let response = '🎖 Титулы за сегодня:\n\n';

        for (const doc of logsSnapshot.docs) {
            const userId = doc.id;
            const title = doc.data().lastTitle;

            try {
                const user = await vk.api.users.get({ user_ids: [userId], lang: 'ru' });
                response += `${user[0].first_name}: ${title}\n`;
            } catch (e) {
                response += `id${userId}: ${title}\n`;
            }
        }

        await context.send(response.trim());
        return;
    }

    if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.lastGeneratedDate === todayDate && userData.lastTitle) {
            await context.send(`${initiatorName}, твой титул сегодня: ${userData.lastTitle}`);
            return;
        }
    }

    let randomTitle = '';
    try {
        const isRatMode = eventModeFirstOfAprilChats.includes(chatId);
        randomTitle = await generateAITitle(isRatMode);
    } catch (err) {
        console.error('Ошибка генерации титула:', err);
        await context.send('Что-то пошло не так с генерацией титула 🧨 Попробуй ещё раз позже!');
        return;
    }

    await userDocRef.set({
        lastGeneratedDate: todayDate,
        lastTitle: randomTitle,
    });

    await context.send(`${initiatorName}, ты — ${randomTitle}.`);
};