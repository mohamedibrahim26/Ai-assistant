@echo off
title Vera — Starting Up
echo.
echo  ██╗   ██╗███████╗██████╗  █████╗
echo  ██║   ██║██╔════╝██╔══██╗██╔══██╗
echo  ██║   ██║█████╗  ██████╔╝███████║
echo  ╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══██║
echo   ╚████╔╝ ███████╗██║  ██║██║  ██║
echo    ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
echo.
echo  Life Companion AI — Starting all services...
echo  ─────────────────────────────────────────────
echo.

:: ── Step 1: Python AI Service (Groq / Llama) ─────────────────────────────────
echo [1/3] Starting AI Service (Groq + Llama 3.1 8B)...
set AI_DIR=%~dp0ai-service

if not exist "%AI_DIR%\venv" (
    echo       Setting up Python venv for the first time...
    cd /d "%AI_DIR%"
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
)

start "Vera AI Service" cmd /k "cd /d "%AI_DIR%" && venv\Scripts\activate && python main.py"

echo       Waiting for AI service to load...
timeout /t 5 /nobreak >nul

:: ── Step 2: Node Backend ──────────────────────────────────────────────────────
echo [2/3] Starting Vera backend...
set BACKEND_DIR=%~dp0backend

start "Vera Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

timeout /t 2 /nobreak >nul

:: ── Step 3: React Frontend ────────────────────────────────────────────────────
echo [3/3] Starting Vera frontend...
set FRONTEND_DIR=%~dp0frontend

if not exist "%FRONTEND_DIR%\node_modules" (
    echo       Installing frontend dependencies ^(first time only^)...
    cd /d "%FRONTEND_DIR%"
    npm install
)

start "Vera Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

:: ── Open browser ──────────────────────────────────────────────────────────────
echo.
echo  ─────────────────────────────────────────────
echo  All services starting!
echo.
echo  AI Service:  http://localhost:8000
echo  Backend:     http://localhost:3001
echo  Vera App:    http://localhost:5173
echo  ─────────────────────────────────────────────
echo.
echo  Opening Vera in 6 seconds...
timeout /t 6 /nobreak >nul
start http://localhost:5173
