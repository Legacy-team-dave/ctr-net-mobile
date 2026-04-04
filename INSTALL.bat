@echo off
title ENROL.NET - Installation
echo =========================================================
echo   ENROL.NET - Installation des dependances
echo =========================================================
echo.

:: Verifier Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou non accessible dans le PATH.
    echo Installez Node.js 22+ depuis https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js detecte :
node --version
echo [OK] npm detecte :
npm --version
echo.

echo [INFO] Installation des dependances npm...
npm install
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation npm.
    pause
    exit /b 1
)

echo.
echo =========================================================
echo   [OK] Installation terminee !
echo   Lancez START.bat pour demarrer le serveur dev.
echo   Lancez BUILD_APK.bat pour compiler l'APK Android.
echo =========================================================
pause
