@echo off
title Sub Section X - Purchase Orders
color 0B
cd /d "%~dp0"
call venv\Scripts\activate.bat
python manage.py migrate --run-syncdb >nul 2>&1
start http://127.0.0.1:8000/subsection-x/
python manage.py runserver 8000
