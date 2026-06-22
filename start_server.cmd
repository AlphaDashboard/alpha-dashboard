@echo off
echo This file has been replaced. Please use START_SERVER.bat instead.
echo.
echo Redirecting to START_SERVER.bat ...
timeout /t 2 /nobreak >nul
call "%~dp0START_SERVER.bat"
