# Migration: Add B-2 integration fields to tblCASHBANK and tblCASHBANK_TRAN
# These are purely additive — existing Bank Transaction data is unaffected.
# module_type='' (blank/empty) = existing Bank Transactions.
# module_type='B2'             = Sub Section B-2 transactions.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0017_alter_subsectionb2_options_and_more'),
    ]

    operations = [
        # ── tblCASHBANK: module partitioning column ───────────────────────
        migrations.AddField(
            model_name='cashbank',
            name='module_type',
            field=models.CharField(
                blank=True,
                default='',
                db_index=True,
                max_length=10,
                verbose_name='Module Type',
                help_text="Empty = Bank Transaction; 'B2' = Sub Section B-2"
            ),
        ),
        # ── tblCASHBANK: posting_status (B-2 workflow) ───────────────────
        migrations.AddField(
            model_name='cashbank',
            name='posting_status',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=20,
                verbose_name='Posting Status',
                help_text='B-2 workflow status: DRAFT, PENDING, or POSTED. Null for regular bank transactions.'
            ),
        ),
        # ── tblCASHBANK: ref_voucher_no (B-2 optional reference) ─────────
        migrations.AddField(
            model_name='cashbank',
            name='ref_voucher_no',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=50,
                verbose_name='Ref Voucher No',
                help_text='Optional reference voucher number used by B-2 module.'
            ),
        ),
        # ── tblCASHBANK_TRAN: cost_center (B-2 dashboard aggregation) ────
        migrations.AddField(
            model_name='cashbanktran',
            name='cost_center',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=50,
                verbose_name='Cost Center',
                help_text='Optional cost center code used by B-2 module for dashboard aggregation.'
            ),
        ),
    ]
