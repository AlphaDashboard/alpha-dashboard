from django.db import migrations
from django.utils import timezone


def seed_group_charges(apps, schema_editor):
    SalPurGroup = apps.get_model('dashboard', 'SalPurGroup')
    SalPurGroupTran = apps.get_model('dashboard', 'SalPurGroupTran')
    AccountMaster = apps.get_model('dashboard', 'AccountMaster')

    now_dt = timezone.now()

    # 1. Raw Material Purchase Group
    rm_groups = SalPurGroup.objects.filter(SalPurGroupName__icontains='Raw Material Purchase Group')
    rm_acc = AccountMaster.objects.filter(Account_Name__icontains='Raw Material Purchase').first()
    if not rm_acc:
        rm_acc = AccountMaster.objects.first()

    for g in rm_groups:
        if not SalPurGroupTran.objects.filter(SalPurGroupID=g).exists():
            SalPurGroupTran.objects.create(
                ChargesName='Input CGST 9%',
                SalPurGroupID=g,
                ChargeAccountID=rm_acc,
                Auto_Y_Manual_N=True,
                Rate=9.00,
                Debit_D_Credit_C='D',
                UserCreated='system',
                DateCreated=now_dt,
                UserModified='system',
                DateModified=now_dt
            )
            SalPurGroupTran.objects.create(
                ChargesName='Input SGST 9%',
                SalPurGroupID=g,
                ChargeAccountID=rm_acc,
                Auto_Y_Manual_N=True,
                Rate=9.00,
                Debit_D_Credit_C='D',
                UserCreated='system',
                DateCreated=now_dt,
                UserModified='system',
                DateModified=now_dt
            )
            SalPurGroupTran.objects.create(
                ChargesName='Freight & Inward Charges',
                SalPurGroupID=g,
                ChargeAccountID=rm_acc,
                Auto_Y_Manual_N=False,
                Rate=0.00,
                Debit_D_Credit_C='D',
                UserCreated='system',
                DateCreated=now_dt,
                UserModified='system',
                DateModified=now_dt
            )

    # 2. Finished Goods Sales Group
    fg_groups = SalPurGroup.objects.filter(SalPurGroupName__icontains='Finished Goods Sales Group')
    fg_acc = AccountMaster.objects.filter(Account_Name__icontains='Finished Goods Sales').first()
    if not fg_acc:
        fg_acc = AccountMaster.objects.first()

    for g in fg_groups:
        if not SalPurGroupTran.objects.filter(SalPurGroupID=g).exists():
            SalPurGroupTran.objects.create(
                ChargesName='Output CGST 9%',
                SalPurGroupID=g,
                ChargeAccountID=fg_acc,
                Auto_Y_Manual_N=True,
                Rate=9.00,
                Debit_D_Credit_C='D',
                UserCreated='system',
                DateCreated=now_dt,
                UserModified='system',
                DateModified=now_dt
            )
            SalPurGroupTran.objects.create(
                ChargesName='Output SGST 9%',
                SalPurGroupID=g,
                ChargeAccountID=fg_acc,
                Auto_Y_Manual_N=True,
                Rate=9.00,
                Debit_D_Credit_C='D',
                UserCreated='system',
                DateCreated=now_dt,
                UserModified='system',
                DateModified=now_dt
            )
            SalPurGroupTran.objects.create(
                ChargesName='Freight & Insurance Outward',
                SalPurGroupID=g,
                ChargeAccountID=fg_acc,
                Auto_Y_Manual_N=False,
                Rate=0.00,
                Debit_D_Credit_C='D',
                UserCreated='system',
                DateCreated=now_dt,
                UserModified='system',
                DateModified=now_dt
            )


def reverse_seed_group_charges(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0047_alter_salpurgroup_table'),
    ]

    operations = [
        migrations.RunPython(seed_group_charges, reverse_seed_group_charges),
    ]
