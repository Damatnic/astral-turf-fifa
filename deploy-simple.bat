@echo off
echo.
echo ================================== 
echo    ASTRAL TURF SIMPLE DEPLOYMENT
echo ==================================
echo.

echo 🚀 Running simple deployment script...
node deploy-simple.js

echo.
echo ================================== 
echo    DEPLOYMENT SCRIPT COMPLETED
echo ==================================
echo.
echo Next steps:
echo 1. Go to https://vercel.com/dashboard
echo 2. Find your "astral-turf" project
echo 3. Add environment variables from vercel-env-template.txt
echo 4. Redeploy with: vercel --prod
echo.
pause
