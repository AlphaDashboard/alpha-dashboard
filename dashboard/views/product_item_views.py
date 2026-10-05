from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import View
from django.http import JsonResponse
from django.contrib import messages
from django.db.models import Q

from dashboard.models import ItemProduct, ItemGroup
from dashboard.forms import ItemProductForm


class ProductItemListView(View):
    """
    Displays the unified enterprise list of Products / Items.
    Supports filtering by search query, status, and unit.
    """
    template_name = 'dashboard/product_item_list.html'

    def get(self, request, *args, **kwargs):
        queryset = ItemProduct.objects.all().order_by('item_name')

        search_query = request.GET.get('search', '').strip()
        search_by = request.GET.get('search_by', 'item_name')
        status_filter = request.GET.get('status', '').strip()
        unit_filter = request.GET.get('unit', '').strip()

        if search_query:
            if search_by == 'item_code':
                queryset = queryset.filter(item_code__icontains=search_query)
            elif search_by == 'rack_no':
                queryset = queryset.filter(rack_no__icontains=search_query)
            elif search_by == 'hsn_sac_code':
                queryset = queryset.filter(hsn_sac_code__icontains=search_query)
            else:
                queryset = queryset.filter(item_name__icontains=search_query)

        if status_filter:
            if status_filter in ['CONTINUE', 'DISCONTINUE']:
                queryset = queryset.filter(status=status_filter)
            elif status_filter == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_filter == 'inactive':
                queryset = queryset.filter(is_active=False)

        if unit_filter:
            queryset = queryset.filter(unit__iexact=unit_filter)

        units = ItemProduct.objects.values_list('unit', flat=True).distinct()
        item_groups = ItemGroup.objects.filter(is_active=True)

        context = {
            'products': queryset,
            'search_query': search_query,
            'search_by': search_by,
            'status_filter': status_filter,
            'unit_filter': unit_filter,
            'units': [u for u in units if u],
            'item_groups': item_groups,
            'form': ItemProductForm(),
        }
        return render(request, self.template_name, context)


class ProductItemCreateView(View):
    """Handles creating a new ItemProduct."""

    def post(self, request, *args, **kwargs):
        form = ItemProductForm(request.POST)
        if form.is_valid():
            product = form.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'id': product.pk,
                    'item_name': product.item_name,
                    'rack_no': product.rack_no or '',
                    'unit': product.unit,
                    'status': product.status,
                    'mrp': str(product.mrp),
                    'p_rate': str(product.p_rate),
                    'message': f"Product '{product.item_name}' created successfully!"
                })
            messages.success(request, f"Product '{product.item_name}' created successfully!")
            return redirect('dashboard:product_item_list')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors}, status=400)
            messages.error(request, "Please correct the errors below.")
            return redirect('dashboard:product_item_list')


class ProductItemDetailJSONView(View):
    """Fetches full JSON details of a single product to prefill the MODIFY PRODUCT modal."""

    def get(self, request, pk, *args, **kwargs):
        product = get_object_or_404(ItemProduct, pk=pk)
        data = {
            'id': product.pk,
            # Top Zone
            'status': product.status,
            'product_type': product.product_type,
            'hide': product.hide,
            'item_name': product.item_name,
            'item_code': product.item_code or '',
            'rack_no': product.rack_no or '',
            'unit': product.unit,
            'decimal_allowed': product.decimal_allowed,
            'fast_search': product.fast_search,
            'color_type': product.color_type,
            'store': product.store,
            'store_code': product.store_code,
            'item_type_code': product.item_type_code,
            'group_allowed': product.group_allowed,
            'item_group_id': product.item_group_id or '',
            'group_name': product.group_name or '',
            'hsn_sac_allowed': product.hsn_sac_allowed,
            'hsn_sac_code': product.hsn_sac_code or '',
            # Bottom Zone - Column 1
            'local_tax': product.local_tax,
            'central_tax': product.central_tax,
            'mrp': str(product.mrp),
            'rate_a': str(product.rate_a),
            'conv_box': str(product.conv_box),
            'min_qty': str(product.min_qty),
            'max_discount': str(product.max_discount),
            'min_margin': str(product.min_margin),
            # Bottom Zone - Column 2
            'sgst_pct': str(product.sgst_pct),
            'igst_pct': str(product.igst_pct),
            'p_rate': str(product.p_rate),
            'rate_b': str(product.rate_b),
            'conv_case': str(product.conv_case),
            'max_qty': str(product.max_qty),
            'purc_disc': str(product.purc_disc),
            'disc_less': str(product.disc_less),
            # Bottom Zone - Column 3
            'cgst_pct': str(product.cgst_pct),
            'cost_per_pcs': str(product.cost_per_pcs),
            'rate_c': str(product.rate_c),
            'negative_billing': product.negative_billing,
            'reorder_qty': str(product.reorder_qty),
            'reorder_days': product.reorder_days,
            'rate_mod_allowed': product.rate_mod_allowed,
            'manufacturer': product.manufacturer or '',
            'is_active': product.is_active,
        }
        return JsonResponse(data)


class ProductItemUpdateView(View):
    """Handles updating an existing ItemProduct."""

    def post(self, request, pk, *args, **kwargs):
        product = get_object_or_404(ItemProduct, pk=pk)
        form = ItemProductForm(request.POST, instance=product)
        if form.is_valid():
            product = form.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'id': product.pk,
                    'item_name': product.item_name,
                    'rack_no': product.rack_no or '',
                    'unit': product.unit,
                    'status': product.status,
                    'mrp': str(product.mrp),
                    'p_rate': str(product.p_rate),
                    'message': f"Product '{product.item_name}' updated successfully!"
                })
            messages.success(request, f"Product '{product.item_name}' updated successfully!")
            return redirect('dashboard:product_item_list')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors}, status=400)
            messages.error(request, "Please correct the errors below.")
            return redirect('dashboard:product_item_list')


class ProductItemDeleteView(View):
    """Handles deleting an ItemProduct."""

    def post(self, request, pk, *args, **kwargs):
        product = get_object_or_404(ItemProduct, pk=pk)
        name = product.item_name
        product.delete()
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'message': f"Product '{name}' deleted successfully!"})
        messages.success(request, f"Product '{name}' deleted successfully!")
        return redirect('dashboard:product_item_list')
