@echo off
REM CRM NOVA Frontend-Backend Setup Script for Windows
REM This script helps set up and run both frontend and backend

echo.
echo =====================================
echo   CRM NOVA Integration Setup
echo =====================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)

REM Check if Maven is installed
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed or not in PATH
    echo Please install Maven from https://maven.apache.org/
    pause
    exit /b 1
)

echo [OK] All prerequisites found
echo.
echo Node.js version:
node -v
echo.
echo Java version:
java -version
echo.
echo Maven version:
mvn -version
echo.

setlocal enabledelayedexpansion

:menu
cls
echo.
echo =====================================
echo   CRM NOVA Setup Menu
echo =====================================
echo.
echo 1. Install Frontend Dependencies
echo 2. Build Backend (Maven)
echo 3. Run Backend (Maven)
echo 4. Run Frontend (Vite)
echo 5. Check Backend Health
echo 6. Install All and Run (Complete Setup)
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto frontend_install
if "%choice%"=="2" goto backend_build
if "%choice%"=="3" goto backend_run
if "%choice%"=="4" goto frontend_run
if "%choice%"=="5" goto health_check
if "%choice%"=="6" goto complete_setup
if "%choice%"=="7" goto end
goto menu

:frontend_install
echo.
echo Installing Frontend Dependencies...
cd nova Frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    goto menu
)
echo [OK] Frontend dependencies installed
cd ..
pause
goto menu

:backend_build
echo.
echo Building Backend...
cd nova Frontend\CRM-NOVA-backend
call mvn clean install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build backend
    pause
    goto menu
)
echo [OK] Backend built successfully
cd ..\..
pause
goto menu

:backend_run
echo.
echo Starting Backend on http://localhost:8081...
echo Press Ctrl+C to stop the backend
cd nova Frontend\CRM-NOVA-backend
call mvn spring-boot:run
cd ..\..
pause
goto menu

:frontend_run
echo.
echo Starting Frontend on http://localhost:3000...
echo Press Ctrl+C to stop the frontend
cd nova Frontend
call npm run dev
cd ..
pause
goto menu

:health_check
echo.
echo Checking Backend Health...
timeout /t 2 >nul
for /f "usebackq delims=" %%A in (`powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8081/api/dashboard/health' -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Output 'OK' } } catch { Write-Output 'ERROR' }"`) do set result=%%A

if "%result%"=="OK" (
    echo [OK] Backend is running and healthy
    powershell -Command "Invoke-WebRequest -Uri 'http://localhost:8081/api/dashboard/health' -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json"
) else (
    echo [ERROR] Backend is not responding
    echo Make sure backend is running: mvn spring-boot:run
)
echo.
pause
goto menu

:complete_setup
echo.
echo Starting Complete Setup...
echo.

echo [Step 1] Installing Frontend Dependencies...
cd nova Frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    goto menu
)
echo [OK] Frontend dependencies installed
cd ..

echo.
echo [Step 2] Building Backend...
cd nova Frontend\CRM-NOVA-backend
call mvn clean install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build backend
    pause
    goto menu
)
echo [OK] Backend built successfully
cd ..\..

echo.
echo =====================================
echo   Setup Complete!
echo =====================================
echo.
echo Next Steps:
echo 1. Open Terminal 1: Run Backend
echo    cd "nova Frontend\CRM-NOVA-backend"
echo    mvn spring-boot:run
echo.
echo 2. Open Terminal 2: Run Frontend
echo    cd "nova Frontend"
echo    npm run dev
echo.
echo 3. Open Browser: http://localhost:3000
echo.
echo Backend will be running on: http://localhost:8081
echo.
pause
goto menu

:end
echo.
echo Goodbye!
echo.
exit /b 0
