from django.views.generic import TemplateView
from dashboard.models import AccountMaster, Material, Broker, Zone, VendorSupplier, SalPurGroup
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

        context['items'] = Material.objects.filter(is_active=True).order_by('material_name')
        context['sal_pur_groups'] = SalPurGroup.objects.filter(is_active=True).order_by('SalPurGroupName')

        # Calculate prev_pk and next_pk for record navigation
        current_pk = self.kwargs.get('pk', '')
        context['prev_pk'] = None
        context['next_pk'] = None
        context['bill_status'] = 'Draft'

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

                    # Pass the Bill's current status so the template can conditionally show/hide Edit button
                    try:
                        bill_obj = PurchaseBill.objects.get(pk=current_pk)
                        context['bill_status'] = bill_obj.bill_status
                    except PurchaseBill.DoesNotExist:
                        context['bill_status'] = 'Draft'
        except Exception:
            pass

        return context
