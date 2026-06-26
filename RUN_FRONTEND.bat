@echo off
title Kartik Paver ERP - React Frontend
echo ===================================================
echo   KARTIK PAVER INDUSTRIES - REACT FRONTEND SYSTEM
echo ===================================================
echo.

:: Check for Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in system PATH.
    echo Please install Node.js LTS version from nodejs.org.
    pause
    exit /b 1
)

:: Navigate to frontend
cd /d "%~dp0\frontend"

echo [STATUS] Installing React dependencies (npm install)...
call npm install

echo.
echo ===================================================
echo   SUCCESS: Frontend is ready!
echo   Launching dev environment at: http://localhost:3000
echo ===================================================
echo.
call npm run dev
pause
