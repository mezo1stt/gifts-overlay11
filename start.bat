@echo off
chcp 65001 >nul
title MEZO TIK - منصة أدوات البث المباشر المتكاملة
color 0c
echo ========================================================
echo       🔥👑 MEZO TIK - منصة أوفرلاي البث المتكاملة
echo ========================================================
echo.
echo [*] السيرفر شغال الآن على البورت 3001...
echo.
echo [*] لوحة التحكم الرئيسية:             http://localhost:3001
echo [*] 🎁 أوفرلاي هدايا التيك توك 1:     http://localhost:3001/overlay.html
echo [*] ⚔️ أوفرلاي هدايا الفرق 2:          http://localhost:3001/overlay-team.html?team=1
echo [*] 🔥 رابط آخر داعم (الشريط الناري):  http://localhost:3001/fire-text.html
echo [*] 📷 بنرات وإطارات الكاميرا:        http://localhost:3001/camera-overlay.html
echo [*] ⚡ لوحة النتائج (Scoreboard):     http://localhost:3001/scoreboard-overlay.html
echo.
echo [*] حساب المدير الافتراضي: mezo / 123456
echo ========================================================
echo.
start http://localhost:3001
node server.js
pause
