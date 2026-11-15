@echo off
setlocal enabledelayedexpansion

title NASA Space Apps 2026 - Launcher

echo =====================================================================
echo    🚀 Astronaut Health Command Center - One-Click Launcher
echo    NASA Space Apps Challenge 2026
echo =====================================================================
echo.

:: Ensure critical tool directories are prioritized on PATH
set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\nodejs;%USERPROFILE%\.local\bin;%USERPROFILE%\.cargo\bin;C:\Windows\System32;%PATH%"

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "NASA-Space Backend - Port 8000" cmd /k "cd /d "%~dp0backend" && uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Starting Vite Frontend on http://127.0.0.1:5173 ...
start "NASA-Space Frontend - Port 5173" cmd /k "cd /d "%~dp0frontend" && (npm run dev || "C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js --host)"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo =====================================================================
echo    🌟 Systems Online!
echo    Frontend: http://127.0.0.1:5173
echo    Backend API: http://127.0.0.1:8000/docs
echo =====================================================================
echo Opening Command Center in default browser...
start http://127.0.0.1:5173

exit /b 0
