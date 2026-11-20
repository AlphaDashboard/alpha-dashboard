from django.views.generic import TemplateView
from django.db.models import Q
from dashboard.models import Category, AccountMaster, Material, Broker, Zone, SalPurGroup
from dashboard.models.pur_sales import PurSales

PURSALES_TYPE_CONFIG = {
    # Purchase
    'RMPUR':  {'label': 'Raw Materials',   'tran': 'Purchase',        'title': 'Raw Material Purchase',        'badge': 'Raw Materials'},
    'FGPUR':  {'label': 'Finished Goods',  'tran': 'Purchase',        'title': 'Finished Goods Purchase',       'badge': 'Finished Goods'},
    'SMPUR':  {'label': 'Store Materials', 'tran': 'Purchase',        'title': 'Store Material Purchase',      'badge': 'Store Materials'},
    # Sales
    'RMSAL':  {'label': 'Raw Materials',   'tran': 'Sales',           'title': 'Raw Material Sales',           'badge': 'Raw Materials'},
    'FGSAL':  {'label': 'Finished Goods',  'tran': 'Sales',           'title': 'Finished Goods Sales',          'badge': 'Finished Goods'},
    'SMSAL':  {'label': 'Store Materials', 'tran': 'Sales',           'title': 'Store Material Sales',         'badge': 'Store Materials'},
    # Sales Return
    'RMRET':  {'label': 'Raw Materials',   'tran': 'Sales Return',    'title': 'Raw Material Sales Return',    'badge': 'Raw Materials'},
    'FGRET':  {'label': 'Finished Goods',  'tran': 'Sales Return',    'title': 'Finished Goods Sales Return',   'badge': 'Finished Goods'},
    'SMRET':  {'label': 'Store Materials', 'tran': 'Sales Return',    'title': 'Store Material Sales Return',   'badge': 'Store Materials'},
    # Purchase Return
    'RMPRET': {'label': 'Raw Materials',   'tran': 'Purchase Return', 'title': 'Raw Material Purchase Return', 'badge': 'Raw Materials'},
    'FGPRET': {'label': 'Finished Goods',  'tran': 'Purchase Return', 'title': 'Finished Goods Purchase Return','badge': 'Finished Goods'},
    'SMPRET': {'label': 'Store Materials', 'tran': 'Purchase Return', 'title': 'Store Material Purchase Return','badge': 'Store Materials'},
}

class SubSectionYListView(TemplateView):
    template_name = 'dashboard/subsection_y_list.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        form_type = (self.request.GET.get('type') or 'RMPUR').strip().upper()
        config = PURSALES_TYPE_CONFIG.get(form_type, PURSALES_TYPE_CONFIG['RMPUR'])
        context['form_type'] = form_type
        context['form_type_label'] = config['label']
        context['form_type_tran'] = config['tran']
        context['form_type_title'] = config['title']
        context['form_type_badge'] = config['badge']
        return context

class SubSectionYCreateView(TemplateView):
    template_name = 'dashboard/subsection_y_form.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Passed to template to know if it's edit or create
        context['voucher_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')

        form_type = (self.request.GET.get('type') or 'RMPUR').strip().upper()
        config = PURSALES_TYPE_CONFIG.get(form_type, PURSALES_TYPE_CONFIG['RMPUR'])
        context['form_type'] = form_type
        context['form_type_label'] = config['label']
        context['form_type_tran'] = config['tran']
        context['form_type_title'] = config['title']
        context['form_type_badge'] = config['badge']

        # Dropdowns for form
        context['brokers'] = Broker.objects.all().order_by('BrokerName')
        context['suppliers'] = AccountMaster.objects.all().order_by('Account_Name')
        context['purchase_groups'] = SalPurGroup.objects.all().order_by('SalPurGroupName')

        # Filter items matching material type if possible
        items_qs = Material.objects.filter(is_active=True)
        type_filtered = None
        if 'RM' in form_type:
            type_filtered = items_qs.filter(Q(product_type__icontains='raw') | Q(product_type__iexact='rm') | Q(item_type_code__iexact='rm'))
        elif 'FG' in form_type:
            type_filtered = items_qs.filter(Q(product_type__icontains='finish') | Q(product_type__iexact='fg') | Q(item_type_code__iexact='fg'))
        elif 'SM' in form_type:
            type_filtered = items_qs.filter(Q(product_type__icontains='store') | Q(product_type__iexact='sm') | Q(store__icontains='store'))

        if type_filtered and type_filtered.exists():
            context['items'] = type_filtered.order_by('material_name')
        else:
            context['items'] = items_qs.order_by('material_name')

        context['zones'] = Zone.objects.all().order_by('ZoneName')

        # Dropdowns for terms (mapped to numeric IDs)
        context['delivery_terms_options'] = [
            {'id': 1, 'name': 'Ex Works/Ex-Godown'},
            {'id': 2, 'name': 'FOB'},
            {'id': 3, 'name': 'Door Delivery'},
            {'id': 4, 'name': 'FOB-FOT-FOR'},
            {'id': 5, 'name': 'CIF'},
            {'id': 6, 'name': 'EXW'},
            {'id': 7, 'name': 'DAP'},
        ]
        context['payment_terms_options'] = [
            {'id': 1, 'code': 'ADV', 'name': 'Advance Payment', 'days': 0},
            {'id': 2, 'code': 'IMMEDIATE', 'name': 'Immediate Payment', 'days': 0},
            {'id': 3, 'code': 'PARTPAY', 'name': 'Partial Payment', 'days': 0},
            {'id': 30, 'code': 'NET30', 'name': 'Net 30 Days', 'days': 30},
            {'id': 45, 'code': 'NET45', 'name': 'Net 45 Days', 'days': 45},
            {'id': 60, 'code': 'NET60', 'name': 'Net 60 Days', 'days': 60},
        ]
        context['freight_terms_options'] = [
            {'id': 1, 'name': 'Supplier Paid'},
            {'id': 2, 'name': 'Buyer Paid'},
            {'id': 3, 'name': 'To Be Billed'},
        ]
        context['incoterms_options'] = [
            {'id': 1, 'code': 'EXW', 'name': 'Ex Works'},
            {'id': 2, 'code': 'FOB', 'name': 'Free On Board'},
            {'id': 3, 'code': 'CIF', 'name': 'Cost, Insurance & Freight'},
            {'id': 4, 'code': 'DDP', 'name': 'Delivered Duty Paid'},
        ]

        # Calculate prev_pk and next_pk for record navigation
        pks = list(PurSales.objects.all().order_by('-VoucherDate', '-DatdCreated').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                if current_pk not in pks:
                    pks = list(PurSales.objects.all().order_by('-VoucherDate', '-DatdCreated').values_list('pk', flat=True))
                idx = pks.index(current_pk)
                # In a list sorted newest-first, index 0 is the newest.
                # "Next" should move down the list (to older records, idx + 1).
                # "Prev" should move up the list (to newer records, idx - 1).
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None
        return context
