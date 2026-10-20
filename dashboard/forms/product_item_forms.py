from django import forms
from dashboard.models import Material, ItemGroup


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
    # Backward compatibility aliases for item_name and item_code
    item_name = forms.CharField(required=False, widget=forms.HiddenInput())
    item_code = forms.CharField(required=False, widget=forms.HiddenInput())

    class Meta:
        model = Material
        fields = [
            'material_name', 'material_code',
            # Top Zone
            'status', 'product_type', 'hide',
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
            'material_name': forms.TextInput(attrs={'class': 'form-control form-control-sm fw-bold', 'placeholder': 'e.g. DEXORANGE', 'required': 'required'}),
            'material_code': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'placeholder': 'F4-Item Code'}),
            'status': forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'product_type': forms.TextInput(attrs={'class': 'form-control form-control-sm'}),
            'hide': forms.Select(attrs={'class': 'form-select form-select-sm'}),
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

    def __init__(self, *args, **kwargs):
        if 'data' in kwargs and kwargs['data']:
            data = kwargs['data'].copy()
            if 'item_name' in data and not data.get('material_name'):
                data['material_name'] = data['item_name']
            if 'item_code' in data and not data.get('material_code'):
                data['material_code'] = data['item_code']
            kwargs['data'] = data
        elif len(args) > 0 and args[0]:
            data = args[0].copy()
            if 'item_name' in data and not data.get('material_name'):
                data['material_name'] = data['item_name']
            if 'item_code' in data and not data.get('material_code'):
                data['material_code'] = data['item_code']
            args = (data,) + args[1:]
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name not in ['material_name', 'item_name']:
                field.required = False
        if self.instance and self.instance.pk:
            self.initial['item_name'] = self.instance.material_name
            self.initial['item_code'] = self.instance.material_code

    def clean(self):
        cleaned_data = super().clean()
        name = cleaned_data.get('material_name') or cleaned_data.get('item_name')
        if name:
            cleaned_data['material_name'] = name
            cleaned_data['item_name'] = name
        else:
            self.add_error('material_name', 'Item Name is required.')

        code = cleaned_data.get('material_code') or cleaned_data.get('item_code')
        if code:
            cleaned_data['material_code'] = code
            cleaned_data['item_code'] = code
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        name = self.cleaned_data.get('material_name') or self.cleaned_data.get('item_name')
        if name:
            instance.material_name = name
        code = self.cleaned_data.get('material_code') or self.cleaned_data.get('item_code')
        if code:
            instance.material_code = code
        elif not instance.material_code:
            count = Material.objects.count() + 1
            code_candidate = f"ITM-{count:04d}"
            while Material.objects.filter(material_code=code_candidate).exists():
                count += 1
                code_candidate = f"ITM-{count:04d}"
            instance.material_code = code_candidate
        if commit:
            instance.save()
        return instance
