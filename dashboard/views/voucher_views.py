from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, View
from django.contrib import messages
from django.db.models import Sum, Q
from django.db import transaction
from django.http import HttpResponse
from datetime import datetime

from dashboard.models import Voucher, Category, VoucherFact
from dashboard.forms import VoucherForm, VoucherFactFormSet
from dashboard.services import VoucherImportService, VoucherExportService
from dashboard.constants import RowType

from dashboard.models.cashbank import CashBank, CashBankTran
from dashboard.services.transaction_sp_helper import execute_sp_manage_transaction
import types

class VoucherListView(ListView):
    """
    Displays the paginated list of Voucher records.
    Supports filtering by voucher number, date, and state.
    """
    model = CashBank
    template_name = 'dashboard/voucher_list.html'
    context_object_name = 'vouchers'

    def get_queryset(self):
        queryset = CashBank.objects.filter(tran_type='J000').order_by('-date', '-date_created')
        
        # Annotate total amount (sum of Type A facts)
        queryset = queryset.annotate(
            total_amount=Sum('transactions__amount', filter=Q(transactions__rpid='A'))
        )
        
        # Sorting
        sort_by = self.request.GET.get('sort', '-voucher_date')
        if sort_by == 'voucher_number':
            queryset = queryset.order_by('voucher_no')
        elif sort_by == '-voucher_number':
            queryset = queryset.order_by('-voucher_no')
        elif sort_by == 'date':
            queryset = queryset.order_by('date')
        elif sort_by == '-date':
            queryset = queryset.order_by('-date')
        elif sort_by == 'amount':
            queryset = queryset.order_by('total_amount')
        elif sort_by == '-amount':
            queryset = queryset.order_by('-total_amount')

        # Advanced Filters
        voucher_date = self.request.GET.get('voucher_date', '').strip()
        date_from = self.request.GET.get('date_from', '').strip()
        date_to = self.request.GET.get('date_to', '').strip()
        status_filter = self.request.GET.get('status', '').strip()

        if voucher_date:
            queryset = queryset.filter(date__date=voucher_date)
        if date_from:
            queryset = queryset.filter(date__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__date__lte=date_to)
            
        if status_filter == 'active':
            queryset = queryset.filter(status=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(status=False)

        # Search filter by selected criteria
        search_query = self.request.GET.get('search', '').strip()
        search_by = self.request.GET.get('search_by', 'voucher_number')
        
        if search_query:
            if search_by == 'voucher_number':
                queryset = queryset.filter(voucher_no__icontains=search_query)
            elif search_by == 'remarks':
                queryset = queryset.filter(narration__icontains=search_query)
            elif search_by == 'voucher_date':
                try:
                    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y'):
                        try:
                            dt = datetime.strptime(search_query, fmt).date()
                            queryset = queryset.filter(date__date=dt)
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass
            elif search_by == 'amount':
                try:
                    queryset = queryset.filter(transactions__amount=float(search_query)).distinct()
                except ValueError:
                    pass
            elif search_by == 'status':
                if search_query.lower() in ['active', 'yes', 'true', '1']:
                    queryset = queryset.filter(status=True)
                elif search_query.lower() in ['inactive', 'deleted', 'no', 'false', '0']:
                    queryset = queryset.filter(status=False)
            
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Preserve filters for pagination and standard logic
        context['search_query'] = self.request.GET.get('search', '')
        context['search_by'] = self.request.GET.get('search_by', 'voucher_number')
        context['voucher_date'] = self.request.GET.get('voucher_date', '')
        context['date_from'] = self.request.GET.get('date_from', '')
        context['date_to'] = self.request.GET.get('date_to', '')
        context['status_filter'] = self.request.GET.get('status', '')
        context['current_sort'] = self.request.GET.get('sort', '-voucher_date')
        
        # Calculate total amount of the filtered queryset
        queryset = self.get_queryset()
        total_amount = queryset.aggregate(
            total=Sum('transactions__amount', filter=Q(transactions__rpid='A'))
        )['total'] or 0.00
        context['total_amount'] = total_amount
        
        # Build query string for pagination links
        query_params = self.request.GET.copy()
        if 'page' in query_params:
            del query_params['page']
        context['query_string'] = query_params.urlencode()
        
        return context

class VoucherCreateView(CreateView):
    """View to handle creating a new Voucher with its FormSet facts."""
    model = Voucher
    form_class = VoucherForm
    template_name = 'dashboard/voucher_form.html'
    success_url = reverse_lazy('dashboard:voucher_list')

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        if self.request.POST:
            data['fact_formset'] = VoucherFactFormSet(self.request.POST, instance=Voucher(voucher_number=None))
        else:
            data['fact_formset'] = VoucherFactFormSet(instance=Voucher(voucher_number=None))
        data['categories'] = Category.objects.all()
        return data

    def form_valid(self, form):
        context = self.get_context_data()
        fact_formset = context['fact_formset']
        
        if fact_formset.is_valid():
            try:
                with transaction.atomic():
                    header_data = {
                        'voucher_no': form.cleaned_data.get('voucher_number'),
                        'date': form.cleaned_data.get('voucher_date'),
                        'tran_type': 'J000',
                        'rpid': None,
                        'amount': sum(f.cleaned_data.get('amount') for f in fact_formset.forms if f.cleaned_data.get('row_type') == 'A' and not f.cleaned_data.get('DELETE', False)),
                        'narration': form.cleaned_data.get('remarks') or '',
                        'bank_account': None
                    }
                    detail_rows = []
                    for f in fact_formset.forms:
                        if f.cleaned_data and not f.cleaned_data.get('DELETE', False):
                            detail_rows.append({
                                'account_master': f.cleaned_data.get('account_master'),
                                'amount': f.cleaned_data.get('amount'),
                                'remarks': f.cleaned_data.get('remarks') or '',
                                'rpid': f.cleaned_data.get('row_type')
                            })
                    username = self.request.user.username if self.request.user else 'system'
                    voucher_no = execute_sp_manage_transaction('INSERT', 'SECTION_A', header_data, detail_rows, username)
                messages.success(self.request, f"Voucher '{voucher_no}' successfully created!")
                return redirect(self.success_url)
            except Exception as e:
                messages.error(self.request, f"Error saving voucher: {str(e)}")
                return self.render_to_response(self.get_context_data(form=form))
        else:
            return self.render_to_response(self.get_context_data(form=form))

class VoucherUpdateView(UpdateView):
    """View to handle updating an existing Voucher with its FormSet facts."""
    model = Voucher
    form_class = VoucherForm
    template_name = 'dashboard/voucher_form.html'
    success_url = reverse_lazy('dashboard:voucher_list')

    def get_object(self, queryset=None):
        pk = self.kwargs.get(self.pk_url_kwarg) or self.kwargs.get('pk')
        cb = get_object_or_404(CashBank, voucher_no=pk, tran_type='J000')
        voucher = Voucher(
            pk=cb.voucher_no,
            voucher_number=cb.voucher_no,
            voucher_date=cb.date.date() if hasattr(cb.date, 'date') else cb.date,
            remarks=cb.narration,
            is_active=cb.status,
            created_at=cb.date_created,
            updated_at=cb.date_modified
        )
        return voucher

    def dispatch(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj.is_active:
            if request.method == 'POST' or request.GET.get('mode') != 'view':
                messages.error(request, f"Voucher '{obj.voucher_number}' is inactive and cannot be edited. Please activate it first.")
                return redirect('dashboard:voucher_list')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        from django.forms import inlineformset_factory
        from dashboard.forms.voucher_forms import VoucherFactForm, BaseVoucherFactFormSet
        
        UpdateFormSet = inlineformset_factory(
            Voucher,
            VoucherFact,
            form=VoucherFactForm,
            formset=BaseVoucherFactFormSet,
            extra=0,
            can_delete=True
        )

        trans = CashBankTran.objects.filter(voucher_id=self.object.voucher_number)
        facts = []
        for t in trans:
            fact = VoucherFact(
                pk=t.pk,
                voucher=self.object,
                row_type=t.rpid,
                account_master_id=t.account_master_id,
                voucher_date=t.date.date() if hasattr(t.date, 'date') else t.date,
                remarks=t.remarks,
                amount=t.amount
            )
            facts.append(fact)
        
        if self.request.POST:
            data['fact_formset'] = UpdateFormSet(self.request.POST, instance=self.object)
        else:
            data['fact_formset'] = UpdateFormSet(instance=self.object)

        # Inject transient queryset
        fs = data['fact_formset']
        fs.get_queryset = types.MethodType(lambda self_fs: facts, fs)
        fs.initial_form_count = types.MethodType(lambda self_fs: len(facts), fs)

        data['categories'] = Category.objects.all()
        data['is_view_mode'] = self.request.GET.get('mode') == 'view'

        # Calculate prev_pk and next_pk for record navigation
        pks = list(CashBank.objects.filter(tran_type='J000', status=True).order_by('-date', '-date_created').values_list('pk', flat=True))
        if not self.object.is_active:
            pks = list(CashBank.objects.filter(tran_type='J000').order_by('-date', '-date_created').values_list('pk', flat=True))
        try:
            idx = pks.index(self.object.pk)
            data['prev_pk'] = pks[idx - 1] if idx > 0 else None
            data['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
        except ValueError:
            data['prev_pk'] = data['next_pk'] = None

        return data

    def form_valid(self, form):
        context = self.get_context_data()
        fact_formset = context['fact_formset']
        
        if fact_formset.is_valid():
            try:
                with transaction.atomic():
                    original_voucher_no = self.kwargs.get('pk')
                    new_voucher_no = form.cleaned_data.get('voucher_number')
                    
                    if new_voucher_no != original_voucher_no:
                        # 1. Delete existing detail lines referencing the original voucher number
                        # to prevent foreign key constraint violations when renaming the parent.
                        CashBankTran.objects.filter(voucher_id=original_voucher_no).delete()
                        
                        # 2. Update the parent row's primary key (voucher_no) to the new voucher number.
                        # This works because constraint checking is deferred, and child rows have been deleted.
                        CashBank.objects.filter(voucher_no=original_voucher_no).update(voucher_no=new_voucher_no)
                    
                    header_data = {
                        'voucher_no': new_voucher_no,
                        'date': form.cleaned_data.get('voucher_date'),
                        'tran_type': 'J000',
                        'rpid': None,
                        'amount': sum(f.cleaned_data.get('amount') for f in fact_formset.forms if f.cleaned_data.get('row_type') == 'A' and not f.cleaned_data.get('DELETE', False)),
                        'narration': form.cleaned_data.get('remarks') or '',
                        'bank_account': None
                    }
                    detail_rows = []
                    for f in fact_formset.forms:
                        if f.cleaned_data and not f.cleaned_data.get('DELETE', False):
                            detail_rows.append({
                                'account_master': f.cleaned_data.get('account_master'),
                                'amount': f.cleaned_data.get('amount'),
                                'remarks': f.cleaned_data.get('remarks') or '',
                                'rpid': f.cleaned_data.get('row_type')
                            })
                    username = self.request.user.username if self.request.user else 'system'
                    execute_sp_manage_transaction('UPDATE', 'SECTION_A', header_data, detail_rows, username)
                messages.success(self.request, f"Voucher '{new_voucher_no}' successfully updated!")
                return redirect(self.success_url)
            except Exception as e:
                messages.error(self.request, f"Error updating voucher: {str(e)}")
                return self.render_to_response(self.get_context_data(form=form))
        else:
            return self.render_to_response(self.get_context_data(form=form))

class VoucherToggleStatusView(View):
    """Soft deletes/restores a record by toggling 'status'."""
    def post(self, request, pk, *args, **kwargs):
        cb = get_object_or_404(CashBank, pk=pk, tran_type='J000')
        new_status = not cb.status
        username = request.user.username if request.user else 'system'
        if not new_status:
            execute_sp_manage_transaction('DELETE', 'SECTION_A', {'voucher_no': pk}, [], username)
        else:
            cb.status = True
            cb.save()
        status_text = "activated" if new_status else "deactivated (soft deleted)"
        messages.success(request, f"Voucher '{pk}' successfully {status_text}.")
        return redirect('dashboard:voucher_list')

class VoucherDeleteView(View):
    """Permanent delete."""
    def post(self, request, pk, *args, **kwargs):
        cb = get_object_or_404(CashBank, pk=pk, tran_type='J000')
        if cb.status:
            messages.error(request, f"Cannot delete '{pk}' because it is currently Active. Please Mark Inactive/Deleted first.")
            return redirect('dashboard:voucher_list')
        username = request.user.username if request.user else 'system'
        execute_sp_manage_transaction('HARD_DELETE', 'SECTION_A', {'voucher_no': pk}, [], username)
        messages.success(request, f"Voucher '{pk}' was permanently deleted.")
        return redirect('dashboard:voucher_list')

class ExportVoucherView(View):
    """View executing VoucherExportService to process excel generation."""
    def get(self, request, *args, **kwargs):
        queryset = CashBank.objects.filter(tran_type='J000').order_by('-date', '-date_created')
        queryset = queryset.annotate(
            total_amount=Sum('transactions__amount', filter=Q(transactions__rpid='A'))
        )
        
        voucher_date = request.GET.get('voucher_date', '').strip()
        date_from = request.GET.get('date_from', '').strip()
        date_to = request.GET.get('date_to', '').strip()
        status_filter = request.GET.get('status', '').strip()

        if voucher_date:
            queryset = queryset.filter(date__date=voucher_date)
        if date_from:
            queryset = queryset.filter(date__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__date__lte=date_to)
            
        if status_filter == 'active':
            queryset = queryset.filter(status=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(status=False)

        search_query = request.GET.get('search', '').strip()
        search_by = request.GET.get('search_by', 'voucher_number')
        
        if search_query:
            if search_by == 'voucher_number':
                queryset = queryset.filter(voucher_no__icontains=search_query)
            elif search_by == 'remarks':
                queryset = queryset.filter(narration__icontains=search_query)
            elif search_by == 'voucher_date':
                try:
                    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y'):
                        try:
                            dt = datetime.strptime(search_query, fmt).date()
                            queryset = queryset.filter(date__date=dt)
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass
            elif search_by == 'amount':
                try:
                    queryset = queryset.filter(transactions__amount=float(search_query)).distinct()
                except ValueError:
                    pass
            elif search_by == 'status':
                if search_query.lower() in ['active', 'yes', 'true', '1']:
                    queryset = queryset.filter(status=True)
                elif search_query.lower() in ['inactive', 'deleted', 'no', 'false', '0']:
                    queryset = queryset.filter(status=False)

        wb = VoucherExportService.generate_excel(queryset)
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        date_str = datetime.now().strftime('%Y%m%d')
        response['Content-Disposition'] = f'attachment; filename="vouchers_export_{date_str}.xlsx"'
        wb.save(response)
        return response

class ImportVoucherView(View):
    """View utilizing VoucherImportService to parse and store rows."""
    def post(self, request, *args, **kwargs):
        excel_file = request.FILES.get('import_file')
        if not excel_file:
            messages.error(request, 'No file uploaded.')
            return redirect('dashboard:voucher_list')
        
        if not excel_file.name.endswith('.xlsx'):
            messages.error(request, 'Invalid file format. Please upload an .xlsx file.')
            return redirect('dashboard:voucher_list')

        try:
            # Shift heavy logic to proper layer
            vouchers_data = VoucherImportService.parse_and_validate_excel(excel_file)
            imported_count = VoucherImportService.process_imported_vouchers(vouchers_data)
            messages.success(request, f"Successfully imported {imported_count} vouchers.")
        except ValueError as ve:
            messages.error(request, str(ve))
        except Exception as e:
            messages.error(request, f"Unexpected Import Error: {str(e)}")
            
        return redirect('dashboard:voucher_list')
