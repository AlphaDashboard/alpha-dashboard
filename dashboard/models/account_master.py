from django.db import models
from django.utils.translation import gettext_lazy as _
from dashboard.constants import CategoryType

class ActiveAccountMasterManager(models.Manager):
    """Custom manager to return only active Account Master records."""
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class Category(models.Model):
    """
    Model representing tblCategory.
    """
    categoryName = models.CharField(max_length=50, verbose_name=_("Category Name"))
    categoryType = models.CharField(max_length=1, choices=CategoryType.CHOICES, verbose_name=_("Category Type"), default='A')

    class Meta:
        db_table = 'tblCategory'
        verbose_name = _('Category')
        verbose_name_plural = _('Categories')

    def __str__(self):
        return self.categoryName


class AccountMaster(models.Model):
    """
    Model representing an Account Master group (tblAccountmaster).
    Soft-delete is handled via the 'is_active' boolean field.
    """

    groupID = models.BigIntegerField(
        null=True,
        blank=True,
        db_column='groupID',
        verbose_name=_("Group ID")
    )
    Account_Name = models.CharField(
        max_length=50, 
        db_column='Account_Name',
        verbose_name=_("Account Name")
    )
    display_name = models.CharField(
        max_length=100, 
        verbose_name=_("Display Name")
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT,
        db_column='categoryID',
        verbose_name=_("Category")
    )
    cl_bal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        db_column='CL_BAL',
        verbose_name=_("Opening Balance")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
        help_text=_("Designates whether this record should be treated as active.")
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_("Created At")
    )
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name=_("Updated At")
    )

    # Managers
    objects = models.Manager() # Default manager
    active_objects = ActiveAccountMasterManager() # Custom manager

    class Meta:
        db_table = 'tblAccountmaster'
        ordering = ['-created_at']
        verbose_name = _('Account Master Record')
        verbose_name_plural = _('Account Master Records')

    @property
    def account_name(self):
        return self.Account_Name

    @account_name.setter
    def account_name(self, value):
        self.Account_Name = value

    @property
    def code(self):
        return str(self.groupID or '')

    @code.setter
    def code(self, value):
        if value is not None and value != '':
            try:
                self.groupID = int(value)
            except ValueError:
                pass

    def __str__(self):
        return f"{self.Account_Name}"
