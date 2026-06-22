from django.db import models
from django.utils.translation import gettext_lazy as _

class UserMaster(models.Model):
    ROLE_CHOICES = (
        ('User', 'User'),
        ('Maker', 'Maker'),
        ('Checker', 'Checker'),
        ('Admin', 'Admin'),
    )

    user_id = models.CharField(max_length=50, primary_key=True, db_column='user_id', verbose_name=_("User ID"))
    user_name = models.CharField(max_length=150, db_column='user_name', verbose_name=_("User Name"))
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='User', db_column='role', verbose_name=_("Role"))
    empid = models.CharField(max_length=50, unique=True, db_column='empid', verbose_name=_("Emp ID"))
    is_active = models.BooleanField(default=True, db_column='is_active', verbose_name=_("Is Active"))

    # audit fields
    user_created = models.CharField(max_length=50, blank=True, null=True, db_column='user_created', verbose_name=_("UserCreated"))
    date_created = models.DateTimeField(auto_now_add=True, db_column='date_created', verbose_name=_("DateCreated"))
    user_modified = models.CharField(max_length=50, blank=True, null=True, db_column='user_modified', verbose_name=_("UserModified"))
    date_modified = models.DateTimeField(auto_now=True, db_column='date_modified', verbose_name=_("DateModified"))

    class Meta:
        db_table = 'tblUserMaster'
        verbose_name = _('User Master')
        verbose_name_plural = _('User Masters')
        ordering = ['user_id']

    def __str__(self):
        return f"{self.user_name} ({self.user_id})"
