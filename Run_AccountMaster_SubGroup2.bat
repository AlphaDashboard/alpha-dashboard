@echo off
title AccountMaster Sub Group 2
color 0E
cd /d "%~dp0"
call venv\Scripts\activate.bat
python manage.py migrate --run-syncdb >nul 2>&1
start http://127.0.0.1:8000/sal-pur-group/
python manage.py runserver 8000
