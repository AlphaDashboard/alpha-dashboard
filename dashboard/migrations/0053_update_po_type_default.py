from django.db import migrations

def set_po_type_db_default(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute('ALTER TABLE "tblPurchaseOrder" ALTER COLUMN "po_type" SET DEFAULT \'RMPO\';')

def rollback_po_type_db_default(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute('ALTER TABLE "tblPurchaseOrder" ALTER COLUMN "po_type" DROP DEFAULT;')

class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0052_purchaseorder_po_type_alter_material_hsn_sac_code_and_more'),
    ]

    operations = [
        migrations.RunPython(set_po_type_db_default, rollback_po_type_db_default),
    ]
