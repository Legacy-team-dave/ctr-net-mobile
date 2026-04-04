@echo off
chcp 65001 >nul
title ENROL.NET - Build APK
echo =========================================================
echo   ENROL.NET - Compilation APK Android
echo =========================================================
echo.

:: Verifier Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe.
    pause
    exit /b 1
)

:: Verifier Java
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Java JDK 21 n'est pas installe.
    echo Installez-le depuis https://adoptium.net
    pause
    exit /b 1
)

echo [OK] Node.js :
node --version
echo [OK] Java :
java -version 2>&1 | findstr /i "version"
echo.

:: Verifier node_modules
if not exist "node_modules" (
    echo [INFO] Installation des dependances npm...
    npm install
)

:: Etape 1 : Build Angular production
echo.
echo [1/3] Build Angular production...
call npx ng build --configuration production
if %errorlevel% neq 0 (
    echo [ERREUR] Echec du build Angular.
    pause
    exit /b 1
)

:: Etape 2 : Synchroniser Capacitor
echo.
echo [2/3] Synchronisation Capacitor Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la synchronisation Capacitor.
    pause
    exit /b 1
)

:: Etape 3 : Build APK
echo.
echo [3/3] Compilation APK via Gradle...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la compilation Gradle.
    cd ..
    pause
    exit /b 1
)
cd ..

set "APK_SOURCE=android\app\build\outputs\apk\debug\ctr-net-enrollement-mobile-debug.apk"
if not exist "%APK_SOURCE%" set "APK_SOURCE=android\app\build\outputs\apk\debug\app-debug.apk"
set "APK_DIST_DIR=dist\apk"
set "APK_DIST=%APK_DIST_DIR%\ctr-net-enrollement-mobile-latest-debug.apk"

if not exist "%APK_SOURCE%" (
    echo [ERREUR] APK introuvable: %APK_SOURCE%
    pause
    exit /b 1
)

if not exist "%APK_DIST_DIR%" mkdir "%APK_DIST_DIR%" >nul 2>&1
copy /Y "%APK_SOURCE%" "%APK_DIST%" >nul
if %errorlevel% neq 0 (
    echo [ERREUR] Echec de copie vers %APK_DIST%
    pause
    exit /b 1
)

echo.
echo =========================================================
echo   [OK] APK genere avec succes !
echo   Emplacement source : %APK_SOURCE%
echo   APK distribuable   : %APK_DIST%
echo =========================================================

set /p INSTALL_NOW=Installer automatiquement sur appareil Android connecte (ADB) ? [O/N]:
if /I "%INSTALL_NOW%"=="O" (
    call INSTALL_APK.bat "%APK_DIST%"
)

pause
