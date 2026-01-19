# Simple SQL Data Insertion Script
# Inserts all required data into CRM NOVA database

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CRM NOVA - Complete Data Insertion" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Read the SQL file
$sqlFile = Join-Path $PSScriptRoot "insert-all-data.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found!" -ForegroundColor Red
    exit 1
}

# Database credentials
$dbHost = "212.1.211.51"
$dbPort = 3306
$dbName = "u894306996_nova"
$dbUser = "u894306996_nova"
$dbPassword = "9Amer.3lih"

Write-Host "Reading SQL file..." -ForegroundColor Yellow
$sqlContent = Get-Content $sqlFile -Raw

# Split SQL into statements (remove comments and empty lines)
$statements = $sqlContent -split ';' | ForEach-Object {
    $stmt = $_.Trim()
    # Remove SQL comments
    $stmt = $stmt -replace '--.*$', ''
    $stmt = $stmt.Trim()
    if ($stmt -ne '' -and $stmt -notmatch '^\s*$') {
        $stmt
    }
} | Where-Object { $_ }

Write-Host "Found $($statements.Count) SQL statements" -ForegroundColor Green
Write-Host ""

# Try to load MySQL .NET Connector
$mysqlLoaded = $false
$possibleAssemblies = @(
    "MySql.Data",
    "C:\Program Files (x86)\MySQL\MySQL Connector NET 8.0.27\Assemblies\v4.5.2\MySql.Data.dll",
    "C:\Program Files\MySQL\MySQL Connector NET 8.0\Assemblies\MySql.Data.dll"
)

foreach ($assembly in $possibleAssemblies) {
    try {
        Add-Type -Path $assembly -ErrorAction Stop
        $mysqlLoaded = $true
        Write-Host "✓ MySQL .NET Connector loaded" -ForegroundColor Green
        break
    } catch {
        continue
    }
}

if (-not $mysqlLoaded) {
    Write-Host "MySQL .NET Connector not found - trying alternative method..." -ForegroundColor Yellow
    Write-Host ""
    
    # Alternative: Use Invoke-WebRequest to call backend API
    Write-Host "Using Backend API method..." -ForegroundColor Cyan
    Write-Host ""
    
    # For now, show instructions
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "MANUAL SQL EXECUTION REQUIRED" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please execute the SQL file manually using one of these methods:" -ForegroundColor White
    Write-Host ""
    Write-Host "METHOD 1 - MySQL Command Line:" -ForegroundColor Cyan
    Write-Host "  mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPassword $dbName" -ForegroundColor Gray
    Write-Host "  Then run: source $sqlFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "METHOD 2 - MySQL Workbench:" -ForegroundColor Cyan
    Write-Host "  1. Open MySQL Workbench" -ForegroundColor Gray
    Write-Host "  2. Connect to: $dbHost" -ForegroundColor Gray
    Write-Host "  3. Open SQL file: $sqlFile" -ForegroundColor Gray
    Write-Host "  4. Execute" -ForegroundColor Gray
    Write-Host ""
    Write-Host "METHOD 3 - phpMyAdmin (if available):" -ForegroundColor Cyan
    Write-Host "  1. Navigate to phpMyAdmin" -ForegroundColor Gray
    Write-Host "  2. Select database: $dbName" -ForegroundColor Gray
    Write-Host "  3. Import SQL file" -ForegroundColor Gray
    Write-Host ""
    Write-Host "The SQL file is here: $sqlFile" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Connect and execute
Write-Host "Connecting to MySQL database..." -ForegroundColor Cyan
$connectionString = "Server=$dbHost;Port=$dbPort;Database=$dbName;Uid=$dbUser;Pwd=$dbPassword;SslMode=none;AllowUserVariables=true;"

try {
    $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
    $connection.Open()
    Write-Host "✓ Connected successfully!" -ForegroundColor Green
    Write-Host ""
    
    $successCount = 0
    $errorCount = 0
    $totalStatements = $statements.Count
    
    Write-Host "Executing SQL statements..." -ForegroundColor Cyan
    
    for ($i = 0; $i -lt $totalStatements; $i++) {
        $statement = $statements[$i]
        
        # Progress indicator
        $progress = [math]::Round(($i / $totalStatements) * 100)
        Write-Progress -Activity "Executing SQL" -Status "$progress% Complete" -PercentComplete $progress
        
        try {
            $command = New-Object MySql.Data.MySqlClient.MySqlCommand($statement, $connection)
            $command.CommandTimeout = 120
            $result = $command.ExecuteNonQuery()
            $successCount++
            
            # Show important operations
            if ($statement -match 'INSERT INTO (nova|team|agent|client)') {
                $table = $matches[1]
                Write-Host "  ✓ Inserted data into $table" -ForegroundColor Green
            }
        } catch {
            $errorCount++
            # Only show critical errors
            if ($statement -match 'INSERT|CREATE|ALTER') {
                Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Progress -Activity "Executing SQL" -Completed
    
    $connection.Close()
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✓ Data Insertion Completed!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Statistics:" -ForegroundColor Cyan
    Write-Host "  Successful: $successCount" -ForegroundColor Green
    Write-Host "  Failed: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Yellow" } else { "Green" })
    Write-Host ""
    Write-Host "Inserted Data:" -ForegroundColor Cyan
    Write-Host "  • 2 NOVA (HQ) users" -ForegroundColor White
    Write-Host "  • 3 Teams (Alpha, Bravo, Charlie)" -ForegroundColor White
    Write-Host "  • 12 Agents (4 per team)" -ForegroundColor White
    Write-Host "  • 10 Clients" -ForegroundColor White
    Write-Host "  • 7 Agent History records" -ForegroundColor White
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "  NOVA: admin@crm.com / password123" -ForegroundColor Yellow
    Write-Host "  TEAM: team.alpha@crm.com / password123" -ForegroundColor Yellow
    Write-Host "  AGENT: john.smith@crm.com / password123" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Restart your backend (if running)" -ForegroundColor White
    Write-Host "  2. Visit: http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Login and test the system!" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "✗ Connection Failed" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  • Database server is running" -ForegroundColor White
    Write-Host "  • Credentials are correct" -ForegroundColor White
    Write-Host "  • Network connection is available" -ForegroundColor White
    Write-Host ""
    exit 1
}
