# Migration 0030 – Fix sp_manage_transaction for SECTION_A
#
# Problems fixed:
#   1. Global validation was summing ALL detail amounts (A + B) and comparing
#      against p_amount, which only contains the sum of Type-A rows.
#      For a balanced journal A=222, B=222 → sum=444 ≠ 222 → false rejection.
#   2. The SP had no handler for module='SECTION_A', so even if validation
#      somehow passed, no data would ever be written to the database.
#
# Fix:
#   • Validation is now module-aware:
#       SECTION_A → sum only rpid='A' rows  (equals the double-entry debit total)
#       all others → sum all rows           (unchanged behaviour)
#   • A complete SECTION_A INSERT / UPDATE / DELETE block is added, writing to
#     tblCASHBANK (header) and tblCASHBANK_TRAN (detail rows, each with its
#     own rpid so both A and B rows are preserved).

from django.db import migrations


def fix_sp_manage_transaction(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    with schema_editor.connection.cursor() as cursor:
        # Drop the current version so we can replace it cleanly
        cursor.execute(
            "DROP PROCEDURE IF EXISTS sp_manage_transaction("
            "VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, "
            "DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);"
        )
        cursor.execute("""
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
            LANGUAGE plpgsql AS $$
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
                        DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                    END IF;

                -- ── SECTION_C handler ─────────────────────────────────────────────
                ELSIF p_module = 'SECTION_C' THEN

                    IF p_operation = 'INSERT' THEN
                        INSERT INTO "tblSectionC" (
                            voucher_no, date, tran_type, rpid, amount, narration,
                            "BankAccount", status, user_created, date_created,
                            user_modified, date_modified
                        ) VALUES (
                            p_voucher_no, p_date, p_tran_type, p_rpid, p_amount, p_narration,
                            p_bank_account_id, TRUE, p_user, CURRENT_TIMESTAMP,
                            p_user, CURRENT_TIMESTAMP
                        );

                        INSERT INTO "tblSectionC_TRAN" (
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
                        UPDATE "tblSectionC" SET
                            date = p_date, tran_type = p_tran_type, rpid = p_rpid,
                            amount = p_amount, narration = p_narration,
                            "BankAccount" = p_bank_account_id,
                            user_modified = p_user, date_modified = CURRENT_TIMESTAMP
                        WHERE voucher_no = p_voucher_no;

                        DELETE FROM "tblSectionC_TRAN" WHERE "VoucherNo" = p_voucher_no;

                        INSERT INTO "tblSectionC_TRAN" (
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
                        UPDATE "tblSectionC" SET
                            status = FALSE, user_modified = p_user,
                            date_modified = CURRENT_TIMESTAMP
                        WHERE voucher_no = p_voucher_no;
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
                                DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                            END IF;
                        END IF;
                    END;
                END IF;
            END;
            $$;
        """)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0029_sp_subsection_y'),
    ]

    operations = [
        migrations.RunPython(fix_sp_manage_transaction, noop),
    ]
