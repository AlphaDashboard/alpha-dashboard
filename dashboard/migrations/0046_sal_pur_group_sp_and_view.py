# Migration 0046 — Register vw_sal_pur_group View and sp_manage_sal_pur_group Stored Procedure.

from django.db import migrations


def create_sp_and_view(apps, schema_editor):
    db_vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        if db_vendor == 'postgresql':
            # Create View
            cursor.execute("""
                CREATE OR REPLACE VIEW vw_sal_pur_group AS
                SELECT 
                    "SalPurGroupID", "SalPurGroupName", "GroupwiseAccounting", "GroupwiseAccountID",
                    "TransactionTypeID", "Interstate_Y_WithinState_N", "GST_Applicable_Y_N",
                    "IsGSTApplicableY1N0", "IGST1_CGST0", "UserCreated", "DateCreated",
                    "UserModified", "DateModified", "is_active"
                FROM "tblSalPurGroup";
            """)
            # Create Stored Procedure
            cursor.execute("""
                DROP PROCEDURE IF EXISTS sp_manage_sal_pur_group CASCADE;
            """)
            cursor.execute("""
                CREATE OR REPLACE PROCEDURE sp_manage_sal_pur_group(
                    p_operation             VARCHAR(20),
                    INOUT p_group_id        BIGINT,
                    p_group_name            VARCHAR(255),
                    p_groupwise_accounting  BOOLEAN,
                    p_groupwise_account_id  BIGINT,
                    p_transaction_type_id   BIGINT,
                    p_interstate            BOOLEAN,
                    p_gst_applicable        BOOLEAN,
                    p_is_gst_applicable_y1n0 BOOLEAN,
                    p_igst1_cgst0           BOOLEAN,
                    p_user                  VARCHAR(100),
                    p_is_active             BOOLEAN,
                    p_items_json            JSONB DEFAULT '[]'::JSONB
                )
                LANGUAGE plpgsql AS $$
                DECLARE
                    v_last_id BIGINT;
                BEGIN
                    IF p_operation = 'INSERT' THEN
                        IF p_group_id IS NULL OR p_group_id = 0 THEN
                            SELECT COALESCE(MAX("SalPurGroupID"), 0) + 1 INTO v_last_id FROM "tblSalPurGroup";
                            p_group_id := v_last_id;
                        END IF;

                        INSERT INTO "tblSalPurGroup" (
                            "SalPurGroupID", "SalPurGroupName", "GroupwiseAccounting", "GroupwiseAccountID",
                            "TransactionTypeID", "Interstate_Y_WithinState_N", "GST_Applicable_Y_N",
                            "IsGSTApplicableY1N0", "IGST1_CGST0", "UserCreated", "DateCreated",
                            "UserModified", "DateModified", "is_active"
                        ) VALUES (
                            p_group_id, p_group_name, p_groupwise_accounting, p_groupwise_account_id,
                            p_transaction_type_id, p_interstate, p_gst_applicable,
                            p_is_gst_applicable_y1n0, p_igst1_cgst0, p_user, NOW(),
                            p_user, NOW(), COALESCE(p_is_active, TRUE)
                        );

                        INSERT INTO "tblSalPurGroup_Tran" (
                            "ChargesName", "SalPurGroupID", "ChargeAccountID", "Auto_Y_Manual_N",
                            "Rate", "Debit_D_Credit_C", "UserCreated", "DateCreated",
                            "UserModified", "DateModified"
                        )
                        SELECT
                            d->>'ChargesName',
                            p_group_id,
                            (d->>'ChargeAccountID')::BIGINT,
                            (d->>'Auto_Y_Manual_N')::BOOLEAN,
                            (d->>'Rate')::DECIMAL(18,4),
                            d->>'Debit_D_Credit_C',
                            p_user, NOW(),
                            p_user, NOW()
                        FROM jsonb_array_elements(p_items_json) AS d;

                    ELSIF p_operation = 'UPDATE' THEN
                        UPDATE "tblSalPurGroup" SET
                            "SalPurGroupName" = p_group_name,
                            "GroupwiseAccounting" = p_groupwise_accounting,
                            "GroupwiseAccountID" = p_groupwise_account_id,
                            "TransactionTypeID" = p_transaction_type_id,
                            "Interstate_Y_WithinState_N" = p_interstate,
                            "GST_Applicable_Y_N" = p_gst_applicable,
                            "IsGSTApplicableY1N0" = p_is_gst_applicable_y1n0,
                            "IGST1_CGST0" = p_igst1_cgst0,
                            "UserModified" = p_user,
                            "DateModified" = NOW(),
                            "is_active" = COALESCE(p_is_active, "is_active")
                        WHERE "SalPurGroupID" = p_group_id;

                        DELETE FROM "tblSalPurGroup_Tran" WHERE "SalPurGroupID" = p_group_id;

                        INSERT INTO "tblSalPurGroup_Tran" (
                            "ChargesName", "SalPurGroupID", "ChargeAccountID", "Auto_Y_Manual_N",
                            "Rate", "Debit_D_Credit_C", "UserCreated", "DateCreated",
                            "UserModified", "DateModified"
                        )
                        SELECT
                            d->>'ChargesName',
                            p_group_id,
                            (d->>'ChargeAccountID')::BIGINT,
                            (d->>'Auto_Y_Manual_N')::BOOLEAN,
                            (d->>'Rate')::DECIMAL(18,4),
                            d->>'Debit_D_Credit_C',
                            p_user, NOW(),
                            p_user, NOW()
                        FROM jsonb_array_elements(p_items_json) AS d;

                    ELSIF p_operation = 'DELETE' THEN
                        DELETE FROM "tblSalPurGroup_Tran" WHERE "SalPurGroupID" = p_group_id;
                        DELETE FROM "tblSalPurGroup" WHERE "SalPurGroupID" = p_group_id;
                    END IF;
                END $$;
            """)
        elif db_vendor == 'sqlite':
            # Create View for SQLite
            cursor.execute("""
                CREATE VIEW IF NOT EXISTS vw_sal_pur_group AS
                SELECT 
                    SalPurGroupID, SalPurGroupName, GroupwiseAccounting, GroupwiseAccountID,
                    TransactionTypeID, Interstate_Y_WithinState_N, GST_Applicable_Y_N,
                    IsGSTApplicableY1N0, IGST1_CGST0, UserCreated, DateCreated,
                    UserModified, DateModified, is_active
                FROM tblSalPurGroup;
            """)


def drop_sp_and_view(apps, schema_editor):
    db_vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        if db_vendor == 'postgresql':
            cursor.execute("DROP VIEW IF EXISTS vw_sal_pur_group CASCADE;")
            cursor.execute("DROP PROCEDURE IF EXISTS sp_manage_sal_pur_group CASCADE;")
        elif db_vendor == 'sqlite':
            cursor.execute("DROP VIEW IF EXISTS vw_sal_pur_group;")


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0045_transactiontype_and_salpurgroup_txntype'),
    ]

    operations = [
        migrations.RunPython(create_sp_and_view, drop_sp_and_view),
    ]
