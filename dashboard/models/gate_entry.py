import sys
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from .account_master import AccountMaster

TESTING = 'test' in sys.argv
User = get_user_model()

class Material(models.Model):
    """
    Model representing Material Master list (tblMaterial).
    Unified master for all materials, products, and inventory items.
    """
    material_code = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        verbose_name=_("Material Code")
    )
    material_name = models.CharField(
        max_length=255,
        verbose_name=_("Material Name")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active")
    )

    # ── Legacy GST & Calculation Columns ──
    PurchaseGST = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        db_column='PurchaseGST',
        verbose_name=_("Purchase GST")
    )
    SalesGST = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        db_column='SalesGST',
        verbose_name=_("Sales GST")
    )
    unit_weight = models.DecimalField(
        max_digits=18,
        decimal_places=3,
        null=True,
        blank=True,
        db_column='unit_weight',
        verbose_name=_("Unit Weight")
    )
    Auto1_Manual0_calc = models.BooleanField(
        null=True,
        blank=True,
        db_column='Auto1_Manual0_calc',
        verbose_name=_("Auto1 Manual0 Calc")
    )
    IsRateInclGSTY1N0 = models.BooleanField(
        null=True,
        blank=True,
        db_column='IsRateInclGSTY1N0',
        verbose_name=_("Is Rate Incl GST Y1N0")
    )

    # ── Enterprise Product Attributes: Classification & Storage ──
    status = models.CharField(
        max_length=20,
        default='CONTINUE',
        choices=[('CONTINUE', 'CONTINUE'), ('DISCONTINUE', 'DISCONTINUE')],
        verbose_name=_("Status")
    )
    product_type = models.CharField(
        max_length=50,
        default='NORMAL',
        verbose_name=_("Type")
    )
    hide = models.CharField(
        max_length=10,
        default='NO',
        choices=[('NO', 'NO'), ('YES', 'YES')],
        verbose_name=_("Hide")
    )
    rack_no = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        default='a1',
        verbose_name=_("Rack No.")
    )
    unit = models.CharField(
        max_length=20,
        default='PCS',
        verbose_name=_("Unit")
    )
    decimal_allowed = models.CharField(
        max_length=10,
        default='No',
        choices=[('No', 'No'), ('Yes', 'Yes')],
        verbose_name=_("Decimal")
    )
    fast_search = models.CharField(
        max_length=10,
        default='YES',
        choices=[('YES', 'YES'), ('NO', 'NO')],
        verbose_name=_("Fast Search")
    )
    color_type = models.CharField(
        max_length=50,
        default='NORMAL',
        verbose_name=_("Color Type")
    )
    store = models.CharField(
        max_length=50,
        default='Default',
        verbose_name=_("Store")
    )
    store_code = models.IntegerField(
        default=0,
        verbose_name=_("Store Code")
    )
    item_type_code = models.CharField(
        max_length=50,
        default='1 NORMAL',
        verbose_name=_("Item Type")
    )
    group_allowed = models.CharField(
        max_length=10,
        default='Yes',
        choices=[('Yes', 'Yes'), ('No', 'No')],
        verbose_name=_("Group")
    )
    item_group = models.ForeignKey(
        'dashboard.ItemGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='materials',
        verbose_name=_("Item Group")
    )
    group_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        default='General',
        verbose_name=_("Group Name Text")
    )
    hsn_sac_allowed = models.CharField(
        max_length=10,
        default='Yes',
        choices=[('Yes', 'Yes'), ('No', 'No')],
        verbose_name=_("HSN/SAC Allowed")
    )
    hsn_sac_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        default='-BLANK-',
        verbose_name=_("HSN/SAC Code")
    )

    # ── Pricing Matrix: Taxes, Rates & Controls ──
    local_tax = models.CharField(
        max_length=20,
        default='Taxable',
        choices=[('Taxable', 'Taxable'), ('Exempt', 'Exempt'), ('Nil Rated', 'Nil Rated')],
        verbose_name=_("LOCAL Tax")
    )
    central_tax = models.CharField(
        max_length=20,
        default='Taxable',
        choices=[('Taxable', 'Taxable'), ('Exempt', 'Exempt'), ('Nil Rated', 'Nil Rated')],
        verbose_name=_("CENTRAL Tax")
    )
    mrp = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("M.R.P.")
    )
    rate_a = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Rate-A")
    )
    conv_box = models.DecimalField(
        max_digits=18,
        decimal_places=3,
        default=0.000,
        verbose_name=_("CONV.BOX")
    )
    min_qty = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("MINIMUM QTY")
    )
    max_discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("MAXIMUM DISCOUNT %")
    )
    min_margin = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        default=0.000,
        verbose_name=_("MINIMUM MARGIN %")
    )
    sgst_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("SGST %")
    )
    igst_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("IGST %")
    )
    p_rate = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("P.RATE")
    )
    rate_b = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Rate-B")
    )
    conv_case = models.DecimalField(
        max_digits=18,
        decimal_places=3,
        default=0.000,
        verbose_name=_("CONV.CAS")
    )
    max_qty = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("MAXIMUM QTY")
    )
    purc_disc = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("PURC Disc")
    )
    disc_less = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("DISC LESS")
    )
    cgst_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("CGST %")
    )
    cost_per_pcs = models.DecimalField(
        max_digits=18,
        decimal_places=5,
        default=0.00000,
        verbose_name=_("COST/PCS")
    )
    rate_c = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Rate-C")
    )
    negative_billing = models.CharField(
        max_length=10,
        default='No',
        choices=[('No', 'No'), ('Yes', 'Yes')],
        verbose_name=_("NEGATIVE")
    )
    reorder_qty = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Reorder Qty")
    )
    reorder_days = models.IntegerField(
        default=0,
        verbose_name=_("Days")
    )
    rate_mod_allowed = models.CharField(
        max_length=10,
        default='YES',
        choices=[('YES', 'YES'), ('NO', 'NO')],
        verbose_name=_("F6/RATE±")
    )
    manufacturer = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("Mfr (F3)")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'tblMaterial'
        verbose_name = _('Material')
        verbose_name_plural = _('Materials')
        ordering = ['material_name']

    def __str__(self):
        return f"{self.material_name} ({self.material_code})"

    # ── Backward & Form Compatibility Properties ──
    @property
    def item_name(self):
        return self.material_name

    @item_name.setter
    def item_name(self, value):
        self.material_name = value

    @property
    def item_code(self):
        return self.material_code

    @item_code.setter
    def item_code(self, value):
        self.material_code = value


class GateEntry(models.Model):
    """
    Model representing a single Gate Pass Entry (tblGateEntry).
    """
    gate_pass_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        verbose_name=_("Gate Pass ID")
    )
    entry_datetime = models.DateTimeField(
        verbose_name=_("Entry Time")
    )
    supplier = models.ForeignKey(
        AccountMaster,
        on_delete=models.PROTECT,
        related_name='gate_entries',
        verbose_name=_("Supplier")
    )
    vehicle_number = models.CharField(
        max_length=20,
        verbose_name=_("Vehicle Number")
    )
    material_type = models.ForeignKey(
        Material,
        on_delete=models.PROTECT,
        related_name='gate_entries',
        verbose_name=_("Material Type")
    )
    driver_name = models.CharField(
        max_length=50,
        verbose_name=_("Driver Name")
    )
    photo = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Driver Photo (Base64)")
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gate_entries',
        verbose_name=_("Created By")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )

    class Meta:
        db_table = 'tblGateEntry'
        verbose_name = _('Gate Entry')
        verbose_name_plural = _('Gate Entries')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.gate_pass_id:
            # Safely fetch the last record based on primary key ID
            last_entry = GateEntry.objects.all().order_by('id').last()
            if last_entry and last_entry.gate_pass_id:
                try:
                    last_num = int(last_entry.gate_pass_id.replace('GP-', ''))
                    self.gate_pass_id = f"GP-{last_num + 1}"
                except ValueError:
                    # Fallback in case of custom data anomalies
                    self.gate_pass_id = f"GP-{last_entry.id + 10001}"
            else:
                self.gate_pass_id = "GP-10001"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.gate_pass_id} - {self.vehicle_number} ({self.driver_name})"


class GatePass(models.Model):
    """
    Model representing Gate Pass Header (tblGatePass).
    """
    GatePassNo = models.IntegerField(
        primary_key=True,
        db_column='GatePassNo'
    )
    GatePassdate = models.DateField(
        null=True, blank=True,
        db_column='GatePassdate'
    )
    VehicleNo = models.CharField(
        max_length=50, null=True, blank=True,
        db_column='VehicleNo'
    )
    DriverName = models.CharField(
        max_length=100, null=True, blank=True,
        db_column='DriverName'
    )
    WeighmentNo = models.CharField(
        max_length=50, null=True, blank=True,
        db_column='WeighmentNo'
    )
    WeighmentDate = models.DateField(
        null=True, blank=True,
        db_column='WeighmentDate'
    )
    Bags = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='Bags'
    )
    GrossWeight = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='GrossWeight'
    )
    TareWeight = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='TareWeight'
    )
    NetWeight = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='NetWeight'
    )

    class Meta:
        db_table = 'tblGatePass'
        managed = TESTING
        verbose_name = _('Gate Pass')
        verbose_name_plural = _('Gate Passes')

    def __str__(self):
        return f"GP-{self.GatePassNo} - {self.VehicleNo} ({self.DriverName})"


class GatePassTran(models.Model):
    """
    Model representing Gate Pass Transaction lines (tblGatePass_Tran).
    """
    ID = models.AutoField(
        primary_key=True,
        db_column='ID'
    )
    GatePassNo = models.ForeignKey(
        GatePass,
        on_delete=models.CASCADE,
        db_column='GatePassNo',
        related_name='items'
    )
    GatePassDate = models.DateField(
        null=True, blank=True,
        db_column='GatePassDate'
    )
    MaterialID = models.IntegerField(
        null=True, blank=True,
        db_column='MaterialID'
    )
    Bags = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='Bags'
    )
    GrossWeight = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='GrossWeight'
    )
    NetWeight = models.DecimalField(
        max_digits=18, decimal_places=2, null=True, blank=True,
        db_column='NetWeight'
    )

    class Meta:
        db_table = 'tblGatePass_Tran'
        managed = TESTING
        verbose_name = _('Gate Pass Detail')
        verbose_name_plural = _('Gate Pass Details')
