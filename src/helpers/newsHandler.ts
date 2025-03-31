import { MessageContext, VK } from 'vk-io';
import axios from 'axios';

const openaiApiKey = process.env.OPENAI_API_KEY || '';

const generateAbsurdNews = async (name: string): Promise<string> => {
    const prompt = `Сгенерируй короткую абсурдную, нелепую и безопасную новость про человека по имени "${name}".
Новость должна быть в стиле странных телеграм-каналов: сюрреалистичная, но не обидная.
Пример: "${name} снова был замечен в районе хлебных 2D-мужей. Жители в ужасе."
Без кавычек, одна строка, без пояснений.`;

    const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 1.35,
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
        const news = await generateAbsurdNews(targetName);
        await context.send(`📰 ${news}`);
    } catch (err) {
        console.error('Ошибка генерации новости:', err);
        await context.send('Новостной телеканал КРЫСА-ТВ крашнулся. Увидимся позже 🥲');
    }
};
