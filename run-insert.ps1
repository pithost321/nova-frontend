# Execute the fixed SQL script
$dbHost = "212.1.211.51"
$dbPort = 3306
$dbName = "u894306996_nova"
$dbUser = "u894306996_nova"
$dbPassword = "9Amer.3lih"
$sqlFile = Join-Path $PSScriptRoot "insert-all-data-fixed.sql"

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CRM NOVA - Inserting All Data" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found" -ForegroundColor Red
    exit 1
}

Write-Host "Executing SQL..." -ForegroundColor Yellow
$sqlContent = Get-Content $sqlFile -Raw
$sqlContent | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName 2>&1 | ForEach-Object {
    $line = $_.ToString()
    if ($line -notmatch "Warning.*password") {
        if ($line -match "ERROR") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "Message|Nova_Users|Teams|Agents|Clients") {
            Write-Host $line -ForegroundColor Green
        } else {
            Write-Host $line -ForegroundColor Gray
        }
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database populated with:" -ForegroundColor Cyan
    Write-Host "  2 NOVA users" -ForegroundColor White
    Write-Host "  3 Teams" -ForegroundColor White
    Write-Host "  12 Agents" -ForegroundColor White
    Write-Host "  10 Clients" -ForegroundColor White
    Write-Host ""
    Write-Host "Login with:" -ForegroundColor Cyan
    Write-Host "  admin@crm.com / password123" -ForegroundColor Yellow
    Write-Host "  team.alpha@crm.com / password123" -ForegroundColor Yellow
    Write-Host "  john.smith@crm.com / password123" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "FAILED - Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
