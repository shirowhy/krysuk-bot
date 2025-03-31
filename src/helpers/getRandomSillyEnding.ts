import axios from 'axios';

const apiKey = process.env.OPENAI_API_KEY || '';

export async function getRandomSillyEnding(from: string, action: string, to: string): Promise<string> {
    const prompt = `Придумай короткое абсурдное и смешное завершение для фразы: "${from} ${action} ${to},". Завершение должно быть связано именно с этим действием — нелепое, сюрреалистичное или странное, но подходящее по смыслу. Например: "так, что все тараканы в округе закричали от страха". Ответ — только эта фраза, без кавычек.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4-turbo',
        messages: [
            { role: 'user', content: prompt }
        ],
        max_tokens: 50,
        temperature: 1.2,
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }
    });

    return response.data.choices[0].message.content.trim();
}
