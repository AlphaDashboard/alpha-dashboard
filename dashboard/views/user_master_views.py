from django.views.generic import TemplateView
from django.views import View
from django.shortcuts import render, redirect
from django.contrib import messages
from dashboard.models.user_master import UserMaster

class UserMasterListView(TemplateView):
    """Serves the User Master list page."""
    template_name = 'dashboard/user_master_list.html'

class UserMasterCreateView(TemplateView):
    """
    Serves the User Master form page (Create/Edit).
    """
    template_name = 'dashboard/user_master_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['user_id'] = self.kwargs.get('pk', '')
        context['is_view_mode'] = (self.request.GET.get('mode') == 'view')

        # Pagination for navigation
        pks = list(UserMaster.objects.all().order_by('user_id').values_list('pk', flat=True))
        current_pk = self.kwargs.get('pk', '')
        if current_pk:
            try:
                if current_pk not in pks:
                    pks = list(UserMaster.objects.all().order_by('user_id').values_list('pk', flat=True))
                idx = pks.index(current_pk)
                context['prev_pk'] = pks[idx - 1] if idx > 0 else None
                context['next_pk'] = pks[idx + 1] if idx < len(pks) - 1 else None
            except ValueError:
                context['prev_pk'] = context['next_pk'] = None
        return context

class LoginView(View):
    """
    Renders login view and handles session authentication.
    Seeds default Maker, Checker, and Admin users if table is empty.
    """
    def get(self, request):
        # Ensure default prototype users always exist
        default_users = [
            {'user_id': 'maker', 'user_name': 'Maker User', 'role': 'Maker', 'empid': 'EMP-MAKER'},
            {'user_id': 'checker', 'user_name': 'Checker User', 'role': 'Checker', 'empid': 'EMP-CHECKER'},
            {'user_id': 'admin', 'user_name': 'Admin User', 'role': 'Admin', 'empid': 'EMP-ADMIN'},
        ]
        for u_info in default_users:
            if not UserMaster.objects.filter(user_id=u_info['user_id']).exists():
                UserMaster.objects.create(
                    user_id=u_info['user_id'],
                    user_name=u_info['user_name'],
                    role=u_info['role'],
                    empid=u_info['empid'],
                    is_active=True,
                    user_created='system'
                )

        # Clear any existing session before logging in
        if 'user_id' in request.session:
            request.session.flush()

        users = UserMaster.objects.filter(is_active=True).order_by('role', 'user_name')
        return render(request, 'dashboard/login.html', {'users': users})

    def post(self, request):
        user_id = request.POST.get('user_id')
        if not user_id:
            messages.error(request, 'Please select a user to login.')
            return redirect('dashboard:login')

        try:
            user = UserMaster.objects.get(user_id=user_id, is_active=True)
            request.session['user_id'] = user.user_id
            request.session['user_name'] = user.user_name
            request.session['role'] = user.role
            return redirect('dashboard:alpha_list')
        except UserMaster.DoesNotExist:
            messages.error(request, 'Selected user record is invalid or inactive.')
            return redirect('dashboard:login')

class LogoutView(View):
    """
    Clears session credentials and redirects to login screen.
    """
    def get(self, request):
        request.session.flush()
        return redirect('dashboard:login')
