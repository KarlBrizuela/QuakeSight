# Health Check Script for QuakeSight Services
Write-Host "🏥 QuakeSight Health Check" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

# Configuration
$backendUrl = $env:REACT_APP_API_URL
if (-not $backendUrl) {
    $backendUrl = "http://localhost:5000"
}

$frontendUrl = "http://localhost:3000"

# Check Backend
Write-Host "🐍 Checking Backend API..." -ForegroundColor Yellow
Write-Host "   URL: $backendUrl/api/health" -ForegroundColor Gray
try {
    $backendResponse = Invoke-WebRequest -Uri "$backendUrl/api/health" -UseBasicParsing -TimeoutSec 10
    $backendData = $backendResponse.Content | ConvertFrom-Json
    
    if ($backendData.status -eq "healthy") {
        Write-Host "   ✅ Backend: HEALTHY" -ForegroundColor Green
        Write-Host "   📊 Model Loaded: $($backendData.model_loaded)" -ForegroundColor Green
        Write-Host "   ⏰ Timestamp: $($backendData.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Backend: UNHEALTHY" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Backend: OFFLINE or UNREACHABLE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check Frontend
Write-Host "⚛️  Checking Frontend..." -ForegroundColor Yellow
Write-Host "   URL: $frontendUrl" -ForegroundColor Gray
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend: ONLINE" -ForegroundColor Green
        Write-Host "   📄 Status: $($frontendResponse.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Frontend: Unexpected status $($frontendResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Frontend: OFFLINE or UNREACHABLE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor DarkGray

# Test API Endpoint
Write-Host ""
Write-Host "🧪 Testing Prediction Endpoint..." -ForegroundColor Yellow
try {
    $testBody = @{
        fault_proximity = 15.5
        historical_quakes = 25
        max_magnitude = 6.8
        soil_risk = 0.9
        building_age = 0.7
        population_density = 8500
        tsunami_risk = 0.8
        current_risk_score = 65.5
        years_forward = 5
    } | ConvertTo-Json

    $predictResponse = Invoke-WebRequest -Uri "$backendUrl/api/predict" -Method POST -Body $testBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    $predictData = $predictResponse.Content | ConvertFrom-Json
    
    if ($predictData.success) {
        Write-Host "   ✅ Prediction API: WORKING" -ForegroundColor Green
        Write-Host "   📈 Future Risk Score: $($predictData.prediction.future_risk_score)" -ForegroundColor Green
        Write-Host "   🎯 Risk Level: $($predictData.prediction.risk_level)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Prediction API: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "Health check complete!" -ForegroundColor Cyan
