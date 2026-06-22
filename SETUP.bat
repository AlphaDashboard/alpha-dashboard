@echo off
title Alpha Dashboard - FIRST TIME SETUP
color 0A
echo.
echo ============================================================
echo   ALPHA DASHBOARD - FIRST TIME SETUP
echo   This will install everything needed to run the project.
echo   Please wait, do NOT close this window.
echo ============================================================
echo.

cd /d "%~dp0"

REM ── Step 1: Check Python ─────────────────────────────────────
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Python is not installed or not in PATH.
    echo  Please install Python 3.10+ from https://www.python.org/downloads/
    echo  Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
python --version
echo  Python found. OK
echo.

REM ── Step 2: Create virtual environment ───────────────────────
echo [2/5] Creating virtual environment...
if exist venv (
    echo  Virtual environment already exists. Skipping creation.
) else (
    python -m venv venv
    echo  Virtual environment created. OK
)
echo.

REM ── Step 3: Activate and install packages ────────────────────
echo [3/5] Installing required Python packages...
call venv\Scripts\activate.bat
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo.
    echo  WARNING: Some packages may have failed. Trying individually...
    pip install django==6.0.3
    pip install openpyxl
    pip install djangorestframework
)
echo  Packages installed. OK
echo.

REM ── Step 4: Remove old .env so project uses SQLite ───────────
echo [4/5] Configuring database (SQLite - no PostgreSQL needed)...
REM If a .env file exists and points to PostgreSQL, we rename it
REM so the project falls back to simple SQLite automatically.
if exist .env (
    findstr /i "postgresql" .env >nul 2>&1
    if not errorlevel 1 (
        rename .env .env.postgresql_backup
        echo  PostgreSQL .env detected and backed up as .env.postgresql_backup
        echo  Project will now use SQLite (no server required).
    ) else (
        echo  Existing .env kept as-is.
    )
) else (
    echo  No .env file found. Using SQLite (default). OK
)
echo.

REM ── Step 5: Run database migrations ──────────────────────────
echo [5/5] Setting up database tables...
python manage.py migrate --run-syncdb
if errorlevel 1 (
    echo.
    echo  ERROR: Migration failed. Please check the error above.
    pause
    exit /b 1
)
echo  Database ready. OK
echo.

echo ============================================================
echo   SETUP COMPLETE!
echo   
echo   Now run START_SERVER.bat to launch the application.
echo ============================================================
echo.
pause
