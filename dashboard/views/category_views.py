from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import View
from django.http import JsonResponse
from django.contrib import messages
from django.db.models import Q, ProtectedError

from dashboard.models import Category


class AccountGroupListView(View):
    """
    Displays the list of Category (Account Group) records.
    Supports search by name and filter by type.
    """
    template_name = 'dashboard/account_group_list.html'

    def get(self, request, *args, **kwargs):
        queryset = Category.objects.all().order_by('categoryName')

        search_query = request.GET.get('search', '').strip()
        type_filter = request.GET.get('type', '').strip()

        if search_query:
            queryset = queryset.filter(categoryName__icontains=search_query)

        if type_filter:
            queryset = queryset.filter(categoryType=type_filter)

        context = {
            'categories': queryset,
            'search_query': search_query,
            'type_filter': type_filter,
            'type_choices': [('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        }
        return render(request, self.template_name, context)


class AccountGroupCreateView(View):
    """Creates a new Category (Account Group) record."""

    def post(self, request, *args, **kwargs):
        name = request.POST.get('categoryName', '').strip()
        cat_type = request.POST.get('categoryType', 'A').strip()

        if not name:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Category Name is required.'}, status=400)
            messages.error(request, 'Category Name is required.')
            return redirect('dashboard:account_group_list')

        category = Category.objects.create(categoryName=name, categoryType=cat_type)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'id': category.pk,
                'categoryName': category.categoryName,
                'categoryType': category.categoryType,
                'message': f"Account Group '{category.categoryName}' created successfully!"
            })
        messages.success(request, f"Account Group '{category.categoryName}' created successfully!")
        return redirect('dashboard:account_group_list')


class AccountGroupUpdateView(View):
    """Updates an existing Category (Account Group) record."""

    def post(self, request, pk, *args, **kwargs):
        category = get_object_or_404(Category, pk=pk)
        name = request.POST.get('categoryName', '').strip()
        cat_type = request.POST.get('categoryType', 'A').strip()

        if not name:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Category Name is required.'}, status=400)
            messages.error(request, 'Category Name is required.')
            return redirect('dashboard:account_group_list')

        category.categoryName = name
        category.categoryType = cat_type
        category.save()

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'id': category.pk,
                'categoryName': category.categoryName,
                'categoryType': category.categoryType,
                'message': f"Account Group '{category.categoryName}' updated successfully!"
            })
        messages.success(request, f"Account Group '{category.categoryName}' updated successfully!")
        return redirect('dashboard:account_group_list')


class AccountGroupDeleteView(View):
    """Permanently deletes a Category (Account Group) record."""

    def post(self, request, pk, *args, **kwargs):
        category = get_object_or_404(Category, pk=pk)
        name = category.categoryName
        try:
            category.delete()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'message': f"Account Group '{name}' deleted successfully!"})
            messages.success(request, f"Account Group '{name}' deleted successfully!")
        except ProtectedError:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': f"Cannot delete '{name}' — it is linked to existing Account Master records."
                }, status=400)
            messages.error(request, f"Cannot delete '{name}' — it is linked to existing Account Master records.")
        return redirect('dashboard:account_group_list')
