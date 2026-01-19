# Check existing database tables
$dbHost = "212.1.211.51"
$dbPort = 3306
$dbName = "u894306996_nova"
$dbUser = "u894306996_nova"
$dbPassword = "9Amer.3lih"

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host "Checking existing tables..." -ForegroundColor Cyan
Write-Host ""

$query = "SHOW TABLES;"
$query | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName

Write-Host ""
Write-Host "Checking table structures..." -ForegroundColor Cyan
Write-Host ""

$tables = @("nova", "team", "agent", "client")
foreach ($table in $tables) {
    Write-Host "=== $table ===" -ForegroundColor Yellow
    "DESCRIBE $table;" | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName 2>$null
    Write-Host ""
}
