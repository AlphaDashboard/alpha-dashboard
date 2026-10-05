from django import forms
from dashboard.models import ItemProduct, ItemGroup


class ItemGroupForm(forms.ModelForm):
    class Meta:
        model = ItemGroup
        fields = ['group_name', 'description', 'is_active']
        widgets = {
            'group_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter Group Name'}),
            'description': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Optional Description'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class ItemProductForm(forms.ModelForm):
    class Meta:
        model = ItemProduct
        fields = [
            # Top Zone
            'status', 'product_type', 'hide', 'item_name', 'item_code',
            'rack_no', 'unit', 'decimal_allowed', 'fast_search', 'color_type',
            'store', 'store_code', 'item_type_code', 'group_allowed', 'item_group',
            'group_name', 'hsn_sac_allowed', 'hsn_sac_code',
            # Bottom Zone - Column 1
            'local_tax', 'central_tax', 'mrp', 'rate_a', 'conv_box',
            'min_qty', 'max_discount', 'min_margin',
            # Bottom Zone - Column 2
            'sgst_pct', 'igst_pct', 'p_rate', 'rate_b', 'conv_case',
            'max_qty', 'purc_disc', 'disc_less',
            # Bottom Zone - Column 3
            'cgst_pct', 'cost_per_pcs', 'rate_c', 'negative_billing',
            'reorder_qty', 'reorder_days', 'rate_mod_allowed', 'manufacturer',
            'is_active',
        ]
        widgets = {
            # Top Zone
            'status': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'product_type': forms.TextInput(attrs={'class': 'form-control form-control-sm'}),
            'hide': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'item_name': forms.TextInput(attrs={'class': 'form-control form-control-sm fw-bold', 'placeholder': 'e.g. DEXORANGE', 'required': 'required'}),
            'item_code': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'F4-Item Code'}),
            'rack_no': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'e.g. a1'}),
            'unit': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'e.g. PCS'}),
            'decimal_allowed': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'fast_search': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'color_type': forms.TextInput(attrs={'class': 'form-control form-control-sm'}),
            'store': forms.TextInput(attrs={'class': 'form-control form-control-sm'}),
            'store_code': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end'}),
            'item_type_code': forms.TextInput(attrs={'class': 'form-control form-control-sm'}),
            'group_allowed': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'item_group': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'group_name': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'Group Name'}),
            'hsn_sac_allowed': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'hsn_sac_code': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'HSN/SAC'}),

            # Column 1
            'local_tax': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'central_tax': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'mrp': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'rate_a': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'conv_box': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.001'}),
            'min_qty': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'max_discount': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'min_margin': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.001'}),

            # Column 2
            'sgst_pct': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'igst_pct': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'p_rate': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'rate_b': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'conv_case': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.001'}),
            'max_qty': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'purc_disc': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'disc_less': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),

            # Column 3
            'cgst_pct': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'cost_per_pcs': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.00001'}),
            'rate_c': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'negative_billing': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'reorder_qty': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end', 'step': '0.01'}),
            'reorder_days': forms.NumberInput(attrs={'class': 'form-control form-control-sm text-end'}),
            'rate_mod_allowed': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'manufacturer': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'Manufacturer'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
