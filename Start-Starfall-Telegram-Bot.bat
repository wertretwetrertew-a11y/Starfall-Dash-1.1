@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден.
  pause
  exit /b 1
)

if not defined STARFALL_TELEGRAM_TOKEN (
  echo.
  echo Укажи токен Telegram-бота:
  set /p STARFALL_TELEGRAM_TOKEN=Token: 
)
if not defined STARFALL_TELEGRAM_TOKEN (
  echo Токен не указан.
  pause
  exit /b 1
)

if not defined STARFALL_TELEGRAM_ALLOWED_IDS (
  echo.
  echo Для безопасности можно указать Telegram ID владельца.
  echo Если оставить пустым, бот будет принимать команды от любого пользователя.
  set /p STARFALL_TELEGRAM_ALLOWED_IDS=Owner Telegram ID(s): 
)

node tools\starfall-telegram-bot.mjs
