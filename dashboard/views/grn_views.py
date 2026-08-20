from django.views.generic import TemplateView


class GRNListView(TemplateView):
    """Serves the GRN list page (Subsection X0)."""
    template_name = 'dashboard/grn_list.html'


class GRNCreateView(TemplateView):
    """
    Serves the GRN create/edit form page.
    Works for both Create (/grn/create/) and Edit (/grn/<pk>/edit/).
    """
    template_name = 'dashboard/grn_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['grn_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')
        context['prev_pk'] = None
        context['next_pk'] = None

        # Pass active materials to template context
        try:
            from dashboard.models import Material
            context['materials'] = Material.objects.filter(is_active=True).order_by('material_name')
        except Exception:
            context['materials'] = []

        # Pagination: prev / next record navigation
        # Wrapped in try/except — tblGRN may not exist yet in the database.
        # Once the DBA creates the table/view, this will work automatically.
        try:
            from dashboard.models.grn import GRN
            pks = list(GRN.objects.all().order_by('-GrnDate', '-GrnNo').values_list('GrnNo', flat=True))
            current_pk = self.kwargs.get('pk', '')
            if current_pk:
                try:
                    idx = pks.index(current_pk)
                    context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                    context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
                except (ValueError, IndexError):
                    pass
        except Exception:
            # tblGRN does not exist yet — page still loads safely
            pass

        return context
