@echo off
title Vera — Push to GitHub
echo.
echo  Pushing Vera to GitHub...
echo  ─────────────────────────────────────────────
echo.

cd /d "%~dp0"

:: Initialize git if not already done
if not exist ".git" (
    git init
    git branch -M main
    echo  Git initialized.
) else (
    echo  Git already initialized.
)

:: Stage everything
git add .
echo  Files staged.

:: Commit
git commit -m "Initial commit: Vera — AI life companion"

:: Set remote
git remote remove origin 2>nul
git remote add origin https://github.com/mohamedibrahim26/vera.git

:: Push
echo.
echo  Pushing to GitHub...
echo  (A browser window or credential prompt may appear — log in with your GitHub account)
echo.
git push -u origin main

echo.
echo  ─────────────────────────────────────────────
echo  Done! View your repo at:
echo  https://github.com/mohamedibrahim26/vera
echo  ─────────────────────────────────────────────
echo.
pause
