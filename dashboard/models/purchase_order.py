from django.db import models
from django.utils.translation import gettext_lazy as _
from .account_master import AccountMaster
from .gate_entry import Material
from .broker_supplier import Broker, VendorSupplier

class PurchaseOrder(models.Model):
    """
    tblPurchaseOrder - Master transaction header for Purchase Orders
    """
    po_no = models.CharField(
        max_length=50,
        primary_key=True,
        verbose_name=_("PO No")
    )
    po_date = models.DateTimeField(
        verbose_name=_("PO Date")
    )
    expected_delivery_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Expected Delivery Date")
    )
    po_status = models.CharField(
        max_length=20,
        choices=[
            ('Draft',     'Draft'),
            ('Submitted', 'Submitted for Approval'),
            ('RefBack',   'Ref. Back by Approver'),
            ('Approved',  'Approved'),
        ],
        default='Draft',
        verbose_name=_("PO Status")
    )
    # Supplier Details
    sal_pur_group = models.ForeignKey(
        'SalPurGroup',
        on_delete=models.PROTECT,
        db_constraint=False,
        null=True,
        blank=True,
        db_column='SalPurGroupID',
        related_name='purchase_orders',
        verbose_name=_("Sales/Purchase Group")
    )
    broker = models.ForeignKey(
        Broker,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_constraint=False,
        related_name='broker_pos',
        verbose_name=_("Broker Name")
    )
    zone_name = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name=_("Zone Name")
    )
    supplier = models.ForeignKey(
        VendorSupplier,
        on_delete=models.PROTECT,
        db_constraint=False,
        related_name='supplier_pos',
        verbose_name=_("Supplier Name")
    )
    supplier_contact = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Supplier Contact")
    )
    supplier_address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Supplier Address")
    )
    gst_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("GST Number")
    )
    
    # Delivery & Payment Terms
    delivery_location = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name=_("Delivery Location")
    )
    delivery_terms = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name=_("Delivery Terms/Incoterms")
    )
    payment_terms = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name=_("Payment Terms")
    )
    freight_terms = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name=_("Freight Terms")
    )
    currency = models.CharField(
        max_length=10,
        default='INR',
        verbose_name=_("Currency")
    )
    
    # Additional ERP Fields
    purchaser_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("Purchaser Name")
    )
    department = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Department")
    )
    cost_center = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Cost Center")
    )
    special_instructions = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Special Instructions")
    )
    internal_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Internal Notes")
    )
    
    # Summary Calculations
    total_basic_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Total Basic Amount")
    )
    taxes = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Taxes")
    )
    grand_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Grand Total")
    )
    
    # Status (for soft delete)
    status = models.BooleanField(
        default=True,
        verbose_name=_("Status")
    )
    
    # Audit info
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
        db_table = 'tblPurchaseOrder'
        verbose_name = _('Purchase Order')
        verbose_name_plural = _('Purchase Orders')
        ordering = ['-po_date', '-date_created']

    def save(self, *args, **kwargs):
        if not self.po_no or self.po_no == "Auto Generated":
            from django.utils import timezone
            now = timezone.now()
            prefix = f"PO-{now.strftime('%Y%m')}-"
            # Get last PO for the same month/year
            last_po = PurchaseOrder.objects.filter(po_no__startswith=prefix).order_by('po_no').last()
            if last_po:
                try:
                    last_num = int(last_po.po_no.replace(prefix, ''))
                    self.po_no = f"{prefix}{last_num + 1:04d}"
                except ValueError:
                    self.po_no = f"{prefix}0001"
            else:
                self.po_no = f"{prefix}0001"
        super().save(*args, **kwargs)

    def __str__(self):
        try:
            return f"{self.po_no} - {self.supplier}"
        except Exception:
            return f"{self.po_no} - Unknown Supplier (ID: {self.supplier_id})"


class PurchaseOrderItem(models.Model):
    """
    tblPurchaseOrder_TRAN - Detail lines for Purchase Orders
    """
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items',
        db_column='PONo',
        verbose_name=_("PONo")
    )
    item = models.ForeignKey(
        Material,
        on_delete=models.PROTECT,
        verbose_name=_("Item Code & Name")
    )
    order_qty = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name=_("Order Qty")
    )
    uom = models.CharField(
        max_length=10,
        verbose_name=_("UOM")
    )
    unit_rate = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name=_("Unit Rate")
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
        db_table = 'tblPurchaseOrder_TRAN'
        verbose_name = _('Purchase Order Detail')
        verbose_name_plural = _('Purchase Order Details')

    def __str__(self):
        return f"{self.purchase_order.po_no} - {self.item} - {self.amount}"
