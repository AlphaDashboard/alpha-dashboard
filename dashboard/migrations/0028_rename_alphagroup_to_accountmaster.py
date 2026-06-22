import django.db.models.deletion
from django.db import migrations, models

def create_renamed_sps(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # 1. Drop old sp_manage_transaction and recreate it
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
                    v_module_type VARCHAR(10) := '';
                BEGIN
                    IF p_module = 'SUBSECTION_B2' THEN
                        v_module_type := 'B2';
                    END IF;

                    IF p_operation = 'INSERT' OR p_operation = 'UPDATE' THEN
                        IF p_module = 'SECTION_A' THEN
                            SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00) INTO v_detail_sum
                            FROM jsonb_array_elements(p_details_json) AS d
                            WHERE d->>'rpid' = 'A';
                        ELSE
                            SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00) INTO v_detail_sum
                            FROM jsonb_array_elements(p_details_json) AS d;
                        END IF;

                        IF v_detail_sum <> p_amount THEN
                            RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
                        END IF;
                    END IF;

                    IF p_operation = 'INSERT' THEN
                        IF p_voucher_no IS NULL OR p_voucher_no = '' THEN
                            IF p_module = 'SUBSECTION_B2' THEN
                                p_voucher_no := fn_generate_b2_voucher_no(p_date);
                            ELSE
                                SELECT COALESCE(MAX(CASE WHEN voucher_no ~ '^[0-9]+$' THEN voucher_no::INTEGER ELSE 0 END), 0) + 1 INTO p_voucher_no
                                FROM "tblCASHBANK";
                            END IF;
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
                            p_voucher_no,
                            p_date,
                            p_tran_type,
                            COALESCE(d->>'rpid', p_rpid),
                            COALESCE((d->>'account_master')::INT, (d->>'alpha_group')::INT),
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
                            "VoucherNo", date, tran_type, rpid, accountmaster_id, amount,
                            remarks, cost_center, chq_no, chq_date, payee_bank,
                            user_created, date_created, user_modified, date_modified
                        )
                        SELECT
                            p_voucher_no,
                            p_date,
                            p_tran_type,
                            COALESCE(d->>'rpid', p_rpid),
                            COALESCE((d->>'account_master')::INT, (d->>'alpha_group')::INT),
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
                        IF p_module = 'SUBSECTION_B2' OR p_module = 'SECTION_C' OR p_module = 'SECTION_A' THEN
                            UPDATE "tblCASHBANK" SET
                                status = FALSE,
                                user_modified = p_user,
                                date_modified = CURRENT_TIMESTAMP
                            WHERE voucher_no = p_voucher_no;
                        ELSE
                            DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
                            DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                        END IF;

                    ELSIF p_operation = 'HARD_DELETE' THEN
                        DELETE FROM "tblCASHBANK_TRAN" WHERE "VoucherNo" = p_voucher_no;
                        DELETE FROM "tblCASHBANK" WHERE voucher_no = p_voucher_no;
                    END IF;
                END;
                $$;
            """)

            # 2. Recreate sp_upsert_b2_voucher
            cursor.execute("DROP PROCEDURE IF EXISTS sp_upsert_b2_voucher(VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);")
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
                    IF EXISTS (
                        SELECT 1 FROM "tblSubsectionB2" 
                        WHERE voucher_no = p_voucher_no AND posting_status = 'POSTED'
                    ) THEN
                        RAISE EXCEPTION 'Cannot edit a POSTED transaction.';
                    END IF;

                    SELECT COALESCE(SUM((d->>'amount')::DECIMAL(15, 2)), 0.00) INTO v_detail_sum
                    FROM jsonb_array_elements(p_details_json) AS d;

                    IF v_detail_sum <> p_amount THEN
                        RAISE EXCEPTION 'Header amount does not match sum of detail lines.';
                    END IF;

                    IF p_voucher_no IS NULL OR p_voucher_no = '' THEN
                        p_voucher_no := fn_generate_b2_voucher_no(p_transaction_date);
                        v_is_new := TRUE;
                    END IF;

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

                    DELETE FROM "tblSubsectionB2_TRAN" WHERE "VoucherNo" = p_voucher_no;

                    INSERT INTO "tblSubsectionB2_TRAN" (
                        "VoucherNo", transaction_date, tran_type, rpid, accountmaster_id, amount,
                        remarks, cost_center, chq_no, chq_date, payee_bank,
                        user_created, date_created, user_modified, date_modified
                    )
                    SELECT
                        p_voucher_no,
                        p_transaction_date,
                        p_tran_type,
                        p_rpid,
                        COALESCE((d->>'account_master_id')::INT, (d->>'account_master')::INT, (d->>'accountmaster_id')::INT, (d->>'account_master')::INT, (d->>'alpha_group_id')::INT, (d->>'alpha_group')::INT),
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

            # 3. Recreate sp_get_b2_dashboard_aggregates
            cursor.execute("DROP FUNCTION IF EXISTS sp_get_b2_dashboard_aggregates(TIMESTAMP, TIMESTAMP);")
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
                        COALESCE(c."Account_Name", 'Unknown')::VARCHAR(100) AS group_name,
                        SUM(d.amount) AS total_amount
                    FROM "tblSubsectionB2" h
                    JOIN "tblSubsectionB2_TRAN" d ON h.voucher_no = d."VoucherNo"
                    LEFT JOIN "tblAccountmaster" c ON d.accountmaster_id = c.id
                    WHERE h.transaction_date BETWEEN p_start_date AND p_end_date
                      AND h.status = TRUE
                    GROUP BY h.tran_type, c."Account_Name";
                END;
                $$ LANGUAGE plpgsql;
            """)

def drop_renamed_sps(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("DROP FUNCTION IF EXISTS sp_get_b2_dashboard_aggregates(TIMESTAMP, TIMESTAMP);")
            cursor.execute("DROP PROCEDURE IF EXISTS sp_upsert_b2_voucher(VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);")
            cursor.execute("DROP PROCEDURE IF EXISTS sp_manage_transaction(VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, JSONB);")


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0027_broker_vendorsupplier_alter_purchaseorder_broker_and_more'),
    ]

    operations = [
        # 1. Rename Model Alpha to AccountMaster
        migrations.RenameModel(
            old_name='Alpha',
            new_name='AccountMaster',
        ),
        # 2. Rename the database table
        migrations.AlterModelTable(
            name='accountmaster',
            table='tblAccountmaster',
        ),
        # 3. Rename fields
        migrations.RenameField(
            model_name='cashbanktran',
            old_name='alpha_group',
            new_name='account_master',
        ),
        migrations.RenameField(
            model_name='sectionctran',
            old_name='alpha_group',
            new_name='account_master',
        ),
        migrations.RenameField(
            model_name='subsectionb2tran',
            old_name='alpha_group',
            new_name='account_master',
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RenameField(
                    model_name='voucherfact',
                    old_name='alpha_group',
                    new_name='account_master',
                ),
                migrations.AlterField(
                    model_name='voucherfact',
                    name='account_master',
                    field=models.ForeignKey(
                        to='dashboard.AccountMaster',
                        on_delete=django.db.models.deletion.PROTECT,
                        db_column='accountmaster_id',
                        verbose_name='Account Master'
                    ),
                ),
            ]
        ),
        # 4. Alter ForeignKey fields
        migrations.AlterField(
            model_name='cashbank',
            name='bank_account',
            field=models.ForeignKey(blank=True, db_column='BankAccount', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='cashbank_transactions', to='dashboard.accountmaster', verbose_name='Bank Account'),
        ),
        migrations.AlterField(
            model_name='cashbanktran',
            name='account_master',
            field=models.ForeignKey(blank=True, db_column='accountmaster_id', null=True, on_delete=django.db.models.deletion.PROTECT, to='dashboard.accountmaster', verbose_name='Account Master'),
        ),
        migrations.AlterField(
            model_name='sectionc',
            name='bank_account',
            field=models.ForeignKey(blank=True, db_column='BankAccount', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='sectionc_transactions', to='dashboard.accountmaster', verbose_name='Bank Account'),
        ),
        migrations.AlterField(
            model_name='sectionctran',
            name='account_master',
            field=models.ForeignKey(blank=True, db_column='accountmaster_id', null=True, on_delete=django.db.models.deletion.PROTECT, to='dashboard.accountmaster', verbose_name='Account Master'),
        ),
        migrations.AlterField(
            model_name='subsectionb2',
            name='bank_account',
            field=models.ForeignKey(blank=True, db_column='BankAccount', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='b2_transactions', to='dashboard.accountmaster', verbose_name='Bank Account'),
        ),
        migrations.AlterField(
            model_name='subsectionb2tran',
            name='account_master',
            field=models.ForeignKey(blank=True, db_column='accountmaster_id', null=True, on_delete=django.db.models.deletion.PROTECT, to='dashboard.accountmaster', verbose_name='Account Master'),
        ),
        # 5. Rename column on the unmanaged dashboard_voucherfact table in PostgreSQL
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'dashboard_voucherfact' AND column_name = 'alpha_group_id'
                ) THEN
                    ALTER TABLE "dashboard_voucherfact" RENAME COLUMN "alpha_group_id" TO "accountmaster_id";
                END IF;
            END $$;
            """,
            reverse_sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'dashboard_voucherfact' AND column_name = 'accountmaster_id'
                ) THEN
                    ALTER TABLE "dashboard_voucherfact" RENAME COLUMN "accountmaster_id" TO "alpha_group_id";
                END IF;
            END $$;
            """
        ),
        # 6. Recreate stored procedures
        migrations.RunPython(create_renamed_sps, drop_renamed_sps),
    ]
