@echo off
echo ========================================
echo Starting CRM NOVA Backend Server
echo ========================================
echo.

cd /d "%~dp0CRM-NOVA-backend"

echo Checking for Maven...
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed or not in PATH!
    echo Please install Maven and add it to your system PATH.
    echo Download from: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

echo Maven found!
echo.

echo Building and starting the backend...
echo This may take a few moments on first run...
echo.

call mvnw.cmd clean spring-boot:run

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the backend server!
    pause
    exit /b 1
)

pause
