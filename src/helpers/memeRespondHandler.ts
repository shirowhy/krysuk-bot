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

    await context.sendPhoto(memeUrl);
}
