from django.db import models
from django.utils.translation import gettext_lazy as _


class ItemGroup(models.Model):
    """
    Model representing Products / Items Group classification.
    """
    group_name = models.CharField(max_length=100, unique=True, verbose_name=_("Group Name"))
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name=_("Description"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_item_group'
        verbose_name = _('Item Group')
        verbose_name_plural = _('Item Groups')
        ordering = ['group_name']

    def __str__(self):
        return self.group_name


class ItemProduct(models.Model):
    """
    Model representing Product / Item Master.
    Matches the enterprise 'MODIFY PRODUCT' layout with full pricing,
    taxation, and inventory controls.
    """
    # ── Top Zone: Identification & Classification ──
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
    item_name = models.CharField(
        max_length=255,
        verbose_name=_("Item Name")
    )
    item_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Item Code (F4)")
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
        ItemGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name=_("Product Group")
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

    # ── Bottom Zone: Column 1 (Taxes, Pricing & Margins) ──
    local_tax = models.CharField(
        max_length=20,
        default='Taxable',
        choices=[('Taxable', 'Taxable'), ('Exempt', 'Exempt'), ('Nil Rated', 'Nil Rated')],
        verbose_name=_("Local Tax")
    )
    central_tax = models.CharField(
        max_length=20,
        default='Taxable',
        choices=[('Taxable', 'Taxable'), ('Exempt', 'Exempt'), ('Nil Rated', 'Nil Rated')],
        verbose_name=_("Central Tax")
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
        verbose_name=_("Minimum Qty")
    )
    max_discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Maximum Discount %")
    )
    min_margin = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        default=0.000,
        verbose_name=_("Minimum Margin %")
    )

    # ── Bottom Zone: Column 2 (GST Breakdown, Purchase Rate & Caps) ──
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
        verbose_name=_("P.RATE (Purchase Rate)")
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
        verbose_name=_("Maximum Qty")
    )
    purc_disc = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name=_("PURC Disc %")
    )
    disc_less = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0.00,
        verbose_name=_("DISC LESS")
    )

    # ── Bottom Zone: Column 3 (CGST, Costing, Tier C & Rules) ──
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

    # ── Operational Flags ──
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_item_product'
        verbose_name = _('Item Product')
        verbose_name_plural = _('Item Products')
        ordering = ['item_name']

    def __str__(self):
        return f"{self.item_name} ({self.unit})"
