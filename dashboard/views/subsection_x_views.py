from django.views.generic import TemplateView
from django.db.models import Q
from dashboard.models import AccountMaster, Material, Broker, VendorSupplier, SalPurGroup
from dashboard.models.purchase_order import PurchaseOrder

TYPE_CONFIG = {
    'RMPO': {'label': 'Raw Materials',   'title': 'Raw Material Purchase Order',   'badge': 'Raw Materials'},
    'FPPO': {'label': 'Finished Goods',  'title': 'Finished Goods Purchase Order',  'badge': 'Finished Goods'},
    'SMPO': {'label': 'Store Materials', 'title': 'Store Material Purchase Order', 'badge': 'Store Materials'},
}

class SubSectionXListView(TemplateView):
    """Serves the Sub Section X (Purchase Order) list page."""
    template_name = 'dashboard/subsection_x_list.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        po_type = (self.request.GET.get('type') or self.request.GET.get('po_type') or 'RMPO').strip().upper()
        config = TYPE_CONFIG.get(po_type, TYPE_CONFIG['RMPO'])
        context['po_type'] = po_type
        context['po_type_label'] = config['label']
        context['po_type_title'] = config['title']
        context['po_type_badge'] = config['badge']
        return context


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

        current_pk = self.kwargs.get('pk', '')
        po_type = (self.request.GET.get('type') or self.request.GET.get('po_type') or '').strip().upper()

        # Calculate prev_pk and next_pk for record navigation
        pks = list(PurchaseOrder.objects.filter(status=True).order_by('-po_date', '-date_created').values_list('pk', flat=True))
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
                if not po_type and hasattr(po_obj, 'po_type') and po_obj.po_type:
                    po_type = po_obj.po_type
            except PurchaseOrder.DoesNotExist:
                context['po_status'] = 'Draft'
        else:
            context['po_status'] = 'Draft'

        if not po_type or po_type not in TYPE_CONFIG:
            po_type = 'RMPO'

        config = TYPE_CONFIG.get(po_type, TYPE_CONFIG['RMPO'])
        context['po_type'] = po_type
        context['po_type_label'] = config['label']
        context['po_type_title'] = config['title']
        context['po_type_badge'] = config['badge']

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

        # Context-aware Material items (fallback to all if no subset matches)
        items_qs = Material.objects.filter(is_active=True)
        type_filtered = None
        if po_type == 'RMPO':
            type_filtered = items_qs.filter(Q(product_type__icontains='raw') | Q(product_type__iexact='rm') | Q(item_type_code__iexact='rm'))
        elif po_type == 'FPPO':
            type_filtered = items_qs.filter(Q(product_type__icontains='finish') | Q(product_type__iexact='fg') | Q(item_type_code__iexact='fg'))
        elif po_type == 'SMPO':
            type_filtered = items_qs.filter(Q(product_type__icontains='store') | Q(product_type__iexact='sm') | Q(store__icontains='store'))

        if type_filtered and type_filtered.exists():
            context['items'] = type_filtered.order_by('material_name')
        else:
            context['items'] = items_qs.order_by('material_name')

        context['sal_pur_groups'] = SalPurGroup.objects.filter(is_active=True).order_by('SalPurGroupName')

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


class VendorSupplierDetailAPIView(View):
    """Returns details (contact, address, GST) for a selected vendor/supplier."""
    def get(self, request, pk, *args, **kwargs):
        try:
            supplier = VendorSupplier.objects.get(VendorSupplierID=pk)
            address_parts = [p.strip() for p in [supplier.Address1, supplier.Address2] if p and p.strip()]
            full_address = ", ".join(address_parts)
            return JsonResponse({
                'success': True,
                'id': supplier.VendorSupplierID,
                'name': supplier.VendorSupplierName,
                'contact_no': supplier.ContactNo or '',
                'address': full_address,
                'gst_no': supplier.GSTNo or '',
                'pan_no': supplier.PANo or ''
            })
        except VendorSupplier.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Supplier not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

