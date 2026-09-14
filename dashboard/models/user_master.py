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


class UserFormPermission(models.Model):
    user = models.ForeignKey(
        UserMaster,
        on_delete=models.CASCADE,
        related_name='permissions',
        db_column='user_id',
        verbose_name=_("User")
    )
    form_key = models.CharField(max_length=50, db_column='form_key', verbose_name=_("Form Key"))
    form_name = models.CharField(max_length=100, db_column='form_name', verbose_name=_("Form Name"))
    section = models.CharField(max_length=50, default='General', db_column='section', verbose_name=_("Section"))
    can_read = models.BooleanField(default=False, db_column='can_read', verbose_name=_("Can Read"))
    can_write = models.BooleanField(default=False, db_column='can_write', verbose_name=_("Can Write"))
    can_delete = models.BooleanField(default=False, db_column='can_delete', verbose_name=_("Can Delete"))

    class Meta:
        db_table = 'tblUserFormPermission'
        verbose_name = _('User Form Permission')
        verbose_name_plural = _('User Form Permissions')
        unique_together = ('user', 'form_key')
        ordering = ['id']

    def __str__(self):
        return f"{self.user_id} - {self.form_name} (R:{self.can_read}, W:{self.can_write}, D:{self.can_delete})"
