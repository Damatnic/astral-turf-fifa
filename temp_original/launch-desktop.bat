@echo off
echo ========================================
echo    AstralTurf Desktop Launcher
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Rust is installed
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Rust is not installed
    echo Installing Rust...
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    call "%USERPROFILE%\.cargo\env.bat"
)

:: Check if Visual Studio Build Tools are available
where link.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Visual Studio Build Tools not found
    echo Attempting to install Microsoft C++ Build Tools...
    
    :: Try to install via winget
    winget install Microsoft.VisualStudio.2022.BuildTools --silent --accept-package-agreements --accept-source-agreements
    
    :: Add VS Build Tools to PATH
    if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
        call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
    )
    
    :: Check again
    where link.exe >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Could not set up build environment
        echo Please install Visual Studio Build Tools manually:
        echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
        echo.
        echo After installation, make sure to include:
        echo - C++ build tools
        echo - Windows 10/11 SDK
        echo.
        echo Then run this script again.
        pause
        exit /b 1
    )
)

echo Build environment ready!
echo.

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check if Tauri CLI is installed
npx tauri --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Tauri CLI...
    npm install -g @tauri-apps/cli
)

echo.
echo Launching AstralTurf Desktop Application...
echo.
echo This may take a few minutes on first launch as Rust dependencies compile...
echo.

:: Launch the desktop application
npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to launch desktop application
    echo.
    echo Troubleshooting steps:
    echo 1. Make sure all dependencies are installed
    echo 2. Check that Visual Studio Build Tools are properly installed
    echo 3. Try running: npm run vite:dev (for web version)
    echo.
    pause
    exit /b 1
)

echo.
echo Desktop application closed.
pause