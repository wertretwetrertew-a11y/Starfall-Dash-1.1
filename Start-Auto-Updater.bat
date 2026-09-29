@echo off
title Starfall Dash — Auto Updater
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\auto-update-game.ps1"
pause
