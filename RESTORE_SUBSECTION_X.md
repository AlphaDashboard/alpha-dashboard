# Subsection X (Purchase Orders) Database Restoration Guide

This guide describes how to drop and restore the **Subsection X** (Purchase Order) tables in the database `alpha_dashboard_trial`.

The backup file is named **[subsection_x_backup.sql](file:///e:/Alpha%20Dashboard%2014%20may/Alpha%20Dashboard%2014%20may/Alpha%20Dashboard/subsection_x_backup.sql)** and is located in the root of the project directory.

---

## Method 1: Using pgAdmin (Recommended & Simplest)

1. Open **pgAdmin**.
2. Connect to your database server and open the `alpha_dashboard_trial` database.
3. Right-click the database name and select **Query Tool**.
4. Open the SQL file **[subsection_x_backup.sql](file:///e:/Alpha%20Dashboard%2014%20may/Alpha%20Dashboard%2014%20may/Alpha%20Dashboard/subsection_x_backup.sql)**:
   * In the Query Tool menu, click the **Open File** icon (folder icon).
   * Navigate to the project root directory and select `subsection_x_backup.sql`.
5. Click the **Execute/Play** button (or press `F5`).
6. The script will automatically:
   * Drop the existing tables `tblPurchaseOrder` and `tblPurchaseOrder_TRAN` if they exist.
   * Recreate them with proper fields, indexes, sequences, and constraints.
   * Insert the fresh/seed data for Purchase Orders.

---

## Method 2: Using the Command Line (psql)

1. Open Command Prompt (CMD) or PowerShell.
2. Navigate to the project directory:
   ```cmd
   cd /d "e:\Alpha Dashboard 14 may\Alpha Dashboard 14 may\Alpha Dashboard"
   ```
3. Execute the restoration command:
   ```cmd
   psql -U alpha_user -d alpha_dashboard_trial -f subsection_x_backup.sql
   ```
   *(Enter the password `Chetan@123` when prompted).*

---

## Technical Details

The backup updates the following tables:
1. `tblPurchaseOrder` (Master Table)
2. `tblPurchaseOrder_TRAN` (Transaction Details Table)
