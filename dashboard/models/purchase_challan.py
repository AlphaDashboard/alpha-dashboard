from django.db import models
from django.utils.translation import gettext_lazy as _


# ─────────────────────────────────────────────────────────────
# TABLE 1: tblsalepurchasechallans  →  Purchase Challan Header
# ─────────────────────────────────────────────────────────────
class PurchaseChallan(models.Model):
    """
    Purchase Challan header table — tblsalepurchasechallans.
    TranType is always 'RMPCH' for Raw Material Purchase Challan.
    All writes go through sp_manage_purchase_challan stored procedure.
    """

    ChallanNo = models.CharField(
        max_length=50,
        primary_key=True,
        db_column='ChallanNo',
        verbose_name=_("Challan No")
    )
    ChallanDate = models.DateField(
        null=True, blank=True,
        db_column='ChallanDate',
        verbose_name=_("Challan Date")
    )
    TranType = models.CharField(
        max_length=20,
        default='RMPCH',
        db_column='TranType',
        verbose_name=_("Transaction Type")
    )
    GPNo = models.IntegerField(
        null=True, blank=True,
        db_column='GPNo',
        verbose_name=_("Gate Pass No")
    )
    StatusId = models.IntegerField(
        null=True, blank=True, default=1,
        db_column='StatusId',
        verbose_name=_("Status")
    )
    PONO = models.CharField(
        max_length=50,
        null=True, blank=True,
        db_column='PONO',
        verbose_name=_("PO No")
    )
    PODate = models.DateField(
        null=True, blank=True,
        db_column='PODate',
        verbose_name=_("PO Date")
    )

    # Auto-filled from Gate Pass / Weighment
    GatePassDate = models.DateField(null=True, blank=True, db_column='GatePassDate')
    VehicleNo = models.CharField(max_length=50, null=True, blank=True, db_column='VehicleNo')
    DriverName = models.CharField(max_length=100, null=True, blank=True, db_column='DriverName')
    WeighmentSlipNo = models.CharField(max_length=50, null=True, blank=True, db_column='WeighmentSlipNo')
    WeighmentDate = models.DateField(null=True, blank=True, db_column='WeighmentDate')
    Bags = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, default=0, db_column='Bags')
    GrossWeight = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, default=0, db_column='GrossWeight')
    TareWeight = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, default=0, db_column='TareWeight')
    NetWeight = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, default=0, db_column='NetWeight')

    # Audit fields
    draftedby = models.CharField(max_length=100, null=True, blank=True, db_column='draftedby')
    DraftedDate = models.DateTimeField(null=True, blank=True, db_column='DraftedDate')
    submittedby = models.CharField(max_length=100, null=True, blank=True, db_column='submittedby')
    SubmissionDate = models.DateTimeField(null=True, blank=True, db_column='SubmissionDate')
    approvedby = models.CharField(max_length=100, null=True, blank=True, db_column='approvedby')
    ApprovalDate = models.DateTimeField(null=True, blank=True, db_column='ApprovalDate')
    Notes = models.CharField(max_length=1000, null=True, blank=True, db_column='Notes')
    SupplierName = models.CharField(max_length=200, null=True, blank=True, db_column='SupplierName')

    class Meta:
        db_table = 'tblsalepurchasechallans'
        managed = False
        verbose_name = _('Purchase Challan')
        verbose_name_plural = _('Purchase Challans')

    def __str__(self):
        return str(self.ChallanNo)


# ─────────────────────────────────────────────────────────────
# TABLE 2: tblsalepurchasechallans_tran  →  Material Detail Rows
# ─────────────────────────────────────────────────────────────
class PurchaseChallanTran(models.Model):
    """
    Material transaction rows for a Purchase Challan.
    Maps to tblsalepurchasechallans_tran in the database.
    """

    ID = models.AutoField(primary_key=True, db_column='ID')
    ChallanNo = models.ForeignKey(
        PurchaseChallan,
        on_delete=models.CASCADE,
        db_column='ChallanNo',
        verbose_name=_("Challan No")
    )
    MaterialID = models.IntegerField(null=True, blank=True, db_column='MaterialID')
    Bags = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        db_column='Bags'
    )
    GrossWeight = models.DecimalField(
        max_digits=18, decimal_places=2, default=0, null=True, blank=True,
        db_column='GrossWeight'
    )
    NetWeight = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        db_column='NetWeight'
    )
    Remarks = models.CharField(max_length=500, null=True, blank=True, db_column='Remarks')

    class Meta:
        db_table = 'tblsalepurchasechallans_tran'
        managed = False
        verbose_name = _('Purchase Challan Tran')
        verbose_name_plural = _('Purchase Challan Trans')

    def __str__(self):
        return f"{self.ChallanNo_id} — {self.MaterialID}"
