from django.db import models
from django.utils.translation import gettext_lazy as _
from .account_master import AccountMaster
from .broker_supplier import Broker
from .gate_entry import Material
from .sal_pur_group import SalPurGroup

class PurSales(models.Model):

    """
    Model representing tblPurSales (Purchase/Sales Header).
    """
    VoucherNo = models.CharField(max_length=100, db_column='VoucherNo')
    VoucherDate = models.DateField(db_column='VoucherDate')
    TranType = models.CharField(max_length=20, db_column='TranType')
    OrderNo = models.CharField(max_length=100, primary_key=True, db_column='OrderNo')
    OrderDate = models.DateField(db_column='OrderDate')
    PurSalGroupID = models.ForeignKey(
        SalPurGroup, 
        on_delete=models.PROTECT, 
        db_column='PurSalGroupID'
    )
    PartyID = models.ForeignKey(
        AccountMaster, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True, 
        db_column='PartyID',
        related_name='pursales_party_records'
    )
    BrokerID = models.ForeignKey(
        Broker, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True, 
        db_column='BrokerID'
    )
    ZoneID = models.BigIntegerField(null=True, blank=True, db_column='ZoneID')
    DeliveryLocation = models.CharField(max_length=255, null=True, blank=True, db_column='DeliveryLocation')
    DelTermsID = models.BigIntegerField(null=True, blank=True, db_column='DelTermsID')
    PaymentTermsID = models.BigIntegerField(null=True, blank=True, db_column='PaymentTermsID')
    FreightTermID = models.BigIntegerField(null=True, blank=True, db_column='FreightTermID')
    CurrencyID = models.BigIntegerField(null=True, blank=True, db_column='CurrencyID')
    IncotermID = models.BigIntegerField(null=True, blank=True, db_column='IncotermID')
    CreditDays = models.IntegerField(null=True, blank=True, db_column='CreditDays', default=0)
    Purchaser_Saleman_ID = models.BigIntegerField(null=True, blank=True, db_column='Purchaser_Saleman_ID')
    DepartmentID = models.BigIntegerField(null=True, blank=True, db_column='DepartmentID')
    CostCentrID = models.BigIntegerField(null=True, blank=True, db_column='CostCentrID')
    SpecialInstructions = models.CharField(max_length=255, null=True, blank=True, db_column='SpecialInstructions')
    InternalNotes = models.CharField(max_length=1, null=True, blank=True, db_column='InternalNotes')
    UserCreated = models.CharField(max_length=100, null=True, blank=True, db_column='UserCreated')
    DatdCreated = models.DateField(null=True, blank=True, db_column='DatdCreated')
    UserModified = models.CharField(max_length=100, null=True, blank=True, db_column='UserModified')
    DateModified = models.DateField(null=True, blank=True, db_column='DateModified')
    IGST0_SGST1 = models.SmallIntegerField(null=True, blank=True, db_column='IGST0_SGST1')

    class Meta:
        db_table = 'tblPurSales'
        managed = False
        verbose_name = _('Purchase/Sales Header')
        verbose_name_plural = _('Purchase/Sales Headers')

    def __str__(self):
        return f"{self.VoucherNo} - {self.OrderNo}"

    @property
    def items(self):
        return PurSalesTran.objects.filter(
            VoucherNo=self.VoucherNo,
            VoucherDate=self.VoucherDate,
            TranType=self.TranType
        )


class PurSalesTran(models.Model):
    """
    Model representing tblPurSales_Tran (Purchase/Sales Transaction details).
    """
    id = models.BigAutoField(primary_key=True, db_column='id')
    VoucherNo = models.CharField(max_length=100, db_column='VoucherNo')
    VoucherDate = models.DateField(db_column='VoucherDate')
    TranType = models.CharField(max_length=20, db_column='TranType')
    Item_ID = models.ForeignKey(
        Material,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='Item_ID'
    )
    Bag = models.BigIntegerField(null=True, blank=True, db_column='Bag')
    Weight = models.DecimalField(max_digits=18, decimal_places=3, null=True, blank=True, db_column='Weight')
    unit_weight = models.DecimalField(max_digits=18, decimal_places=3, null=True, blank=True, db_column='unit_weight')
    Unit_rate = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='Unit_rate')
    Amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='Amount')
    gst_rate = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='gst_rate')
    IGST = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='IGST')
    CGST = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='CGST')
    SGST = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='SGST')
    Total = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, db_column='Total')
    IsRateIncludingGST = models.BooleanField(null=True, blank=True, db_column='IsRateIncludingGST')
    UserCreated = models.CharField(max_length=100, null=True, blank=True, db_column='UserCreated')
    DateCreated = models.DateTimeField(null=True, blank=True, db_column='DateCreated')
    UserModified = models.CharField(max_length=100, null=True, blank=True, db_column='UserModified')
    DateModified = models.DateTimeField(null=True, blank=True, db_column='DateModified')

    class Meta:
        db_table = 'tblPurSales_Tran'
        managed = False
        verbose_name = _('Purchase/Sales Detail')
        verbose_name_plural = _('Purchase/Sales Details')

    def __str__(self):
        return f"{self.VoucherNo} - Item {self.Item_ID_id}"
