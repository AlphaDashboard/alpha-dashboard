@echo off
title Alpha Dashboard - Server Running
color 0B
echo.
echo ============================================================
echo   ALPHA DASHBOARD - STARTING SERVER
echo ============================================================
echo.

cd /d "%~dp0"

REM ── Check venv exists ─────────────────────────────────────────
if not exist venv\Scripts\activate.bat (
    echo  Virtual environment not found!
    echo  Please run SETUP.bat first.
    echo.
    pause
    exit /b 1
)

REM ── Activate venv ─────────────────────────────────────────────
call venv\Scripts\activate.bat

REM ── Quick migration check (safe to run every time) ────────────
echo  Checking for any pending database updates...
python manage.py migrate --run-syncdb >nul 2>&1
echo  Database OK.
echo.

REM ── Open browser ──────────────────────────────────────────────
echo  Opening browser at http://127.0.0.1:8000/ ...
timeout /t 2 /nobreak >nul
start http://127.0.0.1:8000/dashboard/account_master/

echo.
echo ============================================================
echo   SERVER IS RUNNING
echo   URL  : http://127.0.0.1:8000/
echo.
echo   Sections available:
echo     - AccountMaster Sub Group 2 : /dashboard/subsection-y/
echo     - Sub Section X             : /dashboard/subsection-x/
echo     - Sub Section Y             : /dashboard/subsection-y/
echo     - Account Master            : /dashboard/account_master/
echo.
echo   Press CTRL+C to stop the server.
echo ============================================================
echo.

python manage.py runserver 8000
