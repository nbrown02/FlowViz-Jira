@echo off
echo.
echo  ============================================
echo   FlowViz MCP Setup
echo  ============================================
echo.

:: Check Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  Node.js is not installed on this machine.
    echo  Please download and install it from: https://nodejs.org
    echo  Choose the LTS version, then run this file again.
    echo.
    pause
    exit /b 1
)

echo  Node.js found. Installing dependencies...
echo.

cd /d "%~dp0"
call npm install

if %errorlevel% neq 0 (
    echo.
    echo  Something went wrong during installation.
    echo  Please check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo  Starting setup wizard...
echo.

call npm run setup

echo.
pause
