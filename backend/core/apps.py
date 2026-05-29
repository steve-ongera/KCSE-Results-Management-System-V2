# ─────────────────────────────────────────────────────────────────────────────
# core/apps.py
# ─────────────────────────────────────────────────────────────────────────────
 
"""
core/apps.py
"""
 
from django.apps import AppConfig
 
 
class ExaminationsConfig(AppConfig):
    name            = 'apps.examinations'
    verbose_name    = 'KCSE Examinations'
    default_auto_field = 'django.db.models.UUIDField'
 
    def ready(self):
        # Connect signals when the app is loaded
        import core.signals  # noqa: F401