# Migration 0045 — Create tblTransactionType table and add TransactionTypeID FK
# to tblSalPurGroup via raw SQL (since tblSalPurGroup is managed=False).
# Seeds 4 default transaction type rows.

from django.db import migrations, models
import django.db.models.deletion


def seed_transaction_types(apps, schema_editor):
    """Seed the 4 default transaction types shown in the dropdown."""
    TransactionType = apps.get_model('dashboard', 'TransactionType')
    defaults = [
        ('Purchase',                 'PUR'),
        ('Sales',                    'SAL'),
        ('Store material Purchase',  'SPUR'),
        ('Store material Sales',     'SSAL'),
    ]
    for name, code in defaults:
        TransactionType.objects.get_or_create(
            TransactionType=code,
            defaults={'TransactionTypeName': name}
        )


def add_column_to_salpurgroup(apps, schema_editor):
    """Add nullable TransactionTypeID FK column to tblSalPurGroup (unmanaged table)."""
    db_vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cursor:
        if db_vendor == 'postgresql':
            cursor.execute("""
                ALTER TABLE "tblSalPurGroup"
                ADD COLUMN IF NOT EXISTS "TransactionTypeID" BIGINT NULL
                REFERENCES "tblTransactionType"("TransactionTypeID")
                ON DELETE SET NULL;
            """)
        elif db_vendor == 'sqlite':
            # SQLite does not support IF NOT EXISTS for ALTER TABLE ADD COLUMN
            # Check first before adding
            cursor.execute("PRAGMA table_info(tblSalPurGroup);")
            cols = [row[1] for row in cursor.fetchall()]
            if 'TransactionTypeID' not in cols:
                cursor.execute("""
                    ALTER TABLE "tblSalPurGroup"
                    ADD COLUMN "TransactionTypeID" INTEGER NULL
                    REFERENCES "tblTransactionType"("TransactionTypeID");
                """)


def remove_column_from_salpurgroup(apps, schema_editor):
    """Reverse operation: drop the TransactionTypeID column from tblSalPurGroup."""
    db_vendor = schema_editor.connection.vendor
    if db_vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                ALTER TABLE "tblSalPurGroup"
                DROP COLUMN IF EXISTS "TransactionTypeID";
            """)
    # SQLite does not support DROP COLUMN in older versions — skip for SQLite reverse


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0044_usermaster_alter_pursales_options_and_more'),
    ]

    operations = [
        # 1. Create the tblTransactionType table (managed=True model)
        migrations.CreateModel(
            name='TransactionType',
            fields=[
                ('TransactionTypeID', models.BigAutoField(
                    db_column='TransactionTypeID', primary_key=True, serialize=False
                )),
                ('TransactionTypeName', models.CharField(
                    db_column='TransactionTypeName', max_length=255,
                    verbose_name='Transaction Type Name'
                )),
                ('TransactionType', models.CharField(
                    db_column='TransactionType', max_length=4,
                    verbose_name='Transaction Type Code (4 char)'
                )),
                ('UserCreated', models.CharField(
                    blank=True, db_column='UserCreated', max_length=100, null=True
                )),
                ('DateCreated', models.DateTimeField(
                    auto_now_add=True, db_column='DateCreated', null=True
                )),
                ('UserModified', models.CharField(
                    blank=True, db_column='UserModified', max_length=100, null=True
                )),
                ('DateModified', models.DateTimeField(
                    auto_now=True, db_column='DateModified', null=True
                )),
            ],
            options={
                'verbose_name': 'Transaction Type',
                'verbose_name_plural': 'Transaction Types',
                'db_table': 'tblTransactionType',
                'ordering': ['TransactionTypeName'],
                'managed': True,
            },
        ),

        # 2. Seed the 4 default transaction types
        migrations.RunPython(seed_transaction_types, migrations.RunPython.noop),

        # 3. Add TransactionTypeID FK column to tblSalPurGroup via raw SQL
        migrations.RunPython(add_column_to_salpurgroup, remove_column_from_salpurgroup),
    ]
