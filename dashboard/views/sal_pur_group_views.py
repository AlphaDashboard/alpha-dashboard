from django.views.generic import TemplateView
from dashboard.models import AccountMaster, Category
from dashboard.models.sal_pur_group import SalPurGroup

class SalPurGroupListView(TemplateView):
    """Serves the Sales/Purchase Group list page."""
    template_name = 'dashboard/sal_pur_group_list.html'

class SalPurGroupCreateView(TemplateView):
    """
    Serves the Sales/Purchase Group form page (Create/Edit).
    """
    template_name = 'dashboard/sal_pur_group_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['group_id'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')
        
        # Pass AccountMaster objects for dropdowns
        context['accounts'] = AccountMaster.objects.filter(is_active=True).order_by('Account_Name')
        context['categories'] = Category.objects.all()

        # Pagination for navigation
        pks = list(SalPurGroup.objects.all().order_by('-DateCreated').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                # Convert current_pk to same type as DB (often int for BigAutoField)
                current_pk_val = int(current_pk)
                if current_pk_val not in pks:
                    pks = list(SalPurGroup.objects.all().order_by('-DateCreated').values_list('pk', flat=True))
                idx = pks.index(current_pk_val)
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None
        return context
