import { readFileSync } from 'fs';
import path from 'path';
import { askGPT } from './askGPT';
import { memeDebugChats } from '../config/config';

const memesPath = path.resolve(__dirname, '../memes.json');
export const memes: Meme[] = JSON.parse(readFileSync(memesPath, 'utf-8'));

export type Meme = {
    filename: string;
    description: string;
    moods: string[];
};

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dsqswy6zv/image/upload/answer-memes';

type Mood = string;
export function getMemeByMood(mood: Mood): string | null {
    const matches = memes.filter(meme => meme.moods.includes(mood));
    if (!matches.length) return null;

    const pick = matches[Math.floor(Math.random() * matches.length)];
    return `${CLOUDINARY_BASE_URL}/${pick.filename}`;
}

export async function detectMood(message: string): Promise<string> {
    const prompt = `Определи эмоциональное настроение этой фразы на английском (например: sadness, sarcasm, support и т.д.):\n"${message}"\n\nОтветь только одним словом.`;

    const response = await askGPT(prompt);
    return response.toLowerCase().trim();
}

export async function maybeSendMeme(ctx: {
    text: string;
    chatId: string;
    send: (opts: { attachment: string }) => Promise<void>;
}) {
    if (!memeDebugChats.includes(String(ctx.chatId))) return;

    const responseChance = 100;
    const roll = Math.random() * 100;

    console.log(`🎲 Meme roll: ${roll}, Response chance: ${responseChance}${roll < responseChance ? ' - Sending meme.' : ' - No response.'}`);

    if (roll >= responseChance) return;

    const mood = await detectMood(ctx.text);
    const meme = getMemeByMood(mood);
    if (meme) {
        await ctx.send({ attachment: meme });
    }
}

