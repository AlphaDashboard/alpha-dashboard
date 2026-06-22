-- ================================================================
--  ALPHA DASHBOARD — COMPLETE POSTGRESQL SETUP SCRIPT
--  Run this entire script in pgAdmin Query Tool
--
--  Steps:
--    1. Open pgAdmin
--    2. Connect to your PostgreSQL server
--    3. Create a new database called: alpha_dashboard_trial
--       (Right-click Databases → Create → Database)
--    4. Open that database → Tools → Query Tool
--    5. Paste this entire script and press F5 (Execute)
-- ================================================================


-- ================================================================
-- SECTION 1: DROP EXISTING TABLES (safe re-run)
-- Order matters: child tables first, parent tables last
-- ================================================================

DROP TABLE IF EXISTS "tblUserMaster"            CASCADE;
DROP TABLE IF EXISTS "tblGateEntry"            CASCADE;
DROP TABLE IF EXISTS "tblPurchaseOrder_TRAN"   CASCADE;
DROP TABLE IF EXISTS "tblPurchaseOrder"        CASCADE;
DROP TABLE IF EXISTS "tblPurSales_Tran"        CASCADE;
DROP TABLE IF EXISTS "tblPurSales"             CASCADE;
DROP TABLE IF EXISTS "tblSalPurGroup_Tran"     CASCADE;
DROP TABLE IF EXISTS "tblSalPurGroup"          CASCADE;
DROP TABLE IF EXISTS "tblCASHBANK_TRAN"        CASCADE;
DROP TABLE IF EXISTS "tblCASHBANK"             CASCADE;
DROP TABLE IF EXISTS "tblSectionC_TRAN"        CASCADE;
DROP TABLE IF EXISTS "tblSectionC"             CASCADE;
DROP TABLE IF EXISTS "tblMaterial"             CASCADE;
DROP TABLE IF EXISTS "tblBroker"               CASCADE;
DROP TABLE IF EXISTS "tblVendorSupplier"       CASCADE;
DROP TABLE IF EXISTS "tblZone"                 CASCADE;
DROP TABLE IF EXISTS "tblAccountmaster"        CASCADE;
DROP TABLE IF EXISTS "tblCategory"             CASCADE;

-- Django system tables (only drop if you want a full clean reset)
-- Uncomment below lines ONLY if doing a complete fresh setup:
-- DROP TABLE IF EXISTS "django_migrations"    CASCADE;
-- DROP TABLE IF EXISTS "django_content_type"  CASCADE;
-- DROP TABLE IF EXISTS "auth_permission"      CASCADE;
-- DROP TABLE IF EXISTS "auth_group_permissions" CASCADE;
-- DROP TABLE IF EXISTS "auth_group"           CASCADE;
-- DROP TABLE IF EXISTS "auth_user_groups"     CASCADE;
-- DROP TABLE IF EXISTS "auth_user_user_permissions" CASCADE;
-- DROP TABLE IF EXISTS "auth_user"            CASCADE;
-- DROP TABLE IF EXISTS "django_admin_log"     CASCADE;
-- DROP TABLE IF EXISTS "django_session"       CASCADE;


-- ================================================================
-- SECTION 2: CORE LOOKUP / MASTER TABLES
-- ================================================================

-- ── tblCategory ──────────────────────────────────────────────────
CREATE TABLE "tblCategory" (
    "id"           SERIAL PRIMARY KEY,
    "categoryName" VARCHAR(50)  NOT NULL,
    "categoryType" VARCHAR(1)   NOT NULL DEFAULT 'A'
);

-- ── tblAccountmaster ─────────────────────────────────────────────
CREATE TABLE "tblAccountmaster" (
    "id"           BIGSERIAL PRIMARY KEY,
    "groupID"      BIGINT,
    "Account_Name" VARCHAR(50)  NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "categoryID"   INTEGER      NOT NULL REFERENCES "tblCategory"("id") ON DELETE RESTRICT,
    "CL_BAL"       NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "is_active"    BOOLEAN      NOT NULL DEFAULT TRUE,
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_accountmaster_active ON "tblAccountmaster"("is_active");

-- ── tblBroker ────────────────────────────────────────────────────
CREATE TABLE "tblBroker" (
    "BrokerID"      SERIAL PRIMARY KEY,
    "BrokerName"    VARCHAR(100) NOT NULL,
    "BrokerAddress" VARCHAR(255),
    "ContactNo"     VARCHAR(50),
    "PANo"          VARCHAR(50),
    "UserCreated"   VARCHAR(50),
    "DateCreated"   TIMESTAMP,
    "UserModified"  VARCHAR(50),
    "DateModified"  TIMESTAMP
);

-- ── tblVendorSupplier ─────────────────────────────────────────────
CREATE TABLE "tblVendorSupplier" (
    "VendorSupplierID"   SERIAL PRIMARY KEY,
    "VendorSupplierName" VARCHAR(100) NOT NULL,
    "Address1"           VARCHAR(255),
    "Address2"           VARCHAR(255),
    "ContactNo"          VARCHAR(50),
    "GSTNo"              VARCHAR(50),
    "PANo"               VARCHAR(50),
    "UserCreted"         VARCHAR(50),
    "DateCreated"        TIMESTAMP,
    "UserModified"       VARCHAR(50),
    "DateModified"       TIMESTAMP
);

-- ── tblZone ──────────────────────────────────────────────────────
CREATE TABLE "tblZone" (
    "ZoneID"   BIGSERIAL PRIMARY KEY,
    "ZoneName" VARCHAR(255) NOT NULL
);

-- ── tblUserMaster ────────────────────────────────────────────────
CREATE TABLE "tblUserMaster" (
    "user_id"       VARCHAR(50)  PRIMARY KEY,
    "user_name"     VARCHAR(150) NOT NULL,
    "role"          VARCHAR(20)  NOT NULL DEFAULT 'User',
    "empid"         VARCHAR(50)  NOT NULL UNIQUE,
    "is_active"     BOOLEAN      NOT NULL DEFAULT TRUE,
    "user_created"  VARCHAR(50),
    "date_created"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "user_modified" VARCHAR(50),
    "date_modified" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── tblMaterial ──────────────────────────────────────────────────
CREATE TABLE "tblMaterial" (
    "id"                  SERIAL PRIMARY KEY,
    "material_code"       VARCHAR(20)  NOT NULL UNIQUE,
    "material_name"       VARCHAR(50)  NOT NULL,
    "is_active"           BOOLEAN      NOT NULL DEFAULT TRUE,
    "PurchaseGST"         NUMERIC(5,2),
    "SalesGST"            NUMERIC(6,2),
    "unit_weight"         NUMERIC(18,3),
    "Auto1_Manual0_calc"  BOOLEAN,
    "IsRateInclGSTY1N0"   BOOLEAN
);

-- ── tblSalPurGroup ───────────────────────────────────────────────
CREATE TABLE "tblSalPurGroup" (
    "SalPurGroupID"              BIGSERIAL PRIMARY KEY,
    "SalPurGroupName"            VARCHAR(255),
    "GroupwiseAccounting"        BOOLEAN,
    "GroupwiseAccountID"         BIGINT REFERENCES "tblAccountmaster"("id") ON DELETE SET NULL,
    "Interstate_Y_WithinState_N" BOOLEAN,
    "GST_Applicable_Y_N"         BOOLEAN,
    "IsGSTApplicableY1N0"        BOOLEAN,
    "IGST1_CGST0"                BOOLEAN,
    "UserCreated"                VARCHAR(100),
    "DateCreated"                TIMESTAMPTZ DEFAULT NOW(),
    "UserModified"               VARCHAR(100),
    "DateModified"               TIMESTAMPTZ DEFAULT NOW(),
    "is_active"                  BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── tblSalPurGroup_Tran ──────────────────────────────────────────
CREATE TABLE "tblSalPurGroup_Tran" (
    "ID"               BIGSERIAL PRIMARY KEY,
    "ChargesName"      VARCHAR(255),
    "SalPurGroupID"    BIGINT REFERENCES "tblSalPurGroup"("SalPurGroupID") ON DELETE CASCADE,
    "ChargeAccountID"  BIGINT REFERENCES "tblAccountmaster"("id") ON DELETE SET NULL,
    "Auto_Y_Manual_N"  BOOLEAN,
    "Rate"             NUMERIC(18,4),
    "Debit_D_Credit_C" VARCHAR(1),
    "UserCreated"      VARCHAR(100),
    "DateCreated"      TIMESTAMPTZ DEFAULT NOW(),
    "UserModified"     VARCHAR(100),
    "DateModified"     TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================================
-- SECTION 3: TRANSACTION TABLES
-- ================================================================

-- ── tblCASHBANK (Sub Section B / Bank Transactions) ──────────────
CREATE TABLE "tblCASHBANK" (
    "voucher_no"     VARCHAR(50)  PRIMARY KEY,
    "date"           TIMESTAMPTZ  NOT NULL,
    "tran_type"      VARCHAR(4)   NOT NULL CHECK ("tran_type" IN ('CASH','BANK','J000','J001','J002')),
    "rpid"           VARCHAR(1)   CHECK ("rpid" IN ('R','P','I','D','A','B')),
    "amount"         NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "narration"      VARCHAR(200),
    "BankAccount"    BIGINT       REFERENCES "tblAccountmaster"("id") ON DELETE RESTRICT,
    "status"         BOOLEAN      NOT NULL DEFAULT TRUE,
    "module_type"    VARCHAR(10)  NOT NULL DEFAULT '',
    "posting_status" VARCHAR(20),
    "ref_voucher_no" VARCHAR(50),
    "user_created"   VARCHAR(50),
    "date_created"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "user_modified"  VARCHAR(50),
    "date_modified"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cashbank_module ON "tblCASHBANK"("module_type");
CREATE INDEX idx_cashbank_date   ON "tblCASHBANK"("date");

-- ── tblCASHBANK_TRAN ─────────────────────────────────────────────
CREATE TABLE "tblCASHBANK_TRAN" (
    "id"              BIGSERIAL PRIMARY KEY,
    "VoucherNo"       VARCHAR(50)  NOT NULL REFERENCES "tblCASHBANK"("voucher_no") ON DELETE CASCADE,
    "date"            TIMESTAMPTZ  NOT NULL,
    "tran_type"       VARCHAR(4)   NOT NULL CHECK ("tran_type" IN ('CASH','BANK','J000','J001','J002')),
    "rpid"            VARCHAR(1)   CHECK ("rpid" IN ('R','P','I','D','A','B')),
    "accountmaster_id" BIGINT      REFERENCES "tblAccountmaster"("id") ON DELETE RESTRICT,
    "amount"          NUMERIC(15,2) NOT NULL,
    "remarks"         VARCHAR(200),
    "cost_center"     VARCHAR(50),
    "chq_no"          VARCHAR(50),
    "chq_date"        DATE,
    "payee_bank"      VARCHAR(100),
    "user_created"    VARCHAR(50),
    "date_created"    TIMESTAMPTZ  DEFAULT NOW(),
    "user_modified"   VARCHAR(50),
    "date_modified"   TIMESTAMPTZ  DEFAULT NOW()
);

-- ── tblSectionC ──────────────────────────────────────────────────
CREATE TABLE "tblSectionC" (
    "voucher_no"    VARCHAR(50)  PRIMARY KEY,
    "date"          TIMESTAMPTZ  NOT NULL,
    "tran_type"     VARCHAR(4)   NOT NULL CHECK ("tran_type" IN ('CASH','BANK')),
    "rpid"          VARCHAR(1)   NOT NULL CHECK ("rpid" IN ('R','P','I','D')),
    "amount"        NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "narration"     VARCHAR(200),
    "BankAccount"   BIGINT       REFERENCES "tblAccountmaster"("id") ON DELETE RESTRICT,
    "status"        BOOLEAN      NOT NULL DEFAULT TRUE,
    "user_created"  VARCHAR(50),
    "date_created"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "user_modified" VARCHAR(50),
    "date_modified" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── tblSectionC_TRAN ─────────────────────────────────────────────
CREATE TABLE "tblSectionC_TRAN" (
    "id"               BIGSERIAL PRIMARY KEY,
    "VoucherNo"        VARCHAR(50) NOT NULL REFERENCES "tblSectionC"("voucher_no") ON DELETE CASCADE,
    "date"             TIMESTAMPTZ NOT NULL,
    "tran_type"        VARCHAR(4)  NOT NULL CHECK ("tran_type" IN ('CASH','BANK')),
    "rpid"             VARCHAR(1)  NOT NULL CHECK ("rpid" IN ('R','P','I','D')),
    "accountmaster_id" BIGINT      REFERENCES "tblAccountmaster"("id") ON DELETE RESTRICT,
    "amount"           NUMERIC(15,2) NOT NULL,
    "remarks"          VARCHAR(200),
    "chq_no"           VARCHAR(50),
    "chq_date"         DATE,
    "payee_bank"       VARCHAR(100),
    "user_created"     VARCHAR(50),
    "date_created"     TIMESTAMPTZ DEFAULT NOW(),
    "user_modified"    VARCHAR(50),
    "date_modified"    TIMESTAMPTZ DEFAULT NOW()
);

-- ── tblGateEntry ─────────────────────────────────────────────────
CREATE TABLE "tblGateEntry" (
    "id"             SERIAL PRIMARY KEY,
    "gate_pass_id"   VARCHAR(20)  UNIQUE,
    "entry_datetime" TIMESTAMPTZ  NOT NULL,
    "supplier_id"    BIGINT       NOT NULL REFERENCES "tblAccountmaster"("id") ON DELETE RESTRICT,
    "vehicle_number" VARCHAR(20)  NOT NULL,
    "material_type_id" INTEGER    NOT NULL REFERENCES "tblMaterial"("id") ON DELETE RESTRICT,
    "driver_name"    VARCHAR(50)  NOT NULL,
    "photo"          TEXT,
    "created_by_id"  INTEGER,
    "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── tblPurchaseOrder (Sub Section X) ─────────────────────────────
CREATE TABLE "tblPurchaseOrder" (
    "po_no"                  VARCHAR(50)   PRIMARY KEY,
    "po_date"                TIMESTAMPTZ   NOT NULL,
    "expected_delivery_date" DATE,
    "po_status"              VARCHAR(20)   NOT NULL DEFAULT 'Draft'
                             CHECK ("po_status" IN ('Draft','Approved','Released')),
    "supplier_id"            INTEGER       NOT NULL REFERENCES "tblVendorSupplier"("VendorSupplierID") ON DELETE RESTRICT,
    "broker_id"              INTEGER       REFERENCES "tblBroker"("BrokerID") ON DELETE RESTRICT,
    "zone_name"              VARCHAR(50)   NOT NULL DEFAULT '',
    "supplier_contact"       VARCHAR(50),
    "supplier_address"       TEXT,
    "gst_number"             VARCHAR(50),
    "delivery_location"      VARCHAR(100)  NOT NULL DEFAULT '',
    "delivery_terms"         VARCHAR(100)  NOT NULL DEFAULT '',
    "payment_terms"          VARCHAR(100)  NOT NULL DEFAULT '',
    "freight_terms"          VARCHAR(100)  NOT NULL DEFAULT '',
    "currency"               VARCHAR(10)   NOT NULL DEFAULT 'INR',
    "purchaser_name"         VARCHAR(100),
    "department"             VARCHAR(50),
    "cost_center"            VARCHAR(50),
    "special_instructions"   TEXT,
    "internal_notes"         TEXT,
    "total_basic_amount"     NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "taxes"                  NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "grand_total"            NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "status"                 BOOLEAN       NOT NULL DEFAULT TRUE,
    "user_created"           VARCHAR(50),
    "date_created"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "user_modified"          VARCHAR(50),
    "date_modified"          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_date   ON "tblPurchaseOrder"("po_date");
CREATE INDEX idx_po_status ON "tblPurchaseOrder"("po_status");

-- ── tblPurchaseOrder_TRAN ─────────────────────────────────────────
CREATE TABLE "tblPurchaseOrder_TRAN" (
    "id"           BIGSERIAL PRIMARY KEY,
    "PONo"         VARCHAR(50)   NOT NULL REFERENCES "tblPurchaseOrder"("po_no") ON DELETE CASCADE,
    "item_id"      INTEGER       NOT NULL REFERENCES "tblMaterial"("id") ON DELETE RESTRICT,
    "order_qty"    NUMERIC(15,4) NOT NULL,
    "uom"          VARCHAR(10)   NOT NULL,
    "unit_rate"    NUMERIC(15,4) NOT NULL,
    "amount"       NUMERIC(15,2) NOT NULL,
    "remarks"      VARCHAR(200),
    "user_created" VARCHAR(50),
    "date_created" TIMESTAMPTZ   DEFAULT NOW(),
    "user_modified" VARCHAR(50),
    "date_modified" TIMESTAMPTZ  DEFAULT NOW()
);

-- ── tblPurSales (Sub Section Y - Header) ─────────────────────────
CREATE TABLE "tblPurSales" (
    "VoucherNo"          VARCHAR(100) NOT NULL,
    "VoucherDate"        DATE         NOT NULL,
    "TranType"           VARCHAR(20)  NOT NULL,
    "OrderNo"            VARCHAR(100) PRIMARY KEY,
    "OrderDate"          DATE         NOT NULL,
    "PurSalGroupID"      BIGINT       NOT NULL REFERENCES "tblSalPurGroup"("SalPurGroupID") ON DELETE RESTRICT,
    "PartyID"            BIGINT       REFERENCES "tblAccountmaster"("id") ON DELETE RESTRICT,
    "BrokerID"           INTEGER      REFERENCES "tblBroker"("BrokerID") ON DELETE RESTRICT,
    "ZoneID"             BIGINT,
    "DeliveryLocation"   VARCHAR(255),
    "DelTermsID"         BIGINT,
    "PaymentTermsID"     BIGINT,
    "FreightTermID"      BIGINT,
    "CurrencyID"         BIGINT,
    "IncotermID"         BIGINT,
    "Purchaser_Saleman_ID" BIGINT,
    "DepartmentID"       BIGINT,
    "CostCentrID"        BIGINT,
    "SpecialInstructions" VARCHAR(255),
    "InternalNotes"      VARCHAR(1),
    "UserCreated"        VARCHAR(100),
    "DatdCreated"        DATE,
    "UserModified"       VARCHAR(100),
    "DateModified"       DATE,
    "IGST0_SGST1"        SMALLINT
);

CREATE INDEX idx_pursales_date     ON "tblPurSales"("VoucherDate");
CREATE INDEX idx_pursales_trantype ON "tblPurSales"("TranType");

-- ── tblPurSales_Tran (Sub Section Y - Detail) ────────────────────
CREATE TABLE "tblPurSales_Tran" (
    "id"                 BIGSERIAL PRIMARY KEY,
    "VoucherNo"          VARCHAR(100) NOT NULL,
    "VoucherDate"        DATE,
    "TranType"           VARCHAR(20),
    "Item_ID"            INTEGER      REFERENCES "tblMaterial"("id") ON DELETE RESTRICT,
    "Bag"                BIGINT,
    "Weight"             NUMERIC(18,3),
    "unit_weight"        NUMERIC(18,3),
    "Unit_rate"          NUMERIC(18,2),
    "Amount"             NUMERIC(18,2),
    "gst_rate"           NUMERIC(18,2),
    "IGST"               NUMERIC(18,2),
    "CGST"               NUMERIC(18,2),
    "SGST"               NUMERIC(18,2),
    "Total"              NUMERIC(18,2),
    "IsRateIncludingGST" BOOLEAN,
    "UserCreated"        VARCHAR(100),
    "DateCreated"        TIMESTAMPTZ,
    "UserModified"       VARCHAR(100),
    "DateModified"       TIMESTAMPTZ
);


DROP PROCEDURE IF EXISTS sp_manage_transaction CASCADE;

CREATE OR REPLACE PROCEDURE sp_manage_transaction(
    p_operation         VARCHAR(20),
    p_module            VARCHAR(20),
    INOUT p_voucher_no  VARCHAR(50),
    p_date              TIMESTAMP,
    p_tran_type         VARCHAR(4),
    p_rpid              VARCHAR(1),
    p_amount            DECIMAL(15, 2),
    p_narration         VARCHAR(200),
    p_bank_account_id   INT,
    p_user              VARCHAR(50),
    p_ref_voucher_no    VARCHAR(50)  DEFAULT NULL,
    p_posting_status    VARCHAR(20)  DEFAULT NULL,
    p_details_json      JSONB        DEFAULT '[]'::jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_detail_sum DECIMAL(15, 2) := 0.00;
BEGIN
    -- ── Amount validation (module-aware) ─────────────────────────────
    IF p_operation = 'INSERT' OR p_operation = 'UPDATE' THEN
        IF p_module = 'SECTION_A' THEN
            -- Double-entry journal: p_amount = sum of debit (A) rows only.
            -- Credit (B) rows equal the same value but are NOT added to p_amount.
            SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00)
              INTO v_detail_sum
              FROM jsonb_array_elements(p_details_json) AS d
             WHERE d->>'rpid' = 'A';
        ELSE
            -- Single-sided entries (cash/bank/section-c): all rows are one type.
            SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00)
              INTO v_detail_sum
              FROM jsonb_array_elements(p_details_json) AS d;
        END IF;

        IF v_detail_sum <> p_amount THEN
            RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
        END IF;
    END IF;

    -- ── SECTION_A handler (journal voucher → tblCASHBANK) ────────────
    IF p_module = 'SECTION_A' THEN

        IF p_operation = 'INSERT' THEN
            -- Auto-generate numeric voucher number when not supplied
            IF p_voucher_no IS NULL OR p_voucher_no = '' OR p_voucher_no = 'Auto-Generated' THEN
                SELECT COALESCE(MAX(voucher_no::BIGINT), 0) + 1
                  INTO p_voucher_no
                  FROM "tblCASHBANK"
                 WHERE voucher_no ~ '^[0-9]+$';
                p_voucher_no := p_voucher_no::TEXT;
            END IF;

            INSERT INTO "tblCASHBANK" (
                voucher_no, date, tran_type, rpid, amount, narration,
                "BankAccount", status, module_type,
                user_created, date_created, user_modified, date_modified
            ) VALUES (
                p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                p_bank_account_id, TRUE, '',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            );

            -- Insert each detail row; store each row's own rpid (A or B)
            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, cost_center, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no,
                p_date,
                p_tran_type,
                d->>'rpid',
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                COALESCE(d->>'remarks', ''),
                COALESCE(d->>'cost_center', ''),
                COALESCE(d->>'chq_no', ''),
                CASE
                    WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                    THEN (d->>'chq_date')::DATE
                    ELSE NULL
                END,
                COALESCE(d->>'payee_bank', ''),
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'UPDATE' THEN
            UPDATE "tblCASHBANK" SET
                date          = p_date,
                tran_type     = p_tran_type,
                rpid          = p_rpid,
                amount        = p_amount,
                narration     = p_narration,
                "BankAccount" = p_bank_account_id,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, cost_center, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no,
                p_date,
                p_tran_type,
                d->>'rpid',
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                COALESCE(d->>'remarks', ''),
                COALESCE(d->>'cost_center', ''),
                COALESCE(d->>'chq_no', ''),
                CASE
                    WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                    THEN (d->>'chq_date')::DATE
                    ELSE NULL
                END,
                COALESCE(d->>'payee_bank', ''),
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'DELETE' THEN
            UPDATE "tblCASHBANK" SET
                status        = FALSE,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

        ELSIF p_operation = 'HARD_DELETE' THEN
            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
            DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
        END IF;

    -- ── SECTION_C handler (cash voucher → tblCASHBANK) ────────────
    ELSIF p_module = 'SECTION_C' THEN

        IF p_operation = 'INSERT' THEN
            INSERT INTO "tblCASHBANK" (
                voucher_no, date, tran_type, rpid, amount, narration,
                "BankAccount", status, module_type,
                user_created, date_created, user_modified, date_modified
            ) VALUES (
                p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                p_bank_account_id, TRUE, '',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            );

            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no, p_date, p_tran_type, p_rpid,
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                d->>'remarks', d->>'chq_no',
                CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                     THEN (d->>'chq_date')::DATE ELSE NULL END,
                d->>'payee_bank',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'UPDATE' THEN
            UPDATE "tblCASHBANK" SET
                date          = p_date,
                tran_type     = p_tran_type,
                rpid          = p_rpid,
                amount        = p_amount,
                narration     = p_narration,
                "BankAccount" = p_bank_account_id,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

            INSERT INTO "tblCASHBANK_TRAN" (
                "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                remarks, chq_no, chq_date, payee_bank,
                user_created, date_created, user_modified, date_modified
            )
            SELECT
                p_voucher_no, p_date, p_tran_type, p_rpid,
                (d->>'account_master')::INT,
                (d->>'amount')::DECIMAL(15, 2),
                d->>'remarks', d->>'chq_no',
                CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                     THEN (d->>'chq_date')::DATE ELSE NULL END,
                d->>'payee_bank',
                p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
            FROM jsonb_array_elements(p_details_json) AS d;

        ELSIF p_operation = 'DELETE' THEN
            UPDATE "tblCASHBANK" SET
                status        = FALSE,
                user_modified = p_user,
                date_modified = CURRENT_TIMESTAMP
            WHERE voucher_no = p_voucher_no;

        ELSIF p_operation = 'HARD_DELETE' THEN
            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
            DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
        END IF;

    -- ── BANK_TRANSACTION / SUBSECTION_B2 / SUBSECTION_Y handler ──────
    ELSIF p_module IN ('BANK_TRANSACTION', 'SUBSECTION_B2', 'SUBSECTION_Y') THEN
        DECLARE
            v_module_type VARCHAR(10) := '';
        BEGIN
            IF p_module = 'SUBSECTION_B2' THEN
                v_module_type := 'B2';
            ELSIF p_module = 'SUBSECTION_Y' THEN
                v_module_type := 'Y';
            END IF;

            IF p_operation = 'INSERT' THEN
                IF v_module_type = 'B2' AND (p_voucher_no IS NULL OR p_voucher_no = '') THEN
                    p_voucher_no := fn_generate_b2_voucher_no(p_date);
                END IF;

                INSERT INTO "tblCASHBANK" (
                    voucher_no, date, tran_type, rpid, amount, narration,
                    "BankAccount", status, module_type, posting_status, ref_voucher_no,
                    user_created, date_created, user_modified, date_modified
                ) VALUES (
                    p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                    p_bank_account_id, TRUE, v_module_type, p_posting_status, p_ref_voucher_no,
                    p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                );

                INSERT INTO "tblCASHBANK_TRAN" (
                    "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                    remarks, cost_center, chq_no, chq_date, payee_bank,
                    user_created, date_created, user_modified, date_modified
                )
                SELECT
                    p_voucher_no, p_date, p_tran_type, p_rpid,
                    (d->>'account_master')::INT,
                    (d->>'amount')::DECIMAL(15, 2),
                    d->>'remarks', d->>'cost_center', d->>'chq_no',
                    CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                         THEN (d->>'chq_date')::DATE ELSE NULL END,
                    d->>'payee_bank',
                    p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                FROM jsonb_array_elements(p_details_json) AS d;

            ELSIF p_operation = 'UPDATE' THEN
                IF v_module_type = 'B2' AND EXISTS (
                    SELECT 1 FROM "tblCASHBANK"
                    WHERE voucher_no = p_voucher_no AND posting_status = 'POSTED'
                ) THEN
                    RAISE EXCEPTION 'Cannot edit a POSTED transaction.';
                END IF;

                UPDATE "tblCASHBANK" SET
                    date          = p_date,
                    tran_type     = p_tran_type,
                    rpid          = p_rpid,
                    amount        = p_amount,
                    narration     = p_narration,
                    "BankAccount" = p_bank_account_id,
                    posting_status = p_posting_status,
                    ref_voucher_no = p_ref_voucher_no,
                    user_modified = p_user,
                    date_modified = CURRENT_TIMESTAMP
                WHERE voucher_no = p_voucher_no;

                DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

                INSERT INTO "tblCASHBANK_TRAN" (
                    "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                    remarks, cost_center, chq_no, chq_date, payee_bank,
                    user_created, date_created, user_modified, date_modified
                )
                SELECT
                    p_voucher_no, p_date, p_tran_type, p_rpid,
                    (d->>'account_master')::INT,
                    (d->>'amount')::DECIMAL(15, 2),
                    d->>'remarks', d->>'cost_center', d->>'chq_no',
                    CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> ''
                         THEN (d->>'chq_date')::DATE ELSE NULL END,
                    d->>'payee_bank',
                    p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                FROM jsonb_array_elements(p_details_json) AS d;

            ELSIF p_operation = 'DELETE' THEN
                IF v_module_type IN ('B2', 'Y') THEN
                    UPDATE "tblCASHBANK" SET
                        status        = FALSE,
                        user_modified = p_user,
                        date_modified = CURRENT_TIMESTAMP
                    WHERE voucher_no = p_voucher_no;
                ELSE
                    DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
                    DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                END IF;

            ELSIF p_operation = 'HARD_DELETE' THEN
                DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
                DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
            END IF;
        END;
    END IF;
END;
$$;OM "tblPurSales_Tran" WHERE "VoucherNo" = p_voucher_no;

        INSERT INTO "tblPurSales_Tran" (
            "VoucherNo", "VoucherDate", "TranType",
            "Item_ID", "Bag", "Weight", "unit_weight",
            "Unit_rate", "Amount", "gst_rate",
            "IGST", "CGST", "SGST", "Total",
            "IsRateIncludingGST", "UserCreated", "DateCreated", "UserModified", "DateModified"
        )
        SELECT
            p_voucher_no,
            p_date::DATE,
            p_tran_type,
            (d->>'item_id')::INT,
            (d->>'bag')::BIGINT,
            (d->>'weight')::NUMERIC(18,3),
            (d->>'unit_weight')::NUMERIC(18,3),
            (d->>'unit_rate')::NUMERIC(18,2),
            (d->>'amount')::NUMERIC(18,2),
            (d->>'gst_rate')::NUMERIC(18,2),
            (d->>'igst')::NUMERIC(18,2),
            (d->>'cgst')::NUMERIC(18,2),
            (d->>'sgst')::NUMERIC(18,2),
            (d->>'total')::NUMERIC(18,2),
            (d->>'is_rate_incl_gst')::BOOLEAN,
            p_user, NOW(), p_user, NOW()
        FROM jsonb_array_elements(p_items_json) AS d;

    -- ── DELETE (soft) ────────────────────────────────────────────
    ELSIF p_operation = 'DELETE' THEN

        -- For bank transactions / section C
        UPDATE "tblCASHBANK" SET "status" = FALSE WHERE "voucher_no" = p_voucher_no;
        UPDATE "tblSectionC"  SET "status" = FALSE WHERE "voucher_no" = p_voucher_no;

    -- ── HARD_DELETE ──────────────────────────────────────────────
    ELSIF p_operation = 'HARD_DELETE' THEN

        DELETE FROM "tblPurSales_Tran" WHERE "VoucherNo" = p_voucher_no;
        DELETE FROM "tblPurSales"      WHERE "OrderNo"   = p_order_no;

    END IF;

END;
$$;


-- ================================================================
-- SECTION 5: STORED PROCEDURE — sp_manage_purchase_order
--            Used by: Sub Section X (Purchase Orders)
-- ================================================================

DROP PROCEDURE IF EXISTS sp_manage_purchase_order CASCADE;

CREATE OR REPLACE PROCEDURE sp_manage_purchase_order(
    p_operation             VARCHAR(20),
    INOUT p_po_no           VARCHAR(50),
    p_po_date               TIMESTAMP,
    p_expected_delivery_date DATE,
    p_po_status             VARCHAR(20),
    p_supplier_id           INT,
    p_broker_id             INT,
    p_zone_name             VARCHAR(50),
    p_supplier_contact      VARCHAR(50),
    p_supplier_address      TEXT,
    p_gst_number            VARCHAR(50),
    p_delivery_location     VARCHAR(100),
    p_delivery_terms        VARCHAR(100),
    p_payment_terms         VARCHAR(100),
    p_freight_terms         VARCHAR(100),
    p_currency              VARCHAR(10),
    p_purchaser_name        VARCHAR(100),
    p_department            VARCHAR(50),
    p_cost_center           VARCHAR(50),
    p_special_instructions  TEXT,
    p_internal_notes        TEXT,
    p_total_basic_amount    DECIMAL(15,2),
    p_taxes                 DECIMAL(15,2),
    p_grand_total           DECIMAL(15,2),
    p_user                  VARCHAR(50),
    p_sal_pur_group_id      BIGINT,
    p_items_json            JSONB DEFAULT '[]'::JSONB
)
LANGUAGE plpgsql AS $$
DECLARE
    v_prefix  VARCHAR(20);
    v_last_no INT;
BEGIN

    IF p_operation = 'INSERT' THEN

        IF p_po_no IS NULL OR p_po_no = '' OR p_po_no = 'Auto Generated' THEN
            v_prefix := 'PO-' || TO_CHAR(p_po_date, 'YYYYMM') || '-';
            SELECT COALESCE(MAX(
                CASE WHEN REPLACE(po_no, v_prefix, '') ~ '^[0-9]+$'
                     THEN REPLACE(po_no, v_prefix, '')::INT
                     ELSE 0 END
            ), 0) + 1
            INTO v_last_no
            FROM "tblPurchaseOrder"
            WHERE po_no LIKE v_prefix || '%';
            p_po_no := v_prefix || LPAD(v_last_no::TEXT, 4, '0');
        END IF;

        INSERT INTO "tblPurchaseOrder" (
            po_no, po_date, expected_delivery_date, po_status, "SalPurGroupID",
            supplier_id, broker_id, zone_name, supplier_contact, supplier_address,
            gst_number, delivery_location, delivery_terms, payment_terms,
            freight_terms, currency, purchaser_name, department, cost_center,
            special_instructions, internal_notes,
            total_basic_amount, taxes, grand_total,
            status, user_created, date_created, user_modified, date_modified
        ) VALUES (
            p_po_no, p_po_date, p_expected_delivery_date, p_po_status, p_sal_pur_group_id,
            p_supplier_id, p_broker_id, p_zone_name, p_supplier_contact, p_supplier_address,
            p_gst_number, p_delivery_location, p_delivery_terms, p_payment_terms,
            p_freight_terms, p_currency, p_purchaser_name, p_department, p_cost_center,
            p_special_instructions, p_internal_notes,
            p_total_basic_amount, p_taxes, p_grand_total,
            TRUE, p_user, NOW(), p_user, NOW()
        );

        INSERT INTO "tblPurchaseOrder_TRAN" (
            "PONo", item_id, order_qty, uom, unit_rate, amount, remarks,
            user_created, date_created, user_modified, date_modified
        )
        SELECT
            p_po_no,
            (d->>'item_id')::INT,
            (d->>'order_qty')::DECIMAL(15,4),
            d->>'uom',
            (d->>'unit_rate')::DECIMAL(15,4),
            (d->>'amount')::DECIMAL(15,2),
            d->>'remarks',
            p_user, NOW(), p_user, NOW()
        FROM jsonb_array_elements(p_items_json) AS d;

    ELSIF p_operation = 'UPDATE' THEN

        UPDATE "tblPurchaseOrder" SET
            po_date                = p_po_date,
            expected_delivery_date = p_expected_delivery_date,
            po_status              = p_po_status,
            "SalPurGroupID"        = p_sal_pur_group_id,
            supplier_id            = p_supplier_id,
            broker_id              = p_broker_id,
            zone_name              = p_zone_name,
            supplier_contact       = p_supplier_contact,
            supplier_address       = p_supplier_address,
            gst_number             = p_gst_number,
            delivery_location      = p_delivery_location,
            delivery_terms         = p_delivery_terms,
            payment_terms          = p_payment_terms,
            freight_terms          = p_freight_terms,
            currency               = p_currency,
            purchaser_name         = p_purchaser_name,
            department             = p_department,
            cost_center            = p_cost_center,
            special_instructions   = p_special_instructions,
            internal_notes         = p_internal_notes,
            total_basic_amount     = p_total_basic_amount,
            taxes                  = p_taxes,
            grand_total            = p_grand_total,
            user_modified          = p_user,
            date_modified          = NOW()
        WHERE po_no = p_po_no;

        DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;

        INSERT INTO "tblPurchaseOrder_TRAN" (
            "PONo", item_id, order_qty, uom, unit_rate, amount, remarks,
            user_created, date_created, user_modified, date_modified
        )
        SELECT
            p_po_no,
            (d->>'item_id')::INT,
            (d->>'order_qty')::DECIMAL(15,4),
            d->>'uom',
            (d->>'unit_rate')::DECIMAL(15,4),
            (d->>'amount')::DECIMAL(15,2),
            d->>'remarks',
            p_user, NOW(), p_user, NOW()
        FROM jsonb_array_elements(p_items_json) AS d;

    ELSIF p_operation = 'DELETE' THEN

        UPDATE "tblPurchaseOrder" SET
            status        = FALSE,
            user_modified = p_user,
            date_modified = NOW()
        WHERE po_no = p_po_no;

    ELSIF p_operation = 'HARD_DELETE' THEN

        DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;
        DELETE FROM "tblPurchaseOrder"      WHERE po_no  = p_po_no;

    END IF;
END;
$$;


-- ================================================================
-- SECTION 6: SEED / REFERENCE DATA
--            Minimum required data to use the application
-- ================================================================

-- Default Categories (required for AccountMaster)
INSERT INTO "tblCategory" ("categoryName", "categoryType") VALUES
    ('Assets',      'A'),
    ('Liabilities', 'L'),
    ('Income',      'I'),
    ('Expense',     'E'),
    ('Capital',     'C')
ON CONFLICT DO NOTHING;

-- Default Zone
INSERT INTO "tblZone" ("ZoneName") VALUES
    ('North'), ('South'), ('East'), ('West'), ('Central')
ON CONFLICT DO NOTHING;


-- ================================================================
-- SECTION 7: VERIFY — Check all tables were created
-- ================================================================

SELECT
    table_name,
    CASE WHEN table_name IN (
        'tblCategory','tblAccountmaster','tblBroker','tblVendorSupplier',
        'tblZone','tblMaterial','tblSalPurGroup','tblSalPurGroup_Tran',
        'tblCASHBANK','tblCASHBANK_TRAN','tblSectionC','tblSectionC_TRAN',
        'tblGateEntry','tblPurchaseOrder','tblPurchaseOrder_TRAN',
        'tblPurSales','tblPurSales_Tran'
    ) THEN '✅ Created' ELSE '⚠ Other' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check stored procedures
SELECT proname AS procedure_name, prokind AS type
FROM pg_proc
WHERE proname IN ('sp_manage_transaction', 'sp_manage_purchase_order')
ORDER BY proname;

-- ================================================================
-- DONE!
-- You should see 17 tables and 2 stored procedures listed above.
--
-- Next: Update your .env file with DB credentials and run:
--   python manage.py migrate --run-syncdb
-- ================================================================
