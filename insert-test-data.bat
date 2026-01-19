@echo off
echo ========================================
echo CRM NOVA - Insert Test Data
echo ========================================
echo.
echo This will insert sample teams and agents into the database.
echo Make sure the backend is running before proceeding!
echo.
pause

powershell.exe -ExecutionPolicy Bypass -File "%~dp0insert-test-data.ps1"

pause
