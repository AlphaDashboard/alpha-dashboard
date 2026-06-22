"""
DEPRECATED — Sub Section B-2 isolated models.

Architecture change (migration 0018): Sub Section B-2 data now lives in
tblCASHBANK / tblCASHBANK_TRAN, partitioned by module_type='B2'.

These model classes (SubsectionB2, SubsectionB2Tran) are retained ONLY to
preserve Django migration history for tblSubsectionB2 / tblSubsectionB2_TRAN,
which still exist in the database. They are NOT used by any production code.

DO NOT import SubsectionB2 or SubsectionB2Tran in new code.
Use CashBank.objects.filter(module_type='B2') instead.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from .subsection_b2_constants import B2TransactionType, B2RPIDState, B2PostingStatus


class SubsectionB2(models.Model):
    """
    tblSubsectionB2 — Master transaction header for Sub Section B-2.

    Isolated from tblCASHBANK and tblSectionC — independent schema.
    Voucher numbers are auto-generated in format: B2-YYYYMM-NNNN
    Soft-delete via status=False (never hard-deleted by default).
    """

    voucher_no = models.CharField(
        max_length=50,
        primary_key=True,
        verbose_name=_("Voucher No"),
        help_text=_("Auto-generated: B2-YYYYMM-NNNN. Read-only after creation.")
    )
    transaction_date = models.DateTimeField(
        db_column='transaction_date',
        verbose_name=_("Transaction Date"),
        help_text=_("Voucher date and time.")
    )
    tran_type = models.CharField(
        max_length=4,
        choices=B2TransactionType.CHOICES,
        verbose_name=_("Tran Type")
    )
    rpid = models.CharField(
        max_length=1,
        choices=B2RPIDState.CHOICES,
        verbose_name=_("RPID")
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Amount"),
        help_text=_("Must equal the sum of all detail row amounts.")
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
        related_name='b2_transactions',
        db_column='BankAccount',
        verbose_name=_("Bank Account")
    )
    ref_voucher_no = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Ref Voucher No"),
        help_text=_("Optional reference to a Sub Section B (CashBank) voucher.")
    )
    status = models.BooleanField(
        default=True,
        verbose_name=_("Status"),
        help_text=_("False = soft-deleted. Never hard-deleted via UI.")
    )
    posting_status = models.CharField(
        max_length=20,
        choices=B2PostingStatus.CHOICES,
        default=B2PostingStatus.DRAFT,
        verbose_name=_("Posting Status"),
        help_text=_("Controls locking workflows: DRAFT, PENDING, or POSTED.")
    )
    
    # Audit-ready columns
    user_created = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("User Created")
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Date Created")
    )
    user_modified = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("User Modified")
    )
    date_modified = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Date Modified")
    )

    class Meta:
        db_table = 'tblSubsectionB2'
        verbose_name = _('Sub Section B-2 Transaction')
        verbose_name_plural = _('Sub Section B-2 Transactions')
        ordering = ['-transaction_date', '-date_created']

    def __str__(self):
        return f"{self.voucher_no} - {self.tran_type} - {self.rpid}"


class SubsectionB2Tran(models.Model):
    """
    tblSubsectionB2_TRAN — Detail transaction row for Sub Section B-2.

    One header (SubsectionB2) can have one or more detail rows.
    cost_center is a new field enabling dashboard cost-center breakdown.
    """

    voucher = models.ForeignKey(
        SubsectionB2,
        on_delete=models.CASCADE,
        related_name='transactions',
        db_column='VoucherNo',
        verbose_name=_("Voucher No")
    )
    transaction_date = models.DateTimeField(
        db_column='transaction_date',
        verbose_name=_("Transaction Date"),
        help_text=_("Inherited from header if not provided.")
    )
    tran_type = models.CharField(
        max_length=4,
        choices=B2TransactionType.CHOICES,
        verbose_name=_("Tran Type"),
        help_text=_("Inherited from header if not provided.")
    )
    rpid = models.CharField(
        max_length=1,
        choices=B2RPIDState.CHOICES,
        verbose_name=_("RPID"),
        help_text=_("Inherited from header if not provided.")
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
        help_text=_("Optional cost center code for dashboard aggregation.")
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
    
    # Audit-ready columns
    user_created = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("User Created")
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        blank=True,
        null=True,
        verbose_name=_("Date Created")
    )
    user_modified = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("User Modified")
    )
    date_modified = models.DateTimeField(
        auto_now=True,
        blank=True,
        null=True,
        verbose_name=_("Date Modified")
    )

    class Meta:
        db_table = 'tblSubsectionB2_TRAN'
        verbose_name = _('Sub Section B-2 Detail')
        verbose_name_plural = _('Sub Section B-2 Details')

    def __str__(self):
        return f"{self.voucher_id} - {self.account_master} - {self.amount}"
