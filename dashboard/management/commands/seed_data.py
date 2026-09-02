import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
from dashboard.models import (
    UserMaster, Category, AccountMaster, VendorSupplier,
    Broker, Zone, Material, TransactionType, SalPurGroup
)


class Command(BaseCommand):
    help = "Seed initial master data (Users, Categories, Accounts, Suppliers, Brokers, Zones, Materials, Transaction Types)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding master data...")

        # 1. Seed Users
        default_users = [
            {'user_id': 'maker', 'user_name': 'Maker User', 'role': 'Maker', 'empid': 'EMP-MAKER'},
            {'user_id': 'checker', 'user_name': 'Checker User', 'role': 'Checker', 'empid': 'EMP-CHECKER'},
            {'user_id': 'admin', 'user_name': 'Admin User', 'role': 'Admin', 'empid': 'EMP-ADMIN'},
            {'user_id': 'user1', 'user_name': 'Standard User 1', 'role': 'User', 'empid': 'EMP-001'},
            {'user_id': 'user2', 'user_name': 'Standard User 2', 'role': 'User', 'empid': 'EMP-002'},
        ]
        for u in default_users:
            UserMaster.objects.update_or_create(
                user_id=u['user_id'],
                defaults={
                    'user_name': u['user_name'],
                    'role': u['role'],
                    'empid': u['empid'],
                    'is_active': True,
                    'user_created': 'system'
                }
            )
        self.stdout.write(self.style.SUCCESS(f"  [OK] Users seeded ({len(default_users)} users)"))

        # 2. Seed Categories
        categories = [
            {'categoryName': 'Bank Accounts', 'categoryType': 'A'},
            {'categoryName': 'Cash Accounts', 'categoryType': 'A'},
            {'categoryName': 'Sundry Debtors', 'categoryType': 'A'},
            {'categoryName': 'Sundry Creditors', 'categoryType': 'L'},
            {'categoryName': 'Purchase Accounts', 'categoryType': 'E'},
            {'categoryName': 'Sales Accounts', 'categoryType': 'I'},
        ]
        cat_objs = {}
        for c in categories:
            obj, _ = Category.objects.get_or_create(
                categoryName=c['categoryName'],
                defaults={'categoryType': c['categoryType']}
            )
            cat_objs[c['categoryName']] = obj
        self.stdout.write(self.style.SUCCESS(f"  [OK] Categories seeded ({len(categories)} categories)"))

        # 3. Seed Accounts
        accounts = [
            {'groupID': 101, 'Account_Name': 'HDFC Current Account', 'display_name': 'HDFC Bank', 'cat': 'Bank Accounts', 'is_bank_account': True},
            {'groupID': 102, 'Account_Name': 'SBI Operating Account', 'display_name': 'SBI Bank', 'cat': 'Bank Accounts', 'is_bank_account': True},
            {'groupID': 103, 'Account_Name': 'ICICI Bank Account', 'display_name': 'ICICI Bank', 'cat': 'Bank Accounts', 'is_bank_account': True},
            {'groupID': 104, 'Account_Name': 'Petty Cash Main Office', 'display_name': 'Main Petty Cash', 'cat': 'Cash Accounts'},
            {'groupID': 105, 'Account_Name': 'Factory Cash Register', 'display_name': 'Factory Cash', 'cat': 'Cash Accounts'},
            {'groupID': 201, 'Account_Name': 'Tata Steel Ltd', 'display_name': 'Tata Steel', 'cat': 'Sundry Creditors'},
            {'groupID': 202, 'Account_Name': 'JSW Steel Ltd', 'display_name': 'JSW Steel', 'cat': 'Sundry Creditors'},
            {'groupID': 203, 'Account_Name': 'Hindalco Industries', 'display_name': 'Hindalco', 'cat': 'Sundry Creditors'},
            {'groupID': 204, 'Account_Name': 'Acme Industrial Supplies', 'display_name': 'Acme Supplies', 'cat': 'Sundry Creditors'},
            {'groupID': 205, 'Account_Name': 'Global Steel Traders', 'display_name': 'Global Steel', 'cat': 'Sundry Creditors'},
            {'groupID': 301, 'Account_Name': 'Larsen & Toubro Ltd', 'display_name': 'L&T', 'cat': 'Sundry Debtors'},
            {'groupID': 302, 'Account_Name': 'Godrej & Boyce Mfg Co', 'display_name': 'Godrej', 'cat': 'Sundry Debtors'},
            {'groupID': 303, 'Account_Name': 'Mahindra Heavy Engg', 'display_name': 'Mahindra', 'cat': 'Sundry Debtors'},
            {'groupID': 401, 'Account_Name': 'Raw Material Purchase A/c', 'display_name': 'RM Purchase', 'cat': 'Purchase Accounts'},
            {'groupID': 402, 'Account_Name': 'Domestic Scrap Purchase A/c', 'display_name': 'Scrap Purchase', 'cat': 'Purchase Accounts'},
            {'groupID': 501, 'Account_Name': 'Finished Goods Sales A/c', 'display_name': 'FG Sales', 'cat': 'Sales Accounts'},
        ]
        for a in accounts:
            cat = cat_objs.get(a['cat'])
            AccountMaster.objects.update_or_create(
                groupID=a['groupID'],
                defaults={
                    'Account_Name': a['Account_Name'],
                    'display_name': a['display_name'],
                    'category': cat,
                    'cl_bal': 0.00,
                    'is_active': True
                }
            )
        self.stdout.write(self.style.SUCCESS(f"  [OK] Accounts seeded ({len(accounts)} accounts)"))

        # 4. Seed Suppliers
        suppliers = [
            {'VendorSupplierID': 1, 'VendorSupplierName': 'Tata Steel Ltd', 'Address1': 'Jamshedpur', 'ContactNo': '0657-2431234', 'GSTNo': '20AAACT2727Q1ZW'},
            {'VendorSupplierID': 2, 'VendorSupplierName': 'JSW Steel Co', 'Address1': 'Mumbai', 'ContactNo': '022-42861000', 'GSTNo': '27AAACJ4321A1ZX'},
            {'VendorSupplierID': 3, 'VendorSupplierName': 'Hindalco Industries', 'Address1': 'Kolkata', 'ContactNo': '033-22883344', 'GSTNo': '19AAACH5678B1ZY'},
            {'VendorSupplierID': 4, 'VendorSupplierName': 'Acme Industrial Supplies', 'Address1': 'Pune', 'ContactNo': '020-25678901', 'GSTNo': '27AAACA1234C1ZZ'},
            {'VendorSupplierID': 5, 'VendorSupplierName': 'Global Steel Traders', 'Address1': 'Delhi', 'ContactNo': '011-45678900', 'GSTNo': '07AAACG9876D1ZU'},
            {'VendorSupplierID': 6, 'VendorSupplierName': 'Supreme Metals & Alloys', 'Address1': 'Chennai', 'ContactNo': '044-28123456', 'GSTNo': '33AAACS5432E1ZV'},
            {'VendorSupplierID': 7, 'VendorSupplierName': 'Prime Minerals Corp', 'Address1': 'Hyderabad', 'ContactNo': '040-66554433', 'GSTNo': '36AAACP1122F1ZW'},
        ]
        for s in suppliers:
            sup = VendorSupplier.objects.filter(VendorSupplierID=s['VendorSupplierID']).first()
            if sup:
                sup.VendorSupplierName = s['VendorSupplierName']
                sup.Address1 = s['Address1']
                sup.ContactNo = s['ContactNo']
                sup.GSTNo = s['GSTNo']
                sup.save()
            else:
                VendorSupplier.objects.create(**s)
        self.stdout.write(self.style.SUCCESS(f"  [OK] Suppliers seeded ({len(suppliers)} suppliers)"))

        # 5. Seed Brokers
        brokers = [
            {'BrokerID': 1, 'BrokerName': 'Direct Purchase (No Broker)', 'ContactNo': '0000000000'},
            {'BrokerID': 2, 'BrokerName': 'Apex Commodity Brokers', 'ContactNo': '9820011223'},
            {'BrokerID': 3, 'BrokerName': 'Modern Commercial Agents', 'ContactNo': '9830022334'},
            {'BrokerID': 4, 'BrokerName': 'Elite Metals Brokerage', 'ContactNo': '9840033445'},
        ]
        for b in brokers:
            brk = Broker.objects.filter(BrokerID=b['BrokerID']).first()
            if brk:
                brk.BrokerName = b['BrokerName']
                brk.ContactNo = b['ContactNo']
                brk.save()
            else:
                Broker.objects.create(**b)
        self.stdout.write(self.style.SUCCESS(f"  [OK] Brokers seeded ({len(brokers)} brokers)"))

        # 6. Seed Zones
        zones = [
            {'ZoneID': 1, 'ZoneName': 'North Zone'},
            {'ZoneID': 2, 'ZoneName': 'West Zone'},
            {'ZoneID': 3, 'ZoneName': 'South Zone'},
            {'ZoneID': 4, 'ZoneName': 'Central Zone'},
        ]
        for z in zones:
            zn = Zone.objects.filter(ZoneID=z['ZoneID']).first()
            if zn:
                zn.ZoneName = z['ZoneName']
                zn.save()
            else:
                Zone.objects.create(**z)
        self.stdout.write(self.style.SUCCESS(f"  [OK] Zones seeded ({len(zones)} zones)"))

        # 7. Seed Materials
        materials = [
            {'code': 'RM-001', 'name': 'Steel Billets 100mm', 'unit_weight': 1000.0, 'PurchaseGST': 18.0, 'SalesGST': 18.0},
            {'code': 'RM-002', 'name': 'Iron Ore Pellets Grade A', 'unit_weight': 1000.0, 'PurchaseGST': 5.0, 'SalesGST': 5.0},
            {'code': 'RM-003', 'name': 'Coking Coal Imported', 'unit_weight': 1000.0, 'PurchaseGST': 5.0, 'SalesGST': 5.0},
            {'code': 'RM-004', 'name': 'Sponge Iron Direct Reduced', 'unit_weight': 1000.0, 'PurchaseGST': 18.0, 'SalesGST': 18.0},
            {'code': 'RM-005', 'name': 'Alloy Wire Rods 8mm', 'unit_weight': 500.0, 'PurchaseGST': 18.0, 'SalesGST': 18.0},
            {'code': 'RM-006', 'name': 'Heavy Melting Steel Scrap', 'unit_weight': 1000.0, 'PurchaseGST': 18.0, 'SalesGST': 18.0},
            {'code': 'RM-007', 'name': 'Refractory Bricks High Alumina', 'unit_weight': 25.0, 'PurchaseGST': 18.0, 'SalesGST': 18.0},
        ]
        # Reset postgres sequences if on PostgreSQL
        from django.db import connection
        if connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                try:
                    cursor.execute("""
                        SELECT setval(pg_get_serial_sequence('"tblMaterial"', 'id'), coalesce(max(id), 1), true) FROM "tblMaterial";
                    """)
                except Exception:
                    pass

        try:
            for m in materials:
                mat = Material.objects.filter(material_code=m['code']).first()
                if mat:
                    mat.material_name = m['name']
                    mat.unit_weight = m['unit_weight']
                    if hasattr(mat, 'PurchaseGST'):
                        try:
                            mat.PurchaseGST = m['PurchaseGST']
                            mat.SalesGST = m['SalesGST']
                        except Exception:
                            pass
                    mat.is_active = True
                    mat.save()
                else:
                    fields = {
                        'material_code': m['code'],
                        'material_name': m['name'],
                        'unit_weight': m['unit_weight'],
                        'is_active': True,
                    }
                    try:
                        Material.objects.create(**fields, PurchaseGST=m['PurchaseGST'], SalesGST=m['SalesGST'])
                    except Exception:
                        Material.objects.create(**fields)
            self.stdout.write(self.style.SUCCESS(f"  [OK] Materials seeded ({len(materials)} materials)"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  [SKIP] Materials seeding skipped: {e}"))

        # 8. Seed Transaction Types & Sales/Purchase Groups
        tt_pur, _ = TransactionType.objects.get_or_create(
            TransactionType='PURC',
            defaults={'TransactionTypeName': 'Purchase Transaction'}
        )
        tt_sal, _ = TransactionType.objects.get_or_create(
            TransactionType='SALE',
            defaults={'TransactionTypeName': 'Sales Transaction'}
        )

        from django.db import connection
        with connection.cursor() as cursor:
            if connection.vendor == 'sqlite':
                cursor.execute("PRAGMA foreign_keys = OFF;")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tblSalPurGroup (
                        SalPurGroupID INTEGER PRIMARY KEY AUTOINCREMENT,
                        SalPurGroupName VARCHAR(255),
                        GroupwiseAccounting BOOLEAN DEFAULT 1,
                        GroupwiseAccountID INTEGER,
                        TransactionTypeID BIGINT,
                        GST_Applicable_Y_N BOOLEAN DEFAULT 1,
                        IsGSTApplicableY1N0 BOOLEAN DEFAULT 1,
                        IGST1_CGST0 BOOLEAN DEFAULT 0,
                        is_active BOOLEAN DEFAULT 1
                    );
                """)
                try:
                    cursor.execute("DROP VIEW IF EXISTS vw_sal_pur_group;")
                except Exception:
                    pass
                cursor.execute("CREATE VIEW IF NOT EXISTS vw_sal_pur_group AS SELECT * FROM tblSalPurGroup;")
                cursor.execute("""
                    INSERT OR IGNORE INTO tblSalPurGroup (SalPurGroupID, SalPurGroupName, GroupwiseAccounting, GroupwiseAccountID, TransactionTypeID, is_active)
                    VALUES 
                    (1, 'Raw Material Purchase Group', 1, 14, 1, 1),
                    (2, 'Finished Goods Sales Group', 1, 16, 2, 1);
                """)
                cursor.execute("""
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
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblGatePass (GatePassNo, GatePassdate, VehicleNo, DriverName, WeighmentNo, WeighmentDate, Bags, GrossWeight, TareWeight, NetWeight)
                    VALUES
                    (101, '2026-08-25', 'MH-12-AB-1234', 'Ramesh Kumar', 'WS-501', '2026-08-25', 100, 15200.00, 5200.00, 10000.00),
                    (102, '2026-08-26', 'MH-14-CD-5678', 'Suresh Patil', 'WS-502', '2026-08-26', 50, 12400.00, 4400.00, 8000.00),
                    (103, '2026-08-27', 'MH-15-EF-9012', 'Amit Sharma', 'WS-503', '2026-08-27', 200, 25000.00, 5000.00, 20000.00),
                    (104, '2026-08-27', 'MH-18-GH-3456', 'Vijay Singh', 'WS-504', '2026-08-27', 80, 18000.00, 6000.00, 12000.00);
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tblGatePass_Tran (
                        ID INTEGER PRIMARY KEY AUTOINCREMENT,
                        GatePassNo INTEGER,
                        GatePassDate DATE,
                        MaterialID INTEGER,
                        Bags NUMERIC(18,2) DEFAULT 0,
                        GrossWeight NUMERIC(18,2) DEFAULT 0,
                        NetWeight NUMERIC(18,2) DEFAULT 0
                    );
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblGatePass_Tran (ID, GatePassNo, GatePassDate, MaterialID, Bags, GrossWeight, NetWeight)
                    VALUES
                    (1, 101, '2026-08-25', 1, 100, 15200.00, 10000.00),
                    (2, 102, '2026-08-26', 1, 50, 12400.00, 8000.00),
                    (3, 103, '2026-08-27', 2, 200, 25000.00, 20000.00),
                    (4, 104, '2026-08-27', 3, 80, 18000.00, 12000.00);
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblGateEntry (id, gate_pass_id, entry_datetime, vehicle_number, driver_name, created_at, created_by_id, supplier_id, material_type_id)
                    VALUES
                    (1, 'GP-10101', '2026-08-25 09:30:00', 'MH-12-AB-1234', 'Ramesh Kumar', '2026-08-25 09:30:00', 1, 6, 1),
                    (2, 'GP-10102', '2026-08-26 10:00:00', 'MH-14-CD-5678', 'Suresh Patil', '2026-08-26 10:00:00', 1, 7, 1),
                    (3, 'GP-10103', '2026-08-27 08:45:00', 'MH-15-EF-9012', 'Amit Sharma', '2026-08-27 08:45:00', 1, 8, 2),
                    (4, 'GP-10104', '2026-08-27 11:15:00', 'MH-18-GH-3456', 'Vijay Singh', '2026-08-27 11:15:00', 1, 9, 3);
                """)
                cursor.execute("""
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
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblSalePurchaseChallans (ChallanNo, ChallanDate, TranType, GPNo, StatusId, PONO, PODate, GatePassDate, VehicleNo, DriverName, WeighmentSlipNo, Bags, GrossWeight, TareWeight, NetWeight, draftedby, SupplierName)
                    VALUES
                    ('PC-202608-0001', '2026-08-25', 'RMPCH', 101, 1, 'PO-202608-0001', '2026-08-20', '2026-08-25', 'MH-12-AB-1234', 'Ramesh Kumar', 'WS-501', 100, 15200.00, 5200.00, 10000.00, 'maker', 'Tata Steel Ltd'),
                    ('PC-202608-0002', '2026-08-26', 'RMPCH', 102, 2, 'PO-202608-0002', '2026-08-22', '2026-08-26', 'MH-14-CD-5678', 'Suresh Patil', 'WS-502', 50, 12400.00, 4400.00, 8000.00, 'maker', 'JSW Steel Ltd');
                """)
                cursor.execute("""
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
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tblWeighment_Tran (
                        ID INTEGER PRIMARY KEY AUTOINCREMENT,
                        WeighmentSlipNo VARCHAR(50),
                        MaterialID INTEGER,
                        Bags NUMERIC(18,2) DEFAULT 0,
                        GrossWeight NUMERIC(18,2) DEFAULT 0,
                        NetWeight NUMERIC(18,2) DEFAULT 0,
                        Remarks VARCHAR(500)
                    );
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblWeighment (WeighmentSlipNo, GatePassNo, GrossWeight, TareWeight, NetWeight, GrossDateTime, TareDateTime, VehicleType, Seller, Purchaser, status, draftedby)
                    VALUES
                    ('WS-501', 101, 15200.00, 5200.00, 10000.00, '2026-08-25 10:00:00', '2026-08-25 10:30:00', 'Truck', 'Tata Steel Ltd', 'Acme Corp', 1, 'maker'),
                    ('WS-502', 102, 12400.00, 4400.00, 8000.00, '2026-08-26 11:00:00', '2026-08-26 11:45:00', 'Trailer', 'JSW Steel Ltd', 'Acme Corp', 1, 'maker');
                """)
                cursor.execute("""
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
                        total_basic_amount NUMERIC(15,2) DEFAULT 0,
                        taxes NUMERIC(15,2) DEFAULT 0,
                        grand_total NUMERIC(15,2) DEFAULT 0,
                        status BOOLEAN DEFAULT 1
                    );
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblPurchaseBill (bill_no, tran_type, bill_date, invoice_no, bill_status, gate_pass_no, po_no, SalPurGroupID, broker_id, zone_name, supplier_id, supplier_contact, supplier_address, gst_number, total_basic_amount, grand_total, status)
                    VALUES
                    ('PB-202608-0001', 'RMPBL', '2026-08-25 10:00:00', 'INV-9001', 'Active', '101', 'PO-202608-0001', 1, 1, 'West Zone', 6, '9876543210', 'Plot 12, MIDC Industrial Area, Pune', '27ABCDE1234F1Z5', 50000.00, 59000.00, 1),
                    ('PB-202608-0002', 'RMPBL', '2026-08-26 11:30:00', 'INV-9002', 'Active', '102', 'PO-202608-0002', 1, 2, 'North Zone', 7, '9123456780', 'Industrial Estate, Mumbai', '27AABCT1332L1ZV', 80000.00, 94400.00, 1),
                    ('PB-202608-0003', 'RMPBL', '2026-08-27 14:15:00', 'INV-9003', 'Active', '103', 'PO-202608-0003', 1, 1, 'West Zone', 8, '9811122233', 'Sector 4, Phase 2, Nagpur', '27XYZPA9876Q1Z2', 120000.00, 141600.00, 1);
                """)
                cursor.execute("""
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
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO tblPurchaseOrder_TRAN (
                        id, PONo, item_id, order_qty, uom, unit_rate, amount, remarks
                    ) VALUES
                    (1, 'PO-202608-0001', 1, 10.0, 'MT', 5000.00, 50000.00, 'Steel Billets Standard'),
                    (2, 'PO-202608-0002', 2, 16.0, 'MT', 5000.00, 80000.00, 'Scrap Heavy Melting'),
                    (3, 'PO-202608-0003', 3, 20.0, 'MT', 6000.00, 120000.00, 'Sponge Iron Grade A'),
                    (4, 'PO-202608-0004', 1, 9.0, 'MT', 5000.00, 45000.00, 'Steel Billets Prime');
                """)
            elif connection.vendor == 'postgresql':
                try:
                    cursor.execute("""
                        INSERT INTO public."tblSalPurGroup" ("SalPurGroupID", "SalPurGroupName", "GroupwiseAccounting", "GroupwiseAccountID", "TransactionTypeID", "is_active")
                        VALUES 
                        (1, 'Raw Material Purchase Group', true, 401, 1, true),
                        (2, 'Finished Goods Sales Group', true, 501, 2, true)
                        ON CONFLICT ("SalPurGroupID") DO NOTHING;
                    """)
                except Exception:
                    pass
                try:
                    cursor.execute("""
                        INSERT INTO public."tblGatePass" ("GatePassNo", "GatePassdate", "VehicleNo", "DriverName", "WeighmentNo", "WeighmentDate", "Bags", "GrossWeight", "TareWeight", "NetWeight")
                        VALUES
                        (101, '2026-08-25', 'MH-12-AB-1234', 'Ramesh Kumar', 'WS-501', '2026-08-25', 100, 15200.00, 5200.00, 10000.00),
                        (102, '2026-08-26', 'MH-14-CD-5678', 'Suresh Patil', 'WS-502', '2026-08-26', 50, 12400.00, 4400.00, 8000.00),
                        (103, '2026-08-27', 'MH-15-EF-9012', 'Amit Sharma', 'WS-503', '2026-08-27', 200, 25000.00, 5000.00, 20000.00),
                        (104, '2026-08-27', 'MH-18-GH-3456', 'Vijay Singh', 'WS-504', '2026-08-27', 80, 18000.00, 6000.00, 12000.00)
                        ON CONFLICT ("GatePassNo") DO NOTHING;
                    """)
                except Exception:
                    pass
                try:
                    cursor.execute("""
                        INSERT INTO public."tblSalePurchaseChallans" ("ChallanNo", "ChallanDate", "TranType", "GPNo", "StatusId", "PONO", "PODate", "GatePassDate", "VehicleNo", "DriverName", "WeighmentSlipNo", "Bags", "GrossWeight", "TareWeight", "NetWeight", "draftedby")
                        VALUES
                        ('PC-202608-0001', '2026-08-25', 'RMPCH', 101, 1, 'PO-202608-0001', '2026-08-20', '2026-08-25', 'MH-12-AB-1234', 'Ramesh Kumar', 'WS-501', 100, 15200.00, 5200.00, 10000.00, 'maker'),
                        ('PC-202608-0002', '2026-08-26', 'RMPCH', 102, 2, 'PO-202608-0002', '2026-08-22', '2026-08-26', 'MH-14-CD-5678', 'Suresh Patil', 'WS-502', 50, 12400.00, 4400.00, 8000.00, 'maker')
                        ON CONFLICT ("ChallanNo") DO NOTHING;
                    """)
                except Exception:
                    pass
                try:
                    cursor.execute("""
                        INSERT INTO public."tblPurchaseBill" ("bill_no", "tran_type", "bill_date", "invoice_no", "bill_status", "gate_pass_no", "po_no", "SalPurGroupID", "broker_id", "zone_name", "supplier_id", "supplier_contact", "supplier_address", "gst_number", "total_basic_amount", "grand_total", "status")
                        VALUES
                        ('PB-202608-0001', 'RMPBL', '2026-08-25 10:00:00', 'INV-9001', 'Active', '101', 'PO-202608-0001', 1, 1, 'West Zone', 1, '9876543210', 'Plot 12, MIDC Industrial Area, Pune', '27ABCDE1234F1Z5', 50000.00, 59000.00, true),
                        ('PB-202608-0002', 'RMPBL', '2026-08-26 11:30:00', 'INV-9002', 'Active', '102', 'PO-202608-0002', 1, 2, 'North Zone', 2, '9123456780', 'Industrial Estate, Mumbai', '27AABCT1332L1ZV', 80000.00, 94400.00, true),
                        ('PB-202608-0003', 'RMPBL', '2026-08-27 14:15:00', 'INV-9003', 'Active', '103', 'PO-202608-0003', 1, 1, 'West Zone', 3, '9811122233', 'Sector 4, Phase 2, Nagpur', '27XYZPA9876Q1Z2', 120000.00, 141600.00, true)
                        ON CONFLICT ("bill_no") DO NOTHING;
                    """)
                except Exception:
                    pass

        self.stdout.write(self.style.SUCCESS("  [OK] Groups, Gate Passes, Challans, and Vouchers seeded"))

        # 9. Seed Purchase Orders via Django ORM (database-agnostic, always runs)
        try:
            from dashboard.models.purchase_order import PurchaseOrder
            import datetime
            tz = datetime.timezone.utc

            po_seed_data = [
                {
                    'po_no': 'PO-202608-0001',
                    'po_date': datetime.datetime(2026, 8, 20, 10, 0, 0, tzinfo=tz),
                    'expected_delivery_date': datetime.date(2026, 8, 30),
                    'po_status': 'Approved',
                    'zone_name': 'West Zone',
                    'supplier_contact': '9876543210',
                    'supplier_address': 'Plot 12, MIDC Industrial Area, Pune',
                    'gst_number': '27ABCDE1234F1Z5',
                    'delivery_location': 'Main Plant, Pune',
                    'delivery_terms': 'Immediate',
                    'payment_terms': '30 Days Net',
                    'freight_terms': 'Ex-Works',
                    'currency': 'INR',
                    'total_basic_amount': 50000.00,
                    'taxes': 9000.00,
                    'grand_total': 59000.00,
                    'supplier_id': 1,
                    'broker_id': 1,
                    'date_created': datetime.datetime(2026, 8, 20, 10, 0, 0, tzinfo=tz),
                    'date_modified': datetime.datetime(2026, 8, 20, 10, 0, 0, tzinfo=tz),
                },
                {
                    'po_no': 'PO-202608-0002',
                    'po_date': datetime.datetime(2026, 8, 22, 11, 30, 0, tzinfo=tz),
                    'expected_delivery_date': datetime.date(2026, 9, 2),
                    'po_status': 'Approved',
                    'zone_name': 'North Zone',
                    'supplier_contact': '9123456780',
                    'supplier_address': 'Industrial Estate, Mumbai',
                    'gst_number': '27AABCT1332L1ZV',
                    'delivery_location': 'Main Plant, Pune',
                    'delivery_terms': 'Immediate',
                    'payment_terms': '45 Days Net',
                    'freight_terms': 'FOR Destination',
                    'currency': 'INR',
                    'total_basic_amount': 80000.00,
                    'taxes': 14400.00,
                    'grand_total': 94400.00,
                    'supplier_id': 2,
                    'broker_id': 2,
                    'date_created': datetime.datetime(2026, 8, 22, 11, 30, 0, tzinfo=tz),
                    'date_modified': datetime.datetime(2026, 8, 22, 11, 30, 0, tzinfo=tz),
                },
                {
                    'po_no': 'PO-202608-0003',
                    'po_date': datetime.datetime(2026, 8, 24, 14, 15, 0, tzinfo=tz),
                    'expected_delivery_date': datetime.date(2026, 9, 5),
                    'po_status': 'Approved',
                    'zone_name': 'West Zone',
                    'supplier_contact': '9811122233',
                    'supplier_address': 'Sector 4, Phase 2, Nagpur',
                    'gst_number': '27XYZPA9876Q1Z2',
                    'delivery_location': 'Main Plant, Pune',
                    'delivery_terms': 'Immediate',
                    'payment_terms': 'Immediate',
                    'freight_terms': 'Ex-Works',
                    'currency': 'INR',
                    'total_basic_amount': 120000.00,
                    'taxes': 21600.00,
                    'grand_total': 141600.00,
                    'supplier_id': 3,
                    'broker_id': 1,
                    'date_created': datetime.datetime(2026, 8, 24, 14, 15, 0, tzinfo=tz),
                    'date_modified': datetime.datetime(2026, 8, 24, 14, 15, 0, tzinfo=tz),
                },
                {
                    'po_no': 'PO-202608-0004',
                    'po_date': datetime.datetime(2026, 8, 26, 16, 0, 0, tzinfo=tz),
                    'expected_delivery_date': datetime.date(2026, 9, 8),
                    'po_status': 'Approved',
                    'zone_name': 'East Zone',
                    'supplier_contact': '9988776655',
                    'supplier_address': 'Plot 88, Whitefield, Bangalore',
                    'gst_number': '29ABCDE5678F1Z9',
                    'delivery_location': 'Main Plant, Pune',
                    'delivery_terms': 'Immediate',
                    'payment_terms': '30 Days Net',
                    'freight_terms': 'FOR Destination',
                    'currency': 'INR',
                    'total_basic_amount': 45000.00,
                    'taxes': 8100.00,
                    'grand_total': 53100.00,
                    'supplier_id': 4,
                    'broker_id': 3,
                    'date_created': datetime.datetime(2026, 8, 26, 16, 0, 0, tzinfo=tz),
                    'date_modified': datetime.datetime(2026, 8, 26, 16, 0, 0, tzinfo=tz),
                },
            ]


            po_count = 0
            for po_data in po_seed_data:
                po_no = po_data.pop('po_no')
                supplier_id = po_data.pop('supplier_id')
                broker_id = po_data.pop('broker_id')
                try:
                    supplier = VendorSupplier.objects.get(VendorSupplierID=supplier_id)
                    broker = Broker.objects.filter(BrokerID=broker_id).first()
                    _, created = PurchaseOrder.objects.get_or_create(
                        po_no=po_no,
                        defaults={**po_data, 'supplier': supplier, 'broker': broker, 'status': True}
                    )
                    if created:
                        po_count += 1
                except Exception:
                    pass
            self.stdout.write(self.style.SUCCESS(f"  [OK] Purchase Orders seeded ({po_count} new POs created)"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  [SKIP] Purchase Orders seeding skipped: {e}"))

        self.stdout.write(self.style.SUCCESS("\nAll initial master data seeded successfully!"))
