from django.db import models
from django.utils.translation import gettext_lazy as _


# ─────────────────────────────────────────────────────────────
# TABLE 1: tblGRN  →  Main GRN Header
# ─────────────────────────────────────────────────────────────
class GRN(models.Model):
    """
    Main GRN header table.
    Reads from tblGRN in SQL Server.
    All writes go through stored procedures in api_views.py
    """

    GrnNo = models.CharField(
        max_length=50,
        primary_key=True,
        db_column='GrnNo',
        verbose_name=_("GRN No")
    )
    GrnDate = models.DateTimeField(
        null=True, blank=True,
        db_column='GrnDate',
        verbose_name=_("GRN Date")
    )
    GatepassNo = models.IntegerField(
        null=True, blank=True,
        db_column='GatepassNo',
        verbose_name=_("Gate Pass No")
    )
    Netweight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='Netweight',
        verbose_name=_("Net Weight")
    )
    DeductedWeight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='DeductedWeight',
        verbose_name=_("Deducted Weight")
    )
    Approvedweight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='Approvedweight',
        verbose_name=_("Approved Weight")
    )
    status = models.IntegerField(
        null=True, blank=True,
        db_column='status',
        verbose_name=_("Status")
    )
    internalnotes = models.CharField(
        max_length=500,
        null=True, blank=True,
        db_column='internalnotes',
        verbose_name=_("Internal Notes")
    )

    # Approval workflow audit fields
    draftedby = models.CharField(
        max_length=100, null=True, blank=True, db_column='draftedby'
    )
    DraftedDate = models.DateTimeField(
        null=True, blank=True, db_column='DraftedDate'
    )
    submittedby = models.CharField(
        max_length=100, null=True, blank=True, db_column='submittedby'
    )
    SubmissionDate = models.DateTimeField(
        null=True, blank=True, db_column='SubmissionDate'
    )
    referedbackby = models.CharField(
        max_length=100, null=True, blank=True, db_column='referedbackby'
    )
    Referredbackdate = models.DateTimeField(
        null=True, blank=True, db_column='Referredbackdate'
    )
    approvedby = models.CharField(
        max_length=100, null=True, blank=True, db_column='approvedby'
    )
    ApprovalDate = models.DateTimeField(
        null=True, blank=True, db_column='ApprovalDate'
    )

    class Meta:
        db_table = 'tblGRN'     # ← exact table name from your Excel
        managed = False          # ← Django will NOT create/delete this table
        verbose_name = _('GRN')
        verbose_name_plural = _('GRNs')

    def __str__(self):
        return str(self.GrnNo)


# ─────────────────────────────────────────────────────────────
# TABLE 2: tblGRN_TRAN_MAT  →  Material Detail Rows
# ─────────────────────────────────────────────────────────────
class GRNTranMat(models.Model):
    """
    GRN Material transaction detail rows.
    One GRN can have many material rows.
    """

    ID = models.AutoField(
        primary_key=True,
        db_column='ID'
    )
    GrnNo = models.ForeignKey(
        GRN,
        on_delete=models.CASCADE,
        null=True, blank=True,
        db_column='GrnNo',
        related_name='materials',
        verbose_name=_("GRN No")
    )
    GrnDate = models.DateTimeField(
        null=True, blank=True,
        db_column='GrnDate',
        verbose_name=_("GRN Date")
    )
    MaterialID = models.IntegerField(
        null=True, blank=True,
        db_column='MaterialID',
        verbose_name=_("Material")
    )
    Bags = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='Bags',
        verbose_name=_("Bags")
    )
    Grossweight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='Grossweight',
        verbose_name=_("Gross Weight")
    )
    Netweight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='Netweight',
        verbose_name=_("Net Weight")
    )
    Remarks = models.CharField(
        max_length=500,
        null=True, blank=True,
        db_column='Remarks',
        verbose_name=_("Remarks")
    )
    usercreated = models.CharField(
        max_length=100, null=True, blank=True, db_column='usercreated'
    )
    usermodified = models.CharField(
        max_length=100, null=True, blank=True, db_column='usermodified'
    )
    datecreated = models.DateTimeField(
        auto_now_add=True, null=True, blank=True, db_column='datecreated'
    )
    datemodified = models.DateTimeField(
        auto_now=True, null=True, blank=True, db_column='datemodified'
    )

    class Meta:
        db_table = 'tblGRN_TRAN_MAT'
        managed = False
        verbose_name = _('GRN Material Detail')
        verbose_name_plural = _('GRN Material Details')

    def __str__(self):
        return f"{self.GrnNo_id} - Material {self.MaterialID}"


# ─────────────────────────────────────────────────────────────
# TABLE 3: tblGRN_TRAN_TEST  →  Test Result Detail Rows
# ─────────────────────────────────────────────────────────────
class GRNTranTest(models.Model):
    """
    GRN Test result detail rows.
    One GRN can have many test rows.
    """

    ID = models.AutoField(
        primary_key=True,
        db_column='ID'
    )
    GrnNo = models.ForeignKey(
        GRN,
        on_delete=models.CASCADE,
        null=True, blank=True,
        db_column='GrnNo',
        related_name='tests',
        verbose_name=_("GRN No")
    )
    GrnDate = models.DateTimeField(
        null=True, blank=True,
        db_column='GrnDate',
        verbose_name=_("GRN Date")
    )
    TestID = models.IntegerField(
        null=True, blank=True,
        db_column='TestID',
        verbose_name=_("Test")
    )
    Testmethodid = models.IntegerField(
        null=True, blank=True,
        db_column='Testmethodid',
        verbose_name=_("Test Method")
    )
    Testresult = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='Testresult',
        verbose_name=_("Test Result")
    )
    deductedweight = models.DecimalField(
        max_digits=18, decimal_places=2,
        null=True, blank=True,
        db_column='deductedweight',
        verbose_name=_("Deducted Weight")
    )
    Remarks = models.CharField(
        max_length=500,
        null=True, blank=True,
        db_column='Remarks',
        verbose_name=_("Remarks")
    )

    class Meta:
        db_table = 'tblGRN_TRAN_TEST'
        managed = False
        verbose_name = _('GRN Test Detail')
        verbose_name_plural = _('GRN Test Details')

    def __str__(self):
        return f"{self.GrnNo_id} - Test {self.TestID}"


# ─────────────────────────────────────────────────────────────
# TABLE 4: tblApprovalStages  →  Workflow stage master lookup
# ─────────────────────────────────────────────────────────────
class ApprovalStages(models.Model):
    """
    Master lookup table for GRN approval workflow stages.
    Rows: 1=Draft, 2=Submitted for approval, 3=Referred Back, 4=Approved, 5=Released.
    Managed externally — Django does not create or drop this table.
    """

    ID = models.DecimalField(
        max_digits=10, decimal_places=0,
        primary_key=True,
        db_column='ID',
        verbose_name=_("Stage ID")
    )
    Status = models.CharField(
        max_length=100,
        db_column='Status',
        verbose_name=_("Status Label")
    )

    class Meta:
        db_table = 'tblApprovalStages'
        managed = False
        verbose_name = _('Approval Stage')
        verbose_name_plural = _('Approval Stages')

    def __str__(self):
        return f"{self.ID} - {self.Status}"


# ─────────────────────────────────────────────────────────────
# TABLE 5: tblGRN_User  →  Workflow action audit trail
# ─────────────────────────────────────────────────────────────
class GRNUser(models.Model):
    """
    Audit trail table recording which user performed each workflow action
    (Draft / Submit / Refer Back / Approve / Release) on a GRN record.
    Each row = one status transition by one user on one GRN.
    Managed externally — Django does not create or drop this table.
    """

    ID = models.AutoField(
        primary_key=True,
        db_column='ID'
    )
    GrnNo = models.CharField(
        max_length=50,
        db_column='GrnNo',
        verbose_name=_("GRN No")
    )
    GrnDate = models.DateField(
        null=True, blank=True,
        db_column='GrnDate',
        verbose_name=_("GRN Date")
    )
    User = models.CharField(
        max_length=100,
        null=True, blank=True,
        db_column='User',
        verbose_name=_("User")
    )
    actiondate = models.DateField(
        null=True, blank=True,
        db_column='actiondate',
        verbose_name=_("Action Date")
    )
    actionid = models.DecimalField(
        max_digits=10, decimal_places=0,
        null=True, blank=True,
        db_column='actionid',
        verbose_name=_("Action (FK → tblApprovalStages)")
    )

    class Meta:
        db_table = 'tblGRN_User'
        managed = False
        verbose_name = _('GRN User Audit')
        verbose_name_plural = _('GRN User Audits')

    def __str__(self):
        return f"{self.GrnNo} - Action {self.actionid} by {self.User}"
