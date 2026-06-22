# Generated manually on 2026-05-22

from django.db import migrations


def create_triggers(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # 1. Create Lock Verification Function
            cursor.execute("""
                CREATE OR REPLACE FUNCTION fn_verify_b2_lock()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF TG_TABLE_NAME = 'tblSubsectionB2' THEN
                        IF OLD.posting_status = 'POSTED' THEN
                            RAISE EXCEPTION 'Transaction is locked (POSTED) and cannot be updated or deleted.';
                        END IF;
                    ELSIF TG_TABLE_NAME = 'tblSubsectionB2_TRAN' THEN
                        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                            IF EXISTS (
                                SELECT 1 FROM "tblSubsectionB2" 
                                WHERE voucher_no = NEW."VoucherNo" AND posting_status = 'POSTED'
                            ) THEN
                                RAISE EXCEPTION 'Parent transaction is locked (POSTED). Child detail modifications are prohibited.';
                            END IF;
                        ELSIF TG_OP = 'DELETE' THEN
                            IF EXISTS (
                                SELECT 1 FROM "tblSubsectionB2" 
                                WHERE voucher_no = OLD."VoucherNo" AND posting_status = 'POSTED'
                            ) THEN
                                RAISE EXCEPTION 'Parent transaction is locked (POSTED). Child detail modifications are prohibited.';
                            END IF;
                        END IF;
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """)

            # 2. Bind Header Trigger
            cursor.execute("""
                CREATE TRIGGER trg_verify_b2_header_lock
                BEFORE UPDATE OR DELETE ON "tblSubsectionB2"
                FOR EACH ROW EXECUTE FUNCTION fn_verify_b2_lock();
            """)

            # 3. Bind Detail Trigger
            cursor.execute("""
                CREATE TRIGGER trg_verify_b2_detail_lock
                BEFORE INSERT OR UPDATE OR DELETE ON "tblSubsectionB2_TRAN"
                FOR EACH ROW EXECUTE FUNCTION fn_verify_b2_lock();
            """)


def drop_triggers(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("DROP TRIGGER IF EXISTS trg_verify_b2_detail_lock ON \"tblSubsectionB2_TRAN\";")
            cursor.execute("DROP TRIGGER IF EXISTS trg_verify_b2_header_lock ON \"tblSubsectionB2\";")
            cursor.execute("DROP FUNCTION IF EXISTS fn_verify_b2_lock();")


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0015_subsection_b2_procedures'),
    ]

    operations = [
        migrations.RunPython(create_triggers, drop_triggers),
    ]
