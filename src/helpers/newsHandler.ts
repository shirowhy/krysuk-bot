import { MessageContext, VK } from 'vk-io';
import axios from 'axios';
import { getNewsTemperature } from '../helpers/firebaseHelper';

const openaiApiKey = process.env.OPENAI_API_KEY || '';

const generateAbsurdNews = async (nameInput: string, temperature: number): Promise<string> => {
    const names = nameInput.split(' и ').map(n => n.trim());
    const isPair = names.length === 2;

    const [name1, name2] = names;
    const prompt = isPair
        ? `Сгенерируй короткую, абсурдную и нелепую новость, в которой участвуют два человека: ${name1} и ${name2}.
Формат — как пост из странного телеграм-канала: с сюрреализмом, мемностью и бытовым безумием.
Избегай спортивных сюжетов, соревнований, турниров, медалей и чемпионов — это слишком скучно.
Старайся использовать странные поводы: еда, бытовые ситуации, технологии, общественный транспорт, соцсети, магические события, аниме, китайские гачи и прочую чушь.
Пример: "${name1} не поделила 2Д-мужа с ${name2} и в качестве мести создала ужасный мем о них."
Пиши одну строку, без кавычек и пояснений. Новость должна быть уникальной, неожиданной и нелепой.`
        : `Сгенерируй короткую, абсурдную и нелепую новость про человека по имени ${name1}.
Формат — как пост из странного телеграм-канала: с сюрреализмом, мемностью и бытовым безумием.
Избегай спортивных сюжетов, соревнований, турниров, медалей и чемпионов — это слишком скучно.
Старайся использовать странные поводы: еда, бытовые ситуации, технологии, общественный транспорт, соцсети, магические события, аниме, китайские гачи и прочую чушь.
Пример: "${name1} снова был замечен за написанием гейских фанфиков. Жители городка в ужасе."
Пиши одну строку, без кавычек и пояснений. Новость должна быть уникальной, неожиданной и нелепой.`;

    const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
            temperature,
        },
        {
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const rawOutput = res.data.choices[0].message.content.trim().replace(/^"|"$/g, '');

    const dotMatches = [...rawOutput.matchAll(/\./g)];
    if (dotMatches.length >= 2) {
        const secondDotIndex = dotMatches[1].index! + 1;
        return rawOutput.slice(0, secondDotIndex).trim();
    }

    return rawOutput;
};

export const handleNewsCommand = async (context: MessageContext, vk: VK) => {
    const chatId = context.chatId?.toString();
    if (!chatId) return;

    const messageText = context.text?.trim();
    if (!messageText) return;

    const parts = messageText.split(' ').slice(2);
    let targetName = parts.join(' ');

    if (context.replyMessage && !targetName) {
        const replyUserId = context.replyMessage.senderId;
        const replyUser = await vk.api.users.get({ user_ids: [replyUserId.toString()], lang: 'ru' });
        targetName = replyUser?.[0]?.first_name || 'Кто-то';
    }

    if (!targetName) {
        await context.send('Укажи имя после команды, например: "Глитч новости сглыпа"');
        return;
    }

    const formattedName = targetName.includes(' и ')
        ? targetName.split(' и ').map(n => n.trim()).join(' и ')
        : targetName.trim();

    try {
        const temperature = await getNewsTemperature(chatId);
        const news = await generateAbsurdNews(formattedName, temperature);
        await context.send(`📰 ${news}`);
    } catch (err) {
        console.error('Ошибка генерации новости:', err);
        await context.send('Новостной телеканал КРЫСА-ТВ крашнулся. Увидимся позже 🥲');
    }
};
