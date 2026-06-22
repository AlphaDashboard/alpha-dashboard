# Generated manually on 2026-05-22

from django.db import migrations


def create_procedures(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # 1. Transaction Ingestion SP
            cursor.execute("""
                CREATE OR REPLACE PROCEDURE sp_upsert_b2_voucher(
                    INOUT p_voucher_no VARCHAR(50),
                    p_transaction_date TIMESTAMP,
                    p_tran_type VARCHAR(4),
                    p_rpid VARCHAR(1),
                    p_amount DECIMAL(15, 2),
                    p_narration VARCHAR(200),
                    p_bank_account_id INT,
                    p_ref_voucher_no VARCHAR(50),
                    p_posting_status VARCHAR(20),
                    p_user VARCHAR(50),
                    p_details_json JSONB
                )
                LANGUAGE plpgsql AS $$
                DECLARE
                    v_is_new BOOLEAN := FALSE;
                    v_detail_sum DECIMAL(15, 2) := 0.00;
                BEGIN
                    -- Check locks if exists and is POSTED
                    IF EXISTS (
                        SELECT 1 FROM "tblSubsectionB2" 
                        WHERE voucher_no = p_voucher_no AND posting_status = 'POSTED'
                    ) THEN
                        RAISE EXCEPTION 'Cannot edit a POSTED transaction.';
                    END IF;

                    -- Validate details sum matches p_amount
                    SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00) INTO v_detail_sum
                    FROM jsonb_array_elements(p_details_json) AS d;

                    IF v_detail_sum <> p_amount THEN
                        RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
                    END IF;

                    -- Generate voucher_no if not provided
                    IF p_voucher_no IS NULL OR p_voucher_no = '' THEN
                        p_voucher_no := fn_generate_b2_voucher_no(p_transaction_date);
                        v_is_new := TRUE;
                    END IF;

                    -- Insert or Update Header
                    IF v_is_new THEN
                        INSERT INTO "tblSubsectionB2" (
                            voucher_no, transaction_date, tran_type, rpid, amount, narration,
                            "BankAccount", ref_voucher_no, status, posting_status,
                            user_created, date_created, user_modified, date_modified
                        ) VALUES (
                            p_voucher_no, p_transaction_date, p_tran_type, p_rpid, p_amount, p_narration,
                            p_bank_account_id, p_ref_voucher_no, TRUE, p_posting_status,
                            p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                        );
                    ELSE
                        UPDATE "tblSubsectionB2" SET
                            transaction_date = p_transaction_date,
                            tran_type = p_tran_type,
                            rpid = p_rpid,
                            amount = p_amount,
                            narration = p_narration,
                            "BankAccount" = p_bank_account_id,
                            ref_voucher_no = p_ref_voucher_no,
                            posting_status = p_posting_status,
                            user_modified = p_user,
                            date_modified = CURRENT_TIMESTAMP
                        WHERE voucher_no = p_voucher_no;
                    END IF;

                    -- Delete old detail rows (Safe detail recreation)
                    DELETE FROM "tblSubsectionB2_TRAN" WHERE "VoucherNo" = p_voucher_no;

                    -- Insert new detail rows
                    INSERT INTO "tblSubsectionB2_TRAN" (
                        "VoucherNo", transaction_date, tran_type, rpid, alpha_group_id, amount,
                        remarks, cost_center, chq_no, chq_date, payee_bank,
                        user_created, date_created, user_modified, date_modified
                    )
                    SELECT
                        p_voucher_no,
                        p_transaction_date,
                        p_tran_type,
                        p_rpid,
                        (d->>'alpha_group_id')::INT,
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

                END;
                $$;
            """)

            # 2. Dashboard Aggregations SP/UDF
            cursor.execute("""
                CREATE OR REPLACE FUNCTION sp_get_b2_dashboard_aggregates(
                    p_start_date TIMESTAMP,
                    p_end_date TIMESTAMP
                )
                RETURNS TABLE (
                    category_name VARCHAR(50),
                    group_name VARCHAR(100),
                    total_amount DECIMAL(15, 2)
                )
                AS $$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        h.tran_type::VARCHAR(50) AS category_name,
                        COALESCE(c."Alpha Group Name", 'Unknown')::VARCHAR(100) AS group_name,
                        SUM(d.amount) AS total_amount
                    FROM "tblSubsectionB2" h
                    JOIN "tblSubsectionB2_TRAN" d ON h.voucher_no = d."VoucherNo"
                    LEFT JOIN "tblAlphagroup" c ON d.alpha_group_id = c.id
                    WHERE h.transaction_date BETWEEN p_start_date AND p_end_date
                      AND h.status = TRUE
                    GROUP BY h.tran_type, c."Alpha Group Name";
                END;
                $$ LANGUAGE plpgsql;
            """)

            # 3. Ledger Reporting SP/UDF
            cursor.execute("""
                CREATE OR REPLACE FUNCTION sp_get_b2_ledger_report(
                    p_start_date TIMESTAMP,
                    p_end_date TIMESTAMP,
                    p_limit INT,
                    p_offset INT
                )
                RETURNS TABLE (
                    voucher_no VARCHAR(50),
                    transaction_date TIMESTAMP,
                    tran_type VARCHAR(4),
                    rpid VARCHAR(1),
                    amount DECIMAL(15, 2),
                    narration VARCHAR(200),
                    posting_status VARCHAR(20),
                    total_records BIGINT
                )
                AS $$
                DECLARE
                    v_total_records BIGINT;
                BEGIN
                    SELECT COUNT(*) INTO v_total_records
                    FROM "tblSubsectionB2"
                    WHERE transaction_date BETWEEN p_start_date AND p_end_date
                      AND status = TRUE;

                    RETURN QUERY
                    SELECT 
                        h.voucher_no::VARCHAR(50),
                        h.transaction_date,
                        h.tran_type::VARCHAR(4),
                        h.rpid::VARCHAR(1),
                        h.amount,
                        h.narration::VARCHAR(200),
                        h.posting_status::VARCHAR(20),
                        v_total_records
                    FROM "tblSubsectionB2" h
                    WHERE h.transaction_date BETWEEN p_start_date AND p_end_date
                      AND h.status = TRUE
                    ORDER BY h.transaction_date DESC, h.date_created DESC
                    LIMIT p_limit
                    OFFSET p_offset;
                END;
                $$ LANGUAGE plpgsql;
            """)


def drop_procedures(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                DROP FUNCTION IF EXISTS sp_get_b2_ledger_report(TIMESTAMP, TIMESTAMP, INT, INT);
                DROP FUNCTION IF EXISTS sp_get_b2_dashboard_aggregates(TIMESTAMP, TIMESTAMP);
                DROP PROCEDURE IF EXISTS sp_upsert_b2_voucher(VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0014_subsection_b2_udfs'),
    ]

    operations = [
        migrations.RunPython(create_procedures, drop_procedures),
    ]
