"""
Migration 0043 — Allow blank values for delivery/payment term fields and zone_name.

These fields have dropdowns on the form but are in Tab 2 which users may not
visit before saving, causing "This field may not be blank" errors.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0042_update_po_status_choices'),
    ]

    operations = [
        migrations.AlterField(
            model_name='purchaseorder',
            name='zone_name',
            field=models.CharField(
                max_length=50,
                blank=True,
                default='',
                verbose_name='Zone Name',
            ),
        ),
        migrations.AlterField(
            model_name='purchaseorder',
            name='delivery_location',
            field=models.CharField(
                max_length=100,
                blank=True,
                default='',
                verbose_name='Delivery Location',
            ),
        ),
        migrations.AlterField(
            model_name='purchaseorder',
            name='delivery_terms',
            field=models.CharField(
                max_length=100,
                blank=True,
                default='',
                verbose_name='Delivery Terms/Incoterms',
            ),
        ),
        migrations.AlterField(
            model_name='purchaseorder',
            name='payment_terms',
            field=models.CharField(
                max_length=100,
                blank=True,
                default='',
                verbose_name='Payment Terms',
            ),
        ),
        migrations.AlterField(
            model_name='purchaseorder',
            name='freight_terms',
            field=models.CharField(
                max_length=100,
                blank=True,
                default='',
                verbose_name='Freight Terms',
            ),
        ),
    ]
