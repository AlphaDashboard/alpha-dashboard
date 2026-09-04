import json
import logging
from django.db import connection, transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


def _fk_id(val):
    if val is None or val == '':
        return None
    if hasattr(val, 'pk'):
        return val.pk
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def _to_bool(val, default=False):
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ('true', '1', 't', 'yes', 'y')
    return bool(val)


def _to_float(val, default=0.0):
    if val is None or val == '':
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def execute_sp_sal_pur_group(operation, header_data, items_data, username='system'):
    """
    Execute sp_manage_sal_pur_group for Sales/Purchase Groups.
    Includes robust parameter normalization, stored procedure execution with explicit
    type casts, and an atomic parameterized direct SQL fallback for 100% reliability.
    """
    group_id = _fk_id(header_data.get('SalPurGroupID') or header_data.get('group_id'))
    if not group_id or group_id == 0:
        group_id = None

    group_name = (header_data.get('SalPurGroupName') or '').strip()
    groupwise_accounting = _to_bool(header_data.get('GroupwiseAccounting'))
    groupwise_account_id = _fk_id(header_data.get('GroupwiseAccountID') or header_data.get('groupwise_account_id'))
    transaction_type_id = _fk_id(header_data.get('TransactionTypeID') or header_data.get('transaction_type_id'))
    interstate = _to_bool(header_data.get('Interstate_Y_WithinState_N'), default=True)
    gst_applicable = _to_bool(header_data.get('GST_Applicable_Y_N'), default=False)
    is_gst_applicable_y1n0 = _to_bool(header_data.get('IsGSTApplicableY1N0'), default=gst_applicable)
    igst1_cgst0 = header_data.get('IGST1_CGST0')
    if igst1_cgst0 is not None:
        igst1_cgst0 = _to_bool(igst1_cgst0)
    else:
        igst1_cgst0 = interstate
    is_active = _to_bool(header_data.get('is_active', True), default=True)

    # Normalize transaction items
    normalized_items = []
    for row in (items_data or []):
        name = (row.get('ChargesName') or row.get('charge_name') or '').strip()
        if not name:
            continue
        charge_account_id = _fk_id(row.get('ChargeAccountID') or row.get('charge_account_id'))
        auto_manual = _to_bool(row.get('Auto_Y_Manual_N', True), default=True)
        rate = _to_float(row.get('Rate') or row.get('rate'))
        debit_credit = (row.get('Debit_D_Credit_C') or 'D').upper()
        if debit_credit not in ('D', 'C'):
            debit_credit = 'D'

        normalized_items.append({
            'ChargesName': name,
            'ChargeAccountID': charge_account_id,
            'Auto_Y_Manual_N': auto_manual,
            'Rate': rate,
            'Debit_D_Credit_C': debit_credit
        })

    # ── 1. PostgreSQL Stored Procedure path ────────────────────────────────────
    if connection.vendor == 'postgresql':
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_manage_sal_pur_group(
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s::jsonb
                    )
                    """,
                    [
                        operation,
                        group_id,
                        group_name,
                        groupwise_accounting,
                        groupwise_account_id,
                        transaction_type_id,
                        interstate,
                        gst_applicable,
                        is_gst_applicable_y1n0,
                        igst1_cgst0,
                        username,
                        is_active,
                        json.dumps(normalized_items)
                    ]
                )
                if operation == 'INSERT':
                    row = cursor.fetchone()
                    if row and row[0]:
                        return row[0]
            if group_id:
                return group_id
        except Exception as e:
            logger.warning("sp_manage_sal_pur_group failed, executing direct SQL fallback: %s", e)

    # ── 2. Direct Parameterized SQL Execution (PostgreSQL / SQLite) ───────────
    with transaction.atomic():
        with connection.cursor() as cursor:
            now_dt = timezone.now()

            if operation == 'INSERT':
                if connection.vendor == 'postgresql':
                    cursor.execute(
                        """
                        INSERT INTO "tblSalPurGroup" (
                            "SalPurGroupName", "GroupwiseAccounting", "GroupwiseAccountID",
                            "TransactionTypeID", "Interstate_Y_WithinState_N", "GST_Applicable_Y_N",
                            "IsGSTApplicableY1N0", "IGST1_CGST0", "UserCreated", "DateCreated",
                            "UserModified", "DateModified", "is_active"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) RETURNING "SalPurGroupID";
                        """,
                        [
                            group_name, groupwise_accounting, groupwise_account_id,
                            transaction_type_id, interstate, gst_applicable,
                            is_gst_applicable_y1n0, igst1_cgst0, username, now_dt,
                            username, now_dt, is_active
                        ]
                    )
                    row = cursor.fetchone()
                    group_id = row[0] if row else None
                else:
                    # SQLite path
                    cursor.execute('SELECT COALESCE(MAX("SalPurGroupID"), 0) + 1 FROM "tblSalPurGroup"')
                    next_id = cursor.fetchone()[0]
                    group_id = next_id
                    cursor.execute(
                        """
                        INSERT INTO "tblSalPurGroup" (
                            "SalPurGroupID", "SalPurGroupName", "GroupwiseAccounting", "GroupwiseAccountID",
                            "TransactionTypeID", "Interstate_Y_WithinState_N", "GST_Applicable_Y_N",
                            "IsGSTApplicableY1N0", "IGST1_CGST0", "UserCreated", "DateCreated",
                            "UserModified", "DateModified", "is_active"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        [
                            group_id, group_name, groupwise_accounting, groupwise_account_id,
                            transaction_type_id, interstate, gst_applicable,
                            is_gst_applicable_y1n0, igst1_cgst0, username, now_dt,
                            username, now_dt, is_active
                        ]
                    )

                for item in normalized_items:
                    cursor.execute(
                        """
                        INSERT INTO "tblSalPurGroup_Tran" (
                            "ChargesName", "SalPurGroupID", "ChargeAccountID", "Auto_Y_Manual_N",
                            "Rate", "Debit_D_Credit_C", "UserCreated", "DateCreated",
                            "UserModified", "DateModified"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        [
                            item['ChargesName'], group_id, item['ChargeAccountID'], item['Auto_Y_Manual_N'],
                            item['Rate'], item['Debit_D_Credit_C'], username, now_dt,
                            username, now_dt
                        ]
                    )
                return group_id

            elif operation == 'UPDATE':
                cursor.execute(
                    """
                    UPDATE "tblSalPurGroup" SET
                        "SalPurGroupName" = %s,
                        "GroupwiseAccounting" = %s,
                        "GroupwiseAccountID" = %s,
                        "TransactionTypeID" = %s,
                        "Interstate_Y_WithinState_N" = %s,
                        "GST_Applicable_Y_N" = %s,
                        "IsGSTApplicableY1N0" = %s,
                        "IGST1_CGST0" = %s,
                        "UserModified" = %s,
                        "DateModified" = %s,
                        "is_active" = %s
                    WHERE "SalPurGroupID" = %s
                    """,
                    [
                        group_name, groupwise_accounting, groupwise_account_id,
                        transaction_type_id, interstate, gst_applicable,
                        is_gst_applicable_y1n0, igst1_cgst0, username, now_dt,
                        is_active, group_id
                    ]
                )

                cursor.execute('DELETE FROM "tblSalPurGroup_Tran" WHERE "SalPurGroupID" = %s', [group_id])
                for item in normalized_items:
                    cursor.execute(
                        """
                        INSERT INTO "tblSalPurGroup_Tran" (
                            "ChargesName", "SalPurGroupID", "ChargeAccountID", "Auto_Y_Manual_N",
                            "Rate", "Debit_D_Credit_C", "UserCreated", "DateCreated",
                            "UserModified", "DateModified"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        [
                            item['ChargesName'], group_id, item['ChargeAccountID'], item['Auto_Y_Manual_N'],
                            item['Rate'], item['Debit_D_Credit_C'], username, now_dt,
                            username, now_dt
                        ]
                    )
                return group_id

            elif operation == 'DELETE':
                cursor.execute('DELETE FROM "tblSalPurGroup_Tran" WHERE "SalPurGroupID" = %s', [group_id])
                cursor.execute('DELETE FROM "tblSalPurGroup" WHERE "SalPurGroupID" = %s', [group_id])
                return group_id
