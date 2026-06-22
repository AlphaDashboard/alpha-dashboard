import logging
from django.db import connection, transaction, models
from django.utils import timezone
from dashboard.models.cashbank import CashBank, CashBankTran
from .subsection_b2_repo_contract import ISubsectionB2Repository

logger = logging.getLogger('dashboard.subsection_b2_repo')

# B-2 posting status constants (kept local to avoid circular import)
B2_DRAFT   = 'DRAFT'
B2_PENDING = 'PENDING'
B2_POSTED  = 'POSTED'


class SubsectionB2Repository(ISubsectionB2Repository):
    """
    SubsectionB2Repository — Concrete implementation of B-2 repository contract.

    ARCHITECTURE CHANGE (migration 0018):
    All B-2 data now lives in tblCASHBANK / tblCASHBANK_TRAN (same tables as the
    baseline Bank Transaction module). B-2 records are isolated via:
        module_type = 'B2'

    The orphaned tblSubsectionB2 / tblSubsectionB2_TRAN tables are no longer
    queried by this code. SQLite works immediately with the Django ORM path.
    PostgreSQL stored procedure calls are preserved for future use but route
    through the same tblCASHBANK tables when deployed.
    """

    def _is_postgresql(self) -> bool:
        return connection.vendor == 'postgresql'

    # ─────────────────────────────────────────────────────────────────────────
    # CREATE VOUCHER
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def create_voucher(self, validated_data: dict) -> CashBank:
        """Create a new B-2 voucher in tblCASHBANK with its detail rows in tblCASHBANK_TRAN."""
        logger.info("B-2 Repo: Creating voucher in tblCASHBANK (module_type='B2')")
        username = validated_data.pop('_user', 'system')
        transactions_data = validated_data.pop('transactions', [])
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        voucher_no = execute_sp_manage_transaction('INSERT', 'SUBSECTION_B2', validated_data, transactions_data, username)
        return CashBank.objects.get(voucher_no=voucher_no)

    # ─────────────────────────────────────────────────────────────────────────
    # UPDATE VOUCHER
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def update_voucher(self, instance: CashBank, validated_data: dict) -> CashBank:
        """Update an existing B-2 voucher in tblCASHBANK with its detail rows."""
        logger.info(f"B-2 Repo: Updating voucher {instance.voucher_no} in tblCASHBANK")

        # Security check: Prevent updates to POSTED vouchers
        if instance.posting_status == B2_POSTED:
            logger.warning(f"B-2 Repo: Blocked update attempt on POSTED voucher {instance.voucher_no}")
            raise PermissionError("Cannot edit a POSTED transaction.")

        username = validated_data.pop('_user', 'system')
        transactions_data = validated_data.pop('transactions', [])
        validated_data['voucher_no'] = instance.voucher_no
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        execute_sp_manage_transaction('UPDATE', 'SUBSECTION_B2', validated_data, transactions_data, username)
        instance.refresh_from_db()
        return instance

    # ─────────────────────────────────────────────────────────────────────────
    # CALCULATE BALANCE
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_balance(self, bank_account_id: int, up_to_date) -> float:
        """Fetch the running B-2 account balance for a specific bank account."""
        logger.info(f"B-2 Repo: Calculating B-2 balance for bank account {bank_account_id}")
        return self._calculate_balance_via_orm(bank_account_id, up_to_date)

    # ─────────────────────────────────────────────────────────────────────────
    # GET DASHBOARD AGGREGATES
    # ─────────────────────────────────────────────────────────────────────────
    def get_dashboard_aggregates(self, start_date, end_date) -> dict:
        """Fetch dashboard aggregations grouped by type and account/category."""
        logger.info(f"B-2 Repo: Fetching dashboard aggregates between {start_date} and {end_date}")
        by_category = self._get_dashboard_aggregates_via_orm(start_date, end_date)

        # KPIs — only B-2 records (module_type='B2')
        headers_in_range = CashBank.objects.filter(
            module_type='B2',
            date__range=(start_date, end_date),
            status=True
        )

        kpi_data = headers_in_range.aggregate(
            total_deposits=models.Sum(
                models.Case(
                    models.When(rpid__in=['D', 'R'], then='amount'),
                    default=models.Value(0.00),
                    output_field=models.DecimalField()
                )
            ),
            total_issues=models.Sum(
                models.Case(
                    models.When(rpid__in=['I', 'P'], then='amount'),
                    default=models.Value(0.00),
                    output_field=models.DecimalField()
                )
            ),
            txn_count=models.Count('voucher_no')
        )

        total_deposits = float(kpi_data['total_deposits'] or 0.00)
        total_issues   = float(kpi_data['total_issues'] or 0.00)
        net_flow       = total_deposits - total_issues
        txn_count      = kpi_data['txn_count'] or 0

        kpis = {
            'total_deposits': total_deposits,
            'total_issues':   total_issues,
            'net_flow':       net_flow,
            'txn_count':      txn_count
        }

        # Cost Center Summaries (from tblCASHBANK_TRAN with module_type='B2' header)
        cost_centers = CashBankTran.objects.filter(
            voucher__module_type='B2',
            voucher__date__range=(start_date, end_date),
            voucher__status=True
        ).values('cost_center').annotate(
            total_amount=models.Sum('amount')
        ).order_by('-total_amount')

        by_cost_center = [
            {
                'cost_center': cc['cost_center'] or 'General',
                'total_amount': float(cc['total_amount'] or 0)
            }
            for cc in cost_centers
        ]

        # Bank Account Summaries
        banks = headers_in_range.values(
            'bank_account__Account_Name', 'bank_account__groupID'
        ).annotate(
            net_flow=models.Sum(
                models.Case(
                    models.When(rpid__in=['D', 'R'], then='amount'),
                    models.When(rpid__in=['I', 'P'], then=-models.F('amount')),
                    default=models.Value(0.00),
                    output_field=models.DecimalField()
                )
            )
        )
        by_bank = [
            {
                'bank_name': f"{b['bank_account__Account_Name']}" if b['bank_account__Account_Name'] else 'Unknown',
                'net_flow': float(b['net_flow'] or 0)
            }
            for b in banks
        ]

        # Monthly Summaries
        monthly_map = {}
        for h in headers_in_range:
            month_key = h.date.strftime('%Y-%m')
            amt = float(h.amount or 0)
            is_dep = h.rpid in ['D', 'R']
            if month_key not in monthly_map:
                monthly_map[month_key] = {'month': month_key, 'deposits': 0.0, 'issues': 0.0}
            if is_dep:
                monthly_map[month_key]['deposits'] += amt
            else:
                monthly_map[month_key]['issues'] += amt

        by_month = sorted(list(monthly_map.values()), key=lambda x: x['month'])

        return {
            'by_category':    by_category,
            'by_cost_center': by_cost_center,
            'by_bank':        by_bank,
            'by_month':       by_month,
            'kpis':           kpis
        }

    # ─────────────────────────────────────────────────────────────────────────
    # GET LEDGER REPORT
    # ─────────────────────────────────────────────────────────────────────────
    def get_ledger_report(self, start_date, end_date, limit: int, offset: int) -> list:
        """Fetch paginated ledger report data from tblCASHBANK (B-2 only)."""
        logger.info(f"B-2 Repo: Fetching ledger report between {start_date} and {end_date}")
        return self._get_ledger_report_via_orm(start_date, end_date, limit, offset)


    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE ORM METHODS — all query tblCASHBANK with module_type='B2'
    # ─────────────────────────────────────────────────────────────────────────

    def _create_via_orm(self, validated_data: dict) -> CashBank:
        from dashboard.serializers import SubsectionB2Serializer

        transactions_data = validated_data.pop('transactions', [])

        # Auto-generate B-2 voucher number if not provided
        voucher_no = validated_data.get('voucher_no')
        if not voucher_no or voucher_no == 'Auto-Generated':
            validated_data['voucher_no'] = SubsectionB2Serializer._generate_voucher_no()

        # Force module_type = 'B2' — this is the critical isolation
        validated_data['module_type'] = 'B2'

        # Set default posting_status if not provided
        if not validated_data.get('posting_status'):
            validated_data['posting_status'] = B2_DRAFT

        # Create header record in tblCASHBANK
        header = CashBank.objects.create(**validated_data)

        # Create detail records in tblCASHBANK_TRAN
        for tran_data in transactions_data:
            tran_data.setdefault('date',      header.date)
            tran_data.setdefault('tran_type', header.tran_type)
            tran_data.setdefault('rpid',      header.rpid)
            CashBankTran.objects.create(voucher=header, **tran_data)

        return header

    def _update_via_orm(self, instance: CashBank, validated_data: dict) -> CashBank:
        transactions_data = validated_data.pop('transactions', [])

        # Ensure module_type stays 'B2' on update
        validated_data['module_type'] = 'B2'

        # Update header fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace detail rows cleanly (delete + recreate)
        instance.transactions.all().delete()
        for tran_data in transactions_data:
            tran_data.setdefault('date',      instance.date)
            tran_data.setdefault('tran_type', instance.tran_type)
            tran_data.setdefault('rpid',      instance.rpid)
            CashBankTran.objects.create(voucher=instance, **tran_data)

        return instance

    def _calculate_balance_via_orm(self, bank_account_id: int, up_to_date) -> float:
        """Running balance: only B-2 records (module_type='B2') for this bank account."""
        result = CashBank.objects.filter(
            module_type='B2',
            bank_account_id=bank_account_id,
            date__lte=up_to_date,
            status=True
        ).aggregate(
            balance=models.functions.Coalesce(
                models.Sum(
                    models.Case(
                        models.When(rpid__in=['R', 'D'], then='amount'),
                        models.When(rpid__in=['P', 'I'], then=-models.F('amount')),
                        default=models.Value(0.00),
                        output_field=models.DecimalField()
                    )
                ),
                models.Value(0.00),
                output_field=models.DecimalField()
            )
        )
        return float(result['balance'])

    def _get_dashboard_aggregates_via_orm(self, start_date, end_date) -> list:
        """Aggregate by tran_type and account_master group — B-2 tran rows only."""
        qs = CashBankTran.objects.filter(
            voucher__module_type='B2',
            voucher__date__range=(start_date, end_date),
            voucher__status=True
        ).values(
            'tran_type', 'account_master__Account_Name'
        ).annotate(
            total_amount=models.Sum('amount')
        )

        return [
            {
                'category_name': item['tran_type'],
                'group_name':    item['account_master__Account_Name'] or 'Unknown',
                'total_amount':  float(item['total_amount'])
            }
            for item in qs
        ]

    def _get_ledger_report_via_orm(self, start_date, end_date, limit: int, offset: int) -> list:
        """Paginated ledger — B-2 headers only."""
        qs = CashBank.objects.filter(
            module_type='B2',
            date__range=(start_date, end_date),
            status=True
        )
        total_records = qs.count()

        paginated_qs = qs.order_by('-date', '-date_created')[offset:offset + limit]

        return [
            {
                'voucher_no':       h.voucher_no,
                'transaction_date': h.date,
                'tran_type':        h.tran_type,
                'rpid':             h.rpid,
                'amount':           float(h.amount),
                'narration':        h.narration or '',
                'posting_status':   h.posting_status or B2_DRAFT,
                'total_records':    total_records
            }
            for h in paginated_qs
        ]
