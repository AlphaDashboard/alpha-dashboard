import os
import sys
import django

sys.path.insert(0, r"e:\Alpha Dashboard 14 may\Alpha Dashboard 14 may\Alpha Dashboard")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.urls import resolve
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from dashboard.api_views import PurchaseOrderViewSet

factory = APIRequestFactory()
raw_request = factory.get('/api/subsection-x/PO-202606-0002/')
drf_request = Request(raw_request)

viewset = PurchaseOrderViewSet()
viewset.request = drf_request
viewset.kwargs = {'po_no': 'PO-202606-0002'}
viewset.format_kwarg = None

# Mimic initialize_request
viewset.action = 'retrieve'

qs = viewset.get_queryset()
print("Base Queryset count:", qs.count())

filtered_qs = viewset.filter_queryset(qs)
print("Filtered Queryset count:", filtered_qs.count())

try:
    obj = viewset.get_object()
    print("get_object() succeeded! Object:", obj)
except Exception as e:
    import traceback
    traceback.print_exc()
