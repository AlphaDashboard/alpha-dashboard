from django.db import models
from django.utils.translation import gettext_lazy as _
from .account_master import AccountMaster


class SalPurGroup(models.Model):

    """
    Model representing tblSalPurGroup.
    """
    SalPurGroupID = models.BigAutoField(primary_key=True, db_column='SalPurGroupID')
    SalPurGroupName = models.CharField(max_length=255, null=True, blank=True, db_column='SalPurGroupName')
    GroupwiseAccounting = models.BooleanField(null=True, blank=True, db_column='GroupwiseAccounting')
    GroupwiseAccountID = models.ForeignKey(
        AccountMaster, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='GroupwiseAccountID'
    )
    Interstate_Y_WithinState_N = models.BooleanField(
        null=True,
        blank=True,
        db_column='Interstate_Y_WithinState_N',
        verbose_name=_("Interstate (Yes) / Within State (No)")
    )
    GST_Applicable_Y_N = models.BooleanField(
        null=True,
        blank=True,
        db_column='GST_Applicable_Y_N',
        verbose_name=_("GST Applicable Y/N")
    )
    IsGSTApplicableY1N0 = models.BooleanField(
        null=True,
        blank=True,
        db_column='IsGSTApplicableY1N0',
        verbose_name=_("Is GST Applicable Y1N0")
    )
    IGST1_CGST0 = models.BooleanField(
        null=True,
        blank=True,
        db_column='IGST1_CGST0',
        verbose_name=_("IGST1 CGST0")
    )
    UserCreated = models.CharField(max_length=100, null=True, blank=True, db_column='UserCreated')
    DateCreated = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_column='DateCreated')
    UserModified = models.CharField(max_length=100, null=True, blank=True, db_column='UserModified')
    DateModified = models.DateTimeField(auto_now=True, null=True, blank=True, db_column='DateModified')
    is_active = models.BooleanField(
        default=True,
        db_column='is_active',
        verbose_name=_("Is Active")
    )

    class Meta:
        db_table = 'tblSalPurGroup'
        managed = False
        verbose_name = _('Sales/Purchase Group')
        verbose_name_plural = _('Sales/Purchase Groups')

    def __str__(self):
        return str(self.SalPurGroupName)


class SalPurGroupTran(models.Model):
    """
    Model representing tblSalPurGroup_Tran.
    """
    DEBIT_CREDIT_CHOICES = (
        ('D', 'Debit'),
        ('C', 'Credit'),
    )

    ID = models.BigAutoField(primary_key=True, db_column='ID')
    ChargesName = models.CharField(max_length=255, null=True, blank=True, db_column='ChargesName')
    SalPurGroupID = models.ForeignKey(
        SalPurGroup, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        db_column='SalPurGroupID',
        related_name='transactions'
    )
    ChargeAccountID = models.ForeignKey(
        AccountMaster, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='ChargeAccountID'
    )
    Auto_Y_Manual_N = models.BooleanField(null=True, blank=True, db_column='Auto_Y_Manual_N')
    Rate = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True, db_column='Rate')
    Debit_D_Credit_C = models.CharField(max_length=1, choices=DEBIT_CREDIT_CHOICES, null=True, blank=True, db_column='Debit_D_Credit_C')
    
    UserCreated = models.CharField(max_length=100, null=True, blank=True, db_column='UserCreated')
    DateCreated = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_column='DateCreated')
    UserModified = models.CharField(max_length=100, null=True, blank=True, db_column='UserModified')
    DateModified = models.DateTimeField(auto_now=True, null=True, blank=True, db_column='DateModified')

    class Meta:
        db_table = 'tblSalPurGroup_Tran'
        managed = False
        verbose_name = _('Sales/Purchase Group Transaction')
        verbose_name_plural = _('Sales/Purchase Group Transactions')

    def __str__(self):
        return str(self.ChargesName)
