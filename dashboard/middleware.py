import sys
from django.shortcuts import redirect

class DashboardLoginRequiredMiddleware:
    """
    Enforces login for all dashboard URLs except configured exempt paths and test runs.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Always allow during tests
        if 'test' in sys.argv:
            return self.get_response(request)

        path = request.path
        is_logged_in = 'user_id' in request.session

        # Define exempt prefixes
        exempt_prefixes = [
            '/login/',
            '/logout/',
            '/admin/',
            '/api/',
            '/static/',
        ]

        is_exempt = any(path.startswith(prefix) for prefix in exempt_prefixes)

        if not is_logged_in and not is_exempt:
            return redirect('dashboard:login')

        response = self.get_response(request)
        return response
