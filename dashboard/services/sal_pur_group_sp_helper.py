import json
from django.db import connection

def _fk_id(val):
    if val is None:
        return None
    if hasattr(val, 'pk'):
        return val.pk
    try:
        return int(val)
    except (TypeError, ValueError):
        return None

def execute_sp_sal_pur_group(operation, header_data, items_data, username):
    """
    Execute sp_manage_sal_pur_group for Sales/Purchase Groups.
    """
    group_id = _fk_id(header_data.get('SalPurGroupID') or header_data.get('group_id'))
    if not group_id or group_id == 0:
        group_id = None

    group_name = header_data.get('SalPurGroupName')
    groupwise_accounting = header_data.get('GroupwiseAccounting')
    groupwise_account_id = _fk_id(header_data.get('GroupwiseAccountID') or header_data.get('groupwise_account_id'))
    transaction_type_id = _fk_id(header_data.get('TransactionTypeID') or header_data.get('transaction_type_id'))
    interstate = header_data.get('Interstate_Y_WithinState_N')
    gst_applicable = header_data.get('GST_Applicable_Y_N')
    is_gst_applicable_y1n0 = header_data.get('IsGSTApplicableY1N0')
    igst1_cgst0 = header_data.get('IGST1_CGST0')
    is_active = header_data.get('is_active', True)

    # Normalize transaction items
    normalized_items = []
    for row in items_data:
        charge_account_id = _fk_id(row.get('ChargeAccountID') or row.get('charge_account_id'))
        normalized_items.append({
            'ChargesName': row.get('ChargesName') or '',
            'ChargeAccountID': charge_account_id,
            'Auto_Y_Manual_N': row.get('Auto_Y_Manual_N'),
            'Rate': float(row.get('Rate') or 0.0),
            'Debit_D_Credit_C': row.get('Debit_D_Credit_C') or 'D'
        })

    # PostgreSQL path
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CALL sp_manage_sal_pur_group(
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s
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
                if row:
                    return row[0]
        return group_id

    # SQLite fallback path
    from dashboard.models.sal_pur_group import SalPurGroup, SalPurGroupTran

    if operation == 'INSERT':
        if not group_id:
            max_obj = SalPurGroup.objects.order_by('SalPurGroupID').last()
            group_id = (max_obj.SalPurGroupID + 1) if max_obj else 1

        group = SalPurGroup(
            SalPurGroupID=group_id,
            SalPurGroupName=group_name,
            GroupwiseAccounting=groupwise_accounting,
            GroupwiseAccountID_id=groupwise_account_id,
            TransactionTypeID_id=transaction_type_id,
            Interstate_Y_WithinState_N=interstate,
            GST_Applicable_Y_N=gst_applicable,
            IsGSTApplicableY1N0=is_gst_applicable_y1n0,
            IGST1_CGST0=igst1_cgst0,
            is_active=is_active,
            UserCreated=username,
            UserModified=username
        )
        from django.db import models as dj_models
        dj_models.Model.save(group)

        for item in normalized_items:
            SalPurGroupTran.objects.create(
                SalPurGroupID=group,
                ChargesName=item['ChargesName'],
                ChargeAccountID_id=item['ChargeAccountID'],
                Auto_Y_Manual_N=item['Auto_Y_Manual_N'],
                Rate=item['Rate'],
                Debit_D_Credit_C=item['Debit_D_Credit_C'],
                UserCreated=username,
                UserModified=username
            )
        return group_id

    elif operation == 'UPDATE':
        group = SalPurGroup.objects.get(SalPurGroupID=group_id)
        group.SalPurGroupName = group_name
        group.GroupwiseAccounting = groupwise_accounting
        group.GroupwiseAccountID_id = groupwise_account_id
        group.TransactionTypeID_id = transaction_type_id
        group.Interstate_Y_WithinState_N = interstate
        group.GST_Applicable_Y_N = gst_applicable
        group.IsGSTApplicableY1N0 = is_gst_applicable_y1n0
        group.IGST1_CGST0 = igst1_cgst0
        group.is_active = is_active
        group.UserModified = username
        
        from django.db import models as dj_models
        dj_models.Model.save(group)

        # Recreate transactions
        group.transactions.all().delete()
        for item in normalized_items:
            SalPurGroupTran.objects.create(
                SalPurGroupID=group,
                ChargesName=item['ChargesName'],
                ChargeAccountID_id=item['ChargeAccountID'],
                Auto_Y_Manual_N=item['Auto_Y_Manual_N'],
                Rate=item['Rate'],
                Debit_D_Credit_C=item['Debit_D_Credit_C'],
                UserCreated=group.UserCreated,
                UserModified=username
            )
        return group_id

    elif operation == 'DELETE':
        SalPurGroupTran.objects.filter(SalPurGroupID_id=group_id).delete()
        SalPurGroup.objects.filter(SalPurGroupID=group_id).delete()
        return group_id
