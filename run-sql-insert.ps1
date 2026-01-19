# Simple SQL Data Insertion Script for CRM NOVA
# Run this to populate the database with all required test data

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CRM NOVA - Complete Data Insertion" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$dbHost = "212.1.211.51"
$dbPort = 3306
$dbName = "u894306996_nova"
$dbUser = "u894306996_nova"
$dbPassword = "9Amer.3lih"
$sqlFile = Join-Path $PSScriptRoot "insert-all-data.sql"

# Verify SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found at: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "SQL File: $sqlFile" -ForegroundColor Green
Write-Host ""

# Try to find mysql.exe
$mysqlExe = $null
$searchPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe"
)

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        break
    }
}

if ($null -eq $mysqlExe) {
    # Check if mysql is in PATH
    try {
        $null = Get-Command mysql -ErrorAction Stop
        $mysqlExe = "mysql"
    } catch {
        Write-Host "MySQL client not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "MANUAL EXECUTION REQUIRED:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1 - Install MySQL Client:" -ForegroundColor Cyan
        Write-Host "  Download from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 2 - Use MySQL Workbench:" -ForegroundColor Cyan
        Write-Host "  1. Download from: https://dev.mysql.com/downloads/workbench/" -ForegroundColor Gray
        Write-Host "  2. Connect to: $dbHost port $dbPort" -ForegroundColor Gray
        Write-Host "  3. Database: $dbName" -ForegroundColor Gray
        Write-Host "  4. User: $dbUser" -ForegroundColor Gray
        Write-Host "  5. Execute file: $sqlFile" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 3 - Use online tool (phpMyAdmin):" -ForegroundColor Cyan
        Write-Host "  Access via your hosting panel and import SQL file" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host "MySQL client found: $mysqlExe" -ForegroundColor Green
Write-Host "Connecting to database..." -ForegroundColor Cyan
Write-Host ""

# Build mysql command
$mysqlArgs = @(
    "--host=$dbHost",
    "--port=$dbPort",
    "--user=$dbUser",
    "--password=$dbPassword",
    $dbName
)

# Read and execute SQL
Write-Host "Executing SQL file..." -ForegroundColor Cyan

try {
    # Execute via stdin
    $sqlContent = Get-Content $sqlFile -Raw
    $sqlContent | & $mysqlExe @mysqlArgs 2>&1 | ForEach-Object {
        $line = $_.ToString()
        if ($line -match "ERROR|error") {
            Write-Host "  [ERROR] $line" -ForegroundColor Red
        } elseif ($line -match "Warning|warning") {
            Write-Host "  [WARN] $line" -ForegroundColor Yellow
        } else {
            Write-Host "  $line" -ForegroundColor Gray
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "SUCCESS - Data Inserted!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Database now contains:" -ForegroundColor Cyan
        Write-Host "  - 2 NOVA users (HQ)" -ForegroundColor White
        Write-Host "  - 3 Teams (Alpha, Bravo, Charlie)" -ForegroundColor White
        Write-Host "  - 12 Agents (4 per team)" -ForegroundColor White
        Write-Host "  - 10 Clients" -ForegroundColor White
        Write-Host "  - 7 Historical records" -ForegroundColor White
        Write-Host ""
        Write-Host "Test Login Credentials:" -ForegroundColor Cyan
        Write-Host "  NOVA Role:  admin@crm.com / password123" -ForegroundColor Yellow
        Write-Host "  TEAM Role:  team.alpha@crm.com / password123" -ForegroundColor Yellow
        Write-Host "  AGENT Role: john.smith@crm.com / password123" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Restart backend (if running)" -ForegroundColor White
        Write-Host "  2. Open http://localhost:3000" -ForegroundColor White
        Write-Host "  3. Login and test!" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Red
        Write-Host "FAILED - Exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}
