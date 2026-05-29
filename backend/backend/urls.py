"""
kcse_system/urls.py

Root URL configuration for the KCSE Management System.

URL structure:
    /api/v1/            → examinations app (core)
    /api/v1/auth/       → JWT authentication (accounts app)
    /api/docs/          → Swagger UI (drf-spectacular)
    /api/schema/        → OpenAPI schema download
    /admin/             → Django admin panel
    /api/v1/health/     → Health check (load balancer probe)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.utils import timezone

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


# ── Health Check ─────────────────────────────────────────────────────────────

def health_check(request):
    """
    Simple health check endpoint for load balancers and uptime monitoring.
    Returns 200 OK with basic system status.
    """
    return JsonResponse({
        'status':    'healthy',
        'service':   'KCSE Management System',
        'timestamp': timezone.now().isoformat(),
        'version':   '1.0.0',
    })


# ── URL Patterns ─────────────────────────────────────────────────────────────

urlpatterns = [

    # ── Django Admin ─────────────────────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── Health Check ─────────────────────────────────────────────────────────
    path('api/v1/health/', health_check, name='health-check'),

   

    # ── OpenAPI Schema & Docs ─────────────────────────────────────────────────
    #   /api/schema/        → Download OpenAPI 3.0 YAML schema
    #   /api/docs/          → Swagger UI (interactive)
    #   /api/redoc/         → ReDoc (read-only docs)
    path(
        'api/schema/',
        SpectacularAPIView.as_view(),
        name='schema',
    ),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),
]

# ── Admin Site Customization ──────────────────────────────────────────────────
admin.site.site_header  = 'KCSE Management System'
admin.site.site_title   = 'KCSE Admin'
admin.site.index_title  = 'KNEC Examinations Administration'