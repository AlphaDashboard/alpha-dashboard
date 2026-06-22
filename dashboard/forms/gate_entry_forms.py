from django import forms
from django.utils.translation import gettext_lazy as _
from dashboard.models import GateEntry, Material, AccountMaster

class GateEntryForm(forms.ModelForm):
    """
    ModelForm for GateEntry.
    """
    class Meta:
        model = GateEntry
        fields = ['entry_datetime', 'supplier', 'vehicle_number', 'material_type', 'driver_name', 'photo']
        widgets = {
            'entry_datetime': forms.TextInput(attrs={
                'class': 'form-control erp-input',
                'placeholder': ' ',
                'id': 'id_entry_datetime'
            }),
            'supplier': forms.Select(attrs={
                'class': 'form-select erp-input',
                'id': 'id_supplier'
            }),
            'vehicle_number': forms.TextInput(attrs={
                'class': 'form-control erp-input',
                'placeholder': ' ',
                'id': 'id_vehicle_number'
            }),
            'material_type': forms.Select(attrs={
                'class': 'form-select erp-input',
                'id': 'id_material_type'
            }),
            'driver_name': forms.TextInput(attrs={
                'class': 'form-control erp-input',
                'placeholder': ' ',
                'id': 'id_driver_name'
            }),
            'photo': forms.HiddenInput(attrs={
                'id': 'id_photo'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Limit supplier to active AccountMaster groups only
        self.fields['supplier'].queryset = AccountMaster.active_objects.all().order_by('Account_Name')
        self.fields['supplier'].empty_label = ""
        
        # Limit material type to active Materials only
        self.fields['material_type'].queryset = Material.objects.filter(is_active=True).order_by('material_name')
        self.fields['material_type'].empty_label = ""


class MaterialForm(forms.ModelForm):
    """
    ModelForm for Material Master.
    """
    class Meta:
        model = Material
        fields = ['material_code', 'material_name', 'is_active']
        widgets = {
            'material_code': forms.TextInput(attrs={
                'class': 'form-control erp-input',
                'placeholder': 'Enter Material Code'
            }),
            'material_name': forms.TextInput(attrs={
                'class': 'form-control erp-input',
                'placeholder': 'Enter Material Name'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
