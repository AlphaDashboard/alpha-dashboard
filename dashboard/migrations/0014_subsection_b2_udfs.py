# Generated manually on 2026-05-22

from django.db import migrations


def create_udfs(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # 1. Running Balance Calculator UDF
            cursor.execute("""
                CREATE OR REPLACE FUNCTION fn_calculate_b2_balance(
                    p_bank_account_id INT, 
                    p_up_to_date TIMESTAMP
                )
                RETURNS DECIMAL(15, 2) AS $$
                DECLARE
                    v_balance DECIMAL(15, 2) := 0.00;
                BEGIN
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN rpid IN ('R', 'D') THEN amount
                            WHEN rpid IN ('P', 'I') THEN -amount
                            ELSE 0.00
                        END
                    ), 0.00) INTO v_balance
                    FROM "tblSubsectionB2"
                    WHERE "BankAccount" = p_bank_account_id
                      AND transaction_date <= p_up_to_date
                      AND status = TRUE;
                      
                    RETURN v_balance;
                END;
                $$ LANGUAGE plpgsql;
            """)

            # 2. Monthly Sequence Generator UDF
            cursor.execute("""
                CREATE OR REPLACE FUNCTION fn_generate_b2_voucher_no(
                    p_date TIMESTAMP
                )
                RETURNS VARCHAR(50) AS $$
                DECLARE
                    v_prefix VARCHAR(10);
                    v_year_month VARCHAR(6);
                    v_next_seq INT;
                    v_voucher_no VARCHAR(50);
                BEGIN
                    v_year_month := to_char(p_date, 'YYYYMM');
                    v_prefix := 'B2-' || v_year_month || '-';
                    
                    SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_no, 11, 4) AS INT)), 0) + 1
                    INTO v_next_seq
                    FROM "tblSubsectionB2"
                    WHERE voucher_no LIKE v_prefix || '%';
                    
                    v_voucher_no := v_prefix || lpad(v_next_seq::text, 4, '0');
                    RETURN v_voucher_no;
                END;
                $$ LANGUAGE plpgsql;
            """)


def drop_udfs(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                DROP FUNCTION IF EXISTS fn_generate_b2_voucher_no(TIMESTAMP);
                DROP FUNCTION IF EXISTS fn_calculate_b2_balance(INT, TIMESTAMP);
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0013_subsection_b2_indexes'),
    ]

    operations = [
        migrations.RunPython(create_udfs, drop_udfs),
    ]
