@echo off
echo ========================================
echo    AstralTurf Web Launcher
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

echo.
echo Launching AstralTurf Web Application...
echo.
echo The application will open in your default browser.
echo Press Ctrl+C to stop the server.
echo.

:: Launch the web application
npm run vite:dev

echo.
echo Web application stopped.
pause