from django.views.generic import TemplateView


class WeighmentListView(TemplateView):
    """Serves the Weighment list page."""
    template_name = 'dashboard/weighment_list.html'


class WeighmentCreateView(TemplateView):
    """
    Serves the Weighment create/edit form page.
    Works for both Create (/weighment/create/) and Edit (/weighment/<pk>/edit/).
    """
    template_name = 'dashboard/weighment_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['slip_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')
        # Pass active materials to template context
        try:
            from dashboard.models import Material
            context['materials'] = Material.objects.filter(is_active=True).order_by('material_name')
        except Exception:
            context['materials'] = []

        context['prev_pk'] = None
        context['next_pk'] = None

        # Pagination: prev / next record navigation
        try:
            from dashboard.models.weighment import Weighment
            pks = list(
                Weighment.objects.all()
                .order_by('-DraftedDate', '-WeighmentSlipNo')
                .values_list('WeighmentSlipNo', flat=True)
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
            pass

        return context
