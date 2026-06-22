@echo off
title Alpha Dashboard - Open Specific Section
color 0E
echo.
echo ============================================================
echo   ALPHA DASHBOARD - OPEN SPECIFIC SECTION
echo ============================================================
echo.
echo   Choose a section to open directly in your browser:
echo.
echo   [1] AccountMaster Group      (Settings)
echo   [2] AccountMaster Sub Group 2 / Sub Section Y  (New Purchase)
echo   [3] Sub Section X            (Purchase Orders)
echo   [4] Sub Section B            (Bank Transactions)
echo   [5] Sub Section A            (Vouchers)
echo   [6] Sub Section C            (Section C)
echo   [7] Sales/Purchase Group     (Settings)
echo   [8] Open ALL sections (main dashboard)
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" start http://127.0.0.1:8000/account_master/
if "%choice%"=="2" start http://127.0.0.1:8000/subsection-y/
if "%choice%"=="3" start http://127.0.0.1:8000/subsection-x/
if "%choice%"=="4" start http://127.0.0.1:8000/bank-transaction/
if "%choice%"=="5" start http://127.0.0.1:8000/voucher/
if "%choice%"=="6" start http://127.0.0.1:8000/section-c/
if "%choice%"=="7" start http://127.0.0.1:8000/sal-pur-group/
if "%choice%"=="8" start http://127.0.0.1:8000/account_master/

echo.
echo  Browser opened. Make sure START_SERVER.bat is running first!
echo.
pause
