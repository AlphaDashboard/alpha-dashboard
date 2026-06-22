# Generated manually on 2026-06-07

from django.db import migrations

def create_sp_manage_transaction(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # Drop the old one first to avoid parameter list mismatch if any
            cursor.execute("DROP PROCEDURE IF EXISTS sp_manage_transaction(VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);")
            cursor.execute("""
                CREATE OR REPLACE PROCEDURE sp_manage_transaction(
                    p_operation VARCHAR(20),
                    p_module VARCHAR(20),
                    INOUT p_voucher_no VARCHAR(50),
                    p_date TIMESTAMP,
                    p_tran_type VARCHAR(4),
                    p_rpid VARCHAR(1),
                    p_amount DECIMAL(15, 2),
                    p_narration VARCHAR(200),
                    p_bank_account_id INT,
                    p_user VARCHAR(50),
                    p_ref_voucher_no VARCHAR(50) DEFAULT NULL,
                    p_posting_status VARCHAR(20) DEFAULT NULL,
                    p_details_json JSONB DEFAULT '[]'::jsonb
                )
                LANGUAGE plpgsql AS $$
                DECLARE
                    v_detail_sum DECIMAL(15, 2) := 0.00;
                BEGIN
                    IF p_operation = 'INSERT' OR p_operation = 'UPDATE' THEN
                        SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00) INTO v_detail_sum
                        FROM jsonb_array_elements(p_details_json) AS d;

                        IF v_detail_sum <> p_amount THEN
                            RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
                        END IF;
                    END IF;

                    IF p_module = 'SECTION_C' THEN
                        IF p_operation = 'INSERT' THEN
                            INSERT INTO "tblSectionC" (
                                voucher_no, date, tran_type, rpid, amount, narration,
                                "BankAccount", status, user_created, date_created, user_modified, date_modified
                            ) VALUES (
                                p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                                p_bank_account_id, TRUE, p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                            );

                            INSERT INTO "tblSectionC_TRAN" (
                                "VoucherNo", date, tran_type, rpid, alpha_group_id, amount,
                                remarks, chq_no, chq_date, payee_bank,
                                user_created, date_created, user_modified, date_modified
                            )
                            SELECT
                                p_voucher_no,
                                p_date,
                                p_tran_type,
                                p_rpid,
                                (d->>'alpha_group')::INT,
                                (d->>'amount')::DECIMAL(15, 2),
                                d->>'remarks',
                                d->>'chq_no',
                                CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> '' THEN (d->>'chq_date')::DATE ELSE NULL END,
                                d->>'payee_bank',
                                p_user,
                                CURRENT_TIMESTAMP,
                                p_user,
                                CURRENT_TIMESTAMP
                            FROM jsonb_array_elements(p_details_json) AS d;

                        ELSIF p_operation = 'UPDATE' THEN
                            UPDATE "tblSectionC" SET
                                date = p_date,
                                tran_type = p_tran_type,
                                rpid = p_rpid,
                                amount = p_amount,
                                narration = p_narration,
                                "BankAccount" = p_bank_account_id,
                                user_modified = p_user,
                                date_modified = CURRENT_TIMESTAMP
                            WHERE voucher_no = p_voucher_no;

                            DELETE FROM "tblSectionC_TRAN" WHERE "VoucherNo" = p_voucher_no;

                            INSERT INTO "tblSectionC_TRAN" (
                                "VoucherNo", date, tran_type, rpid, alpha_group_id, amount,
                                remarks, chq_no, chq_date, payee_bank,
                                user_created, date_created, user_modified, date_modified
                            )
                            SELECT
                                p_voucher_no,
                                p_date,
                                p_tran_type,
                                p_rpid,
                                (d->>'alpha_group')::INT,
                                (d->>'amount')::DECIMAL(15, 2),
                                d->>'remarks',
                                d->>'chq_no',
                                CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> '' THEN (d->>'chq_date')::DATE ELSE NULL END,
                                d->>'payee_bank',
                                p_user,
                                CURRENT_TIMESTAMP,
                                p_user,
                                CURRENT_TIMESTAMP
                            FROM jsonb_array_elements(p_details_json) AS d;

                        ELSIF p_operation = 'DELETE' THEN
                            UPDATE "tblSectionC" SET
                                status = FALSE,
                                user_modified = p_user,
                                date_modified = CURRENT_TIMESTAMP
                            WHERE voucher_no = p_voucher_no;
                        END IF;

                    ELSIF p_module = 'BANK_TRANSACTION' OR p_module = 'SUBSECTION_B2' THEN
                        DECLARE
                            v_module_type VARCHAR(10) := '';
                        BEGIN
                            IF p_module = 'SUBSECTION_B2' THEN
                                v_module_type := 'B2';
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
                                    "VoucherNo", date, tran_type, rpid, alpha_group_id, amount,
                                    remarks, cost_center, chq_no, chq_date, payee_bank,
                                    user_created, date_created, user_modified, date_modified
                                )
                                SELECT
                                    p_voucher_no,
                                    p_date,
                                    p_tran_type,
                                    p_rpid,
                                    (d->>'alpha_group')::INT,
                                    (d->>'amount')::DECIMAL(15, 2),
                                    d->>'remarks',
                                    d->>'cost_center',
                                    d->>'chq_no',
                                    CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> '' THEN (d->>'chq_date')::DATE ELSE NULL END,
                                    d->>'payee_bank',
                                    p_user,
                                    CURRENT_TIMESTAMP,
                                    p_user,
                                    CURRENT_TIMESTAMP
                                FROM jsonb_array_elements(p_details_json) AS d;

                            ELSIF p_operation = 'UPDATE' THEN
                                IF v_module_type = 'B2' AND EXISTS (
                                    SELECT 1 FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no AND posting_status = 'POSTED'
                                ) THEN
                                    RAISE EXCEPTION 'Cannot edit a POSTED transaction.';
                                END IF;

                                UPDATE "tblCASHBANK" SET
                                    date = p_date,
                                    tran_type = p_tran_type,
                                    rpid = p_rpid,
                                    amount = p_amount,
                                    narration = p_narration,
                                    "BankAccount" = p_bank_account_id,
                                    posting_status = p_posting_status,
                                    ref_voucher_no = p_ref_voucher_no,
                                    user_modified = p_user,
                                    date_modified = CURRENT_TIMESTAMP
                                WHERE voucher_no = p_voucher_no;

                                DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;

                                INSERT INTO "tblCASHBANK_TRAN" (
                                    "VoucherNo", date, tran_type, rpid, alpha_group_id, amount,
                                    remarks, cost_center, chq_no, chq_date, payee_bank,
                                    user_created, date_created, user_modified, date_modified
                                )
                                SELECT
                                    p_voucher_no,
                                    p_date,
                                    p_tran_type,
                                    p_rpid,
                                    (d->>'alpha_group')::INT,
                                    (d->>'amount')::DECIMAL(15, 2),
                                    d->>'remarks',
                                    d->>'cost_center',
                                    d->>'chq_no',
                                    CASE WHEN (d->>'chq_date') IS NOT NULL AND (d->>'chq_date') <> '' THEN (d->>'chq_date')::DATE ELSE NULL END,
                                    d->>'payee_bank',
                                    p_user,
                                    CURRENT_TIMESTAMP,
                                    p_user,
                                    CURRENT_TIMESTAMP
                                FROM jsonb_array_elements(p_details_json) AS d;

                            ELSIF p_operation = 'DELETE' THEN
                                IF v_module_type = 'B2' THEN
                                    UPDATE "tblCASHBANK" SET
                                        status = FALSE,
                                        user_modified = p_user,
                                        date_modified = CURRENT_TIMESTAMP
                                    WHERE voucher_no = p_voucher_no;
                                ELSE
                                    DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                                END IF;
                            END IF;
                        END;
                    END IF;
                END;
                $$;
            """)

def drop_sp_manage_transaction(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("DROP PROCEDURE IF EXISTS sp_manage_transaction(VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);")

class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0022_remove_alpha_alpha_name_remove_alpha_code_and_more'),
    ]

    operations = [
        migrations.RunPython(create_sp_manage_transaction, drop_sp_manage_transaction),
    ]
