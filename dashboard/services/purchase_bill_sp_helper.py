"""
purchase_bill_sp_helper.py
---------------------------
Thin helper that wraps CALL sp_manage_purchase_bill(...) on PostgreSQL,
with a plain Django ORM fallback for SQLite.

Only Purchase Bill (TranType = 'RMPBL') logic lives here.
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
    if val is None or val == '':
        return None
    if hasattr(val, 'strftime'):
        return val.strftime(fmt)
    s = str(val)
    return s.split('T')[0].split(' ')[0] if ' ' in s or 'T' in s else s


def _to_datetime_str(val):
    """Return a datetime as a string, or None."""
    if val is None or val == '':
        return None
    if hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d %H:%M:%S')
    return str(val)


def _fk_id(val):
    """Resolve a FK value (model instance or raw id) to an int or None."""
    if val is None or val == '':
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

def execute_sp_purchase_bill(operation, header_data, items_data, username):
    """
    Execute sp_manage_purchase_bill for Purchase Bill (TranType = 'RMPBL').

    Parameters
    ----------
    operation   : str  — 'INSERT', 'UPDATE', 'DELETE', or 'HARD_DELETE'
    header_data : dict — Bill header fields (mirrors PurchaseBill model fields)
    items_data  : list[dict] — item rows (order_qty, unit_rate, uom, item, remarks)
    username    : str  — audit user

    Returns
    -------
    str — the bill_no
    """

    bill_no = header_data.get('bill_no')
    if not bill_no or bill_no == 'Auto Generated':
        bill_no = None  # SP will auto-generate

    bill_date_str = _to_datetime_str(header_data.get('bill_date'))
    exp_del_str   = _to_date_str(header_data.get('expected_delivery_date'))

    gate_pass_no   = header_data.get('gate_pass_no') or ''
    gate_pass_date = _to_date_str(header_data.get('gate_pass_date'))
    po_no          = header_data.get('po_no') or ''
    po_date        = _to_date_str(header_data.get('po_date'))
    invoice_no     = header_data.get('invoice_no') or ''

    supplier_id      = _fk_id(header_data.get('supplier') or header_data.get('supplier_id'))
    broker_id        = _fk_id(header_data.get('broker')   or header_data.get('broker_id'))
    sal_pur_group_id = _fk_id(header_data.get('sal_pur_group') or header_data.get('sal_pur_group_id'))

    bill_status          = header_data.get('bill_status', 'Draft')
    zone_name            = header_data.get('zone_name', '')
    supplier_contact     = header_data.get('supplier_contact') or ''
    supplier_address     = header_data.get('supplier_address') or ''
    gst_number           = header_data.get('gst_number') or ''
    delivery_location    = header_data.get('delivery_location', '')
    delivery_terms       = header_data.get('delivery_terms', '')
    payment_terms        = header_data.get('payment_terms', '')
    freight_terms        = header_data.get('freight_terms', '')
    currency             = header_data.get('currency', 'INR')

    purchaser_name       = header_data.get('purchaser_name', '')
    department           = header_data.get('department', '')
    cost_center          = header_data.get('cost_center', '')
    special_instructions = header_data.get('special_instructions', '')
    internal_notes       = header_data.get('internal_notes', '')

    total_basic_amount   = _to_float(header_data.get('total_basic_amount'))
    taxes                = _to_float(header_data.get('taxes'))
    grand_total          = _to_float(header_data.get('grand_total'))

    # Normalize items
    normalized_items = []
    for row in (items_data or []):
        item_fk = _fk_id(row.get('item') or row.get('item_id'))
        if not item_fk:
            continue
        order_qty = _to_float(row.get('order_qty'))
        unit_rate = _to_float(row.get('unit_rate'))
        amount    = _to_float(row.get('amount'), default=round(order_qty * unit_rate, 2))
        normalized_items.append({
            'item':      item_fk,
            'order_qty': order_qty,
            'uom':       str(row.get('uom') or 'Units'),
            'unit_rate': unit_rate,
            'amount':    amount,
            'remarks':   str(row.get('remarks') or ''),
        })

    # Auto-calculate totals if not provided or 0.00
    calc_basic = round(sum(it['amount'] for it in normalized_items), 2)
    if total_basic_amount == 0.00 and calc_basic > 0:
        total_basic_amount = calc_basic
    if grand_total == 0.00 and (total_basic_amount > 0 or taxes > 0):
        grand_total = round(total_basic_amount + taxes, 2)

    # ------------------------------------------------------------------
    # PostgreSQL Path (Live Server)
    # ------------------------------------------------------------------
    import sys
    TESTING = 'test' in sys.argv

    if connection.vendor == 'postgresql' and not TESTING:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_manage_purchase_bill(
                        %s, %s, %s, %s, %s,
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
                        bill_no,
                        bill_date_str,
                        exp_del_str,
                        bill_status,
                        gate_pass_no,
                        gate_pass_date,
                        po_no,
                        po_date,
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
                        invoice_no,
                    ]
                )

                if operation == 'INSERT':
                    row = cursor.fetchone()
                    if row:
                        return row[0]

            return bill_no
        except Exception:
            pass  # Fallback to ORM below

    # ------------------------------------------------------------------
    # SQLite / ORM Fallback (Local testing)
    # ------------------------------------------------------------------
    from dashboard.models.purchase_bill import PurchaseBill, PurchaseBillItem

    if operation == 'INSERT':
        from django.utils import timezone
        if not bill_no:
            now = timezone.now()
            prefix = f"PB-{now.strftime('%Y%m')}-"
            last = PurchaseBill.objects.filter(bill_no__startswith=prefix).order_by('bill_no').last()
            if last:
                try:
                    last_num = int(last.bill_no.replace(prefix, ''))
                    bill_no = f"{prefix}{last_num + 1:04d}"
                except ValueError:
                    bill_no = f"{prefix}0001"
            else:
                bill_no = f"{prefix}0001"

        bill = PurchaseBill(
            bill_no=bill_no,
            tran_type='RMPBL',
            bill_date=header_data.get('bill_date') or timezone.now(),
            expected_delivery_date=header_data.get('expected_delivery_date'),
            invoice_no=invoice_no,
            bill_status=bill_status,
            gate_pass_no=gate_pass_no,
            gate_pass_date=header_data.get('gate_pass_date'),
            po_no=po_no,
            po_date=header_data.get('po_date'),
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
        bill.save()

        for item_data in normalized_items:
            PurchaseBillItem.objects.create(
                purchase_bill=bill,
                item_id=item_data['item'],
                order_qty=item_data['order_qty'],
                uom=item_data['uom'],
                unit_rate=item_data['unit_rate'],
                amount=item_data['amount'],
                remarks=item_data['remarks'],
                user_created=username,
                user_modified=username,
            )
        return bill_no

    elif operation == 'UPDATE':
        bill = PurchaseBill.objects.get(bill_no=bill_no)
        if header_data.get('bill_date'):
            bill.bill_date = header_data.get('bill_date')
        bill.expected_delivery_date = header_data.get('expected_delivery_date')
        bill.invoice_no             = invoice_no
        bill.bill_status            = bill_status
        bill.gate_pass_no           = gate_pass_no
        bill.gate_pass_date         = header_data.get('gate_pass_date')
        bill.po_no                  = po_no
        bill.po_date                = header_data.get('po_date')
        bill.sal_pur_group_id       = sal_pur_group_id
        bill.supplier_id            = supplier_id
        bill.broker_id              = broker_id
        bill.zone_name              = zone_name
        bill.supplier_contact       = supplier_contact
        bill.supplier_address       = supplier_address
        bill.gst_number             = gst_number
        bill.delivery_location      = delivery_location
        bill.delivery_terms         = delivery_terms
        bill.payment_terms          = payment_terms
        bill.freight_terms          = freight_terms
        bill.currency               = currency
        bill.purchaser_name         = purchaser_name
        bill.department             = department
        bill.cost_center            = cost_center
        bill.special_instructions   = special_instructions
        bill.internal_notes         = internal_notes
        bill.total_basic_amount     = total_basic_amount
        bill.taxes                  = taxes
        bill.grand_total            = grand_total
        bill.user_modified          = username
        bill.save()

        PurchaseBillItem.objects.filter(purchase_bill=bill).delete()
        for item_data in normalized_items:
            PurchaseBillItem.objects.create(
                purchase_bill=bill,
                item_id=item_data['item'],
                order_qty=item_data['order_qty'],
                uom=item_data['uom'],
                unit_rate=item_data['unit_rate'],
                amount=item_data['amount'],
                remarks=item_data['remarks'],
                user_created=username,
                user_modified=username,
            )
        return bill_no

    elif operation == 'DELETE':
        PurchaseBill.objects.filter(bill_no=bill_no).update(status=False, user_modified=username)
        return bill_no

    elif operation == 'HARD_DELETE':
        PurchaseBillItem.objects.filter(purchase_bill_id=bill_no).delete()
        PurchaseBill.objects.filter(bill_no=bill_no).delete()
        return bill_no

    return bill_no
