import os
import sys
import django

sys.path.insert(0, r"e:\Alpha Dashboard 14 may\Alpha Dashboard 14 may\Alpha Dashboard")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.urls import resolve
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/api/subsection-x/PO-202606-0002/')

match = resolve('/api/subsection-x/PO-202606-0002/')
print(f"Resolved to view: {match.func}")
print(f"Arguments: {match.kwargs}")

try:
    response = match.func(request, **match.kwargs)
    print(f"DRF Response Status: {response.status_code}")
    if hasattr(response, 'data'):
        print(f"Response Data: {response.data}")
    else:
        print("No .data in response. Content:")
        print(response.content[:500])
except Exception as e:
    import traceback
    print("Caught exception:")
    traceback.print_exc()
