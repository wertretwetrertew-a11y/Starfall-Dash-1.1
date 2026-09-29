@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установи Node.js.
  pause
  exit /b 1
)

rem Create a robust desktop shortcut through cmd.exe.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop=[Environment]::GetFolderPath('Desktop');$lnk=Join-Path $desktop 'Starfall Dash Bot Lab.lnk';$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut($lnk);$s.TargetPath=$env:ComSpec;$s.Arguments='/c ""%~dp0Start-Starfall-Bot-Lab.bat""';$s.WorkingDirectory='%~dp0';$s.IconLocation='%SystemRoot%\System32\SHELL32.dll,13';$s.Description='Запуск Starfall Dash Bot Lab';$s.Save()"

rem Start the Bot Lab server in the background.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'node' -ArgumentList 'tools\starfall-bot-lab.mjs' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

rem Give Node a moment to start, then open the local panel.
timeout /t 1 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process 'http://127.0.0.1:4180'"

exit /b 0
