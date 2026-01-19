@echo off
echo ========================================
echo Starting CRM NOVA Frontend Application
echo ========================================
echo.

echo Checking for Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Installing dependencies (if needed)...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo.
echo The application will open at: http://localhost:3000
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the development server!
    pause
    exit /b 1
)

pause
