import json
from django.db import connection, transaction

def execute_sp_manage_transaction(operation, module, header_data, detail_rows, username):
    """
    Executes PostgreSQL stored procedure sp_manage_transaction if using postgresql,
    otherwise falls back to Django ORM operations.
    """
    # Normalize header bank_account
    bank_account_val = header_data.get('bank_account') or header_data.get('bank_account_id')
    if hasattr(bank_account_val, 'pk'):
        bank_account_id = bank_account_val.pk
    else:
        bank_account_id = bank_account_val

    # Normalize date
    date_val = header_data.get('date')
    if hasattr(date_val, 'strftime'):
        date_str = date_val.strftime('%Y-%m-%d %H:%M:%S')
    else:
        date_str = str(date_val) if date_val else None

    # Normalize detail rows to dictionary list with primitive types
    normalized_details = []
    for r in detail_rows:
        account_master_val = r.get('account_master') or r.get('accountmaster_id')
        if hasattr(account_master_val, 'pk'):
            accountmaster_id = account_master_val.pk
        else:
            accountmaster_id = account_master_val
            
        chq_date_val = r.get('chq_date')
        if chq_date_val:
            if hasattr(chq_date_val, 'strftime'):
                chq_date_str = chq_date_val.strftime('%Y-%m-%d')
            else:
                chq_date_str = str(chq_date_val).split('T')[0].split(' ')[0]
        else:
            chq_date_str = None
            
        normalized_details.append({
            'account_master': accountmaster_id,
            'amount': float(r.get('amount') or 0.0),
            'remarks': r.get('remarks') or '',
            'cost_center': r.get('cost_center') or '',
            'chq_no': r.get('chq_no') or '',
            'chq_date': chq_date_str,
            'payee_bank': r.get('payee_bank') or '',
            'rpid': r.get('rpid') or r.get('row_type')
        })

    # Normalize tran_type
    raw_tran_type = header_data.get('tran_type')
    if raw_tran_type == 'BANK':
        tran_type_val = 'J001'
    elif raw_tran_type == 'CASH':
        tran_type_val = 'J002'
    elif raw_tran_type in ['J000', 'J001', 'J002']:
        tran_type_val = raw_tran_type
    else:
        # Fallback defaults based on module
        if module == 'SECTION_A':
            tran_type_val = 'J000'
        elif module == 'BANK_TRANSACTION':
            tran_type_val = 'J001'
        elif module == 'SECTION_C':
            tran_type_val = 'J002'
        elif module == 'SUBSECTION_B2':
            tran_type_val = 'J001'
        elif module == 'SUBSECTION_Y':
            tran_type_val = 'J001'
        else:
            tran_type_val = 'J000'

    # Prepare normalized header data
    normalized_header = {
        'voucher_no': header_data.get('voucher_no') or header_data.get('voucher_number'),
        'date': date_str,
        'tran_type': tran_type_val,
        'rpid': header_data.get('rpid'),
        'amount': float(header_data.get('amount') or 0.0),
        'narration': header_data.get('narration') or header_data.get('remarks') or '',
        'bank_account_id': bank_account_id,
        'ref_voucher_no': header_data.get('ref_voucher_no'),
        'posting_status': header_data.get('posting_status')
    }

    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            voucher_no = normalized_header.get('voucher_no')
            if not voucher_no or voucher_no == 'Auto-Generated':
                if module == 'SUBSECTION_Y':
                    from dashboard.models.cashbank import CashBank
                    import re
                    all_vnos = CashBank.objects.values_list('voucher_no', flat=True)
                    numeric_vnos = []
                    for v in all_vnos:
                        if re.match(r'^\d+$', str(v)):
                            numeric_vnos.append(int(v))
                    voucher_no = str(max(numeric_vnos) + 1) if numeric_vnos else "1"
                else:
                    voucher_no = None
                
            cursor.execute(
                """
                CALL sp_manage_transaction(
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """,
                [
                    operation,
                    module,
                    voucher_no,
                    normalized_header.get('date'),
                    normalized_header.get('tran_type'),
                    normalized_header.get('rpid'),
                    normalized_header.get('amount'),
                    normalized_header.get('narration'),
                    normalized_header.get('bank_account_id'),
                    username,
                    normalized_header.get('ref_voucher_no'),
                    normalized_header.get('posting_status'),
                    json.dumps(normalized_details)
                ]
            )
            
            if operation == 'INSERT':
                row = cursor.fetchone()
                if row:
                    return row[0]
            return voucher_no or normalized_header.get('voucher_no')
    else:
        # SQLite / ORM Fallback logic to allow django unit tests to pass!
        from dashboard.models.cashbank import CashBank, CashBankTran
        import re
        
        if module == 'SUBSECTION_B2':
            v_module_type = 'B2'
        elif module == 'SUBSECTION_Y':
            v_module_type = 'Y'
        else:
            v_module_type = ''
        
        if operation == 'INSERT':
            voucher_no = normalized_header.get('voucher_no')
            if not voucher_no or voucher_no == 'Auto-Generated':
                if module == 'SUBSECTION_B2':
                    from dashboard.serializers import SubsectionB2Serializer
                    voucher_no = SubsectionB2Serializer._generate_voucher_no()
                else:
                    all_vnos = CashBank.objects.values_list('voucher_no', flat=True)
                    numeric_vnos = []
                    for v in all_vnos:
                        if re.match(r'^\d+$', str(v)):
                            numeric_vnos.append(int(v))
                    voucher_no = str(max(numeric_vnos) + 1) if numeric_vnos else "1"
            
            # Check validation: detail sum matches header amount
            # SECTION_A is a double-entry journal: p_amount = sum of A (debit) rows only.
            # All other modules are single-sided: p_amount = sum of all rows.
            if module == 'SECTION_A':
                detail_sum = sum(
                    float(row.get('amount') or 0.00)
                    for row in normalized_details
                    if row.get('rpid') == 'A'
                )
            else:
                detail_sum = sum(float(row.get('amount') or 0.00) for row in normalized_details)

            if abs(detail_sum - float(normalized_header.get('amount') or 0.00)) > 0.005:
                raise ValueError("Header amount does not match sum of detail lines.")

            cb = CashBank.objects.create(
                voucher_no=voucher_no,
                date=normalized_header.get('date'),
                tran_type=normalized_header.get('tran_type'),
                rpid=normalized_header.get('rpid'),
                amount=normalized_header.get('amount'),
                narration=normalized_header.get('narration'),
                bank_account_id=normalized_header.get('bank_account_id'),
                status=True,
                module_type=v_module_type,
                posting_status=normalized_header.get('posting_status'),
                ref_voucher_no=normalized_header.get('ref_voucher_no'),
                user_created=username,
                user_modified=username
            )
            
            for row in normalized_details:
                CashBankTran.objects.create(
                    voucher=cb,
                    date=cb.date,
                    tran_type=cb.tran_type,
                    rpid=row.get('rpid') if module == 'SECTION_A' else cb.rpid,
                    account_master_id=row.get('account_master'),
                    amount=row.get('amount'),
                    remarks=row.get('remarks'),
                    cost_center=row.get('cost_center'),
                    chq_no=row.get('chq_no'),
                    chq_date=row.get('chq_date') or None,
                    payee_bank=row.get('payee_bank'),
                    user_created=username,
                    user_modified=username
                )
            return voucher_no
            
        elif operation == 'UPDATE':
            voucher_no = normalized_header.get('voucher_no')
            cb = CashBank.objects.get(voucher_no=voucher_no)
            if v_module_type == 'B2' and cb.posting_status == 'POSTED':
                raise PermissionError("Cannot edit a POSTED transaction.")
            
            # Check validation: detail sum matches header amount (SECTION_A: A-rows only)
            if module == 'SECTION_A':
                detail_sum = sum(
                    float(row.get('amount') or 0.00)
                    for row in normalized_details
                    if row.get('rpid') == 'A'
                )
            else:
                detail_sum = sum(float(row.get('amount') or 0.00) for row in normalized_details)

            if abs(detail_sum - float(normalized_header.get('amount') or 0.00)) > 0.005:
                raise ValueError("Header amount does not match sum of detail lines.")

            cb.date = normalized_header.get('date')
            cb.tran_type = normalized_header.get('tran_type')
            cb.rpid = normalized_header.get('rpid')
            cb.amount = normalized_header.get('amount')
            cb.narration = normalized_header.get('narration')
            cb.bank_account_id = normalized_header.get('bank_account_id')
            cb.posting_status = normalized_header.get('posting_status')
            cb.ref_voucher_no = normalized_header.get('ref_voucher_no')
            cb.user_modified = username
            cb.save()
            
            cb.transactions.all().delete()
            for row in normalized_details:
                CashBankTran.objects.create(
                    voucher=cb,
                    date=cb.date,
                    tran_type=cb.tran_type,
                    rpid=row.get('rpid') if module == 'SECTION_A' else cb.rpid,
                    account_master_id=row.get('account_master'),
                    amount=row.get('amount'),
                    remarks=row.get('remarks'),
                    cost_center=row.get('cost_center'),
                    chq_no=row.get('chq_no'),
                    chq_date=row.get('chq_date') or None,
                    payee_bank=row.get('payee_bank'),
                    user_created=username,
                    user_modified=username
                )
            return voucher_no
            
        elif operation == 'DELETE':
            voucher_no = normalized_header.get('voucher_no')
            # Soft-delete: set status=False for these modules
            if module in ['SUBSECTION_B2', 'SECTION_C', 'SECTION_A', 'SUBSECTION_Y']:
                CashBank.objects.filter(voucher_no=voucher_no).update(
                    status=False,
                    user_modified=username
                )
            else:
                CashBank.objects.filter(voucher_no=voucher_no).delete()
            return voucher_no

        elif operation == 'HARD_DELETE':
            voucher_no = normalized_header.get('voucher_no')
            CashBank.objects.filter(voucher_no=voucher_no).delete()
            return voucher_no
