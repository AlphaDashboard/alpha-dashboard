"""
Migration 0042 — Update po_status choices to the new 4-state approval workflow.

Changes:
  - Migrates old 'Released' status values → 'Approved'
  - Updates Django choice labels for Draft, Submitted, RefBack, Approved
"""

from django.db import migrations, models


def migrate_old_status_values(apps, schema_editor):
    """
    Convert any existing POs with legacy status values to the new 4-state values.
    - 'Released' → 'Approved' (Released was effectively the final approved state)
    """
    PurchaseOrder = apps.get_model('dashboard', 'PurchaseOrder')
    PurchaseOrder.objects.filter(po_status='Released').update(po_status='Approved')


def reverse_migrate_status_values(apps, schema_editor):
    """Reverse: 'Approved' back to 'Released' (best-effort rollback)."""
    PurchaseOrder = apps.get_model('dashboard', 'PurchaseOrder')
    PurchaseOrder.objects.filter(po_status='Approved').update(po_status='Released')


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0041_update_purchase_order_sp'),
    ]

    operations = [
        # Step 1: Run data migration to convert legacy status values
        migrations.RunPython(
            migrate_old_status_values,
            reverse_migrate_status_values,
        ),

        # Step 2: Update the field choices (Django stores as CharField, choices are display-only)
        migrations.AlterField(
            model_name='purchaseorder',
            name='po_status',
            field=models.CharField(
                choices=[
                    ('Draft',     'Draft'),
                    ('Submitted', 'Submitted for Approval'),
                    ('RefBack',   'Ref. Back by Approver'),
                    ('Approved',  'Approved'),
                ],
                default='Draft',
                max_length=20,
                verbose_name='PO Status',
            ),
        ),
    ]
