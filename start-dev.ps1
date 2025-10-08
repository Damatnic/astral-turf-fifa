# Astral Turf Development Server Startup
# Starts both frontend and backend servers for THIS project only

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Astral Turf Development Servers" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = $projectRoot

Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# Check if backend server is already running on port 5555
$backendRunning = Get-NetTCPConnection -LocalPort 5555 -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "Backend already running on port 5555" -ForegroundColor Green
} else {
    Write-Host "Starting Backend Server (port 5555)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run start:dev" -WindowStyle Normal
    Write-Host "Backend server starting in new window..." -ForegroundColor Green
}

Write-Host ""

# Check if frontend server is already running on port 5173
$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Write-Host "Frontend already running on port 5173" -ForegroundColor Green
} else {
    Write-Host "Starting Frontend Server (port 5173)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run vite:dev" -WindowStyle Normal
    Write-Host "Frontend server starting in new window..." -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Servers Starting!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5555/api" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Both servers will open in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
