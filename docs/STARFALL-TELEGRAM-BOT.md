# Starfall Telegram Bot

Telegram-клиент для существующего Starfall Bot Lab. Бот не создаёт отдельную базу: он читает и изменяет те же bugs/ideas/analytics/balance API.

## Запуск

1. Создай бота через @BotFather и получи токен.
2. Запусти `Start-Starfall-Telegram-Bot.bat`.
3. Введи токен.
4. Для ограничения доступа введи свой Telegram ID. Можно указать несколько ID через запятую.
5. Bot Lab должен быть запущен на этом же компьютере.

Бот использует long polling, поэтому отдельный публичный webhook не нужен.

## Команды

- /start или /menu — меню
- /bugs — открытые баги
- /ideas — идеи
- /stats — сводная статистика
- /analytics — аналитика
- /balance — сводка баланса
- /bug Название — добавить баг
- /idea Название — добавить идею

Полный редактор баланса остаётся в Bot Lab, чтобы не давать Telegram произвольный доступ к игровым параметрам.

## Переменные

- STARFALL_TELEGRAM_TOKEN — токен BotFather
- STARFALL_TELEGRAM_ALLOWED_IDS — разрешённые Telegram ID
- STARFALL_BOT_LAB_URL — адрес Bot Lab, по умолчанию http://127.0.0.1:4180

Токен не хранится в GitHub.
