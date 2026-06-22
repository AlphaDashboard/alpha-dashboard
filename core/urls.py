from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Map core URLs
    path('', RedirectView.as_view(pattern_name='dashboard:alpha_list', permanent=False)),
    path('', include('dashboard.urls')),
]
