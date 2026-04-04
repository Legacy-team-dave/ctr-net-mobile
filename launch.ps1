# =========================================================
#   ENROL.NET - Serveur de developpement
# =========================================================

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  ENROL.NET - Demarrage serveur dev" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Verifier Node.js
$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERREUR] Node.js n'est pas installe." -ForegroundColor Red
    Write-Host "Installez Node.js 22+ depuis https://nodejs.org"
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}
Write-Host "[OK] Node.js : $nodeVersion" -ForegroundColor Green

$npmVersion = & npm --version 2>$null
Write-Host "[OK] npm : $npmVersion" -ForegroundColor Green
Write-Host ""

# Verifier node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installation des dependances npm..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Echec de l'installation npm." -ForegroundColor Red
        Read-Host "Appuyez sur Entree pour quitter"
        exit 1
    }
    Write-Host ""
}

Write-Host "[INFO] Demarrage du serveur Ionic (http://localhost:8100)..." -ForegroundColor Yellow
Write-Host "[INFO] Appuyez sur Ctrl+C pour arreter." -ForegroundColor Yellow
Write-Host ""
& npm start
