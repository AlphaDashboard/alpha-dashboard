from django.db import migrations, models
import django.db.models.deletion


def copy_products_to_materials(apps, schema_editor):
    try:
        from django.db import connection
        tables = connection.introspection.table_names()
        if 'tbl_item_product' in tables:
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO "tblMaterial" (
                        material_name, material_code, is_active, status, product_type, hide,
                        rack_no, unit, decimal_allowed, fast_search, color_type, store,
                        store_code, item_type_code, group_allowed, group_name, hsn_sac_allowed,
                        hsn_sac_code, local_tax, central_tax, mrp, rate_a, conv_box, min_qty,
                        max_discount, min_margin, sgst_pct, igst_pct, p_rate, rate_b, conv_case,
                        max_qty, purc_disc, disc_less, cgst_pct, cost_per_pcs, rate_c,
                        negative_billing, reorder_qty, reorder_days, rate_mod_allowed,
                        manufacturer, item_group_id, created_at, updated_at
                    )
                    SELECT 
                        item_name, 
                        COALESCE(NULLIF(item_code, ''), CONCAT('ITM-', id)),
                        is_active, status, product_type, hide,
                        rack_no, unit, decimal_allowed, fast_search, color_type, store,
                        store_code, item_type_code, group_allowed, group_name, hsn_sac_allowed,
                        hsn_sac_code, local_tax, central_tax, mrp, rate_a, conv_box, min_qty,
                        max_discount, min_margin, sgst_pct, igst_pct, p_rate, rate_b, conv_case,
                        max_qty, purc_disc, disc_less, cgst_pct, cost_per_pcs, rate_c,
                        negative_billing, reorder_qty, reorder_days, rate_mod_allowed,
                        manufacturer, item_group_id, created_at, updated_at
                    FROM tbl_item_product
                    WHERE NOT EXISTS (
                        SELECT 1 FROM "tblMaterial" m WHERE m.material_name = tbl_item_product.item_name
                    );
                """)
    except Exception:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0050_itemgroup_itemproduct'),
    ]

    operations = [
        migrations.AlterField(
            model_name='material',
            name='material_code',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True, verbose_name='Material Code'),
        ),
        migrations.AlterField(
            model_name='material',
            name='material_name',
            field=models.CharField(max_length=255, verbose_name='Material Name'),
        ),
        migrations.AddField(
            model_name='material',
            name='status',
            field=models.CharField(choices=[('CONTINUE', 'CONTINUE'), ('DISCONTINUE', 'DISCONTINUE')], default='CONTINUE', max_length=20, verbose_name='Status'),
        ),
        migrations.AddField(
            model_name='material',
            name='product_type',
            field=models.CharField(default='NORMAL', max_length=50, verbose_name='Type'),
        ),
        migrations.AddField(
            model_name='material',
            name='hide',
            field=models.CharField(choices=[('NO', 'NO'), ('YES', 'YES')], default='NO', max_length=10, verbose_name='Hide'),
        ),
        migrations.AddField(
            model_name='material',
            name='rack_no',
            field=models.CharField(blank=True, default='a1', max_length=50, null=True, verbose_name='Rack No.'),
        ),
        migrations.AddField(
            model_name='material',
            name='unit',
            field=models.CharField(default='PCS', max_length=20, verbose_name='Unit'),
        ),
        migrations.AddField(
            model_name='material',
            name='decimal_allowed',
            field=models.CharField(choices=[('No', 'No'), ('Yes', 'Yes')], default='No', max_length=10, verbose_name='Decimal'),
        ),
        migrations.AddField(
            model_name='material',
            name='fast_search',
            field=models.CharField(choices=[('YES', 'YES'), ('NO', 'NO')], default='YES', max_length=10, verbose_name='Fast Search'),
        ),
        migrations.AddField(
            model_name='material',
            name='color_type',
            field=models.CharField(default='NORMAL', max_length=50, verbose_name='Color Type'),
        ),
        migrations.AddField(
            model_name='material',
            name='store',
            field=models.CharField(default='Default', max_length=50, verbose_name='Store'),
        ),
        migrations.AddField(
            model_name='material',
            name='store_code',
            field=models.IntegerField(default=0, verbose_name='Store Code'),
        ),
        migrations.AddField(
            model_name='material',
            name='item_type_code',
            field=models.CharField(default='1 NORMAL', max_length=50, verbose_name='Item Type'),
        ),
        migrations.AddField(
            model_name='material',
            name='group_allowed',
            field=models.CharField(choices=[('Yes', 'Yes'), ('No', 'No')], default='Yes', max_length=10, verbose_name='Group'),
        ),
        migrations.AddField(
            model_name='material',
            name='item_group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='materials', to='dashboard.itemgroup', verbose_name='Item Group'),
        ),
        migrations.AddField(
            model_name='material',
            name='group_name',
            field=models.CharField(blank=True, default='General', max_length=100, null=True, verbose_name='Group Name Text'),
        ),
        migrations.AddField(
            model_name='material',
            name='hsn_sac_allowed',
            field=models.CharField(choices=[('Yes', 'Yes'), ('No', 'No')], default='Yes', max_length=10, verbose_name='HSN/SAC Allowed'),
        ),
        migrations.AddField(
            model_name='material',
            name='hsn_sac_code',
            field=models.CharField(default='-BLANK-', max_length=50, verbose_name='HSN/SAC Code'),
        ),
        migrations.AddField(
            model_name='material',
            name='local_tax',
            field=models.CharField(choices=[('Taxable', 'Taxable'), ('Exempt', 'Exempt'), ('Nil Rated', 'Nil Rated')], default='Taxable', max_length=20, verbose_name='LOCAL Tax'),
        ),
        migrations.AddField(
            model_name='material',
            name='central_tax',
            field=models.CharField(choices=[('Taxable', 'Taxable'), ('Exempt', 'Exempt'), ('Nil Rated', 'Nil Rated')], default='Taxable', max_length=20, verbose_name='CENTRAL Tax'),
        ),
        migrations.AddField(
            model_name='material',
            name='mrp',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='M.R.P.'),
        ),
        migrations.AddField(
            model_name='material',
            name='rate_a',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='Rate-A'),
        ),
        migrations.AddField(
            model_name='material',
            name='conv_box',
            field=models.DecimalField(decimal_places=3, default=0.0, max_digits=18, verbose_name='CONV.BOX'),
        ),
        migrations.AddField(
            model_name='material',
            name='min_qty',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='MINIMUM QTY'),
        ),
        migrations.AddField(
            model_name='material',
            name='max_discount',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='MAXIMUM DISCOUNT %'),
        ),
        migrations.AddField(
            model_name='material',
            name='min_margin',
            field=models.DecimalField(decimal_places=3, default=0.0, max_digits=18, verbose_name='MINIMUM MARGIN %'),
        ),
        migrations.AddField(
            model_name='material',
            name='sgst_pct',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5, verbose_name='SGST %'),
        ),
        migrations.AddField(
            model_name='material',
            name='igst_pct',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5, verbose_name='IGST %'),
        ),
        migrations.AddField(
            model_name='material',
            name='p_rate',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='P.RATE'),
        ),
        migrations.AddField(
            model_name='material',
            name='rate_b',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='Rate-B'),
        ),
        migrations.AddField(
            model_name='material',
            name='conv_case',
            field=models.DecimalField(decimal_places=3, default=0.0, max_digits=18, verbose_name='CONV.CAS'),
        ),
        migrations.AddField(
            model_name='material',
            name='max_qty',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='MAXIMUM QTY'),
        ),
        migrations.AddField(
            model_name='material',
            name='purc_disc',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='PURC Disc'),
        ),
        migrations.AddField(
            model_name='material',
            name='disc_less',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='DISC LESS'),
        ),
        migrations.AddField(
            model_name='material',
            name='cgst_pct',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5, verbose_name='CGST %'),
        ),
        migrations.AddField(
            model_name='material',
            name='cost_per_pcs',
            field=models.DecimalField(decimal_places=5, default=0.0, max_digits=18, verbose_name='COST/PCS'),
        ),
        migrations.AddField(
            model_name='material',
            name='rate_c',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='Rate-C'),
        ),
        migrations.AddField(
            model_name='material',
            name='negative_billing',
            field=models.CharField(choices=[('No', 'No'), ('Yes', 'Yes')], default='No', max_length=10, verbose_name='NEGATIVE'),
        ),
        migrations.AddField(
            model_name='material',
            name='reorder_qty',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=18, verbose_name='Reorder Qty'),
        ),
        migrations.AddField(
            model_name='material',
            name='reorder_days',
            field=models.IntegerField(default=0, verbose_name='Days'),
        ),
        migrations.AddField(
            model_name='material',
            name='rate_mod_allowed',
            field=models.CharField(choices=[('YES', 'YES'), ('NO', 'NO')], default='YES', max_length=10, verbose_name='F6/RATE±'),
        ),
        migrations.AddField(
            model_name='material',
            name='manufacturer',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Mfr (F3)'),
        ),
        migrations.AddField(
            model_name='material',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='material',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.RunPython(copy_products_to_materials, reverse_code=migrations.RunPython.noop),
        migrations.DeleteModel(
            name='ItemProduct',
        ),
    ]
