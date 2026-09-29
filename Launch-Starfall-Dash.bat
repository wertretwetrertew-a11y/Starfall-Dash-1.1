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
  echo Install Git, then run this shortcut again.
  pause
  exit /b 1
)

rem First launch from a downloaded ZIP: create the local Git repository.
if not exist ".git\HEAD" (
  echo First launch: connecting this folder to GitHub main...
  git init
  if errorlevel 1 (
    echo ERROR: Could not initialize Git.
    pause
    exit /b 1
  )
)

rem Make sure the GitHub remote is configured correctly.
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1.git
) else (
  git remote set-url origin https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1.git
)

if errorlevel 1 (
  echo ERROR: Could not configure the GitHub remote.
  pause
  exit /b 1
)

git fetch origin main --quiet
if errorlevel 1 (
  echo.
  echo WARNING: Could not check GitHub.
  echo Starting the current local version.
  goto launch
)

for /f "delims=" %%A in ('git rev-parse HEAD 2^>nul') do set "LOCAL=%%A"
for /f "delims=" %%A in ('git rev-parse origin/main 2^>nul') do set "REMOTE=%%A"

if "%LOCAL%"=="%REMOTE%" (
  echo Your game is already up to date.
  goto launch
)

echo.
echo New version found: %REMOTE:~0,7%
echo Replacing the local game with the latest main version...
echo.

rem Reset tracked files to the exact GitHub main version.
rem This removes old tracked files that no longer exist in main.
git reset --hard origin/main
if errorlevel 1 (
  echo.
  echo WARNING: Update failed.
  echo Starting the current local version.
  goto launch
)

echo.
echo ==========================================
echo Update complete.
echo Old tracked version replaced by main.
echo ==========================================
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

echo ERROR: Could not find index.html.
pause
exit /b 1
