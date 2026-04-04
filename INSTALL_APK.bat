@echo off
chcp 65001 >nul
title ENROL.NET - Installation APK

set "APK_PATH=%~1"
if "%APK_PATH%"=="" set "APK_PATH=dist\apk\ctr-net-enrollement-mobile-latest-debug.apk"
if not exist "%APK_PATH%" set "APK_PATH=android\app\build\outputs\apk\debug\ctr-net-enrollement-mobile-debug.apk"
if not exist "%APK_PATH%" set "APK_PATH=android\app\build\outputs\apk\debug\ctr.net-fardc-mobile.apk"
if not exist "%APK_PATH%" set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"

echo =========================================================
echo   ENROL.NET - Installation APK Android
echo =========================================================
echo.

echo APK cible: %APK_PATH%
if not exist "%APK_PATH%" (
    echo [ERREUR] APK introuvable.
    echo Construisez d'abord l'APK via BUILD_APK.bat
    pause
    exit /b 1
)

where adb >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] adb introuvable dans le PATH.
    echo Installez Android Platform-Tools puis ajoutez adb au PATH.
    echo Installation manuelle possible en copiant l'APK sur le telephone:
    echo   %CD%\%APK_PATH%
    pause
    exit /b 1
)

echo.
echo [INFO] Appareils detectes:
for /f "skip=1 tokens=1,2" %%A in ('adb devices') do (
    if "%%B"=="device" echo   - %%A
)

adb get-state >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Aucun appareil Android pret.
    echo Activez le mode Developpeur + Debogage USB puis reconnectez l'appareil.
    pause
    exit /b 1
)

echo.
echo [INFO] Installation en cours...
adb install -r -d "%APK_PATH%"
if %errorlevel% neq 0 (
    echo [ERREUR] Echec d'installation ADB.
    echo Causes probables :
    echo   - signature differente entre l'ancienne et la nouvelle APK ;
    echo   - version plus ancienne ou identique deja presente sur l'appareil ;
    echo   - application provenant d'un ancien build non signe avec la cle stable.
    echo Si une tres ancienne version est encore installee, desinstallez-la une fois puis reinstallez cette nouvelle APK.
    pause
    exit /b 1
)

echo.
echo [OK] APK installe avec succes sur l'appareil connecte.
pause
