from django.views.generic import TemplateView
from dashboard.models import AccountMaster, Material, Broker, VendorSupplier, SalPurGroup
from dashboard.models.purchase_bill import PurchaseBill


class PurchaseBillListView(TemplateView):
    """Serves the Purchase Bill (RMPBL) list page."""
    template_name = 'dashboard/purchase_bill_list.html'


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

        # Dropdowns for form
        context['brokers'] = Broker.objects.all().order_by('BrokerName')
        context['suppliers'] = VendorSupplier.objects.all().order_by('VendorSupplierName')
        context['items'] = Material.objects.filter(is_active=True).order_by('material_name')
        context['sal_pur_groups'] = SalPurGroup.objects.filter(is_active=True).order_by('SalPurGroupName')

        # Calculate prev_pk and next_pk for record navigation
        pks = list(PurchaseBill.objects.filter(status=True).order_by('-bill_date', '-date_created').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                if current_pk not in pks:
                    pks = list(PurchaseBill.objects.all().order_by('-bill_date', '-date_created').values_list('pk', flat=True))
                idx = pks.index(current_pk)
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None

            # Pass the Bill's current status so the template can conditionally show/hide Edit button
            try:
                bill_obj = PurchaseBill.objects.get(pk=current_pk)
                context['bill_status'] = bill_obj.bill_status
            except PurchaseBill.DoesNotExist:
                context['bill_status'] = 'Draft'
        else:
            context['bill_status'] = 'Draft'
        return context
