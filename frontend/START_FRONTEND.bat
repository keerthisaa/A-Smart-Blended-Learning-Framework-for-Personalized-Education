@echo off
title Vidya Jyothi - Frontend
echo ============================================================
echo  Vidya Jyothi Smart School Management System
echo  Frontend Starting on http://localhost:3000
echo ============================================================
cd /d "%~dp0"

REM Delete old node_modules to fix SWC binary errors
if exist "node_modules\.modules.yaml" (
    echo node_modules found, checking...
) else (
    echo Installing npm packages...
    npm install --legacy-peer-deps
)

echo.
echo Starting frontend...
echo Open browser at: http://localhost:3000
echo.
npm run dev
pause
