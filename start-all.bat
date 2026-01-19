@echo off
echo ========================================
echo CRM NOVA - Complete System Startup
echo ========================================
echo.
echo This will start both the backend and frontend servers.
echo.

echo Starting Backend Server in a new window...
start "CRM NOVA Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server in a new window...
start "CRM NOVA Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Check the separate windows for server status.
echo.
pause
