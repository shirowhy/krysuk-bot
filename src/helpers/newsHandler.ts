import { MessageContext, VK } from 'vk-io';
import axios from 'axios';
import { getNewsTemperature } from '../helpers/firebaseHelper';

const openaiApiKey = process.env.OPENAI_API_KEY || '';

const generateAbsurdNews = async (name: string, temperature: number): Promise<string> => {
    const prompt = `Сгенерируй короткую абсурдную и нелепую новость про человека по имени "${name}".
Новость должна быть в стиле странных телеграм-каналов: сюрреалистичная, но не обидная.
Пример: "${name} снова был замечен в районе хлебных 2D-мужей. Жители в ужасе." 
Старайся не повторять формулировки из предыдущих новостей. Используй неожиданные обороты, сюжеты и повороты. Делай так, чтобы каждая новость была уникальной.
Без кавычек, одна строка, без пояснений.`;

    const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 60,
            temperature,
        },
        {
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return res.data.choices[0].message.content.trim().replace(/^"|"$/g, '');
};

export const handleNewsCommand = async (context: MessageContext, vk: VK) => {
    const chatId = context.chatId?.toString();
    if (!chatId) return;

    let targetName = context.text?.split(' ')[2];

    if (context.replyMessage && !targetName) {
        const replyUserId = context.replyMessage.senderId;
        const replyUser = await vk.api.users.get({ user_ids: [replyUserId.toString()], lang: 'ru' });
        targetName = replyUser?.[0]?.first_name || 'Кто-то';
    }

    if (!targetName) {
        await context.send('Укажи имя после команды, например: "Глитч новости сглыпа"');
        return;
    }

    try {
        const temperature = await getNewsTemperature(chatId);
        const news = await generateAbsurdNews(targetName, temperature);
        await context.send(`📰 ${news}`);
    } catch (err) {
        console.error('Ошибка генерации новости:', err);
        await context.send('Новостной телеканал КРЫСА-ТВ крашнулся. Увидимся позже 🥲');
    }
};
