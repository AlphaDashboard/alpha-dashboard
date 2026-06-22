from django import forms
from dashboard.models import AccountMaster

class AccountMasterForm(forms.ModelForm):
    """
    ModelForm for AccountMaster records.
    Provides Bootstrap styled widgets.
    """
    class Meta:
        model = AccountMaster
        fields = ['groupID', 'category', 'Account_Name', 'display_name', 'cl_bal']
        widgets = {
            'groupID': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Enter Group ID'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'Account_Name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter Account Name'}),
            'display_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter Display Name'}),
            'cl_bal': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Enter Opening Balance', 'step': '0.01'}),
        }
