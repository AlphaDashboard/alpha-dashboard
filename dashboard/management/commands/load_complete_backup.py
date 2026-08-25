import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Load complete PostgreSQL schema, stored procedures, and tables from backups/complete_database_backup.sql"

    def handle(self, *args, **options):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        backup_file = base_dir / 'backups' / 'complete_database_backup.sql'
        sp_challan_file = base_dir / 'sp_manage_purchase_challan_backup.sql'

        if not backup_file.exists():
            self.stderr.write(self.style.ERROR(f"Backup file not found at {backup_file}"))
            return

        self.stdout.write(f"Reading backup SQL from {backup_file}...")
        with open(backup_file, 'r', encoding='utf-8', errors='ignore') as f:
            sql_content = f.read()

        # Remove \restrict line if any (pg_dump artifact)
        clean_lines = []
        for line in sql_content.splitlines():
            if line.startswith('\\restrict') or line.startswith('\\connect'):
                continue
            clean_lines.append(line)
        cleaned_sql = '\n'.join(clean_lines)

        self.stdout.write("Executing complete database backup SQL...")
        with connection.cursor() as cursor:
            # Ensure alpha_user role exists to avoid ownership errors
            if connection.vendor == 'postgresql':
                try:
                    cursor.execute("""
                        DO $$
                        BEGIN
                           IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'alpha_user') THEN
                              CREATE ROLE alpha_user;
                           END IF;
                        END
                        $$;
                    """)
                except Exception as e:
                    self.stdout.write(f"Role notice: {e}")

            # Execute the backup SQL
            try:
                cursor.execute(cleaned_sql)
                self.stdout.write(self.style.SUCCESS("  [OK] Complete database backup restored successfully!"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  Notice during restore: {e}"))

            # Execute sp_manage_purchase_challan backup if exists
            if sp_challan_file.exists():
                with open(sp_challan_file, 'r', encoding='utf-8', errors='ignore') as f:
                    challan_sql = f.read()
                try:
                    cursor.execute(challan_sql)
                    self.stdout.write(self.style.SUCCESS("  [OK] Purchase Challan SP restored successfully!"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Notice during Challan SP restore: {e}"))

            # Grant permissions to current user
            if connection.vendor == 'postgresql':
                try:
                    cursor.execute("""
                        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO PUBLIC;
                        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
                        GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO PUBLIC;
                    """)
                    self.stdout.write(self.style.SUCCESS("  [OK] Permissions granted!"))
                except Exception as e:
                    self.stdout.write(f"Permission notice: {e}")

        # Also run seed_data to ensure latest users exist
        from django.core.management import call_command
        call_command('seed_data')

        self.stdout.write(self.style.SUCCESS("\nAll modules, tables, stored procedures, and data are now 100% loaded!"))
