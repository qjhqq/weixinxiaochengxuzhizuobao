@echo off
chcp 65001 >nul
title Miniprogram Starter Kit - Install Skill
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-skill.ps1" -Root "%~dp0"
echo.
echo If the text above looks garbled, open install-result.txt in this folder.
echo.
echo Press any key to close...
pause >nul
