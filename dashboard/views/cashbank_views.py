from django.views.generic import TemplateView
from dashboard.models import Category

class BankTransactionListView(TemplateView):
    template_name = 'dashboard/bank_transaction_list.html'

class BankTransactionCreateView(TemplateView):
    template_name = 'dashboard/bank_transaction_form.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Passed to template to know if it's edit or create
        context['voucher_no'] = self.kwargs.get('pk', '')
        context['categories'] = Category.objects.all()
        # View-only mode: set via ?mode=view query param
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')

        # Calculate prev_pk and next_pk for record navigation
        from dashboard.models.cashbank import CashBank
        pks = list(CashBank.objects.filter(tran_type='J001', module_type='', status=True).order_by('-date', '-date_created').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                if current_pk not in pks:
                    pks = list(CashBank.objects.filter(tran_type='J001', module_type='').order_by('-date', '-date_created').values_list('pk', flat=True))
                idx = pks.index(current_pk)
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None
        return context

