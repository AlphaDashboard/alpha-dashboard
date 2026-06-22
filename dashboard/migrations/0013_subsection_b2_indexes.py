# Generated manually on 2026-05-22

from django.db import migrations


def create_indexes(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_b2_tran_voucherno 
                    ON "tblSubsectionB2_TRAN" ("VoucherNo");

                CREATE INDEX IF NOT EXISTS idx_b2_reporting_composite 
                    ON "tblSubsectionB2" (transaction_date, posting_status);

                CREATE INDEX IF NOT EXISTS idx_b2_tran_reporting 
                    ON "tblSubsectionB2_TRAN" (transaction_date, alpha_group_id);

                CREATE INDEX IF NOT EXISTS idx_b2_cost_center_partial 
                    ON "tblSubsectionB2_TRAN" (cost_center) 
                    WHERE cost_center IS NOT NULL;

                CREATE INDEX IF NOT EXISTS idx_b2_chq_no_partial 
                    ON "tblSubsectionB2_TRAN" (chq_no) 
                    WHERE chq_no IS NOT NULL;
            """)


def drop_indexes(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                DROP INDEX IF EXISTS idx_b2_chq_no_partial;
                DROP INDEX IF EXISTS idx_b2_cost_center_partial;
                DROP INDEX IF EXISTS idx_b2_tran_reporting;
                DROP INDEX IF EXISTS idx_b2_reporting_composite;
                DROP INDEX IF EXISTS idx_b2_tran_voucherno;
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0012_subsection_b2_schema'),
    ]

    operations = [
        migrations.RunPython(create_indexes, drop_indexes),
    ]
