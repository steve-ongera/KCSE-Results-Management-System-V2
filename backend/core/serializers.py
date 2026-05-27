"""
apps/examinations/serializers.py

DRF serializers for the KCSE Management System.
Covers:
  - Public results lookup (no auth)
  - Candidate registration
  - Marks entry & approval
  - Subject & paper management
  - Audit log read
"""

from rest_framework import serializers
from django.utils import timezone
from django.db import transaction

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
    RegistrationStatus,
    MarksStatus,
    AuditAction,
)


# ─────────────────────────────────────────────────────────────────────────────
# EXAMINATION YEAR
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationYearSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExaminationYear
        fields = [
            'id', 'year', 'is_current',
            'registration_open', 'marking_open',
            'results_published', 'results_published_at',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'results_published_at', 'created_at']


# ─────────────────────────────────────────────────────────────────────────────
# EXAMINATION CENTER
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationCenterSerializer(serializers.ModelSerializer):
    candidate_count = serializers.SerializerMethodField()

    class Meta:
        model  = ExaminationCenter
        fields = [
            'id', 'center_code', 'school_name', 'county', 'sub_county',
            'ward', 'physical_address', 'postal_address', 'phone', 'email',
            'is_active', 'candidate_count',
        ]
        read_only_fields = ['id', 'candidate_count']

    def get_candidate_count(self, obj):
        current_year = ExaminationYear.objects.filter(is_current=True).first()
        if not current_year:
            return 0
        return obj.candidates.filter(examination_year=current_year).count()


class ExaminationCenterMinimalSerializer(serializers.ModelSerializer):
    """Lightweight serializer used inside candidate & result responses."""

    class Meta:
        model  = ExaminationCenter
        fields = ['id', 'center_code', 'school_name', 'county']


# ─────────────────────────────────────────────────────────────────────────────
# SUBJECT & PAPER
# ─────────────────────────────────────────────────────────────────────────────

class SubjectPaperSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SubjectPaper
        fields = ['id', 'paper_number', 'paper_name', 'max_marks']


class SubjectSerializer(serializers.ModelSerializer):
    papers = SubjectPaperSerializer(many=True, read_only=True)

    class Meta:
        model  = Subject
        fields = [
            'id', 'code', 'name', 'category',
            'is_compulsory', 'number_of_papers',
            'max_marks', 'is_active', 'papers',
        ]


class SubjectMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subject
        fields = ['id', 'code', 'name', 'category', 'is_compulsory']


# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATE SUBJECT (selection)
# ─────────────────────────────────────────────────────────────────────────────

class CandidateSubjectSerializer(serializers.ModelSerializer):
    subject = SubjectMinimalSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.filter(is_active=True),
        source='subject',
        write_only=True,
    )

    class Meta:
        model  = CandidateSubject
        fields = ['id', 'subject', 'subject_id', 'is_compulsory']
        read_only_fields = ['id', 'is_compulsory']


# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATE REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────

class CandidateRegistrationSerializer(serializers.ModelSerializer):
    """
    Used by school examination officers to register a Form 4 candidate.
    Validates index number format, KCPE uniqueness, and subject combinations.
    """

    subject_ids = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.filter(is_active=True),
        many=True,
        write_only=True,
        help_text="List of optional subject IDs. Compulsory subjects are added automatically.",
    )
    examination_center_id = serializers.PrimaryKeyRelatedField(
        queryset=ExaminationCenter.objects.filter(is_active=True),
        source='examination_center',
    )
    examination_year_id = serializers.PrimaryKeyRelatedField(
        queryset=ExaminationYear.objects.filter(registration_open=True),
        source='examination_year',
    )

    class Meta:
        model  = Candidate
        fields = [
            'id',
            'index_number',
            'full_name',
            'gender',
            'date_of_birth',
            'kcpe_index_number',
            'kcpe_marks',
            'birth_certificate_number',
            'examination_center_id',
            'examination_year_id',
            'passport_photo',
            'has_special_needs',
            'special_needs_details',
            'registration_status',
            'subject_ids',
            'created_at',
        ]
        read_only_fields = ['id', 'registration_status', 'created_at']

    # ── Field-level validation ──────────────────────────────────────────────

    def validate_index_number(self, value):
        value = value.strip()
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError(
                "Index number must be exactly 11 digits (8-digit center code + 3-digit candidate number)."
            )
        return value

    def validate_kcpe_index_number(self, value):
        value = value.strip()
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                "KCPE index number must be exactly 10 digits."
            )
        return value

    def validate_full_name(self, value):
        cleaned = value.strip().upper()
        parts = cleaned.split()
        if len(parts) < 2:
            raise serializers.ValidationError(
                "Full name must include at least first name and surname."
            )
        return cleaned

    def validate_subject_ids(self, subjects):
        # Total subjects: compulsory (auto-added) + optional should not exceed 9
        # KCSE requires minimum 7 subjects total
        if len(subjects) > 6:  # 3 compulsory + up to 6 optional = max 9
            raise serializers.ValidationError(
                "A candidate may register for a maximum of 6 optional subjects "
                "(compulsory subjects are added automatically)."
            )
        return subjects

    # ── Object-level validation ─────────────────────────────────────────────

    def validate(self, data):
        year   = data.get('examination_year')
        center = data.get('examination_center')
        index  = data.get('index_number', '')
        kcpe   = data.get('kcpe_index_number', '')

        # The first 8 digits of the index number must match the center code
        if index and center and not index.startswith(center.center_code):
            raise serializers.ValidationError({
                'index_number': (
                    f"Index number must start with the center code "
                    f"'{center.center_code}' for {center.school_name}."
                )
            })

        # Check uniqueness of index number within year (excluding current instance on update)
        instance = self.instance
        qs_index = Candidate.objects.filter(index_number=index, examination_year=year)
        if instance:
            qs_index = qs_index.exclude(pk=instance.pk)
        if qs_index.exists():
            raise serializers.ValidationError({
                'index_number': f"Index number '{index}' is already registered for {year}."
            })

        # Check uniqueness of KCPE index within year
        qs_kcpe = Candidate.objects.filter(kcpe_index_number=kcpe, examination_year=year)
        if instance:
            qs_kcpe = qs_kcpe.exclude(pk=instance.pk)
        if qs_kcpe.exists():
            raise serializers.ValidationError({
                'kcpe_index_number': f"KCPE index '{kcpe}' is already registered for {year}."
            })

        return data

    # ── Create with subject linking ─────────────────────────────────────────

    @transaction.atomic
    def create(self, validated_data):
        optional_subjects = validated_data.pop('subject_ids', [])

        candidate = Candidate.objects.create(**validated_data)

        # Auto-add compulsory subjects
        compulsory = Subject.objects.filter(is_compulsory=True, is_active=True)
        for subject in compulsory:
            CandidateSubject.objects.get_or_create(
                candidate=candidate,
                subject=subject,
                defaults={'is_compulsory': True},
            )

        # Add optional subjects selected by the school
        for subject in optional_subjects:
            CandidateSubject.objects.get_or_create(
                candidate=candidate,
                subject=subject,
                defaults={'is_compulsory': False},
            )

        return candidate

    @transaction.atomic
    def update(self, instance, validated_data):
        optional_subjects = validated_data.pop('subject_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if optional_subjects is not None:
            # Retain compulsory, replace optional
            CandidateSubject.objects.filter(
                candidate=instance, is_compulsory=False
            ).delete()
            for subject in optional_subjects:
                CandidateSubject.objects.get_or_create(
                    candidate=instance,
                    subject=subject,
                    defaults={'is_compulsory': False},
                )

        return instance


class CandidateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    school_name = serializers.CharField(
        source='examination_center.school_name', read_only=True
    )
    center_code = serializers.CharField(
        source='examination_center.center_code', read_only=True
    )

    class Meta:
        model  = Candidate
        fields = [
            'id', 'index_number', 'full_name', 'gender',
            'school_name', 'center_code',
            'registration_status', 'created_at',
        ]


class CandidateDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer including subjects."""

    examination_center = ExaminationCenterMinimalSerializer(read_only=True)
    examination_year   = ExaminationYearSerializer(read_only=True)
    candidate_subjects = CandidateSubjectSerializer(many=True, read_only=True)

    class Meta:
        model  = Candidate
        fields = [
            'id', 'index_number', 'full_name', 'gender', 'date_of_birth',
            'kcpe_index_number', 'kcpe_marks', 'birth_certificate_number',
            'examination_center', 'examination_year',
            'passport_photo', 'has_special_needs', 'special_needs_details',
            'registration_status', 'submitted_at', 'approved_at',
            'rejection_reason', 'candidate_subjects', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────────────────────
# MARKS ENTRY
# ─────────────────────────────────────────────────────────────────────────────

class MarksEntrySerializer(serializers.ModelSerializer):
    """
    Used by examiners to enter marks for a script.
    Validates mark range against the SubjectPaper's max_marks.
    """

    script_barcode = serializers.CharField(
        source='script.barcode', read_only=True
    )
    subject_paper_label = serializers.CharField(
        source='subject_paper.__str__', read_only=True
    )
    candidate_index = serializers.CharField(
        source='candidate.index_number', read_only=True
    )

    class Meta:
        model  = MarksEntry
        fields = [
            'id',
            'script', 'script_barcode',
            'candidate', 'candidate_index',
            'subject_paper', 'subject_paper_label',
            'examiner',
            'marks', 'status',
            'is_abnormal', 'abnormality_note',
            'is_bulk_uploaded', 'upload_batch_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'script_barcode', 'subject_paper_label', 'candidate_index',
            'status', 'is_abnormal', 'abnormality_note', 'created_at', 'updated_at',
        ]

    def validate(self, data):
        paper = data.get('subject_paper') or (self.instance.subject_paper if self.instance else None)
        marks = data.get('marks')

        if paper and marks is not None:
            if marks < 0:
                raise serializers.ValidationError({'marks': "Marks cannot be negative."})
            if marks > paper.max_marks:
                raise serializers.ValidationError({
                    'marks': (
                        f"Marks {marks} exceed the maximum allowed "
                        f"({paper.max_marks}) for {paper}."
                    )
                })
        return data


class MarksEntryApprovalSerializer(serializers.Serializer):
    """Used by team leader / chief examiner to approve or lock marks."""

    action = serializers.ChoiceField(choices=['approve', 'lock', 'flag'])
    note   = serializers.CharField(required=False, allow_blank=True)

    def validate_action(self, value):
        instance = self.context.get('instance')
        if not instance:
            return value
        if value == 'lock' and instance.status != MarksStatus.APPROVED:
            raise serializers.ValidationError(
                "Marks must be approved before they can be locked."
            )
        return value


class BulkMarksUploadSerializer(serializers.Serializer):
    """
    Handles CSV/Excel bulk upload of marks.
    Expected CSV columns: barcode, marks
    """

    file = serializers.FileField()
    subject_paper_id = serializers.UUIDField()

    def validate_file(self, value):
        ext = value.name.split('.')[-1].lower()
        if ext not in ['csv', 'xlsx', 'xls']:
            raise serializers.ValidationError(
                "Only CSV and Excel files (.csv, .xlsx, .xls) are accepted."
            )
        if value.size > 5 * 1024 * 1024:  # 5 MB
            raise serializers.ValidationError("File size must not exceed 5 MB.")
        return value


# ─────────────────────────────────────────────────────────────────────────────
# EXAMINATION SCRIPT
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationScriptSerializer(serializers.ModelSerializer):
    candidate_index = serializers.CharField(
        source='candidate.index_number', read_only=True
    )
    subject_paper_label = serializers.CharField(
        source='subject_paper.__str__', read_only=True
    )

    class Meta:
        model  = ExaminationScript
        fields = [
            'id', 'barcode',
            'candidate', 'candidate_index',
            'subject_paper', 'subject_paper_label',
            'examination_year', 'status',
            'collected_at', 'dispatched_at',
            'received_at_marking', 'marked_at',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'candidate_index', 'subject_paper_label', 'created_at']


class ScriptStatusUpdateSerializer(serializers.Serializer):
    """Used by logistics officers to update a script's tracking status."""

    barcode = serializers.CharField(max_length=50)
    status  = serializers.ChoiceField(choices=ExaminationScript.status.field.choices if hasattr(ExaminationScript, 'status') else [])
    notes   = serializers.CharField(required=False, allow_blank=True)

    def validate_barcode(self, value):
        if not ExaminationScript.objects.filter(barcode=value).exists():
            raise serializers.ValidationError(f"No script found with barcode '{value}'.")
        return value


# ─────────────────────────────────────────────────────────────────────────────
# RESULTS — PUBLIC LOOKUP
# ─────────────────────────────────────────────────────────────────────────────

class ResultsLookupRequestSerializer(serializers.Serializer):
    """
    Public endpoint payload — no authentication required.
    Candidate enters their 11-digit index number and full name.
    """

    index_number = serializers.CharField(
        max_length=11,
        min_length=11,
        help_text="11-digit KNEC examination index number (e.g. 10234001023)",
    )
    full_name = serializers.CharField(
        max_length=200,
        help_text="Full name exactly as registered (e.g. GADAFI IMRAN AKIL)",
    )

    def validate_index_number(self, value):
        value = value.strip()
        if not value.isdigit():
            raise serializers.ValidationError("Index number must contain digits only.")
        if len(value) != 11:
            raise serializers.ValidationError(
                "Index number must be exactly 11 digits."
            )
        return value

    def validate_full_name(self, value):
        return value.strip().upper()

    def validate(self, data):
        index = data['index_number']
        name  = data['full_name']

        # Check results are published for the current year
        current_year = ExaminationYear.objects.filter(
            is_current=True, results_published=True
        ).first()

        if not current_year:
            raise serializers.ValidationError(
                "Results have not been published yet. Please check back later."
            )

        # Look up candidate
        try:
            candidate = Candidate.objects.select_related(
                'examination_center', 'examination_year'
            ).get(
                index_number=index,
                examination_year=current_year,
            )
        except Candidate.DoesNotExist:
            raise serializers.ValidationError(
                "No candidate found with that index number for the current examination year."
            )

        # Verify name matches (case-insensitive, normalized)
        if candidate.full_name != name:
            raise serializers.ValidationError(
                "The name provided does not match our records for this index number."
            )

        # Check result exists and is not withheld
        try:
            result = candidate.result
        except CandidateResult.DoesNotExist:
            raise serializers.ValidationError(
                "Results for this candidate have not been processed yet."
            )

        if result.is_withheld:
            raise serializers.ValidationError(
                "This result has been withheld. Please contact KNEC for assistance."
            )

        # Stash for the view to use
        data['_candidate'] = candidate
        data['_result']    = result
        return data


class SubjectResultPublicSerializer(serializers.ModelSerializer):
    """Subject-level result for the public response."""

    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model  = SubjectResult
        fields = [
            'subject_code', 'subject_name',
            'paper_marks', 'total_marks', 'moderated_marks',
            'grade', 'points',
        ]


class ResultsLookupResponseSerializer(serializers.Serializer):
    """
    Shapes the public results response.
    Consumed by ResultsLookupRequestSerializer after validation.
    """

    class CandidateSummarySerializer(serializers.Serializer):
        index_number  = serializers.CharField()
        full_name     = serializers.CharField()
        school_name   = serializers.CharField(source='examination_center.school_name')
        center_code   = serializers.CharField(source='examination_center.center_code')
        county        = serializers.CharField(source='examination_center.county')
        year          = serializers.IntegerField(source='examination_year.year')
        gender        = serializers.CharField()

    class ResultSummarySerializer(serializers.Serializer):
        mean_grade    = serializers.CharField()
        mean_points   = serializers.DecimalField(max_digits=5, decimal_places=2)
        subjects_sat  = serializers.IntegerField()
        school_rank   = serializers.IntegerField(allow_null=True)
        national_rank = serializers.IntegerField(allow_null=True)

    candidate = CandidateSummarySerializer()
    result    = ResultSummarySerializer()
    subjects  = SubjectResultPublicSerializer(many=True)


# ─────────────────────────────────────────────────────────────────────────────
# SUBJECT RESULT (Admin / Staff)
# ─────────────────────────────────────────────────────────────────────────────

class SubjectResultSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model  = SubjectResult
        fields = [
            'id', 'candidate', 'subject', 'subject_code', 'subject_name',
            'examination_year', 'paper_marks', 'total_marks',
            'moderation_adjustment', 'moderated_marks', 'grade', 'points',
        ]
        read_only_fields = ['id']


# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATE RESULT (Admin / Staff)
# ─────────────────────────────────────────────────────────────────────────────

class CandidateResultSerializer(serializers.ModelSerializer):
    candidate_index = serializers.CharField(
        source='candidate.index_number', read_only=True
    )
    candidate_name = serializers.CharField(
        source='candidate.full_name', read_only=True
    )
    school_name = serializers.CharField(
        source='candidate.examination_center.school_name', read_only=True
    )
    subject_results = SubjectResultSerializer(
        source='candidate.subject_results', many=True, read_only=True
    )

    class Meta:
        model  = CandidateResult
        fields = [
            'id', 'candidate', 'candidate_index', 'candidate_name',
            'school_name', 'examination_year',
            'subjects_sat', 'total_points', 'mean_points', 'mean_grade',
            'school_rank', 'county_rank', 'national_rank',
            'is_withheld', 'withheld_reason',
            'processed_at', 'subject_results',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────────────────────
# RESULT PUBLICATION
# ─────────────────────────────────────────────────────────────────────────────

class ResultPublicationSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source='examination_year.year', read_only=True)
    published_by_name = serializers.CharField(
        source='published_by.get_full_name', read_only=True
    )

    class Meta:
        model  = ResultPublication
        fields = [
            'id', 'examination_year', 'year',
            'is_published', 'published_at', 'published_by', 'published_by_name',
            'announcement_message',
        ]
        read_only_fields = ['id', 'published_at', 'published_by', 'year', 'published_by_name']


class PublishResultsSerializer(serializers.Serializer):
    """Payload for the publish-results action (KNEC admin only)."""

    examination_year_id = serializers.UUIDField()
    announcement_message = serializers.CharField(required=False, allow_blank=True)
    confirm = serializers.BooleanField(
        help_text="Must be true to confirm the irreversible publish action."
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "You must confirm the publish action by setting 'confirm' to true."
            )
        return value

    def validate_examination_year_id(self, value):
        try:
            year = ExaminationYear.objects.get(pk=value)
        except ExaminationYear.DoesNotExist:
            raise serializers.ValidationError("Examination year not found.")
        if year.results_published:
            raise serializers.ValidationError(
                f"Results for KCSE {year.year} are already published."
            )
        self._year = year
        return value


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────────────────────────────────────────

class AuditLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()

    class Meta:
        model  = AuditLog
        fields = [
            'id', 'timestamp', 'user', 'user_display', 'user_label',
            'ip_address', 'action', 'description',
            'object_type', 'object_id',
            'before_data', 'after_data',
        ]
        read_only_fields = fields

    def get_user_display(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return obj.user_label or 'Anonymous'


# ─────────────────────────────────────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

class SchoolPerformanceSerializer(serializers.Serializer):
    """Used by the analytics app to return school performance summaries."""

    center_code  = serializers.CharField()
    school_name  = serializers.CharField()
    county       = serializers.CharField()
    year         = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    mean_grade   = serializers.CharField()
    mean_points  = serializers.DecimalField(max_digits=5, decimal_places=2)
    grade_distribution = serializers.DictField(child=serializers.IntegerField())
    county_rank  = serializers.IntegerField(allow_null=True)
    national_rank = serializers.IntegerField(allow_null=True)


class NationalStatisticsSerializer(serializers.Serializer):
    """National-level summary statistics."""

    year             = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    total_centers    = serializers.IntegerField()
    national_mean    = serializers.DecimalField(max_digits=5, decimal_places=2)
    grade_distribution = serializers.DictField(child=serializers.IntegerField())
    top_schools      = SchoolPerformanceSerializer(many=True)
    county_means     = serializers.ListField(child=serializers.DictField())