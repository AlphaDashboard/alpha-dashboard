from django.views.generic import TemplateView


class PurchaseChallanListView(TemplateView):
    """Serves the Purchase Challan list page."""
    template_name = 'dashboard/purchase_challan_list.html'


class PurchaseChallanCreateView(TemplateView):
    """
    Serves the Purchase Challan create/edit form page.
    Works for both Create (/purchase-challan/create/) and Edit (/purchase-challan/<pk>/edit/).
    """
    template_name = 'dashboard/purchase_challan_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['challan_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')
        context['prev_pk'] = None
        context['next_pk'] = None

        # Pass active materials to template context
        try:
            from dashboard.models import Material
            context['materials'] = Material.objects.filter(is_active=True).order_by('material_name')
        except Exception:
            context['materials'] = []

        # Pass active suppliers to template context
        try:
            from dashboard.models import VendorSupplier
            context['suppliers'] = VendorSupplier.objects.filter(is_active=True).order_by('VendorSupplierName')
        except Exception:
            context['suppliers'] = []

        # Pagination: prev / next record navigation
        try:
            from dashboard.models.purchase_challan import PurchaseChallan
            pks = list(
                PurchaseChallan.objects.all()
                .order_by('-ChallanDate', '-ChallanNo')
                .values_list('ChallanNo', flat=True)
            )
            current_pk = self.kwargs.get('pk', '')
            if current_pk:
                try:
                    idx = pks.index(current_pk)
                    context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                    context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
                except (ValueError, IndexError):
                    pass
        except Exception:
            # tblSalePurchaseChallans does not exist yet — page still loads safely
            pass

        return context
