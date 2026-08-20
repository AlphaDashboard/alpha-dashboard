@echo off
title Sub Section Y - Raw Material Purchase
color 0A
cd /d "%~dp0"
call venv\Scripts\activate.bat
python manage.py migrate --run-syncdb >nul 2>&1
start http://127.0.0.1:8000/subsection-y/
python manage.py runserver 8000
