# Generated manually on 2026-05-22

from django.db import migrations, models


def add_constraints(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                -- Master Table Constraints
                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_trantype;
                ALTER TABLE "tblSubsectionB2" ADD CONSTRAINT chk_b2_trantype CHECK (tran_type IN ('CASH', 'BANK'));

                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_rpid;
                ALTER TABLE "tblSubsectionB2" ADD CONSTRAINT chk_b2_rpid CHECK (rpid IN ('R', 'P', 'I', 'D'));

                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_amount_positive;
                ALTER TABLE "tblSubsectionB2" ADD CONSTRAINT chk_b2_amount_positive CHECK (amount >= 0.00);

                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_posting_status;
                ALTER TABLE "tblSubsectionB2" ADD CONSTRAINT chk_b2_posting_status CHECK (posting_status IN ('DRAFT', 'PENDING', 'POSTED'));

                -- Detail Table Constraints
                ALTER TABLE "tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS chk_b2_tran_trantype;
                ALTER TABLE "tblSubsectionB2_TRAN" ADD CONSTRAINT chk_b2_tran_trantype CHECK (tran_type IN ('CASH', 'BANK'));

                ALTER TABLE "tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS chk_b2_tran_rpid;
                ALTER TABLE "tblSubsectionB2_TRAN" ADD CONSTRAINT chk_b2_tran_rpid CHECK (rpid IN ('R', 'P', 'I', 'D'));

                ALTER TABLE "tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS chk_b2_tran_amount;
                ALTER TABLE "tblSubsectionB2_TRAN" ADD CONSTRAINT chk_b2_tran_amount CHECK (amount >= 0.00);
            """)


def remove_constraints(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_posting_status;
                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_amount_positive;
                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_rpid;
                ALTER TABLE "tblSubsectionB2" DROP CONSTRAINT IF EXISTS chk_b2_trantype;

                ALTER TABLE "tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS chk_b2_tran_amount;
                ALTER TABLE "tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS chk_b2_tran_rpid;
                ALTER TABLE "tblSubsectionB2_TRAN" DROP CONSTRAINT IF EXISTS chk_b2_tran_trantype;
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0011_subsectionb2tran_chq_date_subsectionb2tran_chq_no_and_more'),
    ]

    operations = [
        # Rename date to transaction_date in SubsectionB2
        migrations.RenameField(
            model_name='subsectionb2',
            old_name='date',
            new_name='transaction_date',
        ),
        # Rename date to transaction_date in SubsectionB2Tran
        migrations.RenameField(
            model_name='subsectionb2tran',
            old_name='date',
            new_name='transaction_date',
        ),
        # Add posting_status column
        migrations.AddField(
            model_name='subsectionb2',
            name='posting_status',
            field=models.CharField(
                choices=[('DRAFT', 'DRAFT'), ('PENDING', 'PENDING'), ('POSTED', 'POSTED')],
                default='DRAFT',
                max_length=20,
                verbose_name='Posting Status',
                help_text='Controls locking workflows: DRAFT, PENDING, or POSTED.'
            ),
        ),
        # Run Python block for DB constraints (only executed on postgresql)
        migrations.RunPython(add_constraints, remove_constraints),
    ]

