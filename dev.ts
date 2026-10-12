import { handleUpdate } from './lib/handle.ts';
const API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
let offset = 0;
console.log('Бот запущен');
while (true) {
  const r = await (
    await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`)
  ).json();
  if (!r.ok) {
    console.log('Ошибка Telegram:', r);
    continue;
  }
  for (const u of r.result) {
    offset = u.update_id + 1;
    await handleUpdate(u);
  }
}
