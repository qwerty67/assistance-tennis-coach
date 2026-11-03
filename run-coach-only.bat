@echo off
title TennisCoach Standalone
echo ========================================================
echo   Launching Tennis Coach Platform (Coach Mode)
echo ========================================================
echo.
echo 1. Starting Backend...
start "Coach Backend" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo 2. Starting Coach Mobile App...
start "Coach App" cmd /k "cd mobile && npx.cmd expo start"

echo.
echo Coach platform is running!
echo Backend: http://localhost:8000/docs
echo.
pause
