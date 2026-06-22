from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from .models.cashbank import CashBank, CashBankTran
from .models.section_c import SectionC
from .models.sal_pur_group import TransactionType, SalPurGroup
from .serializers import CashBankSerializer, SectionCSerializer, SubsectionB2Serializer, SubsectionYSerializer, SalPurGroupSerializer, TransactionTypeSerializer
from django.db.models import Q, CharField, Value
from django.db.models.functions import Cast, Concat

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'current': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class CashBankViewSet(viewsets.ModelViewSet):
    serializer_class = CashBankSerializer
    lookup_field = 'voucher_no'
    lookup_value_regex = '(?:(?!/toggle_status/).)+'
    pagination_class = None

    def get_queryset(self):
        # Baseline Bank Transaction — excludes all B-2 records (module_type='B2') and filters by tran_type='J001'
        queryset = CashBank.objects.filter(tran_type='J001', module_type='')
        # Generic search
        search = self.request.query_params.get('search', None)
        # Field-specific filters
        tran_type      = self.request.query_params.get('tran_type', None)
        voucher_no_q   = self.request.query_params.get('voucher_no', None)
        narration_q    = self.request.query_params.get('narration', None)
        bank_name_q    = self.request.query_params.get('bank_name', None)
        amount_q       = self.request.query_params.get('amount', None)
        date_after     = self.request.query_params.get('date_after', None)
        date_before    = self.request.query_params.get('date_before', None)
        status_filter  = self.request.query_params.get('status', None)

        if search:
            queryset = queryset.filter(
                Q(narration__icontains=search)
            )
        if tran_type:
            term = tran_type.strip().lower()
            if ' - ' in term:
                parts = [p.strip() for p in term.split('-')]
                l_part, r_part = parts[0], parts[1]
                q_left = Q(tran_type__icontains=l_part)
                q_right = Q(rpid__icontains=r_part)
                if r_part in ['d', 'dep', 'deposit']:
                    q_right = Q(rpid='D')
                elif r_part in ['i', 'iss', 'issue']:
                    q_right = Q(rpid='I')
                elif r_part in ['r', 'rec', 'receipt']:
                    q_right = Q(rpid='R')
                elif r_part in ['p', 'pay', 'payment']:
                    q_right = Q(rpid='P')
                queryset = queryset.filter(q_left & q_right)
            else:
                q_cond = Q()
                if term in ['bank', 'cash']:
                    q_val = 'J001' if term == 'bank' else 'J002'
                    q_cond = Q(tran_type=q_val)
                elif term in ['d', 'dep', 'deposit']:
                    q_cond = Q(rpid='D')
                elif term in ['i', 'iss', 'issue']:
                    q_cond = Q(rpid='I')
                elif term in ['r', 'rec', 'receipt']:
                    q_cond = Q(rpid='R')
                elif term in ['p', 'pay', 'payment']:
                    q_cond = Q(rpid='P')
                else:
                    queryset = queryset.annotate(
                        deposit_issue=Concat('tran_type', Value(' - '), 'rpid', output_field=CharField())
                    )
                    q_cond = Q(deposit_issue__icontains=term)
                queryset = queryset.filter(q_cond)
        if voucher_no_q:
            queryset = queryset.filter(voucher_no__icontains=voucher_no_q)
        if narration_q:
            queryset = queryset.filter(narration__icontains=narration_q)
        if bank_name_q:
            q_cond = Q(bank_account__Account_Name__icontains=bank_name_q) | Q(bank_account__display_name__icontains=bank_name_q)
            try:
                val = int(bank_name_q)
                q_cond |= Q(bank_account__groupID=val)
            except ValueError:
                pass
            queryset = queryset.filter(q_cond)
        if amount_q:
            amount_str = amount_q.replace(',', '').strip()
            if '.' in amount_str:
                amount_str = amount_str.rstrip('0').rstrip('.')
            queryset = queryset.annotate(
                amount_str_val=Cast('amount', output_field=CharField())
            ).filter(amount_str_val__icontains=amount_str)
        if date_after:
            queryset = queryset.filter(date__date__gte=date_after)
        if date_before:
            queryset = queryset.filter(date__date__lte=date_before)
        if status_filter is not None and status_filter != '':
            is_active = status_filter.lower() == 'true'
            queryset = queryset.filter(status=is_active)

        # Whitelisted sorting to prevent injection
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            allowed_fields = {
                'voucher_no': 'voucher_no',
                '-voucher_no': '-voucher_no',
                'date': 'date',
                '-date': '-date',
                'amount': 'amount',
                '-amount': '-amount',
                'status': 'status',
                '-status': '-status'
            }
            db_field = allowed_fields.get(ordering)
            if db_field:
                queryset = queryset.order_by(db_field)

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status:
            return Response(
                {"detail": f"Cannot delete '{instance.voucher_no}' because it is currently Active. Please Mark Inactive first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user else 'system'
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        header_data = {
            'voucher_no': instance.voucher_no,
            'date': instance.date,
            'tran_type': instance.tran_type,
            'rpid': instance.rpid,
            'amount': instance.amount,
            'narration': instance.narration,
            'bank_account_id': instance.bank_account_id
        }
        execute_sp_manage_transaction('DELETE', 'BANK_TRANSACTION', header_data, [], username)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, voucher_no=None):
        instance = self.get_object()
        instance.status = not instance.status
        instance.save()
        return Response({'status': instance.status})

class SectionCViewSet(viewsets.ModelViewSet):
    queryset = CashBank.objects.filter(tran_type='J002')
    serializer_class = SectionCSerializer
    lookup_field = 'voucher_no'
    lookup_value_regex = '(?:(?!/toggle_status/).)+'
    pagination_class = None

    def get_queryset(self):
        queryset = CashBank.objects.filter(tran_type='J002')
        search        = self.request.query_params.get('search', None)
        # Field-specific filters
        tran_type     = self.request.query_params.get('tran_type', None)
        voucher_no_q  = self.request.query_params.get('voucher_no', None)
        narration_q   = self.request.query_params.get('narration', None)
        bank_name_q   = self.request.query_params.get('bank_name', None)
        amount_q      = self.request.query_params.get('amount', None)
        date_after    = self.request.query_params.get('date_after', None)
        date_before   = self.request.query_params.get('date_before', None)
        status_filter = self.request.query_params.get('status', None)

        if search:
            queryset = queryset.filter(
                Q(narration__icontains=search)
            )
        if tran_type:
            term = tran_type.strip().lower()
            if ' - ' in term:
                parts = [p.strip() for p in term.split('-')]
                l_part, r_part = parts[0], parts[1]
                q_left = Q(tran_type__icontains=l_part)
                q_right = Q(rpid__icontains=r_part)
                if r_part in ['d', 'dep', 'deposit']:
                    q_right = Q(rpid='D')
                elif r_part in ['i', 'iss', 'issue']:
                    q_right = Q(rpid='I')
                elif r_part in ['r', 'rec', 'receipt']:
                    q_right = Q(rpid='R')
                elif r_part in ['p', 'pay', 'payment']:
                    q_right = Q(rpid='P')
                queryset = queryset.filter(q_left & q_right)
            else:
                q_cond = Q()
                if term in ['bank', 'cash']:
                    q_val = 'J001' if term == 'bank' else 'J002'
                    q_cond = Q(tran_type=q_val)
                elif term in ['d', 'dep', 'deposit']:
                    q_cond = Q(rpid='D')
                elif term in ['i', 'iss', 'issue']:
                    q_cond = Q(rpid='I')
                elif term in ['r', 'rec', 'receipt']:
                    q_cond = Q(rpid='R')
                elif term in ['p', 'pay', 'payment']:
                    q_cond = Q(rpid='P')
                else:
                    queryset = queryset.annotate(
                        deposit_issue=Concat('tran_type', Value(' - '), 'rpid', output_field=CharField())
                    )
                    q_cond = Q(deposit_issue__icontains=term)
                queryset = queryset.filter(q_cond)
        if voucher_no_q:
            queryset = queryset.filter(voucher_no__icontains=voucher_no_q)
        if narration_q:
            queryset = queryset.filter(narration__icontains=narration_q)
        if bank_name_q:
            q_cond = Q(bank_account__Account_Name__icontains=bank_name_q) | Q(bank_account__display_name__icontains=bank_name_q)
            try:
                val = int(bank_name_q)
                q_cond |= Q(bank_account__groupID=val)
            except ValueError:
                pass
            queryset = queryset.filter(q_cond)
        if amount_q:
            amount_str = amount_q.replace(',', '').strip()
            if '.' in amount_str:
                amount_str = amount_str.rstrip('0').rstrip('.')
            queryset = queryset.annotate(
                amount_str_val=Cast('amount', output_field=CharField())
            ).filter(amount_str_val__icontains=amount_str)
        if date_after:
            queryset = queryset.filter(date__date__gte=date_after)
        if date_before:
            queryset = queryset.filter(date__date__lte=date_before)
        if status_filter is not None and status_filter != '':
            is_active = status_filter.lower() == 'true'
            queryset = queryset.filter(status=is_active)

        # Whitelisted sorting to prevent injection
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            allowed_fields = {
                'voucher_no': 'voucher_no',
                '-voucher_no': '-voucher_no',
                'date': 'date',
                '-date': '-date',
                'amount': 'amount',
                '-amount': '-amount',
                'status': 'status',
                '-status': '-status'
            }
            db_field = allowed_fields.get(ordering)
            if db_field:
                queryset = queryset.order_by(db_field)

        return queryset

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user else 'system'
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        header_data = {
            'voucher_no': instance.voucher_no,
            'date': instance.date,
            'tran_type': instance.tran_type,
            'rpid': instance.rpid,
            'amount': instance.amount,
            'narration': instance.narration,
            'bank_account_id': instance.bank_account_id
        }
        op = 'DELETE' if instance.status else 'HARD_DELETE'
        execute_sp_manage_transaction(op, 'SECTION_C', header_data, [], username)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, voucher_no=None):
        instance = self.get_object()
        instance.status = not instance.status
        instance.save()
        return Response({'status': instance.status})


# =============================================================================
# SUB SECTION B-2 VIEWSET
# Reconnected to tblCASHBANK via module_type='B2' filter.
# The separate tblSubsectionB2 table is NO LONGER queried.
# =============================================================================

class SubsectionB2ViewSet(viewsets.ModelViewSet):
    """
    Full CRUD API for Sub Section B-2 transactions.
    Data lives in tblCASHBANK / tblCASHBANK_TRAN, isolated by module_type='B2'.
    Soft-delete (status=False) on destroy. toggle_status action for restore.
    """
    serializer_class = SubsectionB2Serializer
    lookup_field = 'voucher_no'
    lookup_value_regex = '(?:(?!/toggle_status/).)+'
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Base: only B-2 records from tblCASHBANK
        queryset = CashBank.objects.filter(module_type='B2').select_related('bank_account')

        # Generic cross-field search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(narration__icontains=search) |
                Q(ref_voucher_no__icontains=search)
            )

        # Field-specific filters
        voucher_no_q   = self.request.query_params.get('voucher_no', None)
        narration_q    = self.request.query_params.get('narration', None)
        bank_name_q    = self.request.query_params.get('bank_name', None)
        ref_voucher_q  = self.request.query_params.get('ref_voucher_no', None)
        amount_q       = self.request.query_params.get('amount', None)
        tran_type      = self.request.query_params.get('tran_type', None)
        date_after     = self.request.query_params.get('date_after', None)
        date_before    = self.request.query_params.get('date_before', None)
        status_filter  = self.request.query_params.get('status', None)

        if voucher_no_q:
            queryset = queryset.filter(voucher_no__icontains=voucher_no_q)
        if narration_q:
            queryset = queryset.filter(narration__icontains=narration_q)
        if ref_voucher_q:
            queryset = queryset.filter(ref_voucher_no__icontains=ref_voucher_q)
        if bank_name_q:
            q_cond = Q(bank_account__Account_Name__icontains=bank_name_q) | Q(bank_account__display_name__icontains=bank_name_q)
            try:
                val = int(bank_name_q)
                q_cond |= Q(bank_account__groupID=val)
            except ValueError:
                pass
            queryset = queryset.filter(q_cond)
        if tran_type:
            term = tran_type.strip().lower()
            if term in ['bank', 'cash']:
                q_val = 'J001' if term == 'bank' else 'J002'
                queryset = queryset.filter(tran_type=q_val)
            elif term in ['r', 'rec', 'receipt']:
                queryset = queryset.filter(rpid='R')
            elif term in ['p', 'pay', 'payment']:
                queryset = queryset.filter(rpid='P')
            elif term in ['i', 'iss', 'issue']:
                queryset = queryset.filter(rpid='I')
            elif term in ['d', 'dep', 'deposit']:
                queryset = queryset.filter(rpid='D')
        if amount_q:
            amount_str = amount_q.replace(',', '').strip()
            if '.' in amount_str:
                amount_str = amount_str.rstrip('0').rstrip('.')
            queryset = queryset.annotate(
                amount_str_val=Cast('amount', output_field=CharField())
            ).filter(amount_str_val__icontains=amount_str)
        if date_after:
            queryset = queryset.filter(date__date__gte=date_after)
        if date_before:
            queryset = queryset.filter(date__date__lte=date_before)
        if status_filter is not None and status_filter != '':
            is_active = status_filter.lower() == 'true'
            queryset = queryset.filter(status=is_active)

        # Whitelisted sort fields — prevents SQL injection
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            allowed_fields = {
                'voucher_no':  'voucher_no',
                '-voucher_no': '-voucher_no',
                'date':        'date',
                '-date':       '-date',
                'amount':      'amount',
                '-amount':     '-amount',
                'status':      'status',
                '-status':     '-status',
            }
            db_field = allowed_fields.get(ordering)
            if db_field:
                queryset = queryset.order_by(db_field)

        return queryset

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user else 'system'
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        header_data = {
            'voucher_no': instance.voucher_no,
            'date': instance.date,
            'tran_type': instance.tran_type,
            'rpid': instance.rpid,
            'amount': instance.amount,
            'narration': instance.narration,
            'bank_account_id': instance.bank_account_id,
            'ref_voucher_no': instance.ref_voucher_no,
            'posting_status': instance.posting_status
        }
        op = 'DELETE' if instance.status else 'HARD_DELETE'
        execute_sp_manage_transaction(op, 'SUBSECTION_B2', header_data, [], username)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, voucher_no=None):
        """Flip active <-> soft-deleted without hard delete."""
        instance = self.get_object()
        instance.status = not instance.status
        instance.save()
        return Response({'status': instance.status})

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard_aggregates(self, request):
        """
        Dashboard aggregations: cost-center and bank/category sums.
        Accepts: start_date, end_date
        """
        from datetime import timedelta
        from django.utils import timezone
        from django.utils.dateparse import parse_datetime

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str:
            start_date = parse_datetime(start_date_str)
        else:
            start_date = timezone.now() - timedelta(days=30)

        if end_date_str:
            end_date = parse_datetime(end_date_str)
        else:
            end_date = timezone.now()

        from dashboard.services.subsection_b2_service import SubsectionB2Service
        data = SubsectionB2Service.get_dashboard_aggregates(start_date, end_date)
        return Response({'results': data})

    @action(detail=False, methods=['get'], url_path='report')
    def ledger_report(self, request):
        """
        Paginated ledger report endpoint.
        Accepts: start_date, end_date, limit, offset
        """
        from datetime import timedelta
        from django.utils import timezone
        from django.utils.dateparse import parse_datetime

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))
        offset = int(request.query_params.get('offset', 0))

        if start_date_str:
            start_date = parse_datetime(start_date_str)
        else:
            start_date = timezone.now() - timedelta(days=365)

        if end_date_str:
            end_date = parse_datetime(end_date_str)
        else:
            end_date = timezone.now()

        from dashboard.services.subsection_b2_service import SubsectionB2Service
        data = SubsectionB2Service.get_ledger_report(start_date, end_date, limit, offset)

        total_records = data[0]['total_records'] if data else 0

        return Response({
            'count': total_records,
            'limit': limit,
            'offset': offset,
            'results': data
        })

    @action(detail=False, methods=['get'], url_path='balance')
    def account_balance(self, request):
        """
        Running balance endpoint for a bank account (B-2 transactions only).
        Accepts: bank_account_id, up_to_date
        """
        from django.utils import timezone
        from django.utils.dateparse import parse_datetime

        bank_account_id = request.query_params.get('bank_account_id')
        if not bank_account_id:
            return Response({'error': 'bank_account_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        up_to_date_str = request.query_params.get('up_to_date')
        if up_to_date_str:
            up_to_date = parse_datetime(up_to_date_str)
        else:
            up_to_date = timezone.now()

        from dashboard.services.subsection_b2_service import SubsectionB2Service
        balance = SubsectionB2Service.calculate_balance(int(bank_account_id), up_to_date)
        return Response({
            'bank_account_id': int(bank_account_id),
            'balance': balance
        })


# =============================================================================
# SUB SECTION X (PURCHASE ORDER) VIEWSET
# =============================================================================

from .serializers import PurchaseOrderSerializer
from .models.purchase_order import PurchaseOrder

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    API viewset for Purchase Orders (Sub Section X).
    """
    serializer_class = PurchaseOrderSerializer
    lookup_field = 'po_no'
    lookup_value_regex = '(?:(?!/toggle_status/).)+'
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = PurchaseOrder.objects.all().select_related('broker')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(po_no__icontains=search) |
                Q(supplier__VendorSupplierName__icontains=search) |
                Q(broker__BrokerName__icontains=search)
            )
        
        # UI filters mapping
        po_no_q = self.request.query_params.get('voucher_no') or self.request.query_params.get('po_no')
        bank_name_q = self.request.query_params.get('bank_name') or self.request.query_params.get('supplier_name')
        narration_q = self.request.query_params.get('narration')
        amount_q = self.request.query_params.get('amount')
        date_after = self.request.query_params.get('date_after', None)
        date_before = self.request.query_params.get('date_before', None)
        status_filter = self.request.query_params.get('status', None)
 
        if po_no_q:
            queryset = queryset.filter(po_no__icontains=po_no_q)
        if bank_name_q:
            queryset = queryset.filter(
                Q(supplier__VendorSupplierName__icontains=bank_name_q)
            )
        if narration_q:
            queryset = queryset.filter(
                Q(special_instructions__icontains=narration_q) |
                Q(internal_notes__icontains=narration_q)
            )
        if amount_q:
            amount_str = amount_q.replace(',', '').strip()
            queryset = queryset.filter(grand_total__icontains=amount_str)
        if date_after:
            queryset = queryset.filter(po_date__date__gte=date_after)
        if date_before:
            queryset = queryset.filter(po_date__date__lte=date_before)
        if status_filter is not None and status_filter != '':
            is_active = status_filter.lower() == 'true'
            queryset = queryset.filter(status=is_active)

        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            allowed_fields = {
                'voucher_no': 'po_no',
                '-voucher_no': '-po_no',
                'po_no': 'po_no',
                '-po_no': '-po_no',
                'date': 'po_date',
                '-date': '-po_date',
                'amount': 'grand_total',
                '-amount': '-grand_total',
                'status': 'status',
                '-status': '-status'
            }
            db_field = allowed_fields.get(ordering)
            if db_field:
                queryset = queryset.order_by(db_field)

        return queryset

    # -------------------------------------------------------------------------
    # Status-Based Access Rules
    # ─────────────────────────────────────────────────────────────────────────
    # | Status    | Can Edit? | Can Mark Deleted? |
    # |-----------|-----------|-------------------|
    # | Draft     | Yes       | Yes               |
    # | Submitted | No        | No                |
    # | RefBack   | Yes       | Yes               |
    # | Approved  | No        | Yes (soft only)   |
    # -------------------------------------------------------------------------
    LOCKED_STATUSES       = ('Submitted', 'Approved')  # cannot edit
    NO_DELETE_STATUSES    = ('Submitted',)              # cannot mark deleted

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.po_status in self.LOCKED_STATUSES:
            status_label = instance.get_po_status_display()
            return Response(
                {'detail': f'This Purchase Order is in "{status_label}" state and cannot be edited.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Block soft-delete if PO is in a protected status
        if instance.po_status in self.NO_DELETE_STATUSES:
            status_label = instance.get_po_status_display()
            return Response(
                {'detail': f'This Purchase Order is in "{status_label}" state and cannot be deleted.'},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.user.username if request.user else 'system'
        header_data = {'po_no': instance.po_no}

        from dashboard.services.purchase_order_sp_helper import execute_sp_purchase_order

        if instance.status:
            # Active → soft-delete (sets status = FALSE via SP)
            execute_sp_purchase_order('DELETE', header_data, [], username)
            return Response({'status': False}, status=status.HTTP_200_OK)
        else:
            # Already inactive → hard-delete (removes rows + header via SP)
            execute_sp_purchase_order('HARD_DELETE', header_data, [], username)
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, po_no=None):
        instance = self.get_object()

        # Block toggling (mark deleted) if PO is in a protected status
        if instance.po_status in self.NO_DELETE_STATUSES:
            status_label = instance.get_po_status_display()
            return Response(
                {'detail': f'This Purchase Order is in "{status_label}" state and cannot be marked as deleted.'},
                status=status.HTTP_403_FORBIDDEN
            )

        instance.status = not instance.status
        instance.save()
        return Response({'status': instance.status})


# =============================================================================
# SUB SECTION Y VIEWSET
# Partitioned using module_type='Y' and tran_type='J001'.
# Modeled exactly on CashBankViewSet.
# =============================================================================

class SubsectionYViewSet(viewsets.ModelViewSet):
    serializer_class = SubsectionYSerializer
    lookup_field = 'OrderNo'
    lookup_value_regex = '[^/]+'
    pagination_class = None

    def get_queryset(self):
        from .models.pur_sales import PurSales
        queryset = PurSales.objects.all().order_by('-VoucherDate', '-DatdCreated')
        
        search = self.request.query_params.get('search', None)
        voucher_no = self.request.query_params.get('voucher_no', None)
        order_no = self.request.query_params.get('order_no', None)
        party_name = self.request.query_params.get('party_name', None)
        broker_name = self.request.query_params.get('broker_name', None)
        date_after = self.request.query_params.get('date_after', None)
        date_before = self.request.query_params.get('date_before', None)
        
        if search:
            queryset = queryset.filter(
                Q(VoucherNo__icontains=search) |
                Q(OrderNo__icontains=search) |
                Q(PartyID__Account_Name__icontains=search) |
                Q(BrokerID__BrokerName__icontains=search)
            )
        if voucher_no:
            queryset = queryset.filter(VoucherNo__icontains=voucher_no)
        if order_no:
            queryset = queryset.filter(OrderNo__icontains=order_no)
        if party_name:
            queryset = queryset.filter(PartyID__Account_Name__icontains=party_name)
        if broker_name:
            queryset = queryset.filter(BrokerID__BrokerName__icontains=broker_name)
        if date_after:
            queryset = queryset.filter(VoucherDate__gte=date_after)
        if date_before:
            queryset = queryset.filter(VoucherDate__lte=date_before)
            
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        from .models.pur_sales import PurSalesTran
        # Delete details and delete header
        PurSalesTran.objects.filter(
            VoucherNo=instance.VoucherNo,
            VoucherDate=instance.VoucherDate,
            TranType=instance.TranType
        ).delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, OrderNo=None):
        # tblPurSales doesn't have status, we return a dummy response to maintain page logic compatibility
        return Response({'status': True})

class SalPurGroupViewSet(viewsets.ModelViewSet):
    """
    API viewset for Sales/Purchase Groups.
    """
    queryset = SalPurGroup.objects.all().order_by('-DateCreated')
    serializer_class = SalPurGroupSerializer
    lookup_field = 'SalPurGroupID'
    pagination_class = StandardResultsSetPagination

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, SalPurGroupID=None):
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save()
        return Response({'status': instance.is_active})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_active:
            return Response(
                {"detail": f"Cannot delete group '{instance.SalPurGroupName}' because it is currently Active. Please Mark Inactive first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Generic search
        search = self.request.query_params.get('search', None)
        if search:
            q_cond = Q(SalPurGroupName__icontains=search) | Q(GroupwiseAccountID__Account_Name__icontains=search)
            try:
                val = int(search)
                q_cond |= Q(SalPurGroupID=val)
            except ValueError:
                pass
            queryset = queryset.filter(q_cond)

        # Field-specific searches
        group_id = self.request.query_params.get('group_id', None)
        group_name = self.request.query_params.get('group_name', None)
        account_name = self.request.query_params.get('account_name', None)
        date_after = self.request.query_params.get('date_after', None)
        date_before = self.request.query_params.get('date_before', None)
        status_filter = self.request.query_params.get('status', None)
        gst_applicable = self.request.query_params.get('gst_applicable', None)
        groupwise_accounting = self.request.query_params.get('groupwise_accounting', None)
        interstate = self.request.query_params.get('interstate', None)

        if group_id:
            try:
                queryset = queryset.filter(SalPurGroupID=int(group_id))
            except ValueError:
                queryset = queryset.none()
        if group_name:
            queryset = queryset.filter(SalPurGroupName__icontains=group_name)
        if account_name:
            queryset = queryset.filter(GroupwiseAccountID__Account_Name__icontains=account_name)
        if date_after:
            queryset = queryset.filter(DateCreated__date__gte=date_after)
        if date_before:
            queryset = queryset.filter(DateCreated__date__lte=date_before)
        if status_filter is not None and status_filter != '':
            is_active_val = status_filter.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_val)
        if gst_applicable is not None and gst_applicable != '':
            queryset = queryset.filter(GST_Applicable_Y_N=(gst_applicable.lower() == 'true'))
        if groupwise_accounting is not None and groupwise_accounting != '':
            queryset = queryset.filter(GroupwiseAccounting=(groupwise_accounting.lower() == 'true'))
        if interstate is not None and interstate != '':
            queryset = queryset.filter(Interstate_Y_WithinState_N=(interstate.lower() == 'true'))

        # Sorting
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

from .models.user_master import UserMaster
from .serializers import UserMasterSerializer

class UserMasterViewSet(viewsets.ModelViewSet):
    """
    API viewset for User Master.
    """
    queryset = UserMaster.objects.all().order_by('user_id')
    serializer_class = UserMasterSerializer
    lookup_field = 'user_id'
    pagination_class = StandardResultsSetPagination

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, user_id=None):
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save()
        return Response({'status': instance.is_active})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_active:
            return Response(
                {"detail": f"Cannot delete user '{instance.user_name}' because it is currently Active. Please Mark Inactive first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Generic search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user_id__icontains=search) |
                Q(user_name__icontains=search) |
                Q(empid__icontains=search)
            )

        # Filters
        user_id_filter = self.request.query_params.get('user_id_filter', None)
        user_name_filter = self.request.query_params.get('user_name_filter', None)
        role_filter = self.request.query_params.get('role', None)
        empid_filter = self.request.query_params.get('empid', None)
        status_filter = self.request.query_params.get('status', None)

        if user_id_filter:
            queryset = queryset.filter(user_id__icontains=user_id_filter)
        if user_name_filter:
            queryset = queryset.filter(user_name__icontains=user_name_filter)
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        if empid_filter:
            queryset = queryset.filter(empid__icontains=empid_filter)
        if status_filter is not None and status_filter != '':
            is_active_val = status_filter.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_val)

        # Sorting
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset


class TransactionTypeViewSet(viewsets.ModelViewSet):
    """
    API viewset for Transaction Type lookup table.
    Supports list, retrieve, create, update.
    Used by the Sales/Purchase Group form dropdown and 'Add New' modal.
    """
    queryset = TransactionType.objects.all().order_by('TransactionTypeName')
    serializer_class = TransactionTypeSerializer
    lookup_field = 'TransactionTypeID'
    pagination_class = None  # Return full list for dropdown binding

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(TransactionTypeName__icontains=search) |
                Q(TransactionType__icontains=search)
            )
        return queryset
