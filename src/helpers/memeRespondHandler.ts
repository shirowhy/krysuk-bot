import { VK } from 'vk-io';
import { detectMood, getMemeByMood } from './memeResponder';

export async function handleMemeResponse(context: any, vk: VK) {
    const repliedMessage = context.replyMessage;
    if (!repliedMessage || !repliedMessage.text) return;

    const mood = await detectMood(repliedMessage.text);
    const memeUrl = getMemeByMood(mood);

    if (!memeUrl) {
        await context.send('🤷‍♀️ Мем не найден для такого настроения.');
        return;
    }

    try {
        const attachment = await vk.upload.messagePhoto({
            source: {
                value: memeUrl,
            },
            peer_id: context.peerId,
        });

        await context.send({
            attachment,
        });
    } catch (err) {
        console.error('Ошибка при загрузке мема:', err);
        await context.send(memeUrl);
    }
}
