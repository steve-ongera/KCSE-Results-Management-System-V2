# ─────────────────────────────────────────────────────────────────────────────
# core/signals.py
#
# Django signals — auto-create related records when parent models are saved.
# ─────────────────────────────────────────────────────────────────────────────
 
"""
core/signals.py
"""
 
from django.db.models.signals import post_save
from django.dispatch import receiver
 
 
@receiver(post_save, sender='core.ExaminationYear')
def create_result_publication(sender, instance, created, **kwargs):
    """
    Auto-create a ResultPublication record whenever a new ExaminationYear
    is created, so the publication object always exists to update.
    """
    if created:
        from .models import ResultPublication
        ResultPublication.objects.get_or_create(examination_year=instance)
 
 
@receiver(post_save, sender='core.Candidate')
def auto_add_compulsory_subjects(sender, instance, created, **kwargs):
    """
    When a new candidate is created, automatically add all compulsory subjects
    (English, Kiswahili, Mathematics) to their subject list.
    This is a safety net — the serializer also does this, but signals
    ensure it happens even when candidates are created via the admin.
    """
    if created:
        from .models import Subject, CandidateSubject
        compulsory = Subject.objects.filter(is_compulsory=True, is_active=True)
        for subject in compulsory:
            CandidateSubject.objects.get_or_create(
                candidate=instance,
                subject=subject,
                defaults={'is_compulsory': True},
            )
 
 