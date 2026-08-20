import json
from django.db import connection


def _val(v):
    """Return None for empty/None, otherwise the value as-is."""
    if v is None or v == '':
        return None
    return v


def execute_sp_grn(operation, header_data, mat_items, test_items, username):
    """
    Execute sp_manage_grn stored procedure for GRN (Goods Receipt Note).

    operation   : 'INSERT' | 'UPDATE' | 'DELETE'
    header_data : dict of tblGRN fields
    mat_items   : list of dicts for tblGRN_TRAN_MAT rows
    test_items  : list of dicts for tblGRN_TRAN_TEST rows
    username    : logged-in user id / name

    DB routing:
        PostgreSQL  → CALL sp_manage_grn(...)   ← your live server
        SQLite      → plain Django ORM           ← local dev fallback
    """
    grn_no          = _val(header_data.get('GrnNo'))
    grn_date        = _val(header_data.get('GrnDate'))
    gatepass_no     = _val(header_data.get('GatepassNo'))
    netweight       = _val(header_data.get('Netweight'))
    deducted_weight = _val(header_data.get('DeductedWeight'))
    approved_weight = _val(header_data.get('Approvedweight'))
    status_val      = _val(header_data.get('status'))
    internal_notes  = _val(header_data.get('internalnotes'))
    drafted_by         = _val(header_data.get('draftedby'))
    drafted_date       = _val(header_data.get('DraftedDate'))
    submitted_by       = _val(header_data.get('submittedby'))
    submission_date    = _val(header_data.get('SubmissionDate'))
    referred_back_by   = _val(header_data.get('referedbackby'))
    referred_back_date = _val(header_data.get('Referredbackdate'))
    approved_by        = _val(header_data.get('approvedby'))
    approval_date      = _val(header_data.get('ApprovalDate'))

    # Normalize material rows
    normalized_mat = []
    for row in (mat_items or []):
        normalized_mat.append({
            'MaterialID':  _val(row.get('MaterialID')),
            'Bags':        float(row.get('Bags')        or 0),
            'Grossweight': float(row.get('Grossweight') or 0),
            'Netweight':   float(row.get('Netweight')   or 0),
            'Remarks':     row.get('Remarks') or '',
        })

    # Normalize test rows
    normalized_test = []
    for row in (test_items or []):
        normalized_test.append({
            'TestID':         _val(row.get('TestID')),
            'Testmethodid':   _val(row.get('Testmethodid')),
            'Testresult':     float(row.get('Testresult')     or 0),
            'deductedweight': float(row.get('deductedweight') or 0),
            'Remarks':        row.get('Remarks') or '',
        })

    # ── PostgreSQL path  (your live server) ────────────────────────────────────
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT public.sp_manage_grn(
                    p_operation          := %s::text,
                    p_grn_no             := %s::varchar,
                    p_grn_date           := %s::date,
                    p_gatepass_no        := %s::integer,
                    p_netweight          := %s::numeric,
                    p_deducted_weight    := %s::numeric,
                    p_approved_weight    := %s::numeric,
                    p_status             := %s::integer,
                    p_internal_notes     := %s::text,
                    p_username           := %s::varchar,
                    p_mat_items          := %s::text,
                    p_test_items         := %s::text,
                    p_submitted_by       := %s::varchar,
                    p_submission_date    := %s::timestamptz,
                    p_referred_back_by   := %s::varchar,
                    p_referred_back_date := %s::timestamptz,
                    p_approved_by        := %s::varchar,
                    p_approval_date      := %s::timestamptz
                )
                """,
                [
                    operation,
                    grn_no,
                    grn_date,
                    gatepass_no,
                    netweight,
                    deducted_weight,
                    approved_weight,
                    status_val,
                    internal_notes,
                    username,
                    json.dumps(normalized_mat),
                    json.dumps(normalized_test),
                    submitted_by,
                    submission_date,
                    referred_back_by,
                    referred_back_date,
                    approved_by,
                    approval_date,
                ]
            )
        return grn_no

    # ── SQLite fallback  (local dev / testing only) ────────────────────────────
    from dashboard.models.grn import GRN, GRNTranMat, GRNTranTest
    from django.db import models as dj_models
    from django.utils import timezone

    if operation == 'INSERT':
        grn = GRN(
            GrnNo=grn_no,
            GrnDate=grn_date,
            GatepassNo=gatepass_no,
            Netweight=netweight,
            DeductedWeight=deducted_weight,
            Approvedweight=approved_weight,
            status=status_val,
            internalnotes=internal_notes,
            draftedby=username,
            DraftedDate=timezone.now(),
            submittedby=username if status_val == 2 else None,
            SubmissionDate=timezone.now() if status_val == 2 else None,
        )
        dj_models.Model.save(grn)
        for item in normalized_mat:
            GRNTranMat.objects.create(GrnNo=grn, usercreated=username, **item)
        for item in normalized_test:
            GRNTranTest.objects.create(GrnNo=grn, **item)
        return grn_no

    elif operation == 'UPDATE':
        grn = GRN.objects.get(GrnNo=grn_no)
        grn.GrnDate          = grn_date
        grn.GatepassNo       = gatepass_no
        grn.Netweight        = netweight
        grn.DeductedWeight   = deducted_weight
        grn.Approvedweight   = approved_weight
        grn.status           = status_val
        grn.internalnotes    = internal_notes
        
        # Automatic audit workflow fields
        if status_val == 2 and not grn.submittedby:
            grn.submittedby = username
            grn.SubmissionDate = timezone.now()
        elif status_val == 3:
            grn.referedbackby = username
            grn.Referredbackdate = timezone.now()
        elif status_val == 4:
            grn.approvedby = username
            grn.ApprovalDate = timezone.now()
            
        dj_models.Model.save(grn)
        GRNTranMat.objects.filter(GrnNo=grn).delete()
        GRNTranTest.objects.filter(GrnNo=grn).delete()
        for item in normalized_mat:
            GRNTranMat.objects.create(GrnNo=grn, usercreated=username, **item)
        for item in normalized_test:
            GRNTranTest.objects.create(GrnNo=grn, **item)
        return grn_no

    elif operation == 'DELETE':
        GRNTranMat.objects.filter(GrnNo_id=grn_no).delete()
        GRNTranTest.objects.filter(GrnNo_id=grn_no).delete()
        GRN.objects.filter(GrnNo=grn_no).delete()
        return grn_no
