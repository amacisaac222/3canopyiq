@echo off
echo ==================================================
echo     CanopyIQ Auto-Tracker for Claude Code
echo ==================================================
echo.

REM Check if npm packages are installed
if not exist packages\tracker\node_modules (
    echo Installing tracker dependencies...
    cd packages\tracker
    call npm install
    cd ..\..
    echo.
)

echo Starting automatic tracking...
echo.
echo File changes will be tracked automatically!
echo View live session at: http://localhost:3000/dashboard/sessions
echo.
echo Press Ctrl+C to stop tracking
echo ==================================================
echo.

REM Start the tracker
node packages\tracker\index.js