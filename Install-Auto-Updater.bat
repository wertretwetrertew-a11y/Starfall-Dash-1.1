@echo off
setlocal
set "TARGET=%~dp0Start-Auto-Updater.bat"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut((Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\Starfall Dash Auto Updater.lnk')); $s.TargetPath='%TARGET%'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"
echo.
echo ==========================================
echo Starfall Dash Auto Updater installed.
echo It will start automatically with Windows.
echo ==========================================
pause
