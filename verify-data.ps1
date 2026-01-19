# Verify inserted data
$dbHost = "212.1.211.51"
$dbPort = 3306
$dbName = "u894306996_nova"
$dbUser = "u894306996_nova"
$dbPassword = "9Amer.3lih"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Verifying Inserted Data" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "NOVA Users:" -ForegroundColor Yellow
"SELECT id, username, role FROM nova;" | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName 2>$null
Write-Host ""

Write-Host "Teams:" -ForegroundColor Yellow
"SELECT id, username, role, calls, Sales FROM team;" | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName 2>$null
Write-Host ""

Write-Host "Agents:" -ForegroundColor Yellow
"SELECT id_agent, username, role, team_id, calls, SALE FROM agent;" | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName 2>$null
Write-Host ""

Write-Host "Clients:" -ForegroundColor Yellow
"SELECT id, nom_complet, email, statut_service FROM client LIMIT 5;" | & $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword $dbName 2>$null
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Verification Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
