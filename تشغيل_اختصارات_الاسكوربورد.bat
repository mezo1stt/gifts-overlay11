@echo off
chcp 65001 >nul
title اختصارات الاسكوربورد الشاملة - MEZO TIK
echo ========================================================
echo    تشغيل اختصارات الاسكوربورد في خلفية الويندوز
echo    Alt + [+] : زيادة (+1)
echo    Alt + [-] : إنقاص (-1)
echo ========================================================
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\scoreboard_hotkeys.ps1"
pause
