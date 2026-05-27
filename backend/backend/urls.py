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

    # ── Authentication (JWT) ─────────────────────────────────────────────────
    #   POST /api/v1/auth/login/          → obtain JWT token pair
    #   POST /api/v1/auth/refresh/        → refresh access token
    #   POST /api/v1/auth/verify/         → verify token validity
    path('api/v1/auth/', include('apps.accounts.urls')),

    # ── Core Examinations API ─────────────────────────────────────────────────
    #   Full route list is in apps/examinations/urls.py
    path('api/v1/', include('apps.examinations.urls')),

    # ── Analytics App ─────────────────────────────────────────────────────────
    path('api/v1/', include('apps.analytics.urls')),

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

# ── Serve Media Files in Development ─────────────────────────────────────────
# In production use Nginx or S3 to serve /media/ files.
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT,
    )

    # Django Debug Toolbar (only installed in development)
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass


# ── Admin Site Customization ──────────────────────────────────────────────────
admin.site.site_header  = 'KCSE Management System'
admin.site.site_title   = 'KCSE Admin'
admin.site.index_title  = 'KNEC Examinations Administration'