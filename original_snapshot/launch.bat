@echo off
echo ========================================
echo       AstralTurf Launcher
echo ========================================
echo.
echo Choose your preferred launch method:
echo.
echo 1. Desktop Application (Tauri)
echo 2. Web Application (Browser)
echo 3. Auto-detect (Try desktop, fallback to web)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto desktop
if "%choice%"=="2" goto web
if "%choice%"=="3" goto auto
echo Invalid choice. Defaulting to auto-detect...

:auto
echo.
echo Attempting to launch desktop version...
echo.

:: Check if build tools are available
where link.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo Build tools not available. Launching web version instead...
    goto web
)

:: Try desktop launch
npm run dev >nul 2>&1
if %errorlevel% neq 0 (
    echo Desktop launch failed. Launching web version instead...
    goto web
) else (
    echo Desktop application launched successfully!
    goto end
)

:desktop
echo.
echo Launching Desktop Application...
call launch-desktop.bat
goto end

:web
echo.
echo Launching Web Application...
call launch-web.bat
goto end

:end
echo.
echo Application closed.
pause