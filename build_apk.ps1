# =========================================================
#   CTR.NET FARDC Mobile - Build APK Android
# =========================================================

param(
    [switch]$InstallOnDevice = $false
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  CTR.NET FARDC Contrôle - Compilation APK Android" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Verifier Node.js
$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERREUR] Node.js n'est pas installe." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}
Write-Host "[OK] Node.js : $nodeVersion" -ForegroundColor Green

# Verifier Java
$javaVersion = & java -version 2>&1 | Select-String "version"
if (-not $javaVersion) {
    Write-Host "[ERREUR] Java JDK 21 n'est pas installe." -ForegroundColor Red
    Write-Host "Installez-le depuis https://adoptium.net"
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}
Write-Host "[OK] Java : $javaVersion" -ForegroundColor Green
Write-Host ""

# Verifier node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installation des dependances npm..." -ForegroundColor Yellow
    & npm install
}

# Etape 1 : Build Angular
Write-Host ""
Write-Host "[1/3] Build Angular production..." -ForegroundColor Yellow
& npx ng build --configuration production
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERREUR] Echec du build Angular." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Etape 2 : Sync Capacitor
Write-Host ""
Write-Host "[2/3] Synchronisation Capacitor Android..." -ForegroundColor Yellow
& npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERREUR] Echec de la synchronisation Capacitor." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Etape 3 : Build APK
Write-Host ""
Write-Host "[3/3] Compilation APK via Gradle..." -ForegroundColor Yellow
Push-Location android
& .\gradlew.bat assembleDebug
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host "[ERREUR] Echec de la compilation Gradle." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

$apkCandidates = @(
    (Join-Path $PSScriptRoot 'android\app\build\outputs\apk\debug\ctr-net-controle-mobile-debug.apk'),
    (Join-Path $PSScriptRoot 'android\app\build\outputs\apk\debug\ctr.net-fardc-mobile.apk'),
    (Join-Path $PSScriptRoot 'android\app\build\outputs\apk\debug\app-debug.apk')
)
$apkSource = $apkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
$apkDistDir = Join-Path $PSScriptRoot 'dist\apk'
$apkDist = Join-Path $apkDistDir 'ctr-net-controle-mobile-latest-debug.apk'

if (-not $apkSource) {
    Write-Host "[ERREUR] APK introuvable. Fichiers attendus :" -ForegroundColor Red
    $apkCandidates | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkGray }
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

if (-not (Test-Path $apkDistDir)) {
    New-Item -ItemType Directory -Path $apkDistDir | Out-Null
}

Copy-Item -Path $apkSource -Destination $apkDist -Force

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "  [OK] APK genere avec succes !" -ForegroundColor Green
Write-Host "  Emplacement source : $apkSource" -ForegroundColor Green
Write-Host "  APK distribuable   : $apkDist" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

if ($InstallOnDevice) {
    $adb = Get-Command adb -ErrorAction SilentlyContinue
    if (-not $adb) {
        Write-Host "[ERREUR] adb introuvable dans le PATH." -ForegroundColor Red
    }
    else {
        Write-Host "[INFO] Installation ADB en cours..." -ForegroundColor Yellow
        & adb install -r $apkDist
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] APK installe sur l'appareil connecte." -ForegroundColor Green
        }
        else {
            Write-Host "[ERREUR] Echec d'installation ADB." -ForegroundColor Red
        }
    }
}

Read-Host "Appuyez sur Entree pour quitter"
