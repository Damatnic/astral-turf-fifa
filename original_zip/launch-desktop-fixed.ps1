# AstralTurf Desktop Launcher (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AstralTurf Desktop Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Node.js found: " -NoNewline -ForegroundColor Green
node --version

# Check if Rust is installed
if (-not (Test-Command "rustc")) {
    Write-Host "WARNING: Rust is not installed" -ForegroundColor Yellow
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    
    try {
        $rustupPath = Join-Path $env:TEMP "rustup-init.exe"
        Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustupPath
        Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait
        $cargoPath = Join-Path $env:USERPROFILE ".cargo\bin"
        $env:PATH = $env:PATH + ";" + $cargoPath
        Remove-Item $rustupPath -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "Failed to install Rust automatically. Please install manually from https://rustup.rs/" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✓ Rust found: " -NoNewline -ForegroundColor Green
rustc --version

# Check for Visual Studio Build Tools
$linkExists = Test-Command "link"
if (-not $linkExists) {
    Write-Host "WARNING: Visual Studio Build Tools not found" -ForegroundColor Yellow
    Write-Host "Attempting to install Microsoft C++ Build Tools..." -ForegroundColor Yellow
    
    try {
        # Try to install via winget
        winget install Microsoft.VisualStudio.2022.BuildTools --silent --accept-package-agreements --accept-source-agreements
        
        # Try to set up VS environment
        $vcvarsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
        if (Test-Path $vcvarsPath) {
            Write-Host "Setting up Visual Studio environment..." -ForegroundColor Yellow
            cmd /c "`"$vcvarsPath`" && set" | ForEach-Object {
                if ($_ -match "^(.*?)=(.*)$") {
                    Set-Content "env:\$($matches[1])" $matches[2]
                }
            }
        }
        
        # Check again
        if (-not (Test-Command "link")) {
            throw "Build tools still not available"
        }
    }
    catch {
        Write-Host ""
        Write-Host "ERROR: Could not set up build environment" -ForegroundColor Red
        Write-Host "Please install Visual Studio Build Tools manually:" -ForegroundColor Yellow
        Write-Host "https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "After installation, make sure to include:" -ForegroundColor Yellow
        Write-Host "- C++ build tools" -ForegroundColor White
        Write-Host "- Windows 10/11 SDK" -ForegroundColor White
        Write-Host ""
        Write-Host "Then run this script again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✓ Build environment ready!" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✓ Dependencies ready!" -ForegroundColor Green

# Check if Tauri CLI is available
try {
    npx tauri --version | Out-Null
}
catch {
    Write-Host "Installing Tauri CLI..." -ForegroundColor Yellow
    npm install -g @tauri-apps/cli
}

Write-Host ""
Write-Host "Launching AstralTurf Desktop Application..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This may take a few minutes on first launch as Rust dependencies compile..." -ForegroundColor Yellow
Write-Host ""

# Launch the desktop application
try {
    npm run dev
}
catch {
    Write-Host ""
    Write-Host "ERROR: Failed to launch desktop application" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure all dependencies are installed" -ForegroundColor White
    Write-Host "2. Check that Visual Studio Build Tools are properly installed" -ForegroundColor White
    Write-Host "3. Try running: npm run vite:dev (for web version)" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Desktop application closed." -ForegroundColor Green
Read-Host "Press Enter to exit"