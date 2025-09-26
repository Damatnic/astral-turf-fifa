@echo off
echo.
echo ========================================
echo   ASTRAL TURF - QUICK VERCEL DEPLOY
echo ========================================
echo.

echo ✅ Logged in as: damatnic
echo.

echo 🚀 Starting Vercel deployment...
echo.
echo WHEN PROMPTED, ANSWER:
echo - Set up and deploy? → y
echo - Which scope? → damatnic (or press Enter)
echo - Link to existing project? → n
echo - Project name? → astral-turf
echo - Directory? → ./ (or press Enter)
echo.
echo Press any key to start deployment...
pause >nul

echo.
echo 🚀 Running: vercel --name astral-turf
echo.

vercel --name astral-turf

echo.
echo ========================================
echo   DEPLOYMENT COMPLETED!
echo ========================================
echo.
echo 📋 NEXT STEPS:
echo 1. Go to: https://vercel.com/dashboard
echo 2. Find your "astral-turf" project
echo 3. Settings → Environment Variables
echo 4. Add variables from vercel-env-template.txt
echo 5. Run: vercel --prod
echo.
echo 🎉 Your app should be live!
echo.
pause
