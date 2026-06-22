from django.views.generic import TemplateView
from dashboard.models import Category, AccountMaster, Material, Broker, Zone, SalPurGroup
from dashboard.models.pur_sales import PurSales

class SubSectionYListView(TemplateView):
    template_name = 'dashboard/subsection_y_list.html'

class SubSectionYCreateView(TemplateView):
    template_name = 'dashboard/subsection_y_form.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Passed to template to know if it's edit or create
        context['voucher_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')

        # Dropdowns for form
        context['brokers'] = Broker.objects.all().order_by('BrokerName')
        context['suppliers'] = AccountMaster.objects.all().order_by('Account_Name')
        context['purchase_groups'] = SalPurGroup.objects.all().order_by('SalPurGroupName')
        context['items'] = Material.objects.filter(is_active=True).order_by('material_name')
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
