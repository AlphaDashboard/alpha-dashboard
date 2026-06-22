# Alpha Dashboard
A Django-powered financial tracking and voucher management dashboard. Designed with an aesthetic, modern user-interface, leveraging Bootstrap 5 and Flatpickr for an intuitive data-entry experience.

## Features
- **Voucher Operations**: Manage dimensions/vouchers with validation rules linking Debits and Credits correctly.
- **Dynamic Asynchronous Interfaces**: Uses AJAX based Select2 interfaces to efficiently search up to thousands of "Alpha" tracking groups.
- **Flatpickr Interventions**: Circumvents default desktop visual limitations with custom JS rendering for date components.
- **Data Export Strategy**: Integrated `openpyxl` hooks for easy dumping of voucher sets and reporting structures.

## Project Structure
- `core/`: Primary Django configuration, Settings, ASGI/WSGI entry points and root URLs.
- `dashboard/`: Handling central logic arrays, comprising: `models`, AJAX filtering `views`, and ModelForms (`forms.py`).
- `docs/`: Holds design references, initial scratch spreadsheets, and other client specs.
- `scripts/`: Assorted data extraction logic that was helpful during development parsing test suites.
- `start_server.cmd`: Bootstraps the local deployment so you never have to run `pip`/`venv`/`manage.py` manually.

## Getting Started

### Quick Start (Windows)
We've included an automated bootstrap file to guarantee things run frictionlessly the first time.
1. Run `start_server.cmd` from this folder by double clicking it.
2. It sets up your virtual environment, installs requirements gracefully, migrates, and auto-opens `127.0.0.1:8000/alpha/`.

### Manual Deployment
If you prefer running the command suite yourself:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open a web-browser to: `http://127.0.0.1:8000/alpha/`
