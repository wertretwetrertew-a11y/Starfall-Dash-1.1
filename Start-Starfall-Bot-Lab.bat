@echo off
setlocal
cd /d "%~dp0"

rem Stop an older Bot Lab server so the updated HTML is loaded on restart.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'starfall-bot-lab\.mjs' }; foreach($x in $p){ Stop-Process -Id $x.ProcessId -Force -ErrorAction SilentlyContinue }"

timeout /t 1 /nobreak >nul

set "REPO=https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1.git"

where git >nul 2>nul
if errorlevel 1 (
  echo Git не найден. Установи Git.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установи Node.js.
  pause
  exit /b 1
)

rem Sync the Bot Lab with the same GitHub main used by the game.
if not exist ".git\HEAD" (
  git init >nul 2>&1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin %REPO%
) else (
  git remote set-url origin %REPO%
)

git fetch origin main --quiet
if errorlevel 1 (
  echo Не удалось проверить GitHub. Запускаю текущую версию Bot Lab.
  goto startbot
)

for /f "delims=" %%A in ('git rev-parse HEAD 2^>nul') do set "LOCAL=%%A"
for /f "delims=" %%A in ('git rev-parse origin/main 2^>nul') do set "REMOTE=%%A"

if "%LOCAL%"=="%REMOTE%" goto startbot

rem Do not overwrite unsaved local changes.
for /f "delims=" %%A in ('git status --porcelain 2^>nul') do set "CHANGES=%%A"
if defined CHANGES (
  echo Локальные изменения обнаружены. Обновление Bot Lab пропущено.
  goto startbot
)

echo Найдена новая версия: %REMOTE:~0,7%
echo Обновляю игру и Bot Lab...
git reset --hard origin/main --quiet
if errorlevel 1 (
  echo Обновление не удалось. Запускаю текущую версию Bot Lab.
) else (
  echo Bot Lab обновлён до %REMOTE:~0,7%.
)

:startbot
rem Create/update the desktop shortcut.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop=[Environment]::GetFolderPath('Desktop');$lnk=Join-Path $desktop 'Starfall Dash Bot Lab.lnk';$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut($lnk);$s.TargetPath=$env:ComSpec;$s.Arguments='/c ""%~dp0Start-Starfall-Bot-Lab.bat""';$s.WorkingDirectory='%~dp0';$s.IconLocation='%SystemRoot%\System32\SHELL32.dll,13';$s.Description='Запуск Starfall Dash Bot Lab';$s.Save()"

rem Start the Bot Lab server in the background.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'node' -ArgumentList 'tools\starfall-bot-lab.mjs' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

rem Give Node a moment to start, then open the local panel.
timeout /t 1 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process 'http://127.0.0.1:4180'"

exit /b 0
