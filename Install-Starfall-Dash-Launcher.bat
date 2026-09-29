@echo off
setlocal
set "ROOT=%~dp0"
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "DESKTOP=%USERPROFILE%\Desktop"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut((Join-Path '%DESKTOP%' 'Starfall Dash.lnk')); $s.TargetPath='%ROOT%Launch-Starfall-Dash.bat'; $s.WorkingDirectory='%ROOT%'; $s.IconLocation='%SystemRoot%\System32\shell32.dll,44'; $s.Save()"

echo.
echo ==========================================
echo Starfall Dash launcher installed.
echo A "Starfall Dash" shortcut was added
echo to your Desktop.
echo ==========================================
echo.
pause
