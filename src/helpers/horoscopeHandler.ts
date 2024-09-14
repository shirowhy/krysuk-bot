import { MessageContext, VK } from 'vk-io';
import { db } from '../firebase';
import { DateTime } from 'luxon';
import axios, { AxiosError } from 'axios';
import aiSettings from '../aiSettings.json';

const zodiacSigns: Record<string, string> = {
  'овен': '♈️',
  'телец': '♉️',
  'близнецы': '♊️',
  'рак': '♋️',
  'лев': '♌️',
  'дева': '♍️',
  'весы': '♎️',
  'скорпион': '♏️',
  'стрелец': '♐️',
  'козерог': '♑️',
  'водолей': '♒️',
  'рыбы': '♓️'
};

const generateAIHoroscope = async (sign: string, trainingData: string): Promise<string | null> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key is not defined');
    }

    const prompt = `Сгенерируй нелепый гороскоп для знака зодиака ${sign} обучивший на следующих данных: \n\n${trainingData}. Количество знаков сохраняй примерно такое же как в базе данных, до 300 символов`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: aiSettings.systemMessage },
        { role: 'user', content: prompt }
      ],
      max_tokens: aiSettings.maxTokens,
      temperature: aiSettings.temperature,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Failed to generate AI horoscope:', error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error('Failed to generate AI horoscope:', error.message);
    } else {
      console.error('An unexpected error occurred during AI horoscope generation.');
    }
    return null;
  }
};

export const handleHoroscopeCommand = async (
  context: MessageContext,
  vk: VK,
  zodiacSign: string
): Promise<void> => {
  const initiatorId = context.senderId.toString();
  const nowInMoscow = DateTime.now().setZone('Europe/Moscow');
  const todayDate = nowInMoscow.toISODate();

  const userDocRef = db.collection('horoscopes_logs').doc(`${initiatorId}_${zodiacSign}`);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data();
    const lastGeneratedDate = userData?.lastGeneratedDate;
    const lastResponse = userData?.lastResponse;

    if (lastGeneratedDate === todayDate) {
      await context.send(lastResponse);
      return;
    }
  }

  const horoscopesSnapshot = await db.collection('horoscopes').doc('horoscopes').get();
  const horoscopesData = horoscopesSnapshot.data();

  console.log('Horoscopes Data:', horoscopesData);

  if (!horoscopesData || !horoscopesData['horoscopes-text']) {
    console.error('No horoscopes found in Firestore.');
    await context.send('Что-то пошло не так, попробуйте позже.');
    return;
  }

  const horoscopes = horoscopesData['horoscopes-text'] as string[];
  const trainingData = horoscopes.join('\n');

  const aiGeneratedHoroscope = await generateAIHoroscope(zodiacSign, trainingData);

  if (!aiGeneratedHoroscope) {
    await context.send('Не удалось сгенерировать гороскоп. Попробуйте позже.');
    return;
  }

  const response = `Гороскоп для ${zodiacSigns[zodiacSign.toLowerCase()]}${zodiacSign.charAt(0).toUpperCase() + zodiacSign.slice(1)}: ${aiGeneratedHoroscope}`;

  await userDocRef.set({
    lastGeneratedDate: todayDate,
    lastResponse: response,
  });

  await context.send(response);
};