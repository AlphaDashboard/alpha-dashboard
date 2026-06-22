from django.utils.translation import gettext_lazy as _

class B2TransactionType:
    CASH = 'CASH'
    BANK = 'BANK'
    CHOICES = [
        (CASH, _('CASH')),
        (BANK, _('BANK')),
    ]

class B2RPIDState:
    RECEIPT = 'R'
    PAYMENT = 'P'
    ISSUE = 'I'
    DEPOSIT = 'D'
    CHOICES = [
        (RECEIPT, _('Receipt')),
        (PAYMENT, _('Payment')),
        (ISSUE, _('Issue')),
        (DEPOSIT, _('Deposit')),
    ]

class B2PostingStatus:
    DRAFT = 'DRAFT'
    PENDING = 'PENDING'
    POSTED = 'POSTED'
    CHOICES = [
        (DRAFT, _('DRAFT')),
        (PENDING, _('PENDING')),
        (POSTED, _('POSTED')),
    ]

class DBVendor:
    POSTGRESQL = 'postgresql'
    SQLITE = 'sqlite'
    SQLSERVER = 'microsoft'
