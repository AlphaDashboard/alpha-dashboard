from django.db import models
from django.utils.translation import gettext_lazy as _

class SectionC(models.Model):
    """
    tblSectionC - Master transaction header
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
        choices=[('CASH', 'CASH'), ('BANK', 'BANK')],
        verbose_name=_("TranType")
    )
    rpid = models.CharField(
        max_length=1,
        choices=[('R', 'Receipt'), ('P', 'Payment'), ('I', 'Issue'), ('D', 'Deposit')],
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
        related_name='sectionc_transactions',
        db_column='BankAccount',
        verbose_name=_("Bank Account")
    )
    status = models.BooleanField(
        default=True,
        verbose_name=_("Status")
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

    class Meta:
        db_table = 'tblSectionC'
        verbose_name = _('Section C Transaction')
        verbose_name_plural = _('Section C Transactions')
        ordering = ['-date', '-date_created']

    def __str__(self):
        return f"{self.voucher_no} - {self.tran_type}"

class SectionCTran(models.Model):
    """
    tblSectionC_TRAN - Detail transaction row
    """
    voucher = models.ForeignKey(
        SectionC,
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
        choices=[('CASH', 'CASH'), ('BANK', 'BANK')],
        verbose_name=_("TranType")
    )
    rpid = models.CharField(
        max_length=1,
        choices=[('R', 'Receipt'), ('P', 'Payment'), ('I', 'Issue'), ('D', 'Deposit')],
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

    class Meta:
        db_table = 'tblSectionC_TRAN'
        verbose_name = _('Section C Detail')
        verbose_name_plural = _('Section C Details')

    def __str__(self):
        return f"{self.voucher_id} - {self.amount}"
