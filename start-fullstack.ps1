# QuakeSight - Full Stack Startup
Write-Host "🌍 QuakeSight Full Stack Launcher" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

# Start Backend in new window
Write-Host "🐍 Starting Python XGBoost Backend..." -ForegroundColor Yellow
$backendScript = Join-Path $PSScriptRoot "start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$backendScript`""
Write-Host "✅ Backend starting in new window (http://localhost:5000)" -ForegroundColor Green
Start-Sleep -Seconds 3

# Start Frontend
Write-Host ""
Write-Host "⚛️  Starting React Frontend..." -ForegroundColor Yellow
Write-Host "✅ Frontend will start on http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "🎯 Both servers starting..." -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

npm start
