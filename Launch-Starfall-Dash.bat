@echo off
setlocal
title Starfall Dash

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ==========================================
echo        STARFALL DASH
echo        Checking for updates...
echo ==========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: Git is not installed or not in PATH.
  echo Install Git, then run this launcher again.
  pause
  exit /b 1
)

if not exist ".git\HEAD" (
  echo ERROR: This folder is not a Git repository.
  echo Clone the repository first:
  echo https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1
  pause
  exit /b 1
)

git fetch origin main --quiet
if errorlevel 1 (
  echo WARNING: Could not check GitHub.
  echo Starting the local version instead.
  goto launch
)

for /f "delims=" %%A in ('git rev-parse HEAD') do set "LOCAL=%%A"
for /f "delims=" %%A in ('git rev-parse origin/main') do set "REMOTE=%%A"

if "%LOCAL%"=="%REMOTE%" (
  echo Your game is already up to date.
  goto launch
)

echo New version found: %REMOTE:~0,7%
echo Updating game...

git status --porcelain > "%TEMP%\starfall_status.txt"
for %%A in ("%TEMP%\starfall_status.txt") do set "STATUS_SIZE=%%~zA"

if not "%STATUS_SIZE%"=="0" (
  echo.
  echo WARNING: You have local changes.
  echo The update was skipped to protect your files.
  echo Starting your current local version.
  goto launch
)

git pull --ff-only origin main
if errorlevel 1 (
  echo.
  echo WARNING: Update failed.
  echo Starting the current local version.
  goto launch
)

echo.
echo Update complete.
goto launch

:launch
echo.
echo Starting Starfall Dash...
echo.

if exist "index.html" (
  start "" "%ROOT%index.html"
  exit /b 0
)

if exist "Start-Game.bat" (
  call "%ROOT%Start-Game.bat"
  exit /b %errorlevel%
)

echo ERROR: Could not find index.html or Start-Game.bat.
pause
exit /b 1
