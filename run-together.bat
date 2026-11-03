@echo off
title Unified Platform (Coach + TennisPilot)
echo ========================================================
echo   Launching Coach Assistant Platform (Unified Ecosystem)
echo ========================================================
echo.
echo 1. Starting Unified Backend (FastAPI + TennisPilot APIs)...
start "Platform Backend" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo 2. Starting Unified Mobile App (with TennisPilot Hub)...
start "Unified Mobile App" cmd /k "cd mobile && npx.cmd expo start"

echo.
echo Both services are running in their respective windows!
echo Backend: http://localhost:8000/docs
echo.
pause
