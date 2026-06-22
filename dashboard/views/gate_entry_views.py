from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import View, DetailView
from django.contrib import messages
from django.urls import reverse
from dashboard.models import GateEntry, Material, AccountMaster
from dashboard.forms import GateEntryForm

class GateEntryView(View):
    """
    Handles Gate Entry creation and displays recent logs in a unified, high-density ERP interface.
    """
    template_name = 'dashboard/gate_entry.html'

    def get_queryset(self):
        return GateEntry.objects.all().order_by('-created_at')[:10]

    def get_next_gate_pass_id(self):
        last_entry = GateEntry.objects.all().order_by('id').last()
        if last_entry and last_entry.gate_pass_id:
            try:
                last_num = int(last_entry.gate_pass_id.replace('GP-', ''))
                return f"GP-{last_num + 1}"
            except ValueError:
                return f"GP-{last_entry.id + 10001}"
        return "GP-10001"

    def get(self, request, *args, **kwargs):
        # Automatic Material Seeding on first run to ensure immediate working options
        if not Material.objects.exists():
            default_materials = [
                ('M-001', 'Wheat'),
                ('M-002', 'Rice'),
                ('M-003', 'Grains'),
                ('M-004', 'Sugar'),
                ('M-005', 'Salt'),
                ('M-006', 'Iron'),
                ('M-007', 'Coal'),
            ]
            for code, name in default_materials:
                Material.objects.create(material_code=code, material_name=name)

        form = GateEntryForm()
        recent_entries = self.get_queryset()
        next_pass_id = self.get_next_gate_pass_id()

        context = {
            'form': form,
            'recent_entries': recent_entries,
            'next_pass_id': next_pass_id,
            'categories': AccountMaster.active_objects.all().order_by('Account_Name') # for supplier options standard fallback
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        form = GateEntryForm(request.POST)
        if form.is_valid():
            try:
                gate_entry = form.save(commit=False)
                # Link currently logged in user as the creator
                if request.user.is_authenticated:
                    gate_entry.created_by = request.user
                gate_entry.save()
                
                messages.success(request, f"Gate Pass Entry '{gate_entry.gate_pass_id}' successfully saved!")
                
                # Check if they clicked print stip or standard save
                if 'print_pass' in request.POST or request.POST.get('action') == 'print':
                    # Redirect to print slip
                    return redirect('dashboard:gate_entry_print', pk=gate_entry.pk)
                
                return redirect('dashboard:gate_entry')
            except Exception as e:
                messages.error(request, f"Error saving gate entry: {str(e)}")
        else:
            # Gather errors for clear user feedback
            errors_str = " ".join([f"{field}: {','.join(errs)}" for field, errs in form.errors.items()])
            messages.error(request, f"Validation failed! Please correct fields: {errors_str}")

        # Render with errors
        recent_entries = self.get_queryset()
        next_pass_id = self.get_next_gate_pass_id()
        context = {
            'form': form,
            'recent_entries': recent_entries,
            'next_pass_id': next_pass_id,
        }
        return render(request, self.template_name, context)


class GateEntryPrintView(DetailView):
    """
    Renders a premium, minimalist high-contrast printable pass optimized for A4 and thermal printers.
    Auto-triggers browser window.print() on load.
    """
    model = GateEntry
    template_name = 'dashboard/gate_entry_print.html'
    context_object_name = 'entry'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Pass currently logged-in user name as printer operator
        if self.request.user.is_authenticated:
            context['operator_name'] = self.request.user.get_full_name() or self.request.user.username
        else:
            context['operator_name'] = "Admin User"
        return context
