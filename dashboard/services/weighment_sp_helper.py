import json
from django.db import connection


def _val(v):
    """Return None for empty/None, otherwise the value as-is."""
    if v is None or v == '':
        return None
    return v


def execute_sp_weighment(operation, header_data, tran_items, username):
    """
    Execute sp_manage_weighment stored procedure for Weighment Slip.

    operation   : 'INSERT' | 'UPDATE' | 'DELETE'
    header_data : dict of tblWeighment fields
    tran_items  : list of dicts for tblWeighment_Tran (material rows)
    username    : logged-in user id / name

    DB routing:
        PostgreSQL  -> CALL sp_manage_weighment(...)   <- live server
        SQLite      -> plain Django ORM                <- local dev fallback
    """
    slip_no        = _val(header_data.get('WeighmentSlipNo'))
    gatepass_no    = _val(header_data.get('GatePassNo'))
    gross_weight   = _val(header_data.get('GrossWeight'))
    tare_weight    = _val(header_data.get('TareWeight'))
    net_weight     = _val(header_data.get('NetWeight'))
    gross_datetime = _val(header_data.get('GrossDateTime'))
    tare_datetime  = _val(header_data.get('TareDateTime'))
    auto_manual    = _val(header_data.get('AutoManual')) or 'Manual'
    vehicle_type   = _val(header_data.get('VehicleType'))
    purchaser      = _val(header_data.get('Purchaser'))
    seller         = _val(header_data.get('Seller'))
    remarks        = _val(header_data.get('Remarks'))
    status_val     = _val(header_data.get('status'))

    # Normalize material rows
    normalized_tran = []
    for row in (tran_items or []):
        normalized_tran.append({
            'MaterialID':  _val(row.get('MaterialID')),
            'Bags':        float(row.get('Bags')        or 0),
            'GrossWeight': float(row.get('GrossWeight') or 0),
            'NetWeight':   float(row.get('NetWeight')   or 0),
            'Remarks':     row.get('Remarks') or '',
        })

    # ── PostgreSQL path  (live server) ─────────────────────────────────────────
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT public.sp_manage_weighment(
                    p_operation      := %s::text,
                    p_slip_no        := %s::varchar,
                    p_gatepass_no    := %s::integer,
                    p_gross_weight   := %s::numeric,
                    p_tare_weight    := %s::numeric,
                    p_net_weight     := %s::numeric,
                    p_gross_datetime := %s::timestamptz,
                    p_tare_datetime  := %s::timestamptz,
                    p_auto_manual    := %s::varchar,
                    p_vehicle_type   := %s::varchar,
                    p_purchaser      := %s::varchar,
                    p_seller         := %s::varchar,
                    p_remarks        := %s::varchar,
                    p_status         := %s::integer,
                    p_username       := %s::varchar,
                    p_tran_items     := %s::text
                )
                """,
                [
                    operation,
                    slip_no,
                    gatepass_no,
                    gross_weight,
                    tare_weight,
                    net_weight,
                    gross_datetime,
                    tare_datetime,
                    auto_manual,
                    vehicle_type,
                    purchaser,
                    seller,
                    remarks,
                    status_val,
                    username,
                    json.dumps(normalized_tran),
                ]
            )
        return slip_no

    # ── SQLite fallback  (local dev / testing only) ─────────────────────────────
    from dashboard.models.weighment import Weighment, WeighmentTran
    from django.utils import timezone

    if operation == 'INSERT':
        w = Weighment(
            WeighmentSlipNo=slip_no,
            GatePassNo=gatepass_no,
            GrossWeight=gross_weight,
            TareWeight=tare_weight,
            NetWeight=net_weight,
            GrossDateTime=gross_datetime,
            TareDateTime=tare_datetime,
            AutoManual=auto_manual,
            VehicleType=vehicle_type,
            Purchaser=purchaser,
            Seller=seller,
            Remarks=remarks,
            status=status_val,
            draftedby=username,
            DraftedDate=timezone.now(),
        )
        from django.db import models as dj_models
        dj_models.Model.save(w)
        for item in normalized_tran:
            WeighmentTran.objects.create(WeighmentSlipNo=w, **item)
        return slip_no

    elif operation == 'UPDATE':
        w = Weighment.objects.get(WeighmentSlipNo=slip_no)
        w.GatePassNo    = gatepass_no
        w.GrossWeight   = gross_weight
        w.TareWeight    = tare_weight
        w.NetWeight     = net_weight
        w.GrossDateTime = gross_datetime
        w.TareDateTime  = tare_datetime
        w.AutoManual    = auto_manual
        w.VehicleType   = vehicle_type
        w.Purchaser     = purchaser
        w.Seller        = seller
        w.Remarks       = remarks
        w.status        = status_val
        if status_val == 2 and not w.submittedby:
            w.submittedby   = username
            w.SubmissionDate = timezone.now()
        elif status_val == 4:
            w.approvedby    = username
            w.ApprovalDate  = timezone.now()
        from django.db import models as dj_models
        dj_models.Model.save(w)
        WeighmentTran.objects.filter(WeighmentSlipNo=w).delete()
        for item in normalized_tran:
            WeighmentTran.objects.create(WeighmentSlipNo=w, **item)
        return slip_no

    elif operation == 'DELETE':
        WeighmentTran.objects.filter(WeighmentSlipNo_id=slip_no).delete()
        Weighment.objects.filter(WeighmentSlipNo=slip_no).delete()
        return slip_no
