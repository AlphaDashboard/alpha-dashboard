from abc import ABC, abstractmethod
from dashboard.models.cashbank import CashBank

class ISubsectionB2Repository(ABC):
    """
    Contract for B-2 repository.
    Now uses CashBank (tblCASHBANK) as the return type — B-2 data shares
    the same tables as the baseline Bank Transaction, isolated by module_type='B2'.
    """

    @abstractmethod
    def create_voucher(self, validated_data: dict) -> CashBank:
        """Create a new B-2 voucher with its detail transactions."""
        pass

    @abstractmethod
    def update_voucher(self, instance: CashBank, validated_data: dict) -> CashBank:
        """Update an existing B-2 voucher with its detail transactions."""
        pass

    @abstractmethod
    def get_dashboard_aggregates(self, start_date, end_date) -> dict:
        """Fetch dashboard aggregations grouped by type and account/category."""
        pass

    @abstractmethod
    def get_ledger_report(self, start_date, end_date, limit: int, offset: int) -> list:
        """Fetch paginated ledger report data."""
        pass

    @abstractmethod
    def calculate_balance(self, bank_account_id: int, up_to_date) -> float:
        """Fetch the running B-2 account balance for a specific bank account."""
        pass
