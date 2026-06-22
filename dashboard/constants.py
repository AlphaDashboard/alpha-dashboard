from django.utils.translation import gettext_lazy as _

class RowType:
    A = 'A'
    B = 'B'
    CHOICES = [
        (A, _('A')),
        (B, _('B')),
    ]

class CategoryType:
    CHOICES = [
        ('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')
    ]
