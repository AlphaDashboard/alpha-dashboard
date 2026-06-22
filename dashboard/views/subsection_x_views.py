from django.views.generic import TemplateView
from dashboard.models import AccountMaster, Material, Broker, VendorSupplier, SalPurGroup
from dashboard.models.purchase_order import PurchaseOrder

class SubSectionXListView(TemplateView):
    """Serves the Sub Section X (Purchase Order) list page."""
    template_name = 'dashboard/subsection_x_list.html'


class SubSectionXCreateView(TemplateView):
    """
    Serves the Sub Section X (Purchase Order) creation/edit/view-only form page.
    """
    template_name = 'dashboard/subsection_x_form.html'

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
        pks = list(PurchaseOrder.objects.filter(status=True).order_by('-po_date', '-date_created').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                if current_pk not in pks:
                    pks = list(PurchaseOrder.objects.all().order_by('-po_date', '-date_created').values_list('pk', flat=True))
                idx = pks.index(current_pk)
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None

            # Pass the PO's current status so the template can conditionally show/hide Edit button
            try:
                po_obj = PurchaseOrder.objects.get(pk=current_pk)
                context['po_status'] = po_obj.po_status
            except PurchaseOrder.DoesNotExist:
                context['po_status'] = 'Draft'
        else:
            context['po_status'] = 'Draft'
        return context

from django.views import View
from django.http import JsonResponse

class MaterialCreateAPIView(View):
    def post(self, request, *args, **kwargs):
        name = request.POST.get('material_name', '').strip()
        code = request.POST.get('material_code', '').strip()

        if not name:
            return JsonResponse({'success': False, 'errors': {'material_name': 'Material name is required.'}})

        # Auto-generate code if empty
        if not code:
            count = Material.objects.count()
            code = f"M-{count + 101:03d}"
            while Material.objects.filter(material_code=code).exists():
                count += 1
                code = f"M-{count + 101:03d}"
        
        if Material.objects.filter(material_code=code).exists():
            return JsonResponse({'success': False, 'errors': {'material_code': 'Item Code already exists.'}})

        try:
            material = Material.objects.create(material_code=code, material_name=name, is_active=True)
            return JsonResponse({
                'success': True,
                'id': material.id,
                'text': material.material_name,
                'code': material.material_code
            })
        except Exception as e:
            return JsonResponse({'success': False, 'errors': {'general': str(e)}})


class BrokerCreateAPIView(View):
    def post(self, request, *args, **kwargs):
        name = request.POST.get('broker_name', '').strip()
        if not name:
            return JsonResponse({'success': False, 'errors': {'broker_name': 'Broker Name is required.'}})
        
        try:
            from django.db.models import Max
            max_id = Broker.objects.aggregate(max_id=Max('BrokerID'))['max_id'] or 0
            broker = Broker.objects.create(
                BrokerID=max_id + 1,
                BrokerName=name
            )
            return JsonResponse({
                'success': True,
                'id': broker.BrokerID,
                'text': broker.BrokerName
            })
        except Exception as e:
            return JsonResponse({'success': False, 'errors': {'general': str(e)}})


class VendorSupplierCreateAPIView(View):
    def post(self, request, *args, **kwargs):
        name = request.POST.get('supplier_name', '').strip()
        if not name:
            return JsonResponse({'success': False, 'errors': {'supplier_name': 'Supplier Name is required.'}})
        
        try:
            from django.db.models import Max
            max_id = VendorSupplier.objects.aggregate(max_id=Max('VendorSupplierID'))['max_id'] or 0
            supplier = VendorSupplier.objects.create(
                VendorSupplierID=max_id + 1,
                VendorSupplierName=name
            )
            return JsonResponse({
                'success': True,
                'id': supplier.VendorSupplierID,
                'text': supplier.VendorSupplierName
            })
        except Exception as e:
            return JsonResponse({'success': False, 'errors': {'general': str(e)}})
