// Точка входа для Vercel: Telegram присылает сюда обновления (webhook).
// Адрес: https://bots-eight-teal.vercel.app/api/bot
import { handleUpdate } from '../lib/handle.js';

export default async function handler(req: any, res: any) {
  // Если задан WEBHOOK_SECRET — пропускаем только запросы от Telegram
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(403).send('forbidden');
  }

  if (req.method !== 'POST') {
    return res.status(200).send('bot is running');
  }

  try {
    await handleUpdate(req.body);
  } catch (e) {
    console.log('Ошибка обработки:', e);
  }

  // Telegram всегда должен получить 200, иначе будет слать запрос повторно
  return res.status(200).send('ok');
}
