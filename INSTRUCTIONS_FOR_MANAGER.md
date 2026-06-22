# Database Restoration & Setup Guide for Manager

This document provides step-by-step instructions to restore the clean database backup and set up the project environment. 

The database backup file is named **[complete_database_backup.sql](file:///e:/Alpha%20Dashboard%2014%20may/Alpha%20Dashboard%2014%20may/Alpha%20Dashboard/complete_database_backup.sql)** and is located in the root of the Django project directory.

> [!NOTE]
> The backup file has been generated with `--clean --if-exists` flags. When executed, it will automatically drop existing tables in the database before recreating them. There is no need to manually run drop queries for individual tables.

---

## Step 1: Initialize Database Role (If Not Exists)

If the PostgreSQL role `alpha_user` is not already configured on your system:
1. Open pgAdmin.
2. Open the **Query Tool** on any database.
3. Execute the following command to create the user:
   ```sql
   CREATE ROLE alpha_user WITH LOGIN PASSWORD 'Chetan@123' SUPERUSER;
   ```

---

## Step 2: Restore the Clean Backup

1. Open pgAdmin.
2. If you want to start completely fresh:
   * Right-click the existing `alpha_dashboard_trial` database and choose **Delete/Drop**.
   * Create a new empty database named `alpha_dashboard_trial` with Owner set to `postgres` or `alpha_user`.
3. Open Command Prompt (CMD) or PowerShell and navigate to the project directory:
   ```cmd
   cd /d "e:\Alpha Dashboard 14 may\Alpha Dashboard 14 may\Alpha Dashboard"
   ```
4. Run the restore command using the postgres superuser:
   ```cmd
   psql -U postgres -d alpha_dashboard_trial -f complete_database_backup.sql
   ```
   *(Enter your PostgreSQL password when prompted)*

---

## Step 3: Grant Privileges

After the restore is complete, open the **Query Tool** in pgAdmin for the `alpha_dashboard_trial` database and run the following commands to ensure no "permission denied" errors occur during runtime:
```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO alpha_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO alpha_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO alpha_user;
```

---

## Step 4: Run Django Migrations & Start Server

To verify the setup is complete, run the following commands in the project directory:
1. Run pending migrations:
   ```cmd
   venv\Scripts\python.exe manage.py migrate
   ```
2. Start the local development server:
   ```cmd
   venv\Scripts\python.exe manage.py runserver 8000
   ```
3. Open your browser and navigate to:
   http://127.0.0.1:8000/dashboard/account_master/
