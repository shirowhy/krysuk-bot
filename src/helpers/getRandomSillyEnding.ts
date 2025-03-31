import axios from 'axios';

const apiKey = process.env.OPENAI_API_KEY || '';

export async function getRandomSillyEnding(from: string, action: string, to: string): Promise<string> {
    const prompt = `Придумай абсурдное, смешное, нелепое завершение для фразы: "${from} ${action} ${to},". Одной короткой фразой, например: "так, что все тараканы в округе закричали от страха". Но не помещай этот текст в кавычки.`;

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
