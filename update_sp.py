import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

# SQL for SQLite table creation fallback
sqlite_tables_sql = """
CREATE TABLE IF NOT EXISTS tblUserMaster (
    user_id VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) DEFAULT 'User',
    empid VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT 1,
    user_created VARCHAR(50),
    date_created DATETIME,
    user_modified VARCHAR(50),
    date_modified DATETIME
);

INSERT OR IGNORE INTO tblUserMaster (user_id, user_name, role, empid, is_active, user_created)
VALUES 
('maker', 'Maker User', 'Maker', 'EMP-MAKER', 1, 'system'),
('checker', 'Checker User', 'Checker', 'EMP-CHECKER', 1, 'system'),
('admin', 'Admin User', 'Admin', 'EMP-ADMIN', 1, 'system');

CREATE TABLE IF NOT EXISTS tblSalePurchaseChallans (
    ChallanNo VARCHAR(50) PRIMARY KEY,
    ChallanDate DATE,
    TranType VARCHAR(20) DEFAULT 'RMPCH',
    GPNo INTEGER,
    StatusId INTEGER DEFAULT 1,
    PONO VARCHAR(50),
    PODate DATE,
    GatePassDate DATE,
    VehicleNo VARCHAR(50),
    DriverName VARCHAR(100),
    WeighmentSlipNo VARCHAR(50),
    WeighmentDate DATE,
    Bags NUMERIC(18,2) DEFAULT 0,
    GrossWeight NUMERIC(18,2) DEFAULT 0,
    TareWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0,
    draftedby VARCHAR(100),
    DraftedDate DATETIME,
    submittedby VARCHAR(100),
    SubmissionDate DATETIME,
    approvedby VARCHAR(100),
    ApprovalDate DATETIME,
    Notes VARCHAR(1000),
    SupplierName VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS tblSalePurchaseChallans_Tran (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ChallanNo VARCHAR(50),
    MaterialID INTEGER,
    Bags NUMERIC(18,2) DEFAULT 0,
    GrossWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0,
    Remarks VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS tblGatePass (
    GatePassNo INTEGER PRIMARY KEY,
    GatePassdate DATE,
    VehicleNo VARCHAR(50),
    DriverName VARCHAR(100),
    WeighmentNo VARCHAR(50),
    WeighmentDate DATE,
    Bags NUMERIC(18,2) DEFAULT 0,
    GrossWeight NUMERIC(18,2) DEFAULT 0,
    TareWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tblGatePass_Tran (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    GatePassNo INTEGER,
    GatePassDate DATE,
    MaterialID INTEGER,
    Bags NUMERIC(18,2) DEFAULT 0,
    GrossWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tblWeighment (
    WeighmentSlipNo VARCHAR(50) PRIMARY KEY,
    GatePassNo INTEGER,
    GrossWeight NUMERIC(18,2) DEFAULT 0,
    TareWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0,
    GrossDateTime DATETIME,
    TareDateTime DATETIME,
    AutoManual VARCHAR(10) DEFAULT 'Manual',
    VehicleType VARCHAR(100),
    Purchaser VARCHAR(200),
    Seller VARCHAR(200),
    Remarks VARCHAR(500),
    status INTEGER DEFAULT 1,
    draftedby VARCHAR(100),
    DraftedDate DATETIME,
    submittedby VARCHAR(100),
    SubmissionDate DATETIME,
    approvedby VARCHAR(100),
    ApprovalDate DATETIME
);

CREATE TABLE IF NOT EXISTS tblWeighment_Tran (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    WeighmentSlipNo VARCHAR(50),
    MaterialID INTEGER,
    Bags NUMERIC(18,2) DEFAULT 0,
    GrossWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0,
    Remarks VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS tblGRN (
    GrnNo VARCHAR(50) PRIMARY KEY,
    GrnDate DATETIME,
    GatepassNo INTEGER,
    Netweight NUMERIC(18,2) DEFAULT 0,
    DeductedWeight NUMERIC(18,2) DEFAULT 0,
    Approvedweight NUMERIC(18,2) DEFAULT 0,
    status INTEGER DEFAULT 1,
    internalnotes VARCHAR(500),
    draftedby VARCHAR(100),
    DraftedDate DATETIME,
    submittedby VARCHAR(100),
    SubmissionDate DATETIME,
    approvedby VARCHAR(100),
    ApprovalDate DATETIME
);

CREATE TABLE IF NOT EXISTS tblGRN_Tran (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    GrnNo VARCHAR(50),
    MaterialID INTEGER,
    ItemName VARCHAR(200),
    Bags NUMERIC(18,2) DEFAULT 0,
    Weight NUMERIC(18,2) DEFAULT 0,
    DeductionPercent NUMERIC(5,2) DEFAULT 0,
    DeductionWeight NUMERIC(18,2) DEFAULT 0,
    NetWeight NUMERIC(18,2) DEFAULT 0,
    Remarks VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS tblPurchaseBill (
    bill_no VARCHAR(50) PRIMARY KEY,
    tran_type VARCHAR(20) DEFAULT 'RMPBL',
    bill_date DATETIME,
    expected_delivery_date DATE,
    invoice_no VARCHAR(50),
    bill_status VARCHAR(20) DEFAULT 'Draft',
    gate_pass_no VARCHAR(50),
    gate_pass_date DATE,
    po_no VARCHAR(50),
    po_date DATE,
    SalPurGroupID BIGINT,
    broker_id INTEGER,
    zone_name VARCHAR(50),
    supplier_id INTEGER,
    supplier_contact VARCHAR(50),
    supplier_address TEXT,
    gst_number VARCHAR(50),
    delivery_location VARCHAR(100),
    delivery_terms VARCHAR(100),
    payment_terms VARCHAR(100),
    freight_terms VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',
    purchaser_name VARCHAR(100),
    department VARCHAR(50),
    cost_center VARCHAR(50),
    special_instructions TEXT,
    internal_notes TEXT,
    total_basic_amount NUMERIC(15,2) DEFAULT 0,
    taxes NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) DEFAULT 0,
    status BOOLEAN DEFAULT 1,
    user_created VARCHAR(50),
    date_created DATETIME,
    user_modified VARCHAR(50),
    date_modified DATETIME
);

CREATE TABLE IF NOT EXISTS tblPurchaseBill_TRAN (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    BillNo VARCHAR(50),
    item_id INTEGER,
    order_qty NUMERIC(15,4) DEFAULT 0,
    uom VARCHAR(10),
    unit_rate NUMERIC(15,4) DEFAULT 0,
    amount NUMERIC(15,2) DEFAULT 0,
    remarks VARCHAR(200),
    user_created VARCHAR(50),
    date_created DATETIME,
    user_modified VARCHAR(50),
    date_modified DATETIME
);

CREATE TABLE IF NOT EXISTS tblPurchaseOrder (
    po_no VARCHAR(50) PRIMARY KEY,
    po_date DATETIME NOT NULL,
    expected_delivery_date DATE,
    po_status VARCHAR(20) DEFAULT 'Approved',
    zone_name VARCHAR(50),
    supplier_contact VARCHAR(50),
    supplier_address TEXT,
    gst_number VARCHAR(50),
    delivery_location VARCHAR(100),
    delivery_terms VARCHAR(100),
    payment_terms VARCHAR(100),
    freight_terms VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',
    purchaser_name VARCHAR(100),
    department VARCHAR(50),
    cost_center VARCHAR(50),
    special_instructions TEXT,
    internal_notes TEXT,
    total_basic_amount NUMERIC(15,2) DEFAULT 0,
    taxes NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) DEFAULT 0,
    status BOOLEAN DEFAULT 1,
    user_created VARCHAR(50),
    date_created DATETIME,
    user_modified VARCHAR(50),
    date_modified DATETIME,
    broker_id INTEGER,
    supplier_id INTEGER,
    SalPurGroupID BIGINT
);

CREATE TABLE IF NOT EXISTS tblPurchaseOrder_TRAN (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    PONo VARCHAR(50),
    item_id INTEGER,
    order_qty NUMERIC(15,4) DEFAULT 0,
    uom VARCHAR(10),
    unit_rate NUMERIC(15,4) DEFAULT 0,
    amount NUMERIC(15,2) DEFAULT 0,
    remarks VARCHAR(200),
    user_created VARCHAR(50),
    date_created DATETIME,
    user_modified VARCHAR(50),
    date_modified DATETIME
);

INSERT OR IGNORE INTO tblPurchaseOrder (
    po_no, po_date, expected_delivery_date, po_status, zone_name, supplier_contact, supplier_address, gst_number,
    delivery_location, currency, date_created, date_modified,
    total_basic_amount, taxes, grand_total, status, broker_id, supplier_id, SalPurGroupID, freight_terms, payment_terms, delivery_terms
) VALUES
('PO-202608-0001', '2026-08-20 10:00:00', '2026-08-30', 'Approved', 'West Zone', '9876543210', 'Plot 12, MIDC Industrial Area, Pune', '27ABCDE1234F1Z5',
 'Main Plant, Pune', 'INR', '2026-08-20 10:00:00', '2026-08-20 10:00:00',
 50000.00, 9000.00, 59000.00, 1, 1, 1, 1, 'Ex-Works', '30 Days Net', 'Immediate'),
('PO-202608-0002', '2026-08-22 11:30:00', '2026-09-02', 'Approved', 'North Zone', '9123456780', 'Industrial Estate, Mumbai', '27AABCT1332L1ZV',
 'Main Plant, Pune', 'INR', '2026-08-22 11:30:00', '2026-08-22 11:30:00',
 80000.00, 14400.00, 94400.00, 1, 2, 2, 1, 'FOR Destination', '45 Days Net', 'Immediate'),
('PO-202608-0003', '2026-08-24 14:15:00', '2026-09-05', 'Approved', 'West Zone', '9811122233', 'Sector 4, Phase 2, Nagpur', '27XYZPA9876Q1Z2',
 'Main Plant, Pune', 'INR', '2026-08-24 14:15:00', '2026-08-24 14:15:00',
 120000.00, 21600.00, 141600.00, 1, 1, 3, 1, 'Ex-Works', 'Immediate', 'Immediate'),
('PO-202608-0004', '2026-08-26 16:00:00', '2026-09-08', 'Approved', 'East Zone', '9988776655', 'Plot 88, Whitefield, Bangalore', '29ABCDE5678F1Z9',
 'Main Plant, Pune', 'INR', '2026-08-26 16:00:00', '2026-08-26 16:00:00',
 45000.00, 8100.00, 53100.00, 1, 3, 4, 1, 'FOR Destination', '30 Days Net', 'Immediate');

INSERT OR IGNORE INTO tblPurchaseOrder_TRAN (
    id, PONo, item_id, order_qty, uom, unit_rate, amount, remarks
) VALUES
(1, 'PO-202608-0001', 1, 10.0, 'MT', 5000.00, 50000.00, 'Steel Billets Standard'),
(2, 'PO-202608-0002', 2, 16.0, 'MT', 5000.00, 80000.00, 'Scrap Heavy Melting'),
(3, 'PO-202608-0003', 3, 20.0, 'MT', 6000.00, 120000.00, 'Sponge Iron Grade A'),
(4, 'PO-202608-0004', 1, 9.0, 'MT', 5000.00, 45000.00, 'Steel Billets Prime');
"""

postgresql_sql = """
-- 1. Create tables if not exist on PostgreSQL
CREATE TABLE IF NOT EXISTS public.tblUserMaster (
    user_id VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) DEFAULT 'User',
    empid VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    user_created VARCHAR(50),
    date_created TIMESTAMP,
    user_modified VARCHAR(50),
    date_modified TIMESTAMP
);

INSERT INTO public.tblUserMaster (user_id, user_name, role, empid, is_active, user_created)
VALUES 
('maker', 'Maker User', 'Maker', 'EMP-MAKER', TRUE, 'system'),
('checker', 'Checker User', 'Checker', 'EMP-CHECKER', TRUE, 'system'),
('admin', 'Admin User', 'Admin', 'EMP-ADMIN', TRUE, 'system')
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tblSalePurchaseChallans (
    "ChallanNo" VARCHAR(50) PRIMARY KEY,
    "ChallanDate" DATE,
    "TranType" VARCHAR(20) DEFAULT 'RMPCH',
    "GPNo" INTEGER,
    "StatusId" INTEGER DEFAULT 1,
    "PONO" VARCHAR(50),
    "PODate" DATE,
    "GatePassDate" DATE,
    "VehicleNo" VARCHAR(50),
    "DriverName" VARCHAR(100),
    "WeighmentSlipNo" VARCHAR(50),
    "WeighmentDate" DATE,
    "Bags" NUMERIC(18,2) DEFAULT 0,
    "GrossWeight" NUMERIC(18,2) DEFAULT 0,
    "TareWeight" NUMERIC(18,2) DEFAULT 0,
    "NetWeight" NUMERIC(18,2) DEFAULT 0,
    "draftedby" VARCHAR(100),
    "DraftedDate" TIMESTAMP,
    "submittedby" VARCHAR(100),
    "SubmissionDate" TIMESTAMP,
    "approvedby" VARCHAR(100),
    "ApprovalDate" TIMESTAMP,
    "Notes" VARCHAR(1000),
    "SupplierName" VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS public.tblSalePurchaseChallans_Tran (
    "ID" SERIAL PRIMARY KEY,
    "ChallanNo" VARCHAR(50),
    "MaterialID" INTEGER,
    "Bags" NUMERIC(18,2) DEFAULT 0,
    "GrossWeight" NUMERIC(18,2) DEFAULT 0,
    "NetWeight" NUMERIC(18,2) DEFAULT 0,
    "Remarks" VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS public."tblGatePass" (
    "GatePassNo" INTEGER PRIMARY KEY,
    "GatePassdate" DATE,
    "VehicleNo" VARCHAR(50),
    "DriverName" VARCHAR(100),
    "WeighmentNo" VARCHAR(50),
    "WeighmentDate" DATE,
    "Bags" NUMERIC(18,2) DEFAULT 0,
    "GrossWeight" NUMERIC(18,2) DEFAULT 0,
    "TareWeight" NUMERIC(18,2) DEFAULT 0,
    "NetWeight" NUMERIC(18,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public."tblPurchaseBill" (
    bill_no VARCHAR(50) PRIMARY KEY,
    tran_type VARCHAR(20) DEFAULT 'RMPBL',
    bill_date TIMESTAMP,
    expected_delivery_date DATE,
    invoice_no VARCHAR(50),
    bill_status VARCHAR(20) DEFAULT 'Draft',
    gate_pass_no VARCHAR(50),
    gate_pass_date DATE,
    po_no VARCHAR(50),
    po_date DATE,
    "SalPurGroupID" BIGINT,
    broker_id INTEGER,
    zone_name VARCHAR(50),
    supplier_id INTEGER,
    supplier_contact VARCHAR(50),
    supplier_address TEXT,
    gst_number VARCHAR(50),
    delivery_location VARCHAR(100),
    delivery_terms VARCHAR(100),
    payment_terms VARCHAR(100),
    freight_terms VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',
    purchaser_name VARCHAR(100),
    department VARCHAR(50),
    cost_center VARCHAR(50),
    special_instructions TEXT,
    internal_notes TEXT,
    total_basic_amount NUMERIC(15,2) DEFAULT 0,
    taxes NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) DEFAULT 0,
    status BOOLEAN DEFAULT TRUE,
    user_created VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_modified VARCHAR(50),
    date_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public."tblPurchaseBill_TRAN" (
    id SERIAL PRIMARY KEY,
    "BillNo" VARCHAR(50),
    item_id INTEGER,
    order_qty NUMERIC(15,4) DEFAULT 0,
    uom VARCHAR(10),
    unit_rate NUMERIC(15,4) DEFAULT 0,
    amount NUMERIC(15,2) DEFAULT 0,
    remarks VARCHAR(200),
    user_created VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_modified VARCHAR(50),
    date_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure Notes, GrossWeight, and SupplierName columns exist on existing tables
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tblsalepurchasechallans'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tblsalepurchasechallans' AND column_name = 'Notes'
        ) THEN
            ALTER TABLE public.tblSalePurchaseChallans ADD COLUMN "Notes" VARCHAR(1000);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tblsalepurchasechallans' AND column_name = 'SupplierName'
        ) THEN
            ALTER TABLE public.tblSalePurchaseChallans ADD COLUMN "SupplierName" VARCHAR(200);
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tblsalepurchasechallans_tran'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tblsalepurchasechallans_tran' AND column_name = 'GrossWeight'
        ) THEN
            ALTER TABLE public.tblSalePurchaseChallans_Tran ADD COLUMN "GrossWeight" NUMERIC(18,2) DEFAULT 0;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name = 'tblpurchasebill' OR table_name = 'tblPurchaseBill')
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE (table_name = 'tblpurchasebill' OR table_name = 'tblPurchaseBill') AND column_name = 'invoice_no'
        ) THEN
            ALTER TABLE public."tblPurchaseBill" ADD COLUMN invoice_no VARCHAR(50);
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name = 'tblbroker' OR table_name = 'tblBroker')
    ) THEN
        DELETE FROM public."tblBroker" a
        USING public."tblBroker" b
        WHERE a.ctid > b.ctid AND a."BrokerID" = b."BrokerID";

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public."tblBroker"'::regclass AND contype = 'p'
        ) THEN
            ALTER TABLE public."tblBroker" ADD PRIMARY KEY ("BrokerID");
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name = 'tblvendorsupplier' OR table_name = 'tblVendorSupplier')
    ) THEN
        DELETE FROM public."tblVendorSupplier" a
        USING public."tblVendorSupplier" b
        WHERE a.ctid > b.ctid AND a."VendorSupplierID" = b."VendorSupplierID";

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public."tblVendorSupplier"'::regclass AND contype = 'p'
        ) THEN
            ALTER TABLE public."tblVendorSupplier" ADD PRIMARY KEY ("VendorSupplierID");
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name = 'tblpurchasebill' OR table_name = 'tblPurchaseBill')
    ) THEN
        UPDATE public."tblPurchaseBill"
        SET grand_total = sub.s, total_basic_amount = sub.s
        FROM (
            SELECT "BillNo", COALESCE(SUM(amount), 0) AS s
            FROM public."tblPurchaseBill_TRAN"
            GROUP BY "BillNo"
        ) sub
        WHERE public."tblPurchaseBill".bill_no = sub."BillNo"
          AND (public."tblPurchaseBill".grand_total IS NULL OR public."tblPurchaseBill".grand_total = 0)
          AND sub.s > 0;
    END IF;
END $$;

-- 2. Stored Procedure: sp_manage_purchase_challan
CREATE OR REPLACE FUNCTION public.sp_manage_purchase_challan(
    p_operation character varying, 
    p_challan_no character varying DEFAULT NULL::character varying, 
    p_challan_date date DEFAULT NULL::date, 
    p_tran_type character varying DEFAULT 'RMPCH'::character varying, 
    p_gp_no integer DEFAULT NULL::integer, 
    p_status_id integer DEFAULT 1, 
    p_po_no character varying DEFAULT NULL::character varying, 
    p_po_date date DEFAULT NULL::date, 
    p_username character varying DEFAULT 'system'::character varying, 
    p_tran_items text DEFAULT '[]'::text,
    p_notes character varying DEFAULT NULL::character varying,
    p_supplier_name character varying DEFAULT NULL::character varying
)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_challan_no    VARCHAR(50);
    v_item          JSONB;
    v_items         JSONB;
    v_seq           INTEGER;
    v_today         TEXT;
    
    v_gp_date       DATE         := NULL;
    v_veh_no        VARCHAR(50)  := NULL;
    v_dr_name       VARCHAR(100) := NULL;
    v_weigh_no      VARCHAR(50)  := NULL;
    v_weigh_date    DATE         := NULL;
    v_bags          NUMERIC(18,2):= 0;
    v_gross         NUMERIC(18,2):= 0;
    v_tare          NUMERIC(18,2):= 0;
    v_net           NUMERIC(18,2):= 0;
BEGIN
    v_items := p_tran_items::JSONB;

    IF p_gp_no IS NOT NULL THEN
        SELECT "GatePassdate", "VehicleNo", "DriverName", "WeighmentNo", "WeighmentDate", "Bags", "GrossWeight", "TareWeight", "NetWeight"
          INTO v_gp_date, v_veh_no, v_dr_name, v_weigh_no, v_weigh_date, v_bags, v_gross, v_tare, v_net
          FROM public."tblGatePass"
         WHERE "GatePassNo" = p_gp_no;
    END IF;

    IF p_operation = 'INSERT' THEN
        IF p_challan_no IS NULL OR p_challan_no = '' THEN
            v_today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
            SELECT COALESCE(MAX(CAST(SPLIT_PART("ChallanNo", '-', 3) AS INTEGER)), 0) + 1
              INTO v_seq
              FROM public.tblSalePurchaseChallans
             WHERE "ChallanNo" LIKE 'PC-' || v_today || '-%';
            v_challan_no := 'PC-' || v_today || '-' || LPAD(v_seq::TEXT, 4, '0');
        ELSE
            v_challan_no := p_challan_no;
        END IF;

        INSERT INTO public.tblSalePurchaseChallans (
            "ChallanNo", "ChallanDate", "TranType", "GPNo", "StatusId",
            "PONO", "PODate", "GatePassDate", "VehicleNo", "DriverName",
            "WeighmentSlipNo", "WeighmentDate", "Bags", "GrossWeight", "TareWeight", "NetWeight",
            "draftedby", "DraftedDate", "Notes", "SupplierName"
        ) VALUES (
            v_challan_no, p_challan_date, p_tran_type, p_gp_no, p_status_id,
            p_po_no, p_po_date, v_gp_date, v_veh_no, v_dr_name,
            v_weigh_no, v_weigh_date, v_bags, v_gross, v_tare, v_net,
            p_username, NOW(), p_notes, p_supplier_name
        );

        FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(v_items)
        LOOP
            INSERT INTO public.tblSalePurchaseChallans_Tran (
                "ChallanNo", "MaterialID", "Bags", "GrossWeight", "NetWeight", "Remarks"
            ) VALUES (
                v_challan_no,
                NULLIF((v_item->>'MaterialID'), '')::INTEGER,
                COALESCE((v_item->>'Bags')::NUMERIC, 0),
                COALESCE((v_item->>'GrossWeight')::NUMERIC, 0),
                COALESCE((v_item->>'NetWeight')::NUMERIC, 0),
                COALESCE(v_item->>'Remarks', '')
            );
        END LOOP;

        RETURN v_challan_no;

    ELSIF p_operation = 'UPDATE' THEN
        v_challan_no := p_challan_no;

        UPDATE public.tblSalePurchaseChallans SET
            "ChallanDate"     = p_challan_date,
            "TranType"        = p_tran_type,
            "GPNo"            = p_gp_no,
            "StatusId"        = p_status_id,
            "PONO"            = p_po_no,
            "PODate"          = p_po_date,
            "GatePassDate"    = v_gp_date,
            "VehicleNo"       = v_veh_no,
            "DriverName"      = v_dr_name,
            "WeighmentSlipNo" = v_weigh_no,
            "WeighmentDate"   = v_weigh_date,
            "Bags"            = v_bags,
            "GrossWeight"     = v_gross,
            "TareWeight"      = v_tare,
            "NetWeight"       = v_net,
            "Notes"           = p_notes,
            "SupplierName"    = p_supplier_name,
            "submittedby"     = CASE WHEN p_status_id = 2 AND "submittedby" IS NULL THEN p_username ELSE "submittedby" END,
            "SubmissionDate"  = CASE WHEN p_status_id = 2 AND "SubmissionDate" IS NULL THEN NOW() ELSE "SubmissionDate" END,
            "approvedby"      = CASE WHEN p_status_id = 4 THEN p_username ELSE "approvedby" END,
            "ApprovalDate"    = CASE WHEN p_status_id = 4 THEN NOW() ELSE "ApprovalDate" END
        WHERE "ChallanNo" = v_challan_no;

        DELETE FROM public.tblSalePurchaseChallans_Tran WHERE "ChallanNo" = v_challan_no;

        FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(v_items)
        LOOP
            INSERT INTO public.tblSalePurchaseChallans_Tran (
                "ChallanNo", "MaterialID", "Bags", "GrossWeight", "NetWeight", "Remarks"
            ) VALUES (
                v_challan_no,
                NULLIF((v_item->>'MaterialID'), '')::INTEGER,
                COALESCE((v_item->>'Bags')::NUMERIC, 0),
                COALESCE((v_item->>'GrossWeight')::NUMERIC, 0),
                COALESCE((v_item->>'NetWeight')::NUMERIC, 0),
                COALESCE(v_item->>'Remarks', '')
            );
        END LOOP;

        RETURN v_challan_no;

    ELSIF p_operation = 'DELETE' THEN
        v_challan_no := p_challan_no;
        DELETE FROM public.tblSalePurchaseChallans_Tran WHERE "ChallanNo" = v_challan_no;
        DELETE FROM public.tblSalePurchaseChallans WHERE "ChallanNo" = v_challan_no;
        RETURN v_challan_no;
    END IF;

    RETURN NULL;
END;
$function$;

-- 3. Stored Procedure: sp_manage_purchase_bill (TranType = 'RMPBL')
DROP PROCEDURE IF EXISTS public.sp_manage_purchase_bill;
CREATE OR REPLACE PROCEDURE public.sp_manage_purchase_bill(
    p_operation             VARCHAR(20),
    INOUT p_bill_no         VARCHAR(50),
    p_bill_date             TIMESTAMP,
    p_expected_delivery_date DATE,
    p_bill_status           VARCHAR(20),
    p_gate_pass_no          VARCHAR(50),
    p_gate_pass_date        DATE,
    p_po_no                 VARCHAR(50),
    p_po_date               DATE,
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
    p_total_basic_amount    DECIMAL(15, 2),
    p_taxes                 DECIMAL(15, 2),
    p_grand_total           DECIMAL(15, 2),
    p_user                  VARCHAR(50),
    p_sal_pur_group_id      BIGINT,
    p_items_json            JSONB DEFAULT '[]'::jsonb,
    p_invoice_no            VARCHAR(50) DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_prefix  VARCHAR(20);
    v_last_no INT;
BEGIN
    IF p_operation = 'INSERT' THEN
        IF p_bill_no IS NULL OR p_bill_no = '' OR p_bill_no = 'Auto Generated' THEN
            v_prefix := 'PB-' || TO_CHAR(COALESCE(p_bill_date, CURRENT_TIMESTAMP), 'YYYYMM') || '-';

            SELECT COALESCE(
                MAX(
                    CASE
                        WHEN REPLACE(bill_no, v_prefix, '') ~ '^[0-9]+$'
                        THEN REPLACE(bill_no, v_prefix, '')::INT
                        ELSE 0
                    END
                ), 0
            ) + 1
            INTO v_last_no
            FROM public."tblPurchaseBill"
            WHERE bill_no LIKE v_prefix || '%';

            p_bill_no := v_prefix || LPAD(v_last_no::TEXT, 4, '0');
        END IF;

        INSERT INTO public."tblPurchaseBill" (
            bill_no,
            tran_type,
            bill_date,
            expected_delivery_date,
            invoice_no,
            bill_status,
            gate_pass_no,
            gate_pass_date,
            po_no,
            po_date,
            "SalPurGroupID",
            supplier_id,
            broker_id,
            zone_name,
            supplier_contact,
            supplier_address,
            gst_number,
            delivery_location,
            delivery_terms,
            payment_terms,
            freight_terms,
            currency,
            purchaser_name,
            department,
            cost_center,
            special_instructions,
            internal_notes,
            total_basic_amount,
            taxes,
            grand_total,
            status,
            user_created,
            date_created,
            user_modified,
            date_modified
        ) VALUES (
            p_bill_no,
            'RMPBL',
            COALESCE(p_bill_date, CURRENT_TIMESTAMP),
            p_expected_delivery_date,
            p_invoice_no,
            COALESCE(p_bill_status, 'Draft'),
            p_gate_pass_no,
            p_gate_pass_date,
            p_po_no,
            p_po_date,
            p_sal_pur_group_id,
            p_supplier_id,
            p_broker_id,
            COALESCE(p_zone_name, ''),
            p_supplier_contact,
            p_supplier_address,
            p_gst_number,
            COALESCE(p_delivery_location, ''),
            COALESCE(p_delivery_terms, ''),
            COALESCE(p_payment_terms, ''),
            COALESCE(p_freight_terms, ''),
            COALESCE(p_currency, 'INR'),
            p_purchaser_name,
            p_department,
            p_cost_center,
            p_special_instructions,
            p_internal_notes,
            COALESCE(p_total_basic_amount, 0.00),
            COALESCE(p_taxes, 0.00),
            COALESCE(p_grand_total, 0.00),
            TRUE,
            p_user,
            CURRENT_TIMESTAMP,
            p_user,
            CURRENT_TIMESTAMP
        );

        INSERT INTO public."tblPurchaseBill_TRAN" (
            "BillNo",
            item_id,
            order_qty,
            uom,
            unit_rate,
            amount,
            remarks,
            user_created,
            date_created,
            user_modified,
            date_modified
        )
        SELECT
            p_bill_no,
            (elem->>'item')::INT,
            (elem->>'order_qty')::DECIMAL(15, 4),
            elem->>'uom',
            (elem->>'unit_rate')::DECIMAL(15, 4),
            (elem->>'amount')::DECIMAL(15, 2),
            elem->>'remarks',
            p_user,
            CURRENT_TIMESTAMP,
            p_user,
            CURRENT_TIMESTAMP
        FROM JSONB_ARRAY_ELEMENTS(p_items_json) AS elem;

    ELSIF p_operation = 'UPDATE' THEN
        UPDATE public."tblPurchaseBill"
        SET
            bill_date              = COALESCE(p_bill_date, bill_date),
            expected_delivery_date = p_expected_delivery_date,
            invoice_no             = COALESCE(p_invoice_no, invoice_no),
            bill_status            = COALESCE(p_bill_status, bill_status),
            gate_pass_no           = p_gate_pass_no,
            gate_pass_date         = p_gate_pass_date,
            po_no                  = p_po_no,
            po_date                = p_po_date,
            "SalPurGroupID"        = p_sal_pur_group_id,
            supplier_id            = p_supplier_id,
            broker_id              = p_broker_id,
            zone_name              = COALESCE(p_zone_name, zone_name),
            supplier_contact       = p_supplier_contact,
            supplier_address       = p_supplier_address,
            gst_number             = p_gst_number,
            delivery_location      = COALESCE(p_delivery_location, delivery_location),
            delivery_terms         = COALESCE(p_delivery_terms, delivery_terms),
            payment_terms          = COALESCE(p_payment_terms, payment_terms),
            freight_terms          = COALESCE(p_freight_terms, freight_terms),
            currency               = COALESCE(p_currency, currency),
            purchaser_name         = p_purchaser_name,
            department             = p_department,
            cost_center            = p_cost_center,
            special_instructions   = p_special_instructions,
            internal_notes         = p_internal_notes,
            total_basic_amount     = COALESCE(p_total_basic_amount, total_basic_amount),
            taxes                  = COALESCE(p_taxes, taxes),
            grand_total            = COALESCE(p_grand_total, grand_total),
            user_modified          = p_user,
            date_modified          = CURRENT_TIMESTAMP
        WHERE bill_no = p_bill_no;

        DELETE FROM public."tblPurchaseBill_TRAN" WHERE "BillNo" = p_bill_no;

        INSERT INTO public."tblPurchaseBill_TRAN" (
            "BillNo",
            item_id,
            order_qty,
            uom,
            unit_rate,
            amount,
            remarks,
            user_created,
            date_created,
            user_modified,
            date_modified
        )
        SELECT
            p_bill_no,
            (elem->>'item')::INT,
            (elem->>'order_qty')::DECIMAL(15, 4),
            elem->>'uom',
            (elem->>'unit_rate')::DECIMAL(15, 4),
            (elem->>'amount')::DECIMAL(15, 2),
            elem->>'remarks',
            p_user,
            CURRENT_TIMESTAMP,
            p_user,
            CURRENT_TIMESTAMP
        FROM JSONB_ARRAY_ELEMENTS(p_items_json) AS elem;

    ELSIF p_operation = 'DELETE' THEN
        UPDATE public."tblPurchaseBill"
        SET
            status        = FALSE,
            user_modified = p_user,
            date_modified = CURRENT_TIMESTAMP
        WHERE bill_no = p_bill_no;

    ELSIF p_operation = 'HARD_DELETE' THEN
        DELETE FROM public."tblPurchaseBill_TRAN" WHERE "BillNo" = p_bill_no;
        DELETE FROM public."tblPurchaseBill" WHERE bill_no = p_bill_no;

    END IF;
END;
$$;
"""

if __name__ == '__main__':
    with connection.cursor() as cursor:
        if connection.vendor == 'sqlite':
            print("SQLite database detected. Creating local fallback tables...")
            cursor.execute("PRAGMA foreign_keys = OFF;")
            cursor.executescript(sqlite_tables_sql)
            for col, col_type in [
                ('PurchaseGST', 'NUMERIC(5,2)'),
                ('SalesGST', 'NUMERIC(6,2)'),
                ('unit_weight', 'NUMERIC(18,3)'),
                ('Auto1_Manual0_calc', 'BOOLEAN'),
                ('IsRateInclGSTY1N0', 'BOOLEAN')
            ]:
                try:
                    cursor.execute(f'ALTER TABLE tblMaterial ADD COLUMN {col} {col_type};')
                except Exception:
                    pass
            for col, col_type in [
                ('Notes', 'VARCHAR(1000)'),
                ('SupplierName', 'VARCHAR(200)')
            ]:
                try:
                    cursor.execute(f'ALTER TABLE tblSalePurchaseChallans ADD COLUMN {col} {col_type};')
                except Exception:
                    pass
            print("SUCCESS: SQLite tables and default prototype users initialized!")
        elif connection.vendor == 'postgresql':
            print("PostgreSQL database detected. Executing Stored Procedure and Schema update...")
            cursor.execute(postgresql_sql)
            print("SUCCESS: Stored Procedure sp_manage_purchase_challan and GrossWeight column updated on PostgreSQL!")
