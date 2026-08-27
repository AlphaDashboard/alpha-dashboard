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

        acc_pur = AccountMaster.objects.filter(groupID=401).first()
        acc_sal = AccountMaster.objects.filter(groupID=501).first()

        try:
            if acc_pur:
                SalPurGroup.objects.get_or_create(
                    SalPurGroupName='Raw Material Purchase Group',
                    defaults={'TransactionTypeID': tt_pur, 'GroupwiseAccountID': acc_pur, 'is_active': True}
                )
            if acc_sal:
                SalPurGroup.objects.get_or_create(
                    SalPurGroupName='Finished Goods Sales Group',
                    defaults={'TransactionTypeID': tt_sal, 'GroupwiseAccountID': acc_sal, 'is_active': True}
                )
        except Exception:
            pass
        self.stdout.write(self.style.SUCCESS("  [OK] Transaction Types and SalPurGroups seeded"))

        self.stdout.write(self.style.SUCCESS("\nAll initial master data seeded successfully!"))
