from django.views.generic import TemplateView
from dashboard.models import Category


class SubsectionB2ListView(TemplateView):
    """Serves the Sub Section B-2 transaction list page."""
    template_name = 'dashboard/subsection_b2_list.html'


class SubsectionB2CreateView(TemplateView):
    """
    Serves the Sub Section B-2 transaction form page.
    Works for both Create (/subsection-b2/create/) and
    Edit (/subsection-b2/<str:pk>/edit/) via the same template.
    APP_CONFIG.isEditMode is set in the template based on voucher_no presence.
    """
    template_name = 'dashboard/subsection_b2_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Passed to template → window.APP_CONFIG.voucherNo
        context['voucher_no'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')
        
        # Ensure Bank Accounts category exists and pass it
        category, _ = Category.objects.get_or_create(
            categoryName="Bank Accounts",
            defaults={"categoryType": "A"}
        )
        context['bank_category_id'] = category.id

        # Calculate prev_pk and next_pk for record navigation
        from dashboard.models.cashbank import CashBank
        pks = list(CashBank.objects.filter(module_type='B2', status=True).order_by('-date', '-date_created').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                if current_pk not in pks:
                    pks = list(CashBank.objects.filter(module_type='B2').order_by('-date', '-date_created').values_list('pk', flat=True))
                idx = pks.index(current_pk)
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None
        return context
