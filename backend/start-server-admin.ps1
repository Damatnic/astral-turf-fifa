# Astral Turf Backend Server Startup Script
# Run this as Administrator

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Astral Turf Backend Server Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "Running as Administrator" -ForegroundColor Green
Write-Host ""

# Add Windows Defender exclusion for Node.js
Write-Host "Adding Windows Defender exclusion for Node.js..." -ForegroundColor Yellow
Add-MpPreference -ExclusionProcess "node.exe" -ErrorAction SilentlyContinue
Write-Host "Node.js exclusion added" -ForegroundColor Green

Write-Host ""

# Kill any existing node processes
Write-Host "Stopping existing Node processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Cleared existing processes" -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting NestJS server on port 5555..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Green
Write-Host "  http://localhost:5555/api" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
npm run start:dev
