@echo off
title Vidya Jyothi - Backend Server
echo ============================================================
echo  Vidya Jyothi Smart School Management System
echo  Backend Server Starting on http://localhost:5000
echo ============================================================
cd /d "%~dp0"

REM Check if venv exists, create if not
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements if needed
echo Checking Python packages...
pip install flask PyJWT werkzeug scikit-learn numpy pandas joblib -q

REM Start the server
echo.
echo Starting backend server...
echo First run will seed the database (takes ~30 seconds)
echo.
python app.py
pause
