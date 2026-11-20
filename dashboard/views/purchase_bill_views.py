from django.views.generic import TemplateView
from django.db.models import Q
from dashboard.models import AccountMaster, Material, Broker, Zone, VendorSupplier, SalPurGroup
from dashboard.models.purchase_bill import PurchaseBill

BILL_TYPE_CONFIG = {
    # Purchase
    'RMPBL': {'label': 'Raw Materials',   'tran': 'Purchase',        'title': 'Raw Material Purchase',         'badge': 'Raw Materials'},
    'FGPBL': {'label': 'Finished Goods',  'tran': 'Purchase',        'title': 'Finished Goods Purchase',        'badge': 'Finished Goods'},
    'SMPBL': {'label': 'Store Materials', 'tran': 'Purchase',        'title': 'Store Material Purchase',       'badge': 'Store Materials'},
    # Sales
    'RMSBL': {'label': 'Raw Materials',   'tran': 'Sales',           'title': 'Raw Material Sales',            'badge': 'Raw Materials'},
    'FGSBL': {'label': 'Finished Goods',  'tran': 'Sales',           'title': 'Finished Goods Sales',           'badge': 'Finished Goods'},
    'SMSBL': {'label': 'Store Materials', 'tran': 'Sales',           'title': 'Store Material Sales',          'badge': 'Store Materials'},
    # Sales Return
    'RMSRT': {'label': 'Raw Materials',   'tran': 'Sales Return',    'title': 'Raw Material Sales Return',     'badge': 'Raw Materials'},
    'FGSRT': {'label': 'Finished Goods',  'tran': 'Sales Return',    'title': 'Finished Goods Sales Return',    'badge': 'Finished Goods'},
    'SMSRT': {'label': 'Store Materials', 'tran': 'Sales Return',    'title': 'Store Material Sales Return',    'badge': 'Store Materials'},
    # Purchase Return
    'RMPRT': {'label': 'Raw Materials',   'tran': 'Purchase Return', 'title': 'Raw Material Purchase Return',  'badge': 'Raw Materials'},
    'FGPRT': {'label': 'Finished Goods',  'tran': 'Purchase Return', 'title': 'Finished Goods Purchase Return', 'badge': 'Finished Goods'},
    'SMPRT': {'label': 'Store Materials', 'tran': 'Purchase Return', 'title': 'Store Material Purchase Return', 'badge': 'Store Materials'},
}


class PurchaseBillListView(TemplateView):
    """Serves the Purchase Bill (RMPBL) list page."""
    template_name = 'dashboard/purchase_bill_list.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        tran_type = (self.request.GET.get('type') or self.request.GET.get('tran_type') or 'RMPBL').strip().upper()
        config = BILL_TYPE_CONFIG.get(tran_type, BILL_TYPE_CONFIG['RMPBL'])
        context['tran_type'] = tran_type
        context['bill_type_label'] = config['label']
        context['bill_type_tran'] = config['tran']
        context['bill_type_title'] = config['title']
        context['bill_type_badge'] = config['badge']
        return context


class PurchaseBillCreateView(TemplateView):
    """
    Serves the Purchase Bill (RMPBL) creation/edit/view-only form page.
    """
    template_name = 'dashboard/purchase_bill_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Passed to template -> window.APP_CONFIG.voucherNo
        context['voucher_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')

        current_pk = self.kwargs.get('pk', '')
        tran_type = (self.request.GET.get('type') or self.request.GET.get('tran_type') or '').strip().upper()

        if current_pk:
            try:
                bill_obj = PurchaseBill.objects.get(pk=current_pk)
                context['bill_status'] = bill_obj.bill_status
                if not tran_type and hasattr(bill_obj, 'tran_type') and bill_obj.tran_type:
                    tran_type = bill_obj.tran_type
            except PurchaseBill.DoesNotExist:
                context['bill_status'] = 'Draft'
        else:
            context['bill_status'] = 'Draft'

        if not tran_type or tran_type not in BILL_TYPE_CONFIG:
            tran_type = 'RMPBL'

        config = BILL_TYPE_CONFIG.get(tran_type, BILL_TYPE_CONFIG['RMPBL'])
        context['tran_type'] = tran_type
        context['bill_type_label'] = config['label']
        context['bill_type_tran'] = config['tran']
        context['bill_type_title'] = config['title']
        context['bill_type_badge'] = config['badge']

        # Dropdowns for form (Deduplicated)
        seen_brokers = set()
        unique_brokers = []
        for b in Broker.objects.all().order_by('BrokerName'):
            if b.BrokerName and b.BrokerName.strip() not in seen_brokers:
                seen_brokers.add(b.BrokerName.strip())
                unique_brokers.append(b)
        context['brokers'] = unique_brokers

        seen_suppliers = set()
        unique_suppliers = []
        for s in VendorSupplier.objects.all().order_by('VendorSupplierName'):
            if s.VendorSupplierName and s.VendorSupplierName.strip() not in seen_suppliers:
                seen_suppliers.add(s.VendorSupplierName.strip())
                unique_suppliers.append(s)
        context['suppliers'] = unique_suppliers

        seen_zones = set()
        unique_zones = []
        for z in Zone.objects.all().order_by('ZoneName'):
            if z.ZoneName and z.ZoneName.strip() not in seen_zones:
                seen_zones.add(z.ZoneName.strip())
                unique_zones.append(z)
        context['zones'] = unique_zones

        # Items dropdown (filter if category matches, else all)
        items_qs = Material.objects.filter(is_active=True)
        type_filtered = None
        if 'RM' in tran_type:
            type_filtered = items_qs.filter(Q(product_type__icontains='raw') | Q(product_type__iexact='rm') | Q(item_type_code__iexact='rm'))
        elif 'FG' in tran_type:
            type_filtered = items_qs.filter(Q(product_type__icontains='finish') | Q(product_type__iexact='fg') | Q(item_type_code__iexact='fg'))
        elif 'SM' in tran_type:
            type_filtered = items_qs.filter(Q(product_type__icontains='store') | Q(product_type__iexact='sm') | Q(store__icontains='store'))

        if type_filtered and type_filtered.exists():
            context['items'] = type_filtered.order_by('material_name')
        else:
            context['items'] = items_qs.order_by('material_name')

        context['sal_pur_groups'] = SalPurGroup.objects.filter(is_active=True).order_by('SalPurGroupName')

        # Calculate prev_pk and next_pk for record navigation
        context['prev_pk'] = None
        context['next_pk'] = None

        try:
            from django.db import transaction
            with transaction.atomic():
                pks = list(PurchaseBill.objects.filter(status=True).order_by('-bill_date', '-date_created').values_list('pk', flat=True))
                if current_pk:
                    try:
                        if current_pk not in pks:
                            pks = list(PurchaseBill.objects.all().order_by('-bill_date', '-date_created').values_list('pk', flat=True))
                        idx = pks.index(current_pk)
                        context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                        context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
                    except ValueError:
                        context['prev_pk'] = context['next_pk'] = None
        except Exception:
            pass

        return context
