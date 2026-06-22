from django import forms
from django.forms.models import BaseInlineFormSet
from django.core.exceptions import ValidationError
from dashboard.models import Voucher, VoucherFact
from dashboard.constants import RowType

class VoucherForm(forms.ModelForm):
    """
    ModelForm for Voucher (Dimension).
    """
    class Meta:
        model = Voucher
        fields = ['voucher_number', 'voucher_date', 'remarks', 'is_active']
        widgets = {
            'voucher_number': forms.TextInput(attrs={'class': 'form-control erp-input erp-floating-input', 'placeholder': ' ', 'maxlength': '15'}),
            'voucher_date': forms.TextInput(attrs={'class': 'form-control flatpickr-date erp-input erp-floating-input', 'placeholder': ' '}),
            'remarks': forms.TextInput(attrs={'class': 'form-control erp-input erp-floating-input', 'placeholder': ' '}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input mt-0'}),
        }

    def clean_voucher_number(self):
        number = self.cleaned_data.get('voucher_number')
        if number and len(number) > 15:
            raise ValidationError("Voucher Number cannot exceed 15 characters.")
        if number:
            is_create = not self.instance or not self.instance.pk
            is_rename = self.instance and self.instance.pk and self.instance.pk != number
            if is_create or is_rename:
                from dashboard.models.cashbank import CashBank
                if CashBank.objects.filter(voucher_no=number).exists():
                    raise ValidationError(f"Voucher number '{number}' already exists. Please choose a unique voucher number.")
        return number


class VoucherFactForm(forms.ModelForm):
    """
    ModelForm for a single VoucherFact row.
    """
    class Meta:
        model = VoucherFact
        fields = ['row_type', 'account_master', 'amount']
        widgets = {
            'row_type': forms.Select(attrs={'class': 'form-select row-type-select erp-table-control'}),
            'account_master': forms.Select(attrs={'class': 'form-select account_master-select erp-table-control'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control amount-input erp-table-control', 'step': '0.01'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['account_master'].label_from_instance = lambda obj: f"{obj.Account_Name} [Bal: {obj.cl_bal}]"

class BaseVoucherFactFormSet(BaseInlineFormSet):
    """
    Formset logic separated cleanly here to run business validation dynamically.
    """
    def add_fields(self, form, index):
        super().add_fields(form, index)
        if 'id' in form.fields:
            form.fields['id'] = forms.IntegerField(required=False, widget=forms.HiddenInput())

    def clean(self):
        super().clean()
        if any(self.errors):
            return
            
        total_a = 0
        total_b = 0
        a_count = 0
        b_count = 0
        selected_account_masters = []
        
        for form in self.forms:
            if self.can_delete and self._should_delete_form(form):
                continue
                
            account_master = form.cleaned_data.get('account_master')
            row_type = form.cleaned_data.get('row_type')
            amount = form.cleaned_data.get('amount')
            
            # Skip empty forms
            if not account_master or not row_type or amount is None:
                continue
                
            if account_master in selected_account_masters:
                raise ValidationError(f"Duplicate AccountMaster Group selected: {account_master.Account_Name}. Each group can only be used once per voucher.")
            selected_account_masters.append(account_master)

            if row_type == RowType.A:
                total_a += amount
                a_count += 1
            elif row_type == RowType.B:
                total_b += amount
                b_count += 1
                
        if a_count == 0 or b_count == 0:
            raise ValidationError("A voucher must contain at least one Type A and one Type B transaction.")
            
        # Using a small epsilon to check float match or check exact since it's decimal
        if total_a != total_b:
            raise ValidationError(f"Totals are not balanced! Total A ({total_a}) must equal Total B ({total_b}).")

# Inline formset for Voucher Facts to allow multiple transaction rows per Voucher
VoucherFactFormSet = forms.inlineformset_factory(
    Voucher,
    VoucherFact,
    form=VoucherFactForm,
    formset=BaseVoucherFactFormSet,
    extra=1,
    can_delete=True
)
