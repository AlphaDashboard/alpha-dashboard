from django.db import models
from django.utils.translation import gettext_lazy as _
from dashboard.constants import RowType
from .account_master import AccountMaster


class Voucher(models.Model):

    """
    Dimension Table
    Model representing a Voucher Header.
    """
    voucher_number = models.CharField(
        max_length=15,
        primary_key=True,
        verbose_name=_("Voucher Number")
    )
    voucher_date = models.DateField(
        verbose_name=_("Voucher Date")
    )
    remarks = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Remarks")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
        help_text=_("Designates whether this record should be treated as active (soft delete).")
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        managed = False
        ordering = ['-voucher_date', '-created_at']
        verbose_name = _('Voucher')
        verbose_name_plural = _('Vouchers')

    def __str__(self):
        return self.voucher_number

class VoucherFact(models.Model):
    """
    Fact Table
    Model representing a transaction row in a Voucher.
    """
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.CASCADE,
        related_name='facts',
        verbose_name=_("Voucher")
    )
    row_type = models.CharField(
        max_length=1,
        choices=RowType.CHOICES,
        verbose_name=_("Type")
    )
    account_master = models.ForeignKey(
        AccountMaster,
        on_delete=models.PROTECT,
        db_column='accountmaster_id',
        verbose_name=_("Account Master")
    )
    voucher_date = models.DateField(
        null=True, blank=True,
        verbose_name=_("Voucher Date")
    )
    remarks = models.CharField(
        max_length=200,
        null=True, blank=True,
        verbose_name=_("Remarks")
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Amount")
    )

    class Meta:
        managed = False
        verbose_name = _('Voucher Fact')
        verbose_name_plural = _('Voucher Facts')

    def save(self, *args, **kwargs):
        if self.voucher_id:
            self.voucher_date = self.voucher.voucher_date
            self.remarks = self.voucher.remarks
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.voucher.voucher_number} - {self.row_type} - {self.amount}"
