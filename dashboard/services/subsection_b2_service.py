import logging
from django.utils import timezone
from dashboard.models.cashbank import CashBank
from .subsection_b2_repo import SubsectionB2Repository

logger = logging.getLogger('dashboard.subsection_b2_service')

class SubsectionB2Service:
    """
    SubsectionB2Service — Orchestration service layer for Subsection B-2 transactions.

    ARCHITECTURE: B-2 data now lives in tblCASHBANK (module_type='B2').
    This service delegates all persistence to SubsectionB2Repository which
    correctly filters and writes to tblCASHBANK / tblCASHBANK_TRAN.
    """

    _repo = SubsectionB2Repository()

    @classmethod
    def create_voucher(cls, validated_data: dict) -> CashBank:
        """Orchestrate B-2 voucher creation through the repository."""
        logger.info("B-2 Service: Orchestrating voucher creation in tblCASHBANK")
        return cls._repo.create_voucher(validated_data)

    @classmethod
    def update_voucher(cls, instance: CashBank, validated_data: dict) -> CashBank:
        """Orchestrate B-2 voucher update through the repository."""
        logger.info(f"B-2 Service: Orchestrating voucher update for {instance.voucher_no}")
        return cls._repo.update_voucher(instance, validated_data)

    @classmethod
    def calculate_balance(cls, bank_account_id: int, up_to_date=None) -> float:
        """Fetch running B-2 balance from repository (module_type='B2' filter applied)."""
        if up_to_date is None:
            up_to_date = timezone.now()
        logger.info(f"B-2 Service: Retrieving B-2 account balance for {bank_account_id}")
        return cls._repo.calculate_balance(bank_account_id, up_to_date)

    @classmethod
    def get_dashboard_aggregates(cls, start_date, end_date) -> dict:
        """Fetch dashboard aggregations from repository."""
        logger.info(f"B-2 Service: Retrieving dashboard aggregates from {start_date} to {end_date}")
        return cls._repo.get_dashboard_aggregates(start_date, end_date)

    @classmethod
    def get_ledger_report(cls, start_date, end_date, limit: int = 10, offset: int = 0) -> list:
        """Fetch paginated ledger report from repository."""
        logger.info(f"B-2 Service: Retrieving paginated ledger report from {start_date} to {end_date}")
        return cls._repo.get_ledger_report(start_date, end_date, limit, offset)
