"""
purchase_order_sp_helper.py
---------------------------
Thin helper that wraps CALL sp_manage_purchase_order(...) on PostgreSQL,
with a plain Django ORM fallback for SQLite (used in unit-tests).

Only Subsection X (Purchase Order) logic lives here.
No other section is affected.
"""

import json
from django.db import connection


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_float(val, default=0.0):
    """Safely cast any numeric-ish value to float."""
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _to_date_str(val, fmt='%Y-%m-%d'):
    """Return a date/datetime as a string, or None."""
    if val is None:
        return None
    if hasattr(val, 'strftime'):
        return val.strftime(fmt)
    s = str(val)
    # strip time portion for date-only fields
    return s.split('T')[0].split(' ')[0] if ' ' in s or 'T' in s else s


def _to_datetime_str(val):
    """Return a datetime as a string, or None."""
    if val is None:
        return None
    if hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d %H:%M:%S')
    return str(val)


def _fk_id(val):
    """Resolve a FK value (model instance or raw id) to an int or None."""
    if val is None:
        return None
    if hasattr(val, 'pk'):
        return val.pk
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def execute_sp_purchase_order(operation, header_data, items_data, username):
    """
    Execute sp_manage_purchase_order for Subsection X (Purchase Order).

    Parameters
    ----------
    operation   : str  — 'INSERT', 'UPDATE', 'DELETE', or 'HARD_DELETE'
    header_data : dict — PO header fields (mirrors PurchaseOrder model fields)
    items_data  : list[dict] — item rows (order_qty, unit_rate, uom, item, remarks)
    username    : str  — audit user

    Returns
    -------
    str — the po_no (useful after INSERT auto-generation)
    """

    # ------------------------------------------------------------------
    # Normalise header
    # ------------------------------------------------------------------
    po_no = header_data.get('po_no') or header_data.get('po_number')
    if not po_no or po_no == 'Auto Generated':
        po_no = None  # SP will auto-generate

    po_date_str = _to_datetime_str(header_data.get('po_date'))
    exp_del_str = _to_date_str(header_data.get('expected_delivery_date'))

    supplier_id = _fk_id(header_data.get('supplier') or header_data.get('supplier_id'))
    broker_id   = _fk_id(header_data.get('broker')   or header_data.get('broker_id'))
    sal_pur_group_id = _fk_id(header_data.get('sal_pur_group') or header_data.get('sal_pur_group_id'))

    po_status            = header_data.get('po_status', 'Draft')
    zone_name            = header_data.get('zone_name', '')
    supplier_contact     = header_data.get('supplier_contact') or ''
    supplier_address     = header_data.get('supplier_address') or ''
    gst_number           = header_data.get('gst_number') or ''
    delivery_location    = header_data.get('delivery_location', '')
    delivery_terms       = header_data.get('delivery_terms', '')
    payment_terms        = header_data.get('payment_terms', '')
    freight_terms        = header_data.get('freight_terms', '')
    currency             = header_data.get('currency', 'INR')
    purchaser_name       = header_data.get('purchaser_name') or ''
    department           = header_data.get('department') or ''
    cost_center          = header_data.get('cost_center') or ''
    special_instructions = header_data.get('special_instructions') or ''
    internal_notes       = header_data.get('internal_notes') or ''

    # ------------------------------------------------------------------
    # Normalise & compute item rows
    # ------------------------------------------------------------------
    normalized_items = []
    basic_total = 0.0

    for row in items_data:
        item_id   = _fk_id(row.get('item') or row.get('item_id'))
        order_qty = _to_float(row.get('order_qty'))
        unit_rate = _to_float(row.get('unit_rate'))
        row_amount = round(order_qty * unit_rate, 2)
        basic_total += row_amount

        normalized_items.append({
            'item_id':   item_id,
            'order_qty': order_qty,
            'uom':       row.get('uom', ''),
            'unit_rate': unit_rate,
            'amount':    row_amount,
            'remarks':   row.get('remarks') or '',
        })

    # Compute totals (GST removed — no longer required)
    total_basic_amount = round(basic_total, 2)
    taxes              = 0.00
    grand_total        = total_basic_amount

    # If the header already carries pre-computed totals (e.g. UPDATE path),
    # prefer those if they were explicitly provided.
    if 'total_basic_amount' in header_data and header_data['total_basic_amount'] is not None:
        total_basic_amount = _to_float(header_data['total_basic_amount'])
    if 'taxes' in header_data and header_data['taxes'] is not None:
        taxes = _to_float(header_data['taxes'])
    if 'grand_total' in header_data and header_data['grand_total'] is not None:
        grand_total = _to_float(header_data['grand_total'])

    # ------------------------------------------------------------------
    # PostgreSQL path — call the stored procedure
    # ------------------------------------------------------------------
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CALL sp_manage_purchase_order(
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s
                )
                """,
                [
                    operation,
                    po_no,
                    po_date_str,
                    exp_del_str,
                    po_status,
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
                    username,
                    sal_pur_group_id,
                    json.dumps(normalized_items),
                ]
            )

            if operation == 'INSERT':
                row = cursor.fetchone()
                if row:
                    return row[0]          # INOUT p_po_no is returned as first column

        return po_no

    # ------------------------------------------------------------------
    # SQLite / ORM fallback (used by unit tests)
    # ------------------------------------------------------------------
    from dashboard.models.purchase_order import PurchaseOrder, PurchaseOrderItem

    if operation == 'INSERT':
        from django.utils import timezone
        import re

        # Auto-generate PO number if not supplied
        if not po_no:
            now = timezone.now()
            prefix = f"PO-{now.strftime('%Y%m')}-"
            last = (
                PurchaseOrder.objects
                .filter(po_no__startswith=prefix)
                .order_by('po_no')
                .last()
            )
            if last:
                try:
                    last_num = int(last.po_no.replace(prefix, ''))
                    po_no = f"{prefix}{last_num + 1:04d}"
                except ValueError:
                    po_no = f"{prefix}0001"
            else:
                po_no = f"{prefix}0001"

        po = PurchaseOrder(
            po_no=po_no,
            po_date=header_data.get('po_date'),
            expected_delivery_date=header_data.get('expected_delivery_date'),
            po_status=po_status,
            sal_pur_group_id=sal_pur_group_id,
            supplier_id=supplier_id,
            broker_id=broker_id,
            zone_name=zone_name,
            supplier_contact=supplier_contact,
            supplier_address=supplier_address,
            gst_number=gst_number,
            delivery_location=delivery_location,
            delivery_terms=delivery_terms,
            payment_terms=payment_terms,
            freight_terms=freight_terms,
            currency=currency,
            purchaser_name=purchaser_name,
            department=department,
            cost_center=cost_center,
            special_instructions=special_instructions,
            internal_notes=internal_notes,
            total_basic_amount=total_basic_amount,
            taxes=taxes,
            grand_total=grand_total,
            status=True,
            user_created=username,
            user_modified=username,
        )
        # Bypass model.save() auto-generation (we already built the po_no above)
        from django.db import models as dj_models
        dj_models.Model.save(po)

        for item in normalized_items:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                item_id=item['item_id'],
                order_qty=item['order_qty'],
                uom=item['uom'],
                unit_rate=item['unit_rate'],
                amount=item['amount'],
                remarks=item['remarks'],
                user_created=username,
                user_modified=username,
            )
        return po_no

    elif operation == 'UPDATE':
        po = PurchaseOrder.objects.get(po_no=po_no)
        po.po_date                = header_data.get('po_date', po.po_date)
        po.expected_delivery_date = header_data.get('expected_delivery_date', po.expected_delivery_date)
        po.po_status              = po_status
        po.sal_pur_group_id       = sal_pur_group_id
        po.supplier_id            = supplier_id
        po.broker_id              = broker_id
        po.zone_name              = zone_name
        po.supplier_contact       = supplier_contact
        po.supplier_address       = supplier_address
        po.gst_number             = gst_number
        po.delivery_location      = delivery_location
        po.delivery_terms         = delivery_terms
        po.payment_terms          = payment_terms
        po.freight_terms          = freight_terms
        po.currency               = currency
        po.purchaser_name         = purchaser_name
        po.department             = department
        po.cost_center            = cost_center
        po.special_instructions   = special_instructions
        po.internal_notes         = internal_notes
        po.total_basic_amount     = total_basic_amount
        po.taxes                  = taxes
        po.grand_total            = grand_total
        po.user_modified          = username
        # Use Model.save directly to skip auto-numbering logic in PurchaseOrder.save()
        from django.db import models as dj_models
        dj_models.Model.save(po)

        po.items.all().delete()
        for item in normalized_items:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                item_id=item['item_id'],
                order_qty=item['order_qty'],
                uom=item['uom'],
                unit_rate=item['unit_rate'],
                amount=item['amount'],
                remarks=item['remarks'],
                user_created=po.user_created,
                user_modified=username,
            )
        return po_no

    elif operation == 'DELETE':
        PurchaseOrder.objects.filter(po_no=po_no).update(
            status=False,
            user_modified=username,
        )
        return po_no

    elif operation == 'HARD_DELETE':
        PurchaseOrderItem.objects.filter(purchase_order_id=po_no).delete()
        PurchaseOrder.objects.filter(po_no=po_no).delete()
        return po_no
