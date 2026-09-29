@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установи Node.js.
  pause
  exit /b 1
)

rem Create/update the desktop shortcut.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop=[Environment]::GetFolderPath('Desktop');$lnk=Join-Path $desktop 'Starfall Dash Bot Lab.lnk';$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut($lnk);$s.TargetPath='%~dp0Start-Starfall-Bot-Lab.bat';$s.WorkingDirectory='%~dp0';$s.IconLocation='%SystemRoot%\System32\SHELL32.dll,13';$s.Description='Запуск Starfall Dash Bot Lab';$s.Save()"

rem Start the Bot Lab server in a hidden background process.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Start-Process -FilePath 'node' -ArgumentList 'tools\starfall-bot-lab.mjs' -WorkingDirectory '%~dp0' -WindowStyle Hidden -PassThru; Start-Sleep -Milliseconds 700"

rem The server is now running in the background. Close this launcher window.
exit /b 0
