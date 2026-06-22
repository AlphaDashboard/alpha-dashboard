from django.db import models
from django.utils.translation import gettext_lazy as _


# Module type constants — used to partition tblCASHBANK by module
class ModuleType:
    BANK_TRANSACTION = ''        # baseline Bank Transaction (empty = default)
    SUBSECTION_B2    = 'B2'     # Sub Section B-2 module


class CashBank(models.Model):
    """
    tblCASHBANK - Master transaction header
    """
    voucher_no = models.CharField(
        max_length=50,
        primary_key=True,
        verbose_name=_("Voucher No")
    )
    date = models.DateTimeField(
        verbose_name=_("Date")
    )
    tran_type = models.CharField(
        max_length=4,
        choices=[('CASH', 'CASH'), ('BANK', 'BANK'), ('J000', 'J000'), ('J001', 'J001'), ('J002', 'J002')],
        verbose_name=_("TranType")
    )
    rpid = models.CharField(
        max_length=1,
        choices=[('R', 'Receipt'), ('P', 'Payment'), ('I', 'Issue'), ('D', 'Deposit'), ('A', 'A'), ('B', 'B')],
        null=True,
        blank=True,
        verbose_name=_("RPID")
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Amount")
    )
    narration = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name=_("Narration")
    )
    bank_account = models.ForeignKey(
        'AccountMaster',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='cashbank_transactions',
        db_column='BankAccount',
        verbose_name=_("Bank Account")
    )
    status = models.BooleanField(
        default=True,
        verbose_name=_("Status")
    )
    # ── Module partitioning (added for B-2 consolidation) ───────────────────
    module_type = models.CharField(
        max_length=10,
        blank=True,
        default='',
        db_index=True,
        verbose_name=_("Module Type"),
        help_text=_("Empty = Bank Transaction; 'B2' = Sub Section B-2")
    )
    posting_status = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Posting Status"),
        help_text=_("B-2 workflow status: DRAFT, PENDING, or POSTED. Null for regular bank transactions.")
    )
    ref_voucher_no = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Ref Voucher No"),
        help_text=_("Optional reference voucher number used by B-2 module.")
    )
    user_created = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("UserCreated")
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("DateCreated")
    )
    user_modified = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("UserModified")
    )
    date_modified = models.DateTimeField(
        auto_now=True,
        verbose_name=_("DateModified")
    )

    @property
    def voucher_number(self):
        return self.voucher_no

    @voucher_number.setter
    def voucher_number(self, value):
        self.voucher_no = value

    @property
    def voucher_date(self):
        return self.date

    @voucher_date.setter
    def voucher_date(self, value):
        self.date = value

    @property
    def remarks(self):
        return self.narration

    @remarks.setter
    def remarks(self, value):
        self.narration = value

    @property
    def is_active(self):
        return self.status

    @is_active.setter
    def is_active(self, value):
        self.status = value

    @property
    def created_at(self):
        return self.date_created

    @property
    def updated_at(self):
        return self.date_modified

    @property
    def facts(self):
        return self.transactions

    class Meta:
        db_table = 'tblCASHBANK'
        verbose_name = _('Cash/Bank Transaction')
        verbose_name_plural = _('Cash/Bank Transactions')
        ordering = ['-date', '-date_created']

    def __str__(self):
        return f"{self.voucher_no} - {self.tran_type}"

class CashBankTran(models.Model):
    """
    tblCASHBANK_TRAN - Detail transaction row
    """
    voucher = models.ForeignKey(
        CashBank,
        on_delete=models.CASCADE,
        related_name='transactions',
        db_column='VoucherNo',
        verbose_name=_("VoucherNo")
    )
    date = models.DateTimeField(
        verbose_name=_("Date")
    )
    tran_type = models.CharField(
        max_length=4,
        choices=[('CASH', 'CASH'), ('BANK', 'BANK'), ('J000', 'J000'), ('J001', 'J001'), ('J002', 'J002')],
        verbose_name=_("TranType")
    )
    rpid = models.CharField(
        max_length=1,
        choices=[('R', 'Receipt'), ('P', 'Payment'), ('I', 'Issue'), ('D', 'Deposit'), ('A', 'A'), ('B', 'B')],
        null=True,
        blank=True,
        verbose_name=_("RPID")
    )
    account_master = models.ForeignKey(
        'AccountMaster',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='accountmaster_id',
        verbose_name=_("Account Master")
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Amount")
    )
    remarks = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name=_("Remarks")
    )
    cost_center = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Cost Center"),
        help_text=_("Optional cost center code used by B-2 module for dashboard aggregation.")
    )
    chq_no = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("ChqNo")
    )
    chq_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("ChqDate")
    )
    payee_bank = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("PayeeBank")
    )
    user_created = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("UserCreated")
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        blank=True,
        null=True,
        verbose_name=_("DateCreated")
    )
    user_modified = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("UserModified")
    )
    date_modified = models.DateTimeField(
        auto_now=True,
        blank=True,
        null=True,
        verbose_name=_("DateModified")
    )

    @property
    def row_type(self):
        return self.rpid

    @row_type.setter
    def row_type(self, value):
        self.rpid = value

    class Meta:
        db_table = 'tblCASHBANK_TRAN'
        verbose_name = _('Cash/Bank Detail')
        verbose_name_plural = _('Cash/Bank Details')

    def __str__(self):
        return f"{self.voucher_id} - {self.amount}"
