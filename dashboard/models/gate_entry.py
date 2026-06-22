from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from .account_master import AccountMaster

User = get_user_model()

class Material(models.Model):
    """
    Model representing Material Master list (tblMaterial).
    """
    material_code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name=_("Material Code")
    )
    material_name = models.CharField(
        max_length=50,
        verbose_name=_("Material Name")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active")
    )
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

    class Meta:
        db_table = 'tblMaterial'
        verbose_name = _('Material')
        verbose_name_plural = _('Materials')
        ordering = ['material_name']

    def __str__(self):
        return f"{self.material_name} ({self.material_code})"


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
