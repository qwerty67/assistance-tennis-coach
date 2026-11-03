@echo off
title TennisPilot Standalone
echo ========================================================
echo   Launching TennisPilot AI (Standalone Mode)
echo ========================================================
echo.
echo 1. Starting Backend for TennisPilot...
start "TennisPilot Backend" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo 2. Starting TennisPilot Dedicated UI...
start "TennisPilot UI" cmd /k "cd apps\tennis-pilot\ui && npx.cmd expo start --web"

echo.
echo TennisPilot is running standalone!
echo Web UI: http://localhost:8081
echo Backend: http://localhost:8000/docs
echo.
pause
