@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js не найден. Установи Node.js.
 pause
 exit /b 1
)
node tools\starfall-bot-lab.mjs
pause
