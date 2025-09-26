@echo off
setlocal enabledelayedexpansion

:: Astral Turf Vercel Deployment Script (Windows Batch)
echo.
echo ================================== 
echo    ASTRAL TURF VERCEL DEPLOYMENT
echo ==================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed
echo.

:: Install Vercel CLI if not present
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 🚀 Installing Vercel CLI...
    npm install -g vercel@latest
    if errorlevel 1 (
        echo ❌ Failed to install Vercel CLI
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI installed
) else (
    echo ✅ Vercel CLI is already installed
)
echo.

:: Run the Node.js deployment script
echo 🚀 Starting automated deployment...
echo.

:: Check if production flag should be used
set "PROD_FLAG="
if "%1"=="--prod" set "PROD_FLAG=--prod"
if "%1"=="production" set "PROD_FLAG=--prod"

:: Run the deployment script
node deploy-vercel.js %PROD_FLAG%

if errorlevel 1 (
    echo.
    echo ❌ Deployment failed. Please check the error messages above.
    echo.
    echo Troubleshooting:
    echo 1. Make sure you're logged into Vercel (run: vercel login)
    echo 2. Check your internet connection
    echo 3. Verify all environment variables are set correctly
    echo 4. Try running: npm run build (to test local build)
    echo.
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo.
echo Next steps:
echo 1. Visit your Vercel dashboard to manage your deployment
echo 2. Update your Gemini API key if needed
echo 3. Configure custom domain if desired
echo 4. Test your application thoroughly
echo.
pause
