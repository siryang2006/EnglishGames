@echo off
cd /d "%~dp0"
echo =========================================
echo   English Tank Battle - Launcher
echo =========================================
echo.
echo Starting local server...
echo.
echo Please open in browser: http://localhost:8080
echo.
echo Keep this window open while playing
echo.
python -m http.server 8080