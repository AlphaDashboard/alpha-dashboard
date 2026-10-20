from django.db import models
from django.utils.translation import gettext_lazy as _
from .gate_entry import Material


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


# Unified master: ItemProduct is an alias to Material (tblMaterial)
# Single source of truth for all materials, products, and items across Alpha ERP.
ItemProduct = Material
