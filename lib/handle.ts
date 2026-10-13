// =====================================================================
//  miniapps.kg — логика бота
//  Работает и локально (dev.ts, polling), и на Vercel (api/bot.ts, webhook)
// =====================================================================

const API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// ---------- НАСТРОЙКИ: меняйте здесь ----------
const ORDER_URL = 'https://mini-apps-landing.vercel.app/#lead-form'; // сайт с формой заявки
const MANAGER_URL = 'https://t.me/daniyarch'; // ваш личный Telegram
const CHANNEL_URL = 'https://t.me/avto_lenta_kg'; // поменяйте, когда смените адрес канала

const DEMOS = [
  { title: '🍪 Кондитерская', url: 'https://miniapps-demo.vercel.app/aidan/' },
  // { title: '👕 Магазин одежды', url: 'https://miniapps-demo.vercel.app/shop/' },
  // { title: '🍲 Кафе', url: 'https://miniapps-demo.vercel.app/cafe/' },
];

const CASES: Record<string, { title: string; text: string; url?: string }> = {
  bakery: {
    title: '🍪 Мини-апп кондитерской',
    text:
      'Telegram Mini App для кондитерской: каталог печенья и маффинов, наборы, корзина, ' +
      'выбор доставки и времени.\n\n' +
      '<b>Задача</b>\nУбрать бесконечную переписку в директе и дать клиентам заказывать самим.\n\n' +
      '<b>Решение</b>\n• каталог с фото и ценами\n• корзина и оформление заказа\n• выбор доставки или самовывоза\n\n' +
      '<b>Результат</b>\nКлиент оформляет заказ за пару минут, без переписки.',
  },
};

const TEXTS = {
  start:
    '👋 <b>Привет! Это miniapps.kg</b>\n\n' +
    'Делаем мини-приложения в Telegram для бизнеса: магазины, пекарни, кафе.\n' +
    'Клиенты сами выбирают, заказывают и оплачивают — без переписки.\n\nВыберите раздел 👇',
  demo: '🛍 <b>Демо-приложения</b>\n\nНажмите — приложение откроется прямо в Telegram. Всё работает как настоящее, только заказы никуда не уходят.',
  cases: '📂 <b>Наши кейсы</b>\n\nВыберите проект:',
  price:
    '💰 <b>Сколько стоит</b>\n\nРазработка мини-приложения — <b>от 30 000 сом</b>.\n\n' +
    'Цена зависит от задач:\n• каталог и заказ\n• онлайн-оплата\n• доставка и выбор времени\n• рассылки клиентам\n\n' +
    'Запуск — 2–4 недели. Оставьте заявку — назовём точную стоимость.',
  how:
    '⚙️ <b>Как мы работаем</b>\n\n' +
    '1️⃣ Разбираемся в вашем бизнесе — день 1–2\n2️⃣ Показываем макет — неделя 1\n' +
    '3️⃣ Собираем и тестируем — неделя 2–3\n4️⃣ Запускаем и помогаем — неделя 3–4',
  order:
    '📝 <b>Оставить заявку</b>\n\nНажмите кнопку — форма откроется прямо в Telegram 👇',
};

// ---------- КНОПКИ ----------
// Кнопка заявки сразу открывает форму внутри Telegram
const orderBtn = { text: '📝 Оставить заявку', web_app: { url: ORDER_URL } };

const kb = {
  main: [
    [{ text: '🛍 Попробовать демо', callback_data: 'demo' }],
    [
      { text: '📂 Кейсы', callback_data: 'cases' },
      { text: '⚙️ Как работаем', callback_data: 'how' },
    ],
    [{ text: '💰 Сколько стоит', callback_data: 'price' }],
    [orderBtn],
    [
      { text: '💬 Связаться', url: MANAGER_URL },
      { text: '📢 Наш канал', url: CHANNEL_URL },
    ],
  ],
  demo: () => [
    ...DEMOS.map((d) => [{ text: d.title, web_app: { url: d.url } }]),
    [{ text: '🏠 Главная', callback_data: 'home' }],
  ],
  cases: () => [
    ...Object.entries(CASES).map(([key, c]) => [
      { text: c.title, callback_data: `case:${key}` },
    ]),
    [{ text: '🏠 Главная', callback_data: 'home' }],
  ],
  case: (key: string) => [
    [
      { ...orderBtn, text: '💬 Обсудить' },
      { text: '💬 Связаться', url: MANAGER_URL },
    ],
    ...(CASES[key].url
      ? [[{ text: '🔗 Подробнее', url: CASES[key].url! }]]
      : []),
    [
      { text: '◀️ Назад', callback_data: 'cases' },
      { text: '🏠 Главная', callback_data: 'home' },
    ],
  ],
  back: [[orderBtn], [{ text: '🏠 Главная', callback_data: 'home' }]],
  order: [[orderBtn], [{ text: '🏠 Главная', callback_data: 'home' }]],
};

// ---------- ВЫЗОВЫ TELEGRAM API ----------
async function call(method: string, body: object) {
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!data.ok) console.log(`Ошибка ${method}:`, data.description);
  return data;
}

export function send(chatId: number | string, text: string, buttons?: any[][]) {
  return call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

// редактируем то же сообщение — так навигация не засоряет чат
function edit(
  chatId: number,
  messageId: number,
  text: string,
  buttons: any[][],
) {
  return call('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons },
  });
}

// какой экран показать по команде или кнопке
function screen(name: string): [string, any[][]] | null {
  if (name === 'home') return [TEXTS.start, kb.main];
  if (name === 'demo') return [TEXTS.demo, kb.demo()];
  if (name === 'cases') return [TEXTS.cases, kb.cases()];
  if (name === 'price') return [TEXTS.price, kb.back];
  if (name === 'how') return [TEXTS.how, kb.back];
  if (name === 'order') return [TEXTS.order, kb.order];
  if (name.startsWith('case:')) {
    const key = name.slice(5);
    const c = CASES[key];
    return c ? [`<b>${c.title}</b>\n\n${c.text}`, kb.case(key)] : null;
  }
  return null;
}

// команды из меню бота → экран
const COMMANDS: Record<string, string> = {
  '/start': 'home',
  '/demo': 'demo',
  '/cases': 'cases',
  '/price': 'price',
  '/how': 'how',
  '/order': 'order',
};

// ---------- ГЛАВНЫЙ ОБРАБОТЧИК ----------
export async function handleUpdate(update: any) {
  // 1) нажатие на кнопку
  const cb = update.callback_query;
  if (cb) {
    const s = screen(cb.data);
    if (s) await edit(cb.message.chat.id, cb.message.message_id, s[0], s[1]);
    await call('answerCallbackQuery', { callback_query_id: cb.id }); // убирает «часики»
    return;
  }

  // 2) текстовое сообщение
  const msg = update.message;
  if (!msg?.text) return;

  const cmd = msg.text.split(' ')[0].split('@')[0].toLowerCase();
  const s = screen(COMMANDS[cmd] ?? 'home'); // любой другой текст → главное меню
  if (s) await send(msg.chat.id, s[0], s[1]);
}
