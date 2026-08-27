from rest_framework import serializers
import datetime
from .models.cashbank import CashBank, CashBankTran
from .models.section_c import SectionC, SectionCTran
from .models.broker_supplier import Broker, VendorSupplier
from .models.sal_pur_group import SalPurGroup

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

class SafePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Safely resolves foreign keys by using .filter(...).first() instead of .get(...).
    Prevents MultipleObjectsReturned crashes if legacy tables have duplicate IDs.
    """
    def to_internal_value(self, data):
        if self.pk_field is not None:
            data = self.pk_field.to_internal_value(data)
        queryset = self.get_queryset()
        try:
            obj = queryset.filter(pk=data).first()
            if obj is None:
                self.fail('does_not_exist', pk_value=data)
            return obj
        except (TypeError, ValueError):
            self.fail('incorrect_type', data_type=type(data).__name__)

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
    broker = SafePrimaryKeyRelatedField(queryset=Broker.objects.all(), required=False, allow_null=True)
    supplier = SafePrimaryKeyRelatedField(queryset=VendorSupplier.objects.all(), required=False, allow_null=True)
    sal_pur_group = SafePrimaryKeyRelatedField(queryset=SalPurGroup.objects.all(), required=False, allow_null=True)
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
        if obj.sal_pur_group_id is not None:
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
        if obj.broker_id is not None:
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
        if obj.supplier_id is not None:
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
# PURCHASE BILL (RMPBL) SERIALIZERS
# =============================================================================

from .models.purchase_bill import PurchaseBill, PurchaseBillItem

class PurchaseBillItemSerializer(serializers.ModelSerializer):
    item_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseBillItem
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

class PurchaseBillSerializer(serializers.ModelSerializer):
    items = PurchaseBillItemSerializer(many=True)
    bill_date = SafeDateTimeField(required=False)
    broker = SafePrimaryKeyRelatedField(queryset=Broker.objects.all(), required=False, allow_null=True)
    supplier = SafePrimaryKeyRelatedField(queryset=VendorSupplier.objects.all(), required=False, allow_null=True)
    sal_pur_group = SafePrimaryKeyRelatedField(queryset=SalPurGroup.objects.all(), required=False, allow_null=True)
    broker_display = serializers.SerializerMethodField(read_only=True)
    supplier_display = serializers.SerializerMethodField(read_only=True)
    sal_pur_group_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseBill
        fields = [
            'bill_no', 'tran_type', 'bill_date', 'expected_delivery_date', 'invoice_no', 'bill_status',
            'gate_pass_no', 'gate_pass_date', 'po_no', 'po_date',
            'sal_pur_group', 'sal_pur_group_display',
            'broker', 'broker_display', 'zone_name', 'supplier', 'supplier_display',
            'supplier_contact', 'supplier_address', 'gst_number',
            'delivery_location', 'delivery_terms', 'payment_terms', 'freight_terms', 'currency',
            'purchaser_name', 'department', 'cost_center', 'special_instructions', 'internal_notes',
            'total_basic_amount', 'taxes', 'grand_total', 'status', 'items'
        ]
        extra_kwargs = {
            'bill_no':            {'required': False, 'allow_blank': True},
            'invoice_no':         {'required': False, 'allow_blank': True, 'allow_null': True},
            'tran_type':          {'required': False},
            'total_basic_amount': {'required': False},
            'taxes':              {'required': False},
            'grand_total':        {'required': False},
            'gate_pass_no':       {'required': False, 'allow_blank': True, 'allow_null': True},
            'gate_pass_date':     {'required': False, 'allow_null': True},
            'po_no':              {'required': False, 'allow_blank': True, 'allow_null': True},
            'po_date':            {'required': False, 'allow_null': True},
            'supplier':           {'required': False, 'allow_null': True},
            'broker':             {'required': False, 'allow_null': True},
            'sal_pur_group':      {'required': False, 'allow_null': True},
            'zone_name':          {'required': False, 'allow_blank': True},
            'delivery_location':  {'required': False, 'allow_blank': True},
            'delivery_terms':     {'required': False, 'allow_blank': True},
            'payment_terms':      {'required': False, 'allow_blank': True},
            'freight_terms':      {'required': False, 'allow_blank': True},
            'currency':           {'required': False, 'allow_blank': True},
        }

    def get_sal_pur_group_display(self, obj):
        if obj.sal_pur_group_id is not None:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                g = obj.sal_pur_group
                if g is None:
                    raise ObjectDoesNotExist
                return {'id': g.pk, 'text': f"{g.SalPurGroupName}"}
            except ObjectDoesNotExist:
                return {'id': obj.sal_pur_group_id, 'text': f"Unknown Group (ID: {obj.sal_pur_group_id})"}
        return None

    def get_broker_display(self, obj):
        if obj.broker_id is not None:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                b = obj.broker
                if b is None:
                    raise ObjectDoesNotExist
                return {'id': b.pk, 'text': f"{b.BrokerName}"}
            except ObjectDoesNotExist:
                return {'id': obj.broker_id, 'text': f"Unknown Broker (ID: {obj.broker_id})"}
        return None

    def get_supplier_display(self, obj):
        if obj.supplier_id is not None:
            from django.core.exceptions import ObjectDoesNotExist
            try:
                s = obj.supplier
                if s is None:
                    raise ObjectDoesNotExist
                return {'id': s.pk, 'text': f"{s.VendorSupplierName}"}
            except ObjectDoesNotExist:
                return {'id': obj.supplier_id, 'text': f"Unknown Supplier (ID: {obj.supplier_id})"}
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

        from dashboard.services.purchase_bill_sp_helper import execute_sp_purchase_bill
        bill_no = execute_sp_purchase_bill('INSERT', validated_data, items_data, username)
        return PurchaseBill.objects.get(bill_no=bill_no)

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'

        validated_data['bill_no'] = instance.bill_no

        from dashboard.services.purchase_bill_sp_helper import execute_sp_purchase_bill
        execute_sp_purchase_bill('UPDATE', validated_data, items_data, username)
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
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'

        from dashboard.services.sal_pur_group_sp_helper import execute_sp_sal_pur_group
        group_id = execute_sp_sal_pur_group('INSERT', validated_data, transactions_data, username)
        return SalPurGroup.objects.get(SalPurGroupID=group_id)

    def update(self, instance, validated_data):
        transactions_data = validated_data.pop('transactions', [])
        request = self.context.get('request')
        username = request.user.username if (request and request.user) else 'system'

        validated_data['SalPurGroupID'] = instance.SalPurGroupID

        from dashboard.services.sal_pur_group_sp_helper import execute_sp_sal_pur_group
        execute_sp_sal_pur_group('UPDATE', validated_data, transactions_data, username)
        instance.refresh_from_db()
        return instance


from .models.user_master import UserMaster


class UserMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserMaster
        fields = '__all__'


# ─────────────────────────────────────────────────────────────────────────────
# GRN SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────────
from .models.grn import GRN, GRNTranMat, GRNTranTest, GRNUser, ApprovalStages


class GRNTranMatSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNTranMat
        fields = '__all__'


class GRNTranTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNTranTest
        fields = '__all__'


class GRNUserSerializer(serializers.ModelSerializer):
    """
    Serializer for tblGRN_User — audit trail of who performed each
    workflow action (Draft / Submit / Refer Back / Approve / Release).
    """
    class Meta:
        model = GRNUser
        fields = ['ID', 'GrnNo', 'GrnDate', 'User', 'actiondate', 'actionid']


class GRNSerializer(serializers.ModelSerializer):
    materials     = GRNTranMatSerializer(many=True, read_only=True)
    tests         = GRNTranTestSerializer(many=True, read_only=True)
    # Returns the list of audit log rows from tblGRN_User for this GRN
    approval_log  = serializers.SerializerMethodField()

    def get_approval_log(self, obj):
        """Fetch audit rows from tblGRN_User matching this GRN's GrnNo."""
        rows = GRNUser.objects.filter(GrnNo=obj.GrnNo).order_by('actionid')
        return GRNUserSerializer(rows, many=True).data

    class Meta:
        model = GRN
        fields = '__all__'

    def create(self, validated_data):
        mat_data = self.context.get('request').data.get('materials', [])
        test_data = self.context.get('request').data.get('tests', [])
        request = self.context.get('request')
        username = 'system'
        if request:
            if hasattr(request, 'session') and request.session.get('user_name'):
                username = request.session['user_name']
            elif request.user and request.user.username:
                username = request.user.username

        from dashboard.services.grn_sp_helper import execute_sp_grn
        grn_no = execute_sp_grn('INSERT', validated_data, mat_data, test_data, username)
        return GRN.objects.get(GrnNo=grn_no)

    def update(self, instance, validated_data):
        mat_data = self.context.get('request').data.get('materials', [])
        test_data = self.context.get('request').data.get('tests', [])
        request = self.context.get('request')
        username = 'system'
        if request:
            if hasattr(request, 'session') and request.session.get('user_name'):
                username = request.session['user_name']
            elif request.user and request.user.username:
                username = request.user.username

        validated_data['GrnNo'] = instance.GrnNo
        from dashboard.services.grn_sp_helper import execute_sp_grn
        execute_sp_grn('UPDATE', validated_data, mat_data, test_data, username)
        instance.refresh_from_db()
        return instance


from .models.gate_entry import GateEntry, GatePass, GatePassTran

class GateEntrySerializer(serializers.ModelSerializer):
    entry_datetime = SafeDateTimeField(required=False)

    class Meta:
        model = GateEntry
        fields = '__all__'


class GatePassTranSerializer(serializers.ModelSerializer):
    class Meta:
        model = GatePassTran
        fields = '__all__'


class GatePassSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    supplier_name = serializers.SerializerMethodField()

    def get_items(self, obj):
        try:
            return GatePassTranSerializer(obj.items.all(), many=True).data
        except Exception:
            return []

    def get_supplier_name(self, obj):
        """Fetch SupplierName from GateEntry linked to this GatePass via GatePassNo."""
        try:
            from .models.gate_entry import GateEntry
            from django.db.models import Q
            entry = GateEntry.objects.filter(
                Q(gate_pass_id__icontains=str(obj.GatePassNo + 10000)) |
                Q(gate_pass_id__icontains=str(obj.GatePassNo))
            ).select_related('supplier').first()
            if entry and entry.supplier:
                return getattr(entry.supplier, 'Account_Name', '') or str(entry.supplier)
        except Exception:
            pass
        return ''

    class Meta:
        model = GatePass
        fields = '__all__'


# ──────────────────────────────────────────────────────────────────
# Weighment Serializers
# ──────────────────────────────────────────────────────────────────
from .models.weighment import Weighment, WeighmentTran


class WeighmentTranSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeighmentTran
        fields = '__all__'


class WeighmentSerializer(serializers.ModelSerializer):
    WeighmentSlipNo = serializers.CharField(required=False, allow_blank=True)
    materials = WeighmentTranSerializer(
        source='weighmenttran_set', many=True, read_only=True
    )

    class Meta:
        model = Weighment
        fields = '__all__'

    def _get_username(self):
        request = self.context.get('request')
        if request:
            if hasattr(request, 'session') and request.session.get('user_name'):
                return request.session['user_name']
            if request.user and request.user.username:
                return request.user.username
        return 'system'

    def create(self, validated_data):
        slip_no = validated_data.get('WeighmentSlipNo')
        if not slip_no:
            import datetime
            today_str = datetime.date.today().strftime('%Y%m%d')
            prefix = f"WS-{today_str}-"
            try:
                # Query Weighment table to find the latest slip no for today
                max_slip = Weighment.objects.filter(WeighmentSlipNo__startswith=prefix).order_by('-WeighmentSlipNo').first()
                if max_slip:
                    try:
                        last_seq = int(max_slip.WeighmentSlipNo.split('-')[-1])
                        seq = last_seq + 1
                    except ValueError:
                        seq = 1
                else:
                    seq = 1
            except Exception:
                seq = 1
            validated_data['WeighmentSlipNo'] = f"{prefix}{seq:04d}"

        tran_data = self.context.get('request').data.get('materials', [])
        from dashboard.services.weighment_sp_helper import execute_sp_weighment
        slip_no = execute_sp_weighment('INSERT', validated_data, tran_data, self._get_username())
        return Weighment.objects.get(WeighmentSlipNo=slip_no)

    def update(self, instance, validated_data):
        tran_data = self.context.get('request').data.get('materials', [])
        validated_data['WeighmentSlipNo'] = instance.WeighmentSlipNo
        from dashboard.services.weighment_sp_helper import execute_sp_weighment
        execute_sp_weighment('UPDATE', validated_data, tran_data, self._get_username())
        instance.refresh_from_db()
        return instance


# ──────────────────────────────────────────────────────────────────
# Purchase Challan Serializers
# ──────────────────────────────────────────────────────────────────
from .models.purchase_challan import PurchaseChallan, PurchaseChallanTran


class PurchaseChallanTranSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseChallanTran
        fields = '__all__'


class PurchaseChallanSerializer(serializers.ModelSerializer):
    ChallanNo = serializers.CharField(required=False, allow_blank=True)
    PODate = serializers.DateField(required=False, allow_null=True)
    ChallanDate = serializers.DateField(required=False, allow_null=True)
    materials = serializers.SerializerMethodField()

    def get_materials(self, obj):
        try:
            return PurchaseChallanTranSerializer(obj.purchasechallantran_set.all(), many=True).data
        except Exception:
            return []

    class Meta:
        model = PurchaseChallan
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            for date_field in ['PODate', 'ChallanDate', 'GatePassDate', 'WeighmentDate']:
                if date_field in data and (data[date_field] == '' or data[date_field] is None):
                    data[date_field] = None
        return super().to_internal_value(data)

    def _get_username(self):
        request = self.context.get('request')
        if request:
            if hasattr(request, 'session') and request.session.get('user_name'):
                return request.session['user_name']
            if request.user and request.user.username:
                return request.user.username
        return 'system'

    def create(self, validated_data):
        tran_data = self.context.get('request').data.get('materials', [])
        from dashboard.services.purchase_challan_sp_helper import execute_sp_purchase_challan
        challan_no = execute_sp_purchase_challan('INSERT', validated_data, tran_data, self._get_username())
        try:
            return PurchaseChallan.objects.get(ChallanNo=challan_no)
        except PurchaseChallan.DoesNotExist:
            obj = PurchaseChallan()
            obj.ChallanNo = challan_no
            return obj

    def update(self, instance, validated_data):
        tran_data = self.context.get('request').data.get('materials', [])
        validated_data['ChallanNo'] = instance.ChallanNo
        from dashboard.services.purchase_challan_sp_helper import execute_sp_purchase_challan
        execute_sp_purchase_challan('UPDATE', validated_data, tran_data, self._get_username())
        try:
            instance.refresh_from_db()
        except Exception:
            pass
        return instance
