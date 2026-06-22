
╔══════════════════════════════════════════════════════════════╗
║              ALPHA DASHBOARD - MANAGER GUIDE                 ║
║                    HOW TO RUN THIS PROJECT                   ║
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1 — INSTALL PYTHON (ONE TIME ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Download Python 3.11 or higher from:
     https://www.python.org/downloads/

  2. During installation:
     ✅ Check "Add Python to PATH"   ← IMPORTANT!
     ✅ Click "Install Now"

  3. After install, verify by opening Command Prompt and typing:
     python --version
     (Should show: Python 3.11.x or higher)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2 — FIRST TIME SETUP (ONE TIME ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Extract the ZIP file to any folder on your computer.
     Example: C:\AlphaDashboard\

  2. Open that folder. You will see these files:
     📄 SETUP.bat          ← Run this FIRST (one time only)
     📄 START_SERVER.bat   ← Run this every day to start
     📄 OPEN_SECTION.bat   ← Quick access to any section

  3. Double-click SETUP.bat
     - It will install all required packages automatically.
     - This takes 2-5 minutes on first run.
     - Wait for "SETUP COMPLETE" message.

  ✅ You only need to do STEP 2 once.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 3 — STARTING THE APPLICATION (EVERY DAY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Double-click START_SERVER.bat
  2. A black window will open — DO NOT CLOSE IT while using the app.
  3. Your browser will open automatically with the dashboard.

  ⚠️  Keep the black window open while you use the application.
      Closing it will stop the server.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AVAILABLE SECTIONS & THEIR URLs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Open your browser and go to http://127.0.0.1:8000/

  ┌─────────────────────────────┬──────────────────────────────────────┐
  │  Section Name               │  Direct URL                          │
  ├─────────────────────────────┼──────────────────────────────────────┤
  │  AccountMaster Group        │  /account_master/                    │
  │  AccountMaster Sub Group 2  │  /sal-pur-group/                     │
  │    (Sales/Purchase Groups)  │                                      │
  │  Sub Section Y              │  /subsection-y/                      │
  │    (Raw Material Purchase)  │                                      │
  │  Sub Section X              │  /subsection-x/                      │
  │    (Purchase Orders)        │                                      │
  │  Sub Section A (Vouchers)   │  /voucher/                           │
  │  Sub Section B (Bank Txn)   │  /bank-transaction/                  │
  │  Sub Section C              │  /section-c/                         │
  └─────────────────────────────┴──────────────────────────────────────┘

  Or use OPEN_SECTION.bat to jump directly to any section.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STOPPING THE APPLICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. In the black server window, press:  CTRL + C
  2. Type Y and press Enter when asked.
  3. The server will stop.

  OR simply close the black window.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ Browser shows "This site can't be reached"
     → Make sure START_SERVER.bat is running (black window is open)

  ❌ SETUP.bat shows "Python is not installed"
     → Install Python from python.org with "Add to PATH" checked

  ❌ Port already in use / Error starting server
     → Another app may be using port 8000.
     → Open START_SERVER.bat in Notepad, change 8000 to 8001,
       then access http://127.0.0.1:8001/

  ❌ Something looks wrong with data
     → Run SETUP.bat again — it is safe to run multiple times.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SYSTEM REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Windows 10 or Windows 11
  ✅ Python 3.11 or higher (free from python.org)
  ✅ Internet connection for first setup only
  ✅ Any modern browser (Chrome, Edge, Firefox)
  ✅ No PostgreSQL needed — uses built-in SQLite database

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
