@echo off
title CTR.NET FARDC Mobile - Serveur de developpement
echo =========================================================
echo   CTR.NET FARDC Mobile - Demarrage serveur dev
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

:: Verifier npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas accessible.
    pause
    exit /b 1
)

echo [OK] Node.js detecte : 
node --version
echo [OK] npm detecte :
npm --version
echo.

:: Verifier node_modules
if not exist "node_modules" (
    echo [INFO] Installation des dependances npm...
    npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation npm.
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Demarrage du serveur Ionic (http://localhost:8100)...
echo [INFO] Appuyez sur Ctrl+C pour arreter.
echo.
npm start
pause
