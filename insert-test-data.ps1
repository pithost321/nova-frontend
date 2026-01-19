# CRM NOVA - Insert Test Data
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRM NOVA - Test Data Insertion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendUrl = "http://localhost:8080"

# Check backend
Write-Host "`nChecking backend..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$backendUrl/api/dashboard/health" -Method Get | Out-Null
    Write-Host "Backend is running!`n" -ForegroundColor Green
} catch {
    Write-Host "Backend is NOT running! Start it first.`n" -ForegroundColor Red
    pause
    exit
}

# Login to get JWT token
Write-Host "Authenticating as NOVA..." -ForegroundColor Yellow
try {
    $loginBody = '{"email":"admin@crm.com","role":"NOVA"}'
    $loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    Write-Host "Authenticated successfully!`n" -ForegroundColor Green
} catch {
    Write-Host "Failed to authenticate: $($_.Exception.Message)`n" -ForegroundColor Red
    pause
    exit
}

# Set headers with token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Insert Teams
Write-Host "Creating teams..." -ForegroundColor Yellow
$teams = @(
    '{"id":1,"username":"Sales Team Alpha","password":"team123","calls":1250,"leads":850,"contacts":720,"contactRatio":"84.7%","Sales":156,"sales_per_working_hour":12.5,"sales_to_leads_ratio":"18.4%","sales_to_contacts_ratio":"21.7%","sales_per_hour":12.5,"incomplete_sales":8,"cancelled_sales":4,"callbacks":45,"first_call_resolution":78.5,"role":"TEAM"}',
    '{"id":2,"username":"Sales Team Bravo","password":"team123","calls":980,"leads":650,"contacts":580,"contactRatio":"89.2%","Sales":124,"sales_per_working_hour":10.8,"sales_to_leads_ratio":"19.1%","sales_to_contacts_ratio":"21.4%","sales_per_hour":10.8,"incomplete_sales":6,"cancelled_sales":3,"callbacks":38,"first_call_resolution":82.3,"role":"TEAM"}',
    '{"id":3,"username":"Sales Team Charlie","password":"team123","calls":1100,"leads":720,"contacts":650,"contactRatio":"90.3%","Sales":142,"sales_per_working_hour":11.3,"sales_to_leads_ratio":"19.7%","sales_to_contacts_ratio":"21.8%","sales_per_hour":11.3,"incomplete_sales":7,"cancelled_sales":5,"callbacks":42,"first_call_resolution":80.1,"role":"TEAM"}'
)

foreach ($team in $teams) {
    try {
        Invoke-RestMethod -Uri "$backendUrl/api/dashboard/team" -Method Post -Headers $headers -Body $team | Out-Null
        Write-Host "Created team" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create team: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Insert Agents
Write-Host "`nCreating agents..." -ForegroundColor Yellow
$agents = @(
    '{"ID":1001,"username":"john.smith@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Alpha","costPerHour":25.50,"campaign":"Winter Campaign","calls":285,"SALE":42,"N":15,"NI":8,"callbk":12,"role":"AGENT"}',
    '{"ID":1002,"username":"sarah.jones@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Alpha","costPerHour":24.00,"campaign":"Winter Campaign","calls":310,"SALE":48,"N":12,"NI":6,"callbk":15,"role":"AGENT"}',
    '{"ID":1003,"username":"mike.wilson@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Alpha","costPerHour":26.75,"campaign":"Winter Campaign","calls":298,"SALE":38,"N":18,"NI":10,"callbk":10,"role":"AGENT"}',
    '{"ID":1004,"username":"emma.davis@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Alpha","costPerHour":23.50,"campaign":"Winter Campaign","calls":357,"SALE":28,"N":20,"NI":12,"callbk":8,"role":"AGENT"}',
    '{"ID":2001,"username":"alex.brown@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Bravo","costPerHour":27.00,"campaign":"Winter Campaign","calls":265,"SALE":45,"N":10,"NI":5,"callbk":14,"role":"AGENT"}',
    '{"ID":2002,"username":"lisa.taylor@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Bravo","costPerHour":25.00,"campaign":"Winter Campaign","calls":242,"SALE":35,"N":14,"NI":8,"callbk":11,"role":"AGENT"}',
    '{"ID":2003,"username":"david.miller@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Bravo","costPerHour":24.50,"campaign":"Winter Campaign","calls":235,"SALE":22,"N":16,"NI":9,"callbk":7,"role":"AGENT"}',
    '{"ID":2004,"username":"rachel.white@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Bravo","costPerHour":26.00,"campaign":"Winter Campaign","calls":238,"SALE":22,"N":15,"NI":7,"callbk":6,"role":"AGENT"}',
    '{"ID":3001,"username":"chris.martin@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Charlie","costPerHour":28.00,"campaign":"Winter Campaign","calls":320,"SALE":52,"N":11,"NI":4,"callbk":16,"role":"AGENT"}',
    '{"ID":3002,"username":"jenny.lee@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Charlie","costPerHour":25.75,"campaign":"Winter Campaign","calls":295,"SALE":40,"N":13,"NI":7,"callbk":13,"role":"AGENT"}',
    '{"ID":3003,"username":"tom.anderson@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Charlie","costPerHour":24.25,"campaign":"Winter Campaign","calls":268,"SALE":28,"N":17,"NI":9,"callbk":9,"role":"AGENT"}',
    '{"ID":3004,"username":"maria.garcia@crm.com","password":"agent123","mostCurrentUserGroup":"Sales Team Charlie","costPerHour":26.50,"campaign":"Winter Campaign","calls":217,"SALE":22,"N":19,"NI":11,"callbk":4,"role":"AGENT"}'
)

$count = 0
foreach ($agent in $agents) {
    try {
        Invoke-RestMethod -Uri "$backendUrl/api/dashboard/agent" -Method Post -Headers $headers -Body $agent | Out-Null
        $count++
        Write-Host "Created agent $count of 12" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create agent: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Data Insertion Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "  Teams: 3" -ForegroundColor White
Write-Host "  Agents: $count" -ForegroundColor White
Write-Host "`nView at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nTest logins:" -ForegroundColor Yellow
Write-Host "  NOVA: any email" -ForegroundColor White
Write-Host "  AGENT: john.smith@crm.com" -ForegroundColor White
Write-Host ""
pause
