from rest_framework import serializers
import datetime
from .models.cashbank import CashBank, CashBankTran
from .models.section_c import SectionC, SectionCTran

class SafeDateTimeField(serializers.DateTimeField):
    def to_representation(self, value):
        import datetime
        if isinstance(value, datetime.date) and not isinstance(value, datetime.datetime):
            value = datetime.datetime.combine(value, datetime.time.min)
            from django.conf import settings
            from django.utils import timezone
            if settings.USE_TZ and timezone.is_naive(value):
                value = timezone.make_aware(value)
        return super().to_representation(value)

class CashBankTranSerializer(serializers.ModelSerializer):
    account_master_display = serializers.SerializerMethodField()
    date = SafeDateTimeField(required=False)

    class Meta:
        model = CashBankTran
        fields = [
            'id', 'date', 'tran_type', 'rpid', 'account_master', 'account_master_display',
            'amount', 'remarks', 'chq_no', 'chq_date', 'payee_bank'
        ]
        extra_kwargs = {
            'tran_type': {'required': False},
            'rpid': {'required': False},
        }

    def get_account_master_display(self, obj):
        """Returns id + text for Select2 pre-population in edit mode."""
        if obj.account_master_id:
            a = obj.account_master
            text = f"{a.Account_Name}"
            if a.display_name:
                text += f" [{a.display_name}]"
            return {'id': a.pk, 'text': text}
        return None

class CashBankSerializer(serializers.ModelSerializer):
    transactions = CashBankTranSerializer(many=True)
    date = SafeDateTimeField(required=False)
    # Read-only display field — returned on GET so edit mode can populate Select2
    # with the real account name instead of a placeholder like "Account 5".
    bank_account_display = serializers.SerializerMethodField()

    class Meta:
        model = CashBank
        fields = [
            'voucher_no', 'date', 'tran_type', 'rpid', 'amount',
            'narration', 'status', 'bank_account', 'bank_account_display',
            'transactions'
        ]

    def get_bank_account_display(self, obj):
        """Returns id + text for Select2 pre-population in edit mode."""
        if obj.bank_account_id:
            ba = obj.bank_account
            text = f"{ba.Account_Name}"
            if ba.display_name:
                text += f" [{ba.display_name}]"
            return {
                'id': ba.pk,
                'text': text
            }
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'
        transactions_data = validated_data.pop('transactions', [])
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        voucher_no = execute_sp_manage_transaction('INSERT', 'BANK_TRANSACTION', validated_data, transactions_data, username)
        return CashBank.objects.get(voucher_no=voucher_no)

    def validate_voucher_no(self, value):
        if self.instance and self.instance.pk != value:
            if CashBank.objects.filter(voucher_no=value).exists():
                raise serializers.ValidationError(f"Voucher number '{value}' already exists. Please choose a unique voucher number.")
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'
        transactions_data = validated_data.pop('transactions', [])
        
        original_voucher_no = instance.voucher_no
        new_voucher_no = validated_data.get('voucher_no') or original_voucher_no
        
        if new_voucher_no != original_voucher_no:
            # Delete child transactions referencing old voucher_no
            CashBankTran.objects.filter(voucher_id=original_voucher_no).delete()
            # Update parent primary key
            CashBank.objects.filter(voucher_no=original_voucher_no).update(voucher_no=new_voucher_no)
            instance.voucher_no = new_voucher_no
            instance.pk = new_voucher_no
            
        validated_data['voucher_no'] = new_voucher_no
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        execute_sp_manage_transaction('UPDATE', 'BANK_TRANSACTION', validated_data, transactions_data, username)
        instance.refresh_from_db()
        return instance

class SectionCTranSerializer(serializers.ModelSerializer):
    account_master_display = serializers.SerializerMethodField()
    date = SafeDateTimeField(required=False)

    class Meta:
        model = CashBankTran
        fields = [
            'id', 'date', 'tran_type', 'rpid', 'account_master', 'account_master_display',
            'amount', 'remarks', 'chq_no', 'chq_date', 'payee_bank'
        ]
        extra_kwargs = {
            'tran_type': {'required': False},
            'rpid': {'required': False},
        }

    def get_account_master_display(self, obj):
        """Returns id + text for Select2 pre-population in edit mode."""
        if obj.account_master_id:
            a = obj.account_master
            text = f"{a.Account_Name}"
            if a.display_name:
                text += f" [{a.display_name}]"
            return {'id': a.pk, 'text': text}
        return None

class SectionCSerializer(serializers.ModelSerializer):
    transactions = SectionCTranSerializer(many=True)
    date = SafeDateTimeField(required=False)
    # Read-only display field — returned on GET so edit mode can populate Select2
    bank_account_display = serializers.SerializerMethodField()

    class Meta:
        model = CashBank
        fields = [
            'voucher_no', 'date', 'tran_type', 'rpid', 'amount', 
            'narration', 'status', 'bank_account', 'bank_account_display',
            'transactions'
        ]
        extra_kwargs = {
            'voucher_no': {'required': False, 'allow_blank': True},
        }

    def get_bank_account_display(self, obj):
        """Returns id + text for Select2 pre-population in edit mode."""
        if obj.bank_account_id:
            ba = obj.bank_account
            text = f"{ba.Account_Name}"
            if ba.display_name:
                text += f" [{ba.display_name}]"
            return {
                'id': ba.pk,
                'text': text
            }
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'
        transactions_data = validated_data.pop('transactions', [])
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        voucher_no = execute_sp_manage_transaction('INSERT', 'SECTION_C', validated_data, transactions_data, username)
        return CashBank.objects.get(voucher_no=voucher_no)

    def validate_voucher_no(self, value):
        if self.instance and self.instance.pk != value:
            if CashBank.objects.filter(voucher_no=value).exists():
                raise serializers.ValidationError(f"Voucher number '{value}' already exists. Please choose a unique voucher number.")
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'
        transactions_data = validated_data.pop('transactions', [])
        
        original_voucher_no = instance.voucher_no
        new_voucher_no = validated_data.get('voucher_no') or original_voucher_no
        
        if new_voucher_no != original_voucher_no:
            # Delete child transactions referencing old voucher_no
            CashBankTran.objects.filter(voucher_id=original_voucher_no).delete()
            # Update parent primary key
            CashBank.objects.filter(voucher_no=original_voucher_no).update(voucher_no=new_voucher_no)
            instance.voucher_no = new_voucher_no
            instance.pk = new_voucher_no
            
        validated_data['voucher_no'] = new_voucher_no
        from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
        execute_sp_manage_transaction('UPDATE', 'SECTION_C', validated_data, transactions_data, username)
        instance.refresh_from_db()
        return instance


# =============================================================================
# SUB SECTION B-2 SERIALIZERS
# Reconnected to tblCASHBANK / tblCASHBANK_TRAN via module_type='B2' filter.
# Only form UI, route separation, transaction type filtering, and
# labels/workflow differ from the baseline Bank Transaction serializers.
# =============================================================================

class SubsectionB2TranSerializer(serializers.ModelSerializer):
    """Detail row serializer for B-2 — wraps CashBankTran with cost_center support."""
    account_master_display = serializers.SerializerMethodField()
    date = SafeDateTimeField(required=False)

    class Meta:
        model = CashBankTran
        fields = [
            'id', 'date', 'tran_type', 'rpid',
            'account_master', 'account_master_display',
            'amount', 'remarks', 'cost_center',
            'chq_no', 'chq_date', 'payee_bank'
        ]
        extra_kwargs = {
            'tran_type': {'required': False},
            'rpid':      {'required': False},
        }

    def get_account_master_display(self, obj):
        """Returns id + text for Select2 pre-population in edit mode."""
        if obj.account_master_id:
            a = obj.account_master
            text = f"{a.Account_Name}"
            if a.display_name:
                text += f" [{a.display_name}]"
            return {'id': a.pk, 'text': text}
        return None


class SubsectionB2Serializer(serializers.ModelSerializer):
    """
    Header serializer for B-2 — wraps CashBank.
    B-2 specific fields (posting_status, ref_voucher_no, module_type) now live
    directly on tblCASHBANK thanks to migration 0018.
    """
    transactions = SubsectionB2TranSerializer(many=True)
    date = SafeDateTimeField(required=False)
    bank_account_display = serializers.SerializerMethodField()

    class Meta:
        model = CashBank
        fields = [
            'voucher_no', 'date', 'tran_type', 'rpid', 'amount',
            'narration', 'status', 'posting_status', 'bank_account', 'bank_account_display',
            'ref_voucher_no', 'transactions'
        ]
        extra_kwargs = {
            'voucher_no':    {'required': False, 'allow_blank': True},
            'module_type':   {'read_only': True},
        }

    def get_bank_account_display(self, obj):
        """Returns id + text for Select2 pre-population in edit mode."""
        if obj.bank_account_id:
            ba = obj.bank_account
            text = f"{ba.Account_Name}"
            if ba.display_name:
                text += f" [{ba.display_name}]"
            return {
                'id': ba.pk,
                'text': text
            }
        return None

    def validate(self, data):
        """
        Enforce: prevent editing POSTED vouchers.
        Enforce: header amount == sum of all detail row amounts.
        Enforce: at least one detail row must be provided.
        """
        if self.instance and self.instance.posting_status == 'POSTED':
            raise serializers.ValidationError(
                {'posting_status': 'Cannot edit a POSTED transaction.'}
            )

        transactions = data.get('transactions', [])
        if not transactions:
            raise serializers.ValidationError(
                {'transactions': 'At least one transaction row is required.'}
            )
        detail_total = sum(
            t.get('amount', 0) for t in transactions if t.get('amount')
        )
        header_amount = data.get('amount', 0)
        if header_amount and abs(float(header_amount) - float(detail_total)) > 0.005:
            raise serializers.ValidationError(
                {'amount': f'Header amount ({header_amount}) must equal sum of detail rows ({detail_total}).'}
            )
        return data

    @staticmethod
    def _generate_voucher_no():
        """
        Auto-generate a unique B-2 voucher number: B2-YYYYMM-NNNN.
        Queries tblCASHBANK filtered by module_type='B2' + current month prefix.
        """
        from django.utils import timezone
        now = timezone.now()
        prefix = f"B2-{now.strftime('%Y%m')}-"
        count = CashBank.objects.filter(
            module_type='B2',
            voucher_no__startswith=prefix
        ).count()
        return f"{prefix}{str(count + 1).zfill(4)}"

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['_user'] = request.user.username if (request and request.user) else 'system'
        from dashboard.services.subsection_b2_service import SubsectionB2Service
        return SubsectionB2Service.create_voucher(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        validated_data['_user'] = request.user.username if (request and request.user) else 'system'
        from dashboard.services.subsection_b2_service import SubsectionB2Service
        return SubsectionB2Service.update_voucher(instance, validated_data)


# =============================================================================
# SUB SECTION X (PURCHASE ORDER) SERIALIZERS
# =============================================================================

from .models.purchase_order import PurchaseOrder, PurchaseOrderItem
from .models.account_master import AccountMaster
from .models.gate_entry import Material
from .models.broker_supplier import Broker, VendorSupplier

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    item_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'item', 'item_display', 'order_qty', 'uom', 'unit_rate', 'amount', 'remarks'
        ]
        extra_kwargs = {
            'amount': {'required': False, 'allow_null': True}
        }

    def get_item_display(self, obj):
        if obj.item_id:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                it = obj.item
                return {
                    'id': it.pk,
                    'text': f"{it.material_code} - {it.material_name}"
                }
            except ObjectDoesNotExist:
                return {
                    'id': obj.item_id,
                    'text': f"Unknown Item (ID: {obj.item_id})"
                }
        return None

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    po_date = SafeDateTimeField(required=False)
    broker_display = serializers.SerializerMethodField(read_only=True)
    supplier_display = serializers.SerializerMethodField(read_only=True)
    sal_pur_group_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'po_no', 'po_date', 'expected_delivery_date', 'po_status',
            'sal_pur_group', 'sal_pur_group_display',
            'broker', 'broker_display', 'zone_name', 'supplier', 'supplier_display',
            'supplier_contact', 'supplier_address', 'gst_number',
            'delivery_location', 'delivery_terms', 'payment_terms', 'freight_terms', 'currency',
            'purchaser_name', 'department', 'cost_center', 'special_instructions', 'internal_notes',
            'total_basic_amount', 'taxes', 'grand_total', 'status', 'items'
        ]
        extra_kwargs = {
            'po_no':              {'required': False, 'allow_blank': True},
            'total_basic_amount': {'required': False},
            'taxes':              {'required': False},
            'grand_total':        {'required': False},
            # FK fields — null is acceptable (e.g. broker is optional, supplier filled by user)
            'supplier':           {'required': False, 'allow_null': True},
            'broker':             {'required': False, 'allow_null': True},
            'sal_pur_group':      {'required': False, 'allow_null': True},
            # String fields in Tab 2 — blank is acceptable when user hasn't visited tab
            'zone_name':          {'required': False, 'allow_blank': True},
            'delivery_location':  {'required': False, 'allow_blank': True},
            'delivery_terms':     {'required': False, 'allow_blank': True},
            'payment_terms':      {'required': False, 'allow_blank': True},
            'freight_terms':      {'required': False, 'allow_blank': True},
            'currency':           {'required': False, 'allow_blank': True},
        }

    def get_sal_pur_group_display(self, obj):
        if obj.sal_pur_group_id:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                g = obj.sal_pur_group
                if g is None:
                    raise ObjectDoesNotExist
                return {
                    'id': g.pk,
                    'text': f"{g.SalPurGroupName}"
                }
            except ObjectDoesNotExist:
                return {
                    'id': obj.sal_pur_group_id,
                    'text': f"Unknown Group (ID: {obj.sal_pur_group_id})"
                }
        return None

    def get_broker_display(self, obj):
        if obj.broker_id:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                b = obj.broker
                if b is None:
                    raise ObjectDoesNotExist
                return {
                    'id': b.pk,
                    'text': f"{b.BrokerName}"
                }
            except ObjectDoesNotExist:
                return {
                    'id': obj.broker_id,
                    'text': f"Unknown Broker (ID: {obj.broker_id})"
                }
        return None

    def get_supplier_display(self, obj):
        if obj.supplier_id:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                s = obj.supplier
                if s is None:
                    raise ObjectDoesNotExist
                return {
                    'id': s.pk,
                    'text': f"{s.VendorSupplierName}"
                }
            except ObjectDoesNotExist:
                return {
                    'id': obj.supplier_id,
                    'text': f"Unknown Supplier (ID: {obj.supplier_id})"
                }
        return None


    def validate(self, data):
        items = data.get('items', [])
        if not items:
            raise serializers.ValidationError({'items': 'At least one item line is required.'})
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'

        from dashboard.services.purchase_order_sp_helper import execute_sp_purchase_order
        po_no = execute_sp_purchase_order('INSERT', validated_data, items_data, username)
        return PurchaseOrder.objects.get(po_no=po_no)

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'

        # Carry the PK so the helper knows which record to update
        validated_data['po_no'] = instance.po_no

        from dashboard.services.purchase_order_sp_helper import execute_sp_purchase_order
        execute_sp_purchase_order('UPDATE', validated_data, items_data, username)
        instance.refresh_from_db()
        return instance


# =============================================================================
# SUB SECTION Y (PURCHASE ENTRY) SERIALIZERS
# =============================================================================

from .models.pur_sales import PurSales, PurSalesTran

class SubsectionYTranSerializer(serializers.ModelSerializer):
    item_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurSalesTran
        fields = [
            'id', 'VoucherNo', 'VoucherDate', 'TranType', 'Item_ID', 'item_display',
            'Bag', 'Weight', 'unit_weight', 'Unit_rate', 'Amount', 'gst_rate',
            'IGST', 'CGST', 'SGST', 'Total', 'IsRateIncludingGST'
        ]
        extra_kwargs = {
            'VoucherNo': {'required': False},
            'VoucherDate': {'required': False},
            'TranType': {'required': False},
        }

    def get_item_display(self, obj):
        if obj.Item_ID_id:
            it = obj.Item_ID
            return {
                'id': it.pk,
                'text': f"{it.material_code} - {it.material_name}",
                'unit_weight': str(it.unit_weight) if it.unit_weight else '0',
                'PurchaseGST': str(it.PurchaseGST) if it.PurchaseGST else '0',
                'IsRateInclGSTY1N0': it.IsRateInclGSTY1N0
            }
        return None

class SubsectionYSerializer(serializers.ModelSerializer):
    items = SubsectionYTranSerializer(many=True)
    purchase_group_display = serializers.SerializerMethodField(read_only=True)
    party_display = serializers.SerializerMethodField(read_only=True)
    broker_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurSales
        fields = [
            'VoucherNo', 'VoucherDate', 'TranType', 'OrderNo', 'OrderDate',
            'PurSalGroupID', 'purchase_group_display', 'PartyID', 'party_display',
            'BrokerID', 'broker_display', 'ZoneID', 'DeliveryLocation',
            'DelTermsID', 'PaymentTermsID', 'FreightTermID', 'CurrencyID',
            'IncotermID', 'CreditDays', 'Purchaser_Saleman_ID', 'DepartmentID', 'CostCentrID',
            'SpecialInstructions', 'InternalNotes', 'IGST0_SGST1', 'items'
        ]
        extra_kwargs = {
            'VoucherNo': {'required': False, 'allow_blank': True},
        }

    def get_purchase_group_display(self, obj):
        if obj.PurSalGroupID_id:
            pg = obj.PurSalGroupID
            return {
                'id': pg.pk,
                'text': pg.SalPurGroupName,
                'IsGSTApplicableY1N0': pg.IsGSTApplicableY1N0,
                'IGST1_CGST0': pg.IGST1_CGST0
            }
        return None

    def get_party_display(self, obj):
        if obj.PartyID_id:
            p = obj.PartyID
            return {
                'id': p.pk,
                'text': p.Account_Name
            }
        return None

    def get_broker_display(self, obj):
        if obj.BrokerID_id:
            b = obj.BrokerID
            return {
                'id': b.pk,
                'text': b.BrokerName
            }
        return None

    def validate(self, data):
        items = data.get('items', [])
        if not items:
            raise serializers.ValidationError({'items': 'At least one item line is required.'})
        return data

    from django.db import transaction

    @transaction.atomic
    def create(self, validated_data):
        import datetime
        from django.utils import timezone
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'
        
        # Fallback to auto-generating VoucherNo if empty
        if not validated_data.get('VoucherNo'):
            now = timezone.now()
            prefix = f"PUR-{now.strftime('%Y%m')}-"
            last_record = PurSales.objects.filter(VoucherNo__startswith=prefix).order_by('VoucherNo').last()
            if last_record:
                try:
                    last_num = int(last_record.VoucherNo.replace(prefix, ''))
                    validated_data['VoucherNo'] = f"{prefix}{last_num + 1:04d}"
                except ValueError:
                    validated_data['VoucherNo'] = f"{prefix}0001"
            else:
                validated_data['VoucherNo'] = f"{prefix}0001"

        validated_data['UserCreated'] = username
        validated_data['UserModified'] = username
        validated_data['DatdCreated'] = datetime.date.today()
        validated_data['DateModified'] = datetime.date.today()

        header = PurSales.objects.create(**validated_data)

        for item_data in items_data:
            item_data['VoucherNo'] = header.VoucherNo
            item_data['VoucherDate'] = header.VoucherDate
            item_data['TranType'] = header.TranType
            item_data['UserCreated'] = username
            item_data['UserModified'] = username
            item_data['DateCreated'] = timezone.now()
            item_data['DateModified'] = timezone.now()
            PurSalesTran.objects.create(**item_data)

        return header

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'
        import datetime
        from django.utils import timezone

        validated_data['UserModified'] = username
        validated_data['DateModified'] = datetime.date.today()

        # Update header
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Clean old items and re-create them
        PurSalesTran.objects.filter(
            VoucherNo=instance.VoucherNo,
            VoucherDate=instance.VoucherDate,
            TranType=instance.TranType
        ).delete()

        for item_data in items_data:
            item_data['VoucherNo'] = instance.VoucherNo
            item_data['VoucherDate'] = instance.VoucherDate
            item_data['TranType'] = instance.TranType
            item_data['UserCreated'] = username
            item_data['UserModified'] = username
            item_data['DateCreated'] = timezone.now()
            item_data['DateModified'] = timezone.now()
            PurSalesTran.objects.create(**item_data)

        instance.refresh_from_db()
        return instance


from dashboard.models.sal_pur_group import TransactionType, SalPurGroup, SalPurGroupTran


class TransactionTypeSerializer(serializers.ModelSerializer):
    """Serializer for the TransactionType lookup table."""
    class Meta:
        model = TransactionType
        fields = '__all__'
        read_only_fields = ('TransactionTypeID',)


class SalPurGroupTranSerializer(serializers.ModelSerializer):
    account_display = serializers.SerializerMethodField()

    class Meta:
        model = SalPurGroupTran
        fields = '__all__'
        read_only_fields = ('ID',)

    def get_account_display(self, obj):
        if obj.ChargeAccountID:
            ba = obj.ChargeAccountID
            text = f"{ba.Account_Name}"
            if ba.groupID:
                text += f" - {ba.groupID}"
            return {'id': ba.pk, 'text': text}
        return None


class SalPurGroupSerializer(serializers.ModelSerializer):
    transactions = SalPurGroupTranSerializer(many=True, required=False)
    account_display = serializers.SerializerMethodField()
    transaction_type_display = serializers.SerializerMethodField()

    class Meta:
        model = SalPurGroup
        fields = '__all__'
        read_only_fields = ('SalPurGroupID',)

    def get_account_display(self, obj):
        if obj.GroupwiseAccountID:
            ba = obj.GroupwiseAccountID
            text = f"{ba.Account_Name}"
            if ba.groupID:
                text += f" - {ba.groupID}"
            return {'id': ba.pk, 'text': text}
        return None

    def get_transaction_type_display(self, obj):
        if obj.TransactionTypeID:
            tt = obj.TransactionTypeID
            return {
                'id': tt.TransactionTypeID,
                'name': tt.TransactionTypeName,
                'code': tt.TransactionType
            }
        return None

    def create(self, validated_data):
        transactions_data = validated_data.pop('transactions', [])
        group = SalPurGroup.objects.create(**validated_data)

        for tx_data in transactions_data:
            SalPurGroupTran.objects.create(SalPurGroupID=group, **tx_data)

        return group

    def update(self, instance, validated_data):
        transactions_data = validated_data.pop('transactions', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if transactions_data:
            instance.transactions.all().delete()
            for tx_data in transactions_data:
                SalPurGroupTran.objects.create(SalPurGroupID=instance, **tx_data)

        return instance


from .models.user_master import UserMaster


class UserMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserMaster
        fields = '__all__'
