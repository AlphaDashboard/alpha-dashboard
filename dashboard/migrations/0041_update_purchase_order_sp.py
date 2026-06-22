# Generated manually — Update Purchase Order Stored Procedure with Sales/Purchase Group

from django.db import migrations


def create_sp_manage_purchase_order_new(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return  # SP only needed on PostgreSQL; ORM fallback used on SQLite

    with schema_editor.connection.cursor() as cursor:
        # Drop old versions with exact signatures to avoid ambiguity/overloading issues
        cursor.execute("""
            DROP PROCEDURE IF EXISTS sp_manage_purchase_order(
                VARCHAR, INOUT VARCHAR, TIMESTAMP, DATE, VARCHAR,
                INT, INT, VARCHAR, VARCHAR, TEXT,
                VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
                VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT,
                TEXT, DECIMAL, DECIMAL, DECIMAL, VARCHAR,
                JSONB
            );
        """)
        cursor.execute("""
            DROP PROCEDURE IF EXISTS sp_manage_purchase_order(
                VARCHAR, INOUT VARCHAR, TIMESTAMP, DATE, VARCHAR,
                INT, INT, VARCHAR, VARCHAR, TEXT,
                VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
                VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT,
                TEXT, DECIMAL, DECIMAL, DECIMAL, VARCHAR,
                BIGINT, JSONB
            );
        """)

        cursor.execute("""
            CREATE OR REPLACE PROCEDURE sp_manage_purchase_order(
                p_operation             VARCHAR(20),
                INOUT p_po_no           VARCHAR(50),
                p_po_date               TIMESTAMP,
                p_expected_delivery_date DATE,
                p_po_status             VARCHAR(20),
                p_supplier_id           INT,
                p_broker_id             INT,
                p_zone_name             VARCHAR(50),
                p_supplier_contact      VARCHAR(50),
                p_supplier_address      TEXT,
                p_gst_number            VARCHAR(50),
                p_delivery_location     VARCHAR(100),
                p_delivery_terms        VARCHAR(100),
                p_payment_terms         VARCHAR(100),
                p_freight_terms         VARCHAR(100),
                p_currency              VARCHAR(10),
                p_purchaser_name        VARCHAR(100),
                p_department            VARCHAR(50),
                p_cost_center           VARCHAR(50),
                p_special_instructions  TEXT,
                p_internal_notes        TEXT,
                p_total_basic_amount    DECIMAL(15, 2),
                p_taxes                 DECIMAL(15, 2),
                p_grand_total           DECIMAL(15, 2),
                p_user                  VARCHAR(50),
                p_sal_pur_group_id      BIGINT,
                p_items_json            JSONB DEFAULT '[]'::jsonb
            )
            LANGUAGE plpgsql AS $$
            DECLARE
                v_prefix  VARCHAR(20);
                v_last_no INT;
            BEGIN
                -- -------------------------------------------------------
                -- INSERT: auto-generate PO No then insert header + items
                -- -------------------------------------------------------
                IF p_operation = 'INSERT' THEN

                    -- Auto-generate PO number if not supplied
                    IF p_po_no IS NULL OR p_po_no = '' OR p_po_no = 'Auto Generated' THEN
                        v_prefix := 'PO-' || TO_CHAR(p_po_date, 'YYYYMM') || '-';

                        SELECT COALESCE(
                            MAX(
                                CASE
                                    WHEN REPLACE(po_no, v_prefix, '') ~ '^[0-9]+$'
                                    THEN REPLACE(po_no, v_prefix, '')::INT
                                    ELSE 0
                                END
                            ), 0
                        ) + 1
                        INTO v_last_no
                        FROM "tblPurchaseOrder"
                        WHERE po_no LIKE v_prefix || '%';

                        p_po_no := v_prefix || LPAD(v_last_no::TEXT, 4, '0');
                    END IF;

                    -- Insert header record
                    INSERT INTO "tblPurchaseOrder" (
                        po_no,
                        po_date,
                        expected_delivery_date,
                        po_status,
                        "SalPurGroupID",
                        supplier_id,
                        broker_id,
                        zone_name,
                        supplier_contact,
                        supplier_address,
                        gst_number,
                        delivery_location,
                        delivery_terms,
                        payment_terms,
                        freight_terms,
                        currency,
                        purchaser_name,
                        department,
                        cost_center,
                        special_instructions,
                        internal_notes,
                        total_basic_amount,
                        taxes,
                        grand_total,
                        status,
                        user_created,
                        date_created,
                        user_modified,
                        date_modified
                    ) VALUES (
                        p_po_no,
                        p_po_date,
                        p_expected_delivery_date,
                        p_po_status,
                        p_sal_pur_group_id,
                        p_supplier_id,
                        p_broker_id,
                        p_zone_name,
                        p_supplier_contact,
                        p_supplier_address,
                        p_gst_number,
                        p_delivery_location,
                        p_delivery_terms,
                        p_payment_terms,
                        p_freight_terms,
                        p_currency,
                        p_purchaser_name,
                        p_department,
                        p_cost_center,
                        p_special_instructions,
                        p_internal_notes,
                        p_total_basic_amount,
                        p_taxes,
                        p_grand_total,
                        TRUE,
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    );

                    -- Insert detail (item) rows from JSON array
                    INSERT INTO "tblPurchaseOrder_TRAN" (
                        "PONo",
                        item_id,
                        order_qty,
                        uom,
                        unit_rate,
                        amount,
                        remarks,
                        user_created,
                        date_created,
                        user_modified,
                        date_modified
                    )
                    SELECT
                        p_po_no,
                        (d->>'item_id')::INT,
                        (d->>'order_qty')::DECIMAL(15, 4),
                        d->>'uom',
                        (d->>'unit_rate')::DECIMAL(15, 4),
                        (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks',
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_items_json) AS d;

                -- -------------------------------------------------------
                -- UPDATE: update header, wipe old items, re-insert new ones
                -- -------------------------------------------------------
                ELSIF p_operation = 'UPDATE' THEN

                    UPDATE "tblPurchaseOrder" SET
                        po_date                = p_po_date,
                        expected_delivery_date = p_expected_delivery_date,
                        po_status              = p_po_status,
                        "SalPurGroupID"        = p_sal_pur_group_id,
                        supplier_id            = p_supplier_id,
                        broker_id              = p_broker_id,
                        zone_name              = p_zone_name,
                        supplier_contact       = p_supplier_contact,
                        supplier_address       = p_supplier_address,
                        gst_number             = p_gst_number,
                        delivery_location      = p_delivery_location,
                        delivery_terms         = p_delivery_terms,
                        payment_terms          = p_payment_terms,
                        freight_terms          = p_freight_terms,
                        currency               = p_currency,
                        purchaser_name         = p_purchaser_name,
                        department             = p_department,
                        cost_center            = p_cost_center,
                        special_instructions   = p_special_instructions,
                        internal_notes         = p_internal_notes,
                        total_basic_amount     = p_total_basic_amount,
                        taxes                  = p_taxes,
                        grand_total            = p_grand_total,
                        user_modified          = p_user,
                        date_modified          = CURRENT_TIMESTAMP
                    WHERE po_no = p_po_no;

                    -- Remove all existing item lines
                    DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;

                    -- Re-insert the updated item lines
                    INSERT INTO "tblPurchaseOrder_TRAN" (
                        "PONo",
                        item_id,
                        order_qty,
                        uom,
                        unit_rate,
                        amount,
                        remarks,
                        user_created,
                        date_created,
                        user_modified,
                        date_modified
                    )
                    SELECT
                        p_po_no,
                        (d->>'item_id')::INT,
                        (d->>'order_qty')::DECIMAL(15, 4),
                        d->>'uom',
                        (d->>'unit_rate')::DECIMAL(15, 4),
                        (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks',
                        p_user,
                        CURRENT_TIMESTAMP,
                        p_user,
                        CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_items_json) AS d;

                -- -------------------------------------------------------
                -- DELETE: soft-delete — set status = FALSE
                -- -------------------------------------------------------
                ELSIF p_operation = 'DELETE' THEN

                    UPDATE "tblPurchaseOrder" SET
                        status        = FALSE,
                        user_modified = p_user,
                        date_modified = CURRENT_TIMESTAMP
                    WHERE po_no = p_po_no;

                -- -------------------------------------------------------
                -- HARD_DELETE: permanently remove items then header
                -- -------------------------------------------------------
                ELSIF p_operation = 'HARD_DELETE' THEN

                    DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;
                    DELETE FROM "tblPurchaseOrder" WHERE po_no = p_po_no;

                END IF;
            END;
            $$;
        """)


def rollback_sp_manage_purchase_order_new(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    with schema_editor.connection.cursor() as cursor:
        # Drop the new signature
        cursor.execute("""
            DROP PROCEDURE IF EXISTS sp_manage_purchase_order(
                VARCHAR, INOUT VARCHAR, TIMESTAMP, DATE, VARCHAR,
                INT, INT, VARCHAR, VARCHAR, TEXT,
                VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR,
                VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT,
                TEXT, DECIMAL, DECIMAL, DECIMAL, VARCHAR,
                BIGINT, JSONB
            );
        """)
        # Recreate the old signature
        cursor.execute("""
            CREATE OR REPLACE PROCEDURE sp_manage_purchase_order(
                p_operation             VARCHAR(20),
                INOUT p_po_no           VARCHAR(50),
                p_po_date               TIMESTAMP,
                p_expected_delivery_date DATE,
                p_po_status             VARCHAR(20),
                p_supplier_id           INT,
                p_broker_id             INT,
                p_zone_name             VARCHAR(50),
                p_supplier_contact      VARCHAR(50),
                p_supplier_address      TEXT,
                p_gst_number            VARCHAR(50),
                p_delivery_location     VARCHAR(100),
                p_delivery_terms        VARCHAR(100),
                p_payment_terms         VARCHAR(100),
                p_freight_terms         VARCHAR(100),
                p_currency              VARCHAR(10),
                p_purchaser_name        VARCHAR(100),
                p_department            VARCHAR(50),
                p_cost_center           VARCHAR(50),
                p_special_instructions  TEXT,
                p_internal_notes        TEXT,
                p_total_basic_amount    DECIMAL(15, 2),
                p_taxes                 DECIMAL(15, 2),
                p_grand_total           DECIMAL(15, 2),
                p_user                  VARCHAR(50),
                p_items_json            JSONB DEFAULT '[]'::jsonb
            )
            LANGUAGE plpgsql AS $$
            DECLARE
                v_prefix  VARCHAR(20);
                v_last_no INT;
            BEGIN
                IF p_operation = 'INSERT' THEN
                    IF p_po_no IS NULL OR p_po_no = '' OR p_po_no = 'Auto Generated' THEN
                        v_prefix := 'PO-' || TO_CHAR(p_po_date, 'YYYYMM') || '-';
                        SELECT COALESCE(
                            MAX(
                                CASE
                                    WHEN REPLACE(po_no, v_prefix, '') ~ '^[0-9]+$'
                                    THEN REPLACE(po_no, v_prefix, '')::INT
                                    ELSE 0
                                END
                            ), 0
                        ) + 1
                        INTO v_last_no
                        FROM "tblPurchaseOrder"
                        WHERE po_no LIKE v_prefix || '%';
                        p_po_no := v_prefix || LPAD(v_last_no::TEXT, 4, '0');
                    END IF;

                    INSERT INTO "tblPurchaseOrder" (
                        po_no, po_date, expected_delivery_date, po_status,
                        supplier_id, broker_id, zone_name, supplier_contact,
                        supplier_address, gst_number, delivery_location,
                        delivery_terms, payment_terms, freight_terms, currency,
                        purchaser_name, department, cost_center, special_instructions,
                        internal_notes, total_basic_amount, taxes, grand_total,
                        status, user_created, date_created, user_modified, date_modified
                    ) VALUES (
                        p_po_no, p_po_date, p_expected_delivery_date, p_po_status,
                        p_supplier_id, p_broker_id, p_zone_name, p_supplier_contact,
                        p_supplier_address, p_gst_number, p_delivery_location,
                        p_delivery_terms, p_payment_terms, p_freight_terms, p_currency,
                        p_purchaser_name, p_department, p_cost_center, p_special_instructions,
                        p_internal_notes, p_total_basic_amount, p_taxes, p_grand_total,
                        TRUE, p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                    );

                    INSERT INTO "tblPurchaseOrder_TRAN" (
                        "PONo", item_id, order_qty, uom, unit_rate, amount, remarks,
                        user_created, date_created, user_modified, date_modified
                    )
                    SELECT
                        p_po_no, (d->>'item_id')::INT, (d->>'order_qty')::DECIMAL(15, 4),
                        d->>'uom', (d->>'unit_rate')::DECIMAL(15, 4), (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks', p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_items_json) AS d;

                ELSIF p_operation = 'UPDATE' THEN
                    UPDATE "tblPurchaseOrder" SET
                        po_date                = p_po_date,
                        expected_delivery_date = p_expected_delivery_date,
                        po_status              = p_po_status,
                        supplier_id            = p_supplier_id,
                        broker_id              = p_broker_id,
                        zone_name              = p_zone_name,
                        supplier_contact       = p_supplier_contact,
                        supplier_address       = p_supplier_address,
                        gst_number             = p_gst_number,
                        delivery_location      = p_delivery_location,
                        delivery_terms         = p_delivery_terms,
                        payment_terms          = p_payment_terms,
                        freight_terms          = p_freight_terms,
                        currency               = p_currency,
                        purchaser_name         = p_purchaser_name,
                        department             = p_department,
                        cost_center            = p_cost_center,
                        special_instructions   = p_special_instructions,
                        internal_notes         = p_internal_notes,
                        total_basic_amount     = p_total_basic_amount,
                        taxes                  = p_taxes,
                        grand_total            = p_grand_total,
                        user_modified          = p_user,
                        date_modified          = CURRENT_TIMESTAMP
                    WHERE po_no = p_po_no;

                    DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;

                    INSERT INTO "tblPurchaseOrder_TRAN" (
                        "PONo", item_id, order_qty, uom, unit_rate, amount, remarks,
                        user_created, date_created, user_modified, date_modified
                    )
                    SELECT
                        p_po_no, (d->>'item_id')::INT, (d->>'order_qty')::DECIMAL(15, 4),
                        d->>'uom', (d->>'unit_rate')::DECIMAL(15, 4), (d->>'amount')::DECIMAL(15, 2),
                        d->>'remarks', p_user, CURRENT_TIMESTAMP, p_user, CURRENT_TIMESTAMP
                    FROM jsonb_array_elements(p_items_json) AS d;

                ELSIF p_operation = 'DELETE' THEN
                    UPDATE "tblPurchaseOrder" SET
                        status        = FALSE,
                        user_modified = p_user,
                        date_modified = CURRENT_TIMESTAMP
                    WHERE po_no = p_po_no;

                ELSIF p_operation = 'HARD_DELETE' THEN
                    DELETE FROM "tblPurchaseOrder_TRAN" WHERE "PONo" = p_po_no;
                    DELETE FROM "tblPurchaseOrder" WHERE po_no = p_po_no;
                END IF;
            END;
            $$;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0040_alter_voucher_options_alter_voucherfact_options_and_more'),
    ]

    operations = [
        migrations.RunPython(
            create_sp_manage_purchase_order_new,
            rollback_sp_manage_purchase_order_new,
        ),
    ]
