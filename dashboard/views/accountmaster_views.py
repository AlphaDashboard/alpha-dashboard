from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, View
from django.contrib import messages
from django.db.models import Q
from django.http import JsonResponse
from django.db.models.deletion import ProtectedError
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator

from dashboard.models import AccountMaster, Category
from dashboard.forms import AccountMasterForm

class AccountMasterListView(ListView):
    """
    Displays the list of AccountMaster records.
    Supports filtering by name and category.
    """
    model = AccountMaster
    template_name = 'dashboard/accountmaster_list.html'
    context_object_name = 'account_masters'

    def get_queryset(self):
        queryset = AccountMaster.objects.all()
        
        search_query = self.request.GET.get('search', '').strip()
        search_by = self.request.GET.get('search_by', 'Account_Name')
 
        if search_query:
            if search_by == 'groupID':
                try:
                    val = int(search_query)
                    queryset = queryset.filter(groupID=val)
                except ValueError:
                    queryset = queryset.none()
            elif search_by == 'display_name':
                queryset = queryset.filter(display_name__icontains=search_query)
            else:
                queryset = queryset.filter(Account_Name__icontains=search_query)
            
        category_filter = self.request.GET.get('category', '').strip()
        if category_filter:
            queryset = queryset.filter(category=category_filter)
            
        status_filter = self.request.GET.get('status', '').strip()
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
            
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search_query'] = self.request.GET.get('search', '')
        context['search_by'] = self.request.GET.get('search_by', 'Account_Name')
        context['category_filter'] = self.request.GET.get('category', '')
        context['status_filter'] = self.request.GET.get('status', '')
        context['categories'] = Category.objects.all()
        context['alpha_form'] = AccountMasterForm()
        return context

class AccountMasterCreateView(CreateView):
    """View to handle creating a new AccountMaster record."""
    model = AccountMaster
    form_class = AccountMasterForm
    template_name = 'dashboard/accountmaster_form.html'
    success_url = reverse_lazy('dashboard:alpha_list')
    
    def get_initial(self):
        initial = super().get_initial()
        name = self.request.GET.get('name')
        if name:
            initial['Account_Name'] = name
        return initial
        
    def get_success_url(self):
        next_url = self.request.GET.get('next')
        if next_url:
            from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
            parsed = urlparse(next_url)
            query_params = parse_qsl(parsed.query)
            if hasattr(self, 'object') and self.object:
                query_params.append(('created_accountmaster_id', str(self.object.id)))
                query_params.append(('created_accountmaster_text', f"{self.object.Account_Name} [Bal: {self.object.cl_bal}]"))
            new_query = urlencode(query_params)
            new_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
            return new_url
        return super().get_success_url()

    def form_valid(self, form):
        from django.db import IntegrityError
        try:
            response = super().form_valid(form)
            if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'id': self.object.id,
                    'text': f"{self.object.Account_Name} [Bal: {self.object.cl_bal}]",
                    'message': f"AccountMaster record '{self.object.Account_Name}' successfully created!"
                })
            messages.success(self.request, f"AccountMaster record '{form.instance.Account_Name}' successfully created!")
            return response
        except IntegrityError as e:
            if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': "Database error: An account with this name or Group ID already exists."
                }, status=400)
            messages.error(self.request, "An account with this name or Group ID already exists.")
            return self.form_invalid(form)

    def form_invalid(self, form):
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'errors': form.errors
            }, status=400)
        return super().form_invalid(form)

@method_decorator(never_cache, name='dispatch')
class AccountMasterUpdateView(UpdateView):
    """View to handle updating an existing AccountMaster record."""
    model = AccountMaster
    form_class = AccountMasterForm
    template_name = 'dashboard/accountmaster_form.html'
    success_url = reverse_lazy('dashboard:alpha_list')

    def dispatch(self, request, *args, **kwargs):
        obj = self.get_object()
        if not obj.is_active:
            if request.method == 'POST' or request.GET.get('mode') != 'view':
                messages.error(request, f"AccountMaster record '{obj.Account_Name}' is inactive and cannot be edited. Please activate it first.")
                return redirect('dashboard:alpha_list')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        messages.success(self.request, f"AccountMaster record '{form.instance.Account_Name}' successfully updated!")
        return super().form_valid(form)

class AccountMasterToggleStatusView(View):
    """Toggles the 'is_active' status of a record."""
    def post(self, request, pk, *args, **kwargs):
        account_master = get_object_or_404(AccountMaster, pk=pk)
        account_master.is_active = not account_master.is_active
        account_master.save()
        status_text = "activated" if account_master.is_active else "deactivated"
        
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'is_active': account_master.is_active,
                'message': f"AccountMaster record '{account_master.Account_Name}' successfully {status_text}."
            })
            
        messages.success(request, f"AccountMaster record '{account_master.Account_Name}' successfully {status_text}.")
        return redirect('dashboard:alpha_list')

class AccountMasterDeleteView(View):
    """Permanently deletes an AccountMaster record."""
    def post(self, request, pk, *args, **kwargs):
        account_master = get_object_or_404(AccountMaster, pk=pk)
        if account_master.is_active:
            messages.error(request, f"Cannot delete '{account_master.Account_Name}' because it is currently Active. Please Mark Inactive first.")
            return redirect('dashboard:alpha_list')
        
        name = account_master.Account_Name
        try:
            account_master.delete()
            messages.success(request, f"AccountMaster record '{name}' permanently deleted.")
        except ProtectedError:
            messages.error(request, f"Cannot delete '{name}' because it is linked to existing Vouchers. Since it is already Inactive, it is preserved in your records to protect transaction history.")
        return redirect('dashboard:alpha_list')

class AccountMasterGroupSearchView(View):
    """
    API endpoint for Select2 to fetch AccountMaster groups async.
    """
    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '')
        if query:
            q_filter = Q(Account_Name__icontains=query) | Q(display_name__icontains=query)
            try:
                val = int(query)
                q_filter |= Q(groupID=val)
            except ValueError:
                pass
            qs = AccountMaster.objects.filter(is_active=True).filter(q_filter)[:20]
        else:
            qs = AccountMaster.objects.filter(is_active=True)[:20]
            
        results = [
            {
                'id': obj.id, 
                'text': f"{obj.Account_Name} [Bal: {obj.cl_bal}]",
                'groupID': obj.groupID,
                'code': str(obj.groupID or ''),
                'Account_Name': obj.Account_Name,
                'account_name': obj.Account_Name,
                'display_name': obj.display_name,
                'cl_bal': str(obj.cl_bal)
            } 
            for obj in qs
        ]
        return JsonResponse({'results': results})
 
class AccountMasterGroupDetailView(View):
    """
    API endpoint to fetch a single AccountMaster group detail (specifically cl_bal).
    """
    def get(self, request, pk, *args, **kwargs):
        account_master = get_object_or_404(AccountMaster, pk=pk)
        return JsonResponse({
            'id': account_master.id,
            'groupID': account_master.groupID,
            'code': str(account_master.groupID or ''),
            'Account_Name': account_master.Account_Name,
            'account_name': account_master.Account_Name,
            'display_name': account_master.display_name,
            'cl_bal': str(account_master.cl_bal)
        })

