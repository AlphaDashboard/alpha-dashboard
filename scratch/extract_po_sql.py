import os

sql = open('SETUP_DATABASE_pgAdmin.sql', encoding='utf-8').read()

# Find tblPurchaseOrder tables
idx_tables_start = sql.find('-- ── tblPurchaseOrder')
idx_tables_end = sql.find('-- ================================================================', idx_tables_start)
tables_sql = sql[idx_tables_start:idx_tables_end]

# Find sp_manage_purchase_order procedure
idx_sp_start = sql.find('-- SECTION 5: STORED PROCEDURE')
idx_sp_end = sql.find('-- ================================================================', idx_sp_start)
sp_sql = sql[idx_sp_start:idx_sp_end]

po_backup = f"""-- ================================================================
-- SUBSECTION X (PURCHASE ORDERS) FRESH BACKUP
-- Run this in pgAdmin Query Tool to drop, recreate, and reset
-- the Purchase Order tables and stored procedure.
-- ================================================================

DROP TABLE IF EXISTS "tblPurchaseOrder_TRAN" CASCADE;
DROP TABLE IF EXISTS "tblPurchaseOrder" CASCADE;

{tables_sql.strip()}

{sp_sql.strip()}
"""

with open('scratch/po_backup.sql', 'w', encoding='utf-8') as f:
    f.write(po_backup)

print("Po backup SQL extracted successfully!")
