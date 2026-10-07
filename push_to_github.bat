@echo off
chcp 65001 >nul
title رفع المشروع إلى GitHub - MEZO TIK
cd /d "%~dp0"
echo ==========================================================
echo 🚀 جاري رفع المشروع إلى GitHub:
echo https://github.com/mezo1stt/gifts-overlay11
echo ==========================================================
echo.
git push -u origin main --force
echo.
if %errorlevel% equ 0 (
    echo ✅ تم رفع المشروع بنجاح إلى GitHub!
) else (
    echo ❌ فشل الرفع. إذا طلب منك تسجيل الدخول، يرجى إتمام تسجيل الدخول في المتصفح أو إدخال Personal Access Token (PAT).
)
echo.
pause
