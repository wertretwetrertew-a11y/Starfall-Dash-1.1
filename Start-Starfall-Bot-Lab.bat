@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js не найден. Установи Node.js.
 pause
 exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop=[Environment]::GetFolderPath('Desktop');$lnk=Join-Path $desktop 'Starfall Dash Bot Lab.lnk';$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut($lnk);$s.TargetPath='%~dp0Start-Starfall-Bot-Lab.bat';$s.WorkingDirectory='%~dp0';$s.IconLocation='%SystemRoot%\System32\SHELL32.dll,13';$s.Description='Запуск Starfall Dash Bot Lab';$s.Save()"
node tools\starfall-bot-lab.mjs
pause
