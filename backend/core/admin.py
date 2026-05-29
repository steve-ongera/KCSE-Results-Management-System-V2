# ─────────────────────────────────────────────────────────────────────────────
# core/admin.py
# ─────────────────────────────────────────────────────────────────────────────
 
"""
apps/examinations/admin.py
 
Django admin registrations for the examinations app.
All sensitive models have read-only audit logs and
appropriate fieldsets for KNEC staff.
"""
 
from django.contrib import admin
from django.utils.html import format_html
 
from .models import (
    ExaminationYear,
    ExaminationCenter,
    Subject,
    SubjectPaper,
    Candidate,
    CandidateSubject,
    ExaminationScript,
    MarksEntry,
    SubjectResult,
    CandidateResult,
    ResultPublication,
    AuditLog,
)
 
 
# ── Examination Year ──────────────────────────────────────────────────────────
 
@admin.register(ExaminationYear)
class ExaminationYearAdmin(admin.ModelAdmin):
    list_display  = ['year', 'is_current', 'registration_open',
                     'marking_open', 'results_published', 'results_published_at']
    list_filter   = ['is_current', 'registration_open', 'results_published']
    search_fields = ['year']
    ordering      = ['-year']
 
 
# ── Examination Center ────────────────────────────────────────────────────────
 
@admin.register(ExaminationCenter)
class ExaminationCenterAdmin(admin.ModelAdmin):
    list_display  = ['center_code', 'school_name', 'county', 'sub_county', 'is_active']
    list_filter   = ['county', 'is_active']
    search_fields = ['center_code', 'school_name', 'county']
    ordering      = ['school_name']
 
 
# ── Subject & Paper ───────────────────────────────────────────────────────────
 
class SubjectPaperInline(admin.TabularInline):
    model  = SubjectPaper
    extra  = 0
    fields = ['paper_number', 'paper_name', 'max_marks']
 
@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'category', 'is_compulsory',
                     'number_of_papers', 'max_marks', 'is_active']
    list_filter   = ['category', 'is_compulsory', 'is_active']
    search_fields = ['code', 'name']
    inlines       = [SubjectPaperInline]
 
 
# ── Candidate ─────────────────────────────────────────────────────────────────
 
class CandidateSubjectInline(admin.TabularInline):
    model       = CandidateSubject
    extra       = 0
    fields      = ['subject', 'is_compulsory']
    raw_id_fields = ['subject']
 
@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display  = ['index_number', 'full_name', 'gender',
                     'examination_center', 'examination_year',
                     'registration_status', 'created_at']
    list_filter   = ['registration_status', 'gender',
                     'examination_year', 'has_special_needs']
    search_fields = ['index_number', 'full_name', 'kcpe_index_number']
    ordering      = ['index_number']
    inlines       = [CandidateSubjectInline]
    readonly_fields = ['created_at', 'updated_at', 'submitted_at',
                       'approved_at', 'approved_by']
    fieldsets = (
        ('Identity', {
            'fields': ('index_number', 'full_name', 'gender',
                       'date_of_birth', 'birth_certificate_number', 'passport_photo')
        }),
        ('KCPE', {
            'fields': ('kcpe_index_number', 'kcpe_marks')
        }),
        ('Examination', {
            'fields': ('examination_center', 'examination_year')
        }),
        ('Registration Workflow', {
            'fields': ('registration_status', 'submitted_at',
                       'approved_at', 'approved_by', 'rejection_reason')
        }),
        ('Special Needs', {
            'classes': ('collapse',),
            'fields':  ('has_special_needs', 'special_needs_details')
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields':  ('created_at', 'updated_at')
        }),
    )
 
 
# ── Marks Entry ───────────────────────────────────────────────────────────────
 
@admin.register(MarksEntry)
class MarksEntryAdmin(admin.ModelAdmin):
    list_display  = ['candidate', 'subject_paper', 'marks', 'status',
                     'is_abnormal', 'examiner', 'created_at']
    list_filter   = ['status', 'is_abnormal', 'is_bulk_uploaded', 'subject_paper__subject']
    search_fields = ['candidate__index_number', 'candidate__full_name', 'script__barcode']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at',
                       'approved_at', 'locked_at']
 
 
# ── Candidate Result ──────────────────────────────────────────────────────────
 
@admin.register(CandidateResult)
class CandidateResultAdmin(admin.ModelAdmin):
    list_display  = ['candidate', 'examination_year', 'mean_grade',
                     'mean_points', 'school_rank', 'national_rank', 'is_withheld']
    list_filter   = ['mean_grade', 'examination_year', 'is_withheld']
    search_fields = ['candidate__index_number', 'candidate__full_name']
    ordering      = ['-mean_points']
    readonly_fields = ['processed_at', 'processed_by']
 
 
# ── Result Publication ────────────────────────────────────────────────────────
 
@admin.register(ResultPublication)
class ResultPublicationAdmin(admin.ModelAdmin):
    list_display  = ['examination_year', 'is_published', 'published_at', 'published_by']
    readonly_fields = ['published_at', 'published_by']
 
 
# ── Audit Log ─────────────────────────────────────────────────────────────────
 
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ['timestamp', 'user_label', 'action',
                     'object_type', 'ip_address', 'short_description']
    list_filter   = ['action', 'object_type']
    search_fields = ['user_label', 'description', 'object_id', 'ip_address']
    ordering      = ['-timestamp']
    readonly_fields = [f.name for f in AuditLog._meta.get_fields()
                       if hasattr(f, 'name')]
 
    def has_add_permission(self, request):
        return False
 
    def has_change_permission(self, request, obj=None):
        return False
 
    def has_delete_permission(self, request, obj=None):
        return False
 
    def short_description(self, obj):
        return obj.description[:80] + ('…' if len(obj.description) > 80 else '')
    short_description.short_description = 'Description'
 