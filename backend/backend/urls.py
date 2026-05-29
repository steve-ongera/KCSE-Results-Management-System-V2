"""
backend/urls.py

Root URL configuration for the KCSE Management System.

URL structure:
    /admin/                         → Django admin panel
    /api/v1/health/                 → Health check (load balancer probe)
    /api/v1/auth/                   → JWT authentication
    /api/v1/                        → Examination management (core app)
    /api/schema/                    → OpenAPI schema download
    /api/docs/                      → Swagger UI
    /api/redoc/                     → ReDoc
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

from core.urls import auth_urlpatterns


# ── Health Check ─────────────────────────────────────────────────────────────

def health_check(request):
    return JsonResponse({
        'status':    'healthy',
        'service':   'KCSE Management System',
        'timestamp': timezone.now().isoformat(),
        'version':   '1.0.0',
    })


# ── URL Patterns ─────────────────────────────────────────────────────────────

urlpatterns = [

    # ── Django Admin ──────────────────────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── Health Check ──────────────────────────────────────────────────────────
    path('api/v1/health/', health_check, name='health-check'),

    # ── Authentication ────────────────────────────────────────────────────────
    path('api/v1/auth/', include(auth_urlpatterns)),

    # ── Core App (examinations) ───────────────────────────────────────────────
    path('api/v1/', include('core.urls')),

    # ── OpenAPI Schema & Docs ─────────────────────────────────────────────────
    path('api/schema/', SpectacularAPIView.as_view(),                        name='schema'),
    path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'),   name='swagger-ui'),
    path('api/redoc/',  SpectacularRedocView.as_view(url_name='schema'),     name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# ── Admin Site Customization ──────────────────────────────────────────────────

admin.site.site_header = 'KCSE Management System'
admin.site.site_title  = 'KCSE Admin'
admin.site.index_title = 'KNEC Examinations Administration'