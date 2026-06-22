from django.contrib import admin
from .models.user_master import UserMaster

@admin.register(UserMaster)
class UserMasterAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'user_name', 'role', 'empid', 'is_active', 'date_created')
    list_filter = ('role', 'is_active')
    search_fields = ('user_id', 'user_name', 'empid')

