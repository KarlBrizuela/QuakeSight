# QuakeSight Backend Startup Script
Write-Host "🚀 Starting QuakeSight XGBoost Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
$venvPath = ".\backend\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please run: cd backend; python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Start the server using venv Python
$pythonExe = ".\backend\venv\Scripts\python.exe"
$appPath = ".\backend\app.py"

Write-Host "🎯 Starting Flask server on http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

& $pythonExe $appPath
