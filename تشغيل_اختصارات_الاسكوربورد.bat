@echo off
chcp 65001 >nul
title اختصارات الاسكوربورد الشاملة - MEZO TIK
echo ========================================================
echo    تشغيل اختصارات الاسكوربورد في خلفية الويندوز والألعاب
echo    [Alt] + [1] : زيادة نقطة للأحمر (+1)
echo    [Alt] + [2] : زيادة نقطة للفريق الثاني (+1)
echo    [Alt] + [+] : زيادة نقطة (+1)
echo    [Alt] + [-] : إنقاص نقطة (-1)
echo ========================================================
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\scoreboard_hotkeys.ps1"
pause
