import json
from django.db import connection


def _val(v):
    """Return None for empty/None, otherwise the value as-is."""
    if v is None or v == '':
        return None
    return v


def execute_sp_purchase_challan(operation, header_data, tran_items, username):
    """
    Execute sp_manage_purchase_challan stored procedure for Purchase Challan.

    operation   : 'INSERT' | 'UPDATE' | 'DELETE'
    header_data : dict of tblSalePurchaseChallans fields
    tran_items  : list of dicts for tblSalePurchaseChallans_Tran (material rows)
    username    : logged-in user id / name

    DB routing:
        PostgreSQL  -> CALL sp_manage_purchase_challan(...)   <- live server
        SQLite      -> plain Django ORM                       <- local dev fallback
    """
    challan_no    = _val(header_data.get('ChallanNo'))
    challan_date  = _val(header_data.get('ChallanDate'))
    tran_type     = _val(header_data.get('TranType')) or 'RMPCH'
    gp_no         = _val(header_data.get('GPNo'))
    status_val    = _val(header_data.get('StatusId')) or 1
    po_no         = _val(header_data.get('PONO'))
    po_date       = _val(header_data.get('PODate'))
    notes         = _val(header_data.get('Notes'))
    supplier_name = _val(header_data.get('SupplierName'))

    # Normalize material rows
    normalized_tran = []
    for row in (tran_items or []):
        normalized_tran.append({
            'MaterialID':  _val(row.get('MaterialID')),
            'Bags':        float(row.get('Bags')        or 0),
            'GrossWeight': float(row.get('GrossWeight')   or 0),
            'NetWeight':   float(row.get('NetWeight')   or 0),
            'Remarks':     row.get('Remarks') or '',
        })

    # ── PostgreSQL path  (live server) ─────────────────────────────────────────
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT public.sp_manage_purchase_challan(
                    p_operation    := %s::text,
                    p_challan_no   := %s::varchar,
                    p_challan_date := %s::date,
                    p_tran_type    := %s::varchar,
                    p_gp_no        := %s::integer,
                    p_status_id    := %s::integer,
                    p_po_no        := %s::varchar,
                    p_po_date      := %s::date,
                    p_username     := %s::varchar,
                    p_tran_items   := %s::text,
                    p_notes        := %s::varchar,
                    p_supplier_name := %s::varchar
                )
                """,
                [
                    operation,
                    challan_no,
                    challan_date,
                    tran_type,
                    gp_no,
                    status_val,
                    po_no,
                    po_date,
                    username,
                    json.dumps(normalized_tran),
                    notes,
                    supplier_name,
                ]
            )
            row = cursor.fetchone()
            if row:
                challan_no = row[0] or challan_no
        return challan_no

    # ── SQLite fallback  (local dev / testing only) ─────────────────────────────
    from dashboard.models.purchase_challan import PurchaseChallan, PurchaseChallanTran
    from django.utils import timezone

    if operation == 'INSERT':
        if not challan_no or str(challan_no).strip() in ('', '(Auto-Generated)', 'Auto Generated'):
            now = timezone.now()
            prefix = f"PC-{now.strftime('%Y%m')}-"
            last_pc = PurchaseChallan.objects.filter(ChallanNo__startswith=prefix).order_by('ChallanNo').last()
            if last_pc and last_pc.ChallanNo:
                try:
                    last_num = int(str(last_pc.ChallanNo).split('-')[-1])
                    challan_no = f"{prefix}{last_num + 1:04d}"
                except Exception:
                    challan_no = f"{prefix}0001"
            else:
                cnt = PurchaseChallan.objects.count() + 1
                challan_no = f"{prefix}{cnt:04d}"

        gp_date = None
        veh_no = None
        drv_name = None
        ws_no = None
        ws_date = None
        bags = sum(float(x.get('Bags') or 0) for x in normalized_tran)
        gross_wt = sum(float(x.get('GrossWeight') or 0) for x in normalized_tran)
        net_wt = sum(float(x.get('NetWeight') or 0) for x in normalized_tran)
        tare_wt = 0

        if gp_no:
            try:
                from dashboard.models.gate_entry import GatePass
                gp = GatePass.objects.filter(GatePassNo=gp_no).first()
                if gp:
                    gp_date = gp.GatePassdate
                    veh_no = gp.VehicleNo
                    drv_name = gp.DriverName
                    ws_no = gp.WeighmentNo
                    ws_date = gp.WeighmentDate
                    if not bags and gp.Bags: bags = float(gp.Bags)
                    if not gross_wt and gp.GrossWeight: gross_wt = float(gp.GrossWeight)
                    if not tare_wt and gp.TareWeight: tare_wt = float(gp.TareWeight)
                    if not net_wt and gp.NetWeight: net_wt = float(gp.NetWeight)
            except Exception:
                pass

        pc = PurchaseChallan(
            ChallanNo=challan_no,
            ChallanDate=challan_date or timezone.now().date(),
            TranType=tran_type,
            GPNo=gp_no,
            StatusId=status_val,
            PONO=po_no,
            PODate=po_date,
            GatePassDate=gp_date,
            VehicleNo=veh_no,
            DriverName=drv_name,
            WeighmentSlipNo=ws_no,
            WeighmentDate=ws_date,
            Bags=bags,
            GrossWeight=gross_wt,
            TareWeight=tare_wt,
            NetWeight=net_wt,
            Notes=notes,
            SupplierName=supplier_name,
            draftedby=username,
            DraftedDate=timezone.now(),
        )
        from django.db import models as dj_models
        dj_models.Model.save(pc)
        for item in normalized_tran:
            PurchaseChallanTran.objects.create(ChallanNo=pc, **item)
        return challan_no

    elif operation == 'UPDATE':
        pc = PurchaseChallan.objects.get(ChallanNo=challan_no)
        pc.ChallanDate   = challan_date
        pc.TranType      = tran_type
        pc.GPNo          = gp_no
        pc.StatusId      = status_val
        pc.PONO          = po_no
        pc.PODate        = po_date
        pc.Notes         = notes
        pc.SupplierName  = supplier_name
        if status_val == 2 and not pc.submittedby:
            pc.submittedby   = username
            pc.SubmissionDate = timezone.now()
        elif status_val == 4:
            pc.approvedby   = username
            pc.ApprovalDate = timezone.now()
        from django.db import models as dj_models
        dj_models.Model.save(pc)
        PurchaseChallanTran.objects.filter(ChallanNo=pc).delete()
        for item in normalized_tran:
            PurchaseChallanTran.objects.create(ChallanNo=pc, **item)
        return challan_no

    elif operation == 'DELETE':
        PurchaseChallanTran.objects.filter(ChallanNo_id=challan_no).delete()
        PurchaseChallan.objects.filter(ChallanNo=challan_no).delete()
        return challan_no
