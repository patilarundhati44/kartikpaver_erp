@echo off
title Kartik Paver ERP - Django Backend Server
echo ===================================================
echo   KARTIK PAVER INDUSTRIES - BACKEND SERVER SYSTEM
echo ===================================================
echo.

:: Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in system PATH.
    echo Please install Python 3.10+ from python.org and check "Add Python to PATH".
    pause
    exit /b 1
)

:: Navigate to backend
cd /d "%~dp0\backend"

:: Set up virtual environment
if not exist "venv" (
    echo [STATUS] Creating virtual environment venv...
    python -m venv venv
)

echo [STATUS] Activating virtual environment...
call venv\Scripts\activate

echo [STATUS] Installing required libraries...
pip install -r requirements.txt

echo [STATUS] Applying database schema migrations...
python manage.py makemigrations api
python manage.py migrate

echo [STATUS] Provisioning Default Admin User (username: kartikpaver / password: admin123)...
python manage.py ensure_admin

:: [DISABLED] Seeding database script to make user data permanent
:: echo [STATUS] Seeding database with realistic sample transactions...
:: python manage.py seed_data

echo.
echo ===================================================
echo   SUCCESS: Backend is ready!
echo   Starting server at: http://localhost:8000
echo ===================================================
echo.
python manage.py runserver
pause
