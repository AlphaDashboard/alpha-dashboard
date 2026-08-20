from django.db import models
from django.utils.translation import gettext_lazy as _


# ─────────────────────────────────────────────────────────────
# TABLE 1: tblWeighment  →  Main Weighment Header
# ─────────────────────────────────────────────────────────────
class Weighment(models.Model):
    """
    Main Weighment header table — tblWeighment.
    All writes go through sp_manage_weighment stored procedure.
    """

    WeighmentSlipNo = models.CharField(
        max_length=50,
        primary_key=True,
        db_column='WeighmentSlipNo',
        verbose_name=_("Weighment Slip No")
    )
    GatePassNo = models.IntegerField(
        null=True, blank=True,
        db_column='GatePassNo',
        verbose_name=_("Gate Pass No")
    )
    GrossWeight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True, default=0,
        db_column='GrossWeight',
        verbose_name=_("Gross Weight")
    )
    TareWeight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True, default=0,
        db_column='TareWeight',
        verbose_name=_("Tare Weight")
    )
    NetWeight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True, default=0,
        db_column='NetWeight',
        verbose_name=_("Net Weight")
    )
    GrossDateTime = models.DateTimeField(
        null=True, blank=True,
        db_column='GrossDateTime',
        verbose_name=_("Gross Date & Time")
    )
    TareDateTime = models.DateTimeField(
        null=True, blank=True,
        db_column='TareDateTime',
        verbose_name=_("Tare Date & Time")
    )
    AutoManual = models.CharField(
        max_length=10,
        default='Manual',
        db_column='AutoManual',
        verbose_name=_("Auto/Manual")
    )
    VehicleType = models.CharField(
        max_length=100,
        null=True, blank=True,
        db_column='VehicleType',
        verbose_name=_("Vehicle Type")
    )
    Purchaser = models.CharField(
        max_length=200,
        null=True, blank=True,
        db_column='Purchaser',
        verbose_name=_("Purchaser")
    )
    Seller = models.CharField(
        max_length=200,
        null=True, blank=True,
        db_column='Seller',
        verbose_name=_("Seller")
    )
    Remarks = models.CharField(
        max_length=500,
        null=True, blank=True,
        db_column='Remarks',
        verbose_name=_("Remarks")
    )
    status = models.IntegerField(
        null=True, blank=True, default=1,
        db_column='status',
        verbose_name=_("Status")
    )

    # Audit / approval fields
    draftedby = models.CharField(max_length=100, null=True, blank=True, db_column='draftedby')
    DraftedDate = models.DateTimeField(null=True, blank=True, db_column='DraftedDate')
    submittedby = models.CharField(max_length=100, null=True, blank=True, db_column='submittedby')
    SubmissionDate = models.DateTimeField(null=True, blank=True, db_column='SubmissionDate')
    approvedby = models.CharField(max_length=100, null=True, blank=True, db_column='approvedby')
    ApprovalDate = models.DateTimeField(null=True, blank=True, db_column='ApprovalDate')

    class Meta:
        db_table = 'tblWeighment'
        managed = False
        verbose_name = _('Weighment')
        verbose_name_plural = _('Weighments')

    def __str__(self):
        return str(self.WeighmentSlipNo)


# ─────────────────────────────────────────────────────────────
# TABLE 2: tblWeighment_Tran  →  Material Detail Rows
# ─────────────────────────────────────────────────────────────
class WeighmentTran(models.Model):
    """
    Material transaction rows for a Weighment slip.
    Maps to tblWeighment_Tran in the database.
    """

    ID = models.AutoField(primary_key=True, db_column='ID')
    WeighmentSlipNo = models.ForeignKey(
        Weighment,
        on_delete=models.CASCADE,
        db_column='WeighmentSlipNo',
        verbose_name=_("Weighment Slip No")
    )
    MaterialID = models.IntegerField(null=True, blank=True, db_column='MaterialID')
    Bags = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        db_column='Bags'
    )
    GrossWeight = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        db_column='GrossWeight'
    )
    NetWeight = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        db_column='NetWeight'
    )
    Remarks = models.CharField(max_length=500, null=True, blank=True, db_column='Remarks')

    class Meta:
        db_table = 'tblWeighment_Tran'
        managed = False
        verbose_name = _('Weighment Tran')
        verbose_name_plural = _('Weighment Trans')

    def __str__(self):
        return f"{self.WeighmentSlipNo_id} — {self.MaterialID}"
