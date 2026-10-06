@echo off
chcp 65001 >nul
title TikTok Gifts Overlay & Fire Text
color 0e
echo ========================================================
echo       🎁🔥 تشغيل لوحة الهدايا وشريط النص الناري
echo ========================================================
echo.
echo [*] جاري تشغيل السيرفر على البورت 3001...
echo.
echo [*] لوحة تحكم الهدايا:          http://localhost:3001
echo [*] لوحة تحكم شريط النص الناري: http://localhost:3001/fire.html
echo [*] رابط OBS لشريط النص الناري: http://localhost:3001/fire-text.html
echo.
echo ========================================================
echo.
start http://localhost:3001
node server.js
pause
