# ============================================================
# Vidya Jyothi Smart School Management System
# Windows Setup Script - PowerShell
# Run: Right-click this file → "Run with PowerShell"
# OR open PowerShell in this folder and type: .\setup_windows.ps1
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Vidya Jyothi - Smart School Management System" -ForegroundColor Cyan
Write-Host "  Windows Setup Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Fix PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force 2>$null

# ── Check Python ─────────────────────────────────────────────
Write-Host "[1/6] Checking Python installation..." -ForegroundColor Yellow
try {
    $pyVersion = python --version 2>&1
    if ($pyVersion -match "Python 3") {
        Write-Host "  ✅ $pyVersion found" -ForegroundColor Green
    } else {
        throw "Not Python 3"
    }
} catch {
    Write-Host "  ❌ Python 3 not found!" -ForegroundColor Red
    Write-Host "  👉 Download from: https://python.org/downloads" -ForegroundColor White
    Write-Host "  ⚠  During install, CHECK 'Add Python to PATH'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ── Check Node.js ────────────────────────────────────────────
Write-Host "[2/6] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "  👉 Download from: https://nodejs.org (LTS version)" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node version is 18+
$nodeVersionNumber = (node --version) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersionNumber -lt 18) {
    Write-Host "  ⚠  Node.js version is too old. Need v18 or higher." -ForegroundColor Yellow
    Write-Host "  👉 Download LTS from: https://nodejs.org" -ForegroundColor White
}

# ── Backend Setup ────────────────────────────────────────────
Write-Host "[3/6] Setting up Python Backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment
if (-Not (Test-Path "venv")) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

# Activate venv
& ".\venv\Scripts\Activate.ps1" 2>$null
if (-Not $?) {
    Write-Host "  Trying alternate activation..." -ForegroundColor Gray
    cmd /c "venv\Scripts\activate.bat"
}

# Install dependencies
Write-Host "  Installing Python packages..." -ForegroundColor Gray
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Python packages installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠  Some packages may have failed. Trying individually..." -ForegroundColor Yellow
    pip install flask PyJWT werkzeug --quiet
    pip install scikit-learn numpy pandas joblib --quiet
}

Set-Location ..

# ── Frontend Setup ───────────────────────────────────────────
Write-Host "[4/6] Setting up Next.js Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Delete old node_modules to prevent binary conflicts
if (Test-Path "node_modules") {
    Write-Host "  Removing old node_modules (prevents SWC binary errors)..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}

# Delete package-lock.json to get fresh install
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}

# Clear npm cache
Write-Host "  Clearing npm cache..." -ForegroundColor Gray
npm cache clean --force 2>$null

# Fresh install
Write-Host "  Installing npm packages (this takes 2-3 minutes)..." -ForegroundColor Gray
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Frontend packages installed" -ForegroundColor Green
} else {
    Write-Host "  Retrying with --force..." -ForegroundColor Yellow
    npm install --force
}

Set-Location ..

# ── Verify Setup ─────────────────────────────────────────────
Write-Host "[5/6] Verifying setup..." -ForegroundColor Yellow
if (Test-Path "backend\app.py") {
    Write-Host "  ✅ Backend: app.py found" -ForegroundColor Green
}
if (Test-Path "frontend\src\app\page.tsx") {
    Write-Host "  ✅ Frontend: Next.js pages found" -ForegroundColor Green
}
if (Test-Path "frontend\node_modules\next") {
    Write-Host "  ✅ Next.js: installed" -ForegroundColor Green
}

# ── Create Launch Scripts ─────────────────────────────────────
Write-Host "[6/6] Creating launch scripts..." -ForegroundColor Yellow

# Backend launcher
@"
@echo off
title Vidya Jyothi - Backend Server
echo ============================================================
echo  Vidya Jyothi Backend Server Starting...
echo ============================================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
python app.py
pause
"@ | Out-File -FilePath "backend\START_BACKEND.bat" -Encoding ASCII

# Frontend launcher
@"
@echo off
title Vidya Jyothi - Frontend Server
echo ============================================================
echo  Vidya Jyothi Frontend Starting...
echo  Open browser at: http://localhost:3000
echo ============================================================
cd /d "%~dp0"
npm run dev
pause
"@ | Out-File -FilePath "frontend\START_FRONTEND.bat" -Encoding ASCII

Write-Host "  ✅ Launch scripts created" -ForegroundColor Green

# ── Final Instructions ────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  TO RUN THE SYSTEM:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  STEP 1 - Start Backend:" -ForegroundColor White
Write-Host "    Double-click: backend\START_BACKEND.bat" -ForegroundColor Yellow
Write-Host "    OR: cd backend → .\venv\Scripts\activate → python app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  STEP 2 - Start Frontend (new terminal):" -ForegroundColor White
Write-Host "    Double-click: frontend\START_FRONTEND.bat" -ForegroundColor Yellow
Write-Host "    OR: cd frontend → npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  STEP 3 - Open Browser:" -ForegroundColor White
Write-Host "    http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  LOGIN CREDENTIALS:" -ForegroundColor Cyan
Write-Host "    Admin:   vijayalakshmi.iyer  / admin123" -ForegroundColor White
Write-Host "    Teacher: lakshmi_narayanan   / teacher123" -ForegroundColor White
Write-Host "    Student: student0001          / student123" -ForegroundColor White
Write-Host "    Parent:  parent0001           / parent123" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Read-Host "Press Enter to close"
