"""
backend/core/models.py

Core data models for the KCSE Management System.
Covers the full examination lifecycle:
  - Examination year & center management
  - Candidate registration & subject selection
  - Script tracking (barcode)
  - Marks entry & validation
  - Results computation & publication
  - Audit logging

Custom User model extending Django's AbstractUser.
Adds a role field for KNEC's permission hierarchy and links
staff users to their examination center.

Role hierarchy (top → bottom):
  KNEC_ADMIN        — Full system: publish, moderate, audit
  COUNTY_OFFICER    — County-level candidate approval
  SUBCOUNTY_OFFICER — Sub-county approval workflow
  SCHOOL_OFFICER    — Register candidates, submit for approval
  CHIEF_EXAMINER    — Lock approved marks nationally
  TEAM_LEADER       — Approve marks entered by examiners
  EXAMINER          — Enter marks for assigned scripts
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    KNEC_ADMIN        = 'KNEC_ADMIN',        _('KNEC Administrator')
    COUNTY_OFFICER    = 'COUNTY_OFFICER',    _('County Education Officer')
    SUBCOUNTY_OFFICER = 'SUBCOUNTY_OFFICER', _('Sub-County Education Officer')
    SCHOOL_OFFICER    = 'SCHOOL_OFFICER',    _('School Examination Officer')
    CHIEF_EXAMINER    = 'CHIEF_EXAMINER',    _('Chief Examiner')
    TEAM_LEADER       = 'TEAM_LEADER',       _('Team Leader')
    EXAMINER          = 'EXAMINER',          _('Examiner')


class User(AbstractUser):
    """
    Extended user model for all KCSE system staff.

    Fields beyond the standard AbstractUser:
      role              — determines access level across the system
      examination_center — links school officers to their school
      phone             — contact number
      employee_id       — TSC/KNEC employee identifier
      is_active_examiner — flag set during marking season
    """

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.SCHOOL_OFFICER,
        db_index=True,
    )

    # School officers are linked to a specific examination center.
    # KNEC admins and examiners have center = None (system-wide access).
    examination_center = models.ForeignKey(
        'examinations.ExaminationCenter',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='staff_users',
        help_text=_('The examination center this officer manages. '
                    'Leave blank for KNEC-level staff.'),
    )

    phone       = models.CharField(max_length=15, blank=True)
    employee_id = models.CharField(
        max_length=20, blank=True, unique=True,
        help_text=_('TSC or KNEC employee number'),
    )

    # Examiners are activated per marking season
    is_active_examiner = models.BooleanField(
        default=False,
        help_text=_('True when this examiner is cleared for the current marking season.'),
    )

    # Track last seen county for regional officers
    county = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name        = _('Staff User')
        verbose_name_plural = _('Staff Users')
        ordering            = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['examination_center']),
        ]

    def __str__(self):
        return (
            f"{self.get_full_name() or self.username} "
            f"[{self.get_role_display()}]"
        )

    # ── Convenience role checks ──────────────────────────────────────────────

    @property
    def is_knec_admin(self):
        return self.role == UserRole.KNEC_ADMIN

    @property
    def is_school_officer(self):
        return self.role in {
            UserRole.SCHOOL_OFFICER,
            UserRole.SUBCOUNTY_OFFICER,
            UserRole.COUNTY_OFFICER,
            UserRole.KNEC_ADMIN,
        }

    @property
    def is_examiner_role(self):
        return self.role in {
            UserRole.EXAMINER,
            UserRole.TEAM_LEADER,
            UserRole.CHIEF_EXAMINER,
            UserRole.KNEC_ADMIN,
        }

from django.db import models
from django.core.validators import (
    MinValueValidator, MaxValueValidator,
    RegexValidator, FileExtensionValidator,
)
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import uuid

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATORS
# ─────────────────────────────────────────────────────────────────────────────

validate_index_number = RegexValidator(
    regex=r'^\d{11}$',
    message=_(
        "Index number must be exactly 11 digits "
        "(8-digit school code + 3-digit candidate number)."
    )
)

validate_kcpe_index = RegexValidator(
    regex=r'^\d{10}$',
    message=_("KCPE index number must be exactly 10 digits.")
)

validate_center_code = RegexValidator(
    regex=r'^\d{8}$',
    message=_("Examination center code must be exactly 8 digits.")
)


# ─────────────────────────────────────────────────────────────────────────────
# CHOICES
# ─────────────────────────────────────────────────────────────────────────────

class Gender(models.TextChoices):
    MALE   = 'M', _('Male')
    FEMALE = 'F', _('Female')


class RegistrationStatus(models.TextChoices):
    DRAFT        = 'DRAFT',        _('Draft')
    SUBMITTED    = 'SUBMITTED',    _('Submitted to Sub-County')
    COUNTY_APPR  = 'COUNTY_APPR',  _('County Approved')
    KNEC_APPR    = 'KNEC_APPR',    _('KNEC Approved')
    REJECTED     = 'REJECTED',     _('Rejected')


class ScriptStatus(models.TextChoices):
    AT_CENTER    = 'AT_CENTER',    _('At Examination Centre')
    COLLECTED    = 'COLLECTED',    _('Collected after Paper')
    IN_TRANSIT   = 'IN_TRANSIT',   _('In Transit to Marking Centre')
    AT_MARKING   = 'AT_MARKING',   _('At Marking Centre')
    MARKED       = 'MARKED',       _('Marked')
    VERIFIED     = 'VERIFIED',     _('Verified by Team Leader')


class MarksStatus(models.TextChoices):
    ENTERED      = 'ENTERED',      _('Entered')
    FLAGGED      = 'FLAGGED',      _('Flagged for Review')
    APPROVED     = 'APPROVED',     _('Approved by Team Leader')
    LOCKED       = 'LOCKED',       _('Locked by Chief Examiner')


class SubjectCategory(models.TextChoices):
    COMPULSORY = 'COMPULSORY', _('Compulsory')
    SCIENCES   = 'SCIENCES',   _('Sciences')
    HUMANITIES = 'HUMANITIES', _('Humanities')
    TECHNICALS = 'TECHNICALS', _('Technicals')
    LANGUAGES  = 'LANGUAGES',  _('Languages')


class AuditAction(models.TextChoices):
    CREATE       = 'CREATE',       _('Created')
    UPDATE       = 'UPDATE',       _('Updated')
    DELETE       = 'DELETE',       _('Deleted')
    LOGIN        = 'LOGIN',        _('User Login')
    LOGOUT       = 'LOGOUT',       _('User Logout')
    SUBMIT       = 'SUBMIT',       _('Submitted')
    APPROVE      = 'APPROVE',      _('Approved')
    REJECT       = 'REJECT',       _('Rejected')
    LOCK         = 'LOCK',         _('Locked')
    PUBLISH      = 'PUBLISH',      _('Published')
    LOOKUP       = 'LOOKUP',       _('Results Lookup')
    BULK_UPLOAD  = 'BULK_UPLOAD',  _('Bulk Upload')
    MODERATION   = 'MODERATION',   _('Moderation Applied')


# ─────────────────────────────────────────────────────────────────────────────
# BASE MODEL
# ─────────────────────────────────────────────────────────────────────────────

class TimeStampedModel(models.Model):
    """Abstract base model that adds created_at and updated_at to all models."""

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ─────────────────────────────────────────────────────────────────────────────
# EXAMINATION YEAR
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationYear(TimeStampedModel):
    """
    Represents a single KCSE examination sitting year.
    Only one year can be active (is_current=True) at a time.
    """

    year            = models.PositiveSmallIntegerField(unique=True)
    is_current      = models.BooleanField(default=False)
    registration_open = models.BooleanField(default=False)
    marking_open    = models.BooleanField(default=False)
    results_published = models.BooleanField(default=False)
    results_published_at = models.DateTimeField(null=True, blank=True)
    published_by    = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='published_years'
    )
    notes           = models.TextField(blank=True)

    class Meta:
        ordering = ['-year']
        verbose_name = _('Examination Year')
        verbose_name_plural = _('Examination Years')

    def __str__(self):
        return f"KCSE {self.year}"

    def save(self, *args, **kwargs):
        # Enforce only one current year
        if self.is_current:
            ExaminationYear.objects.filter(is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# EXAMINATION CENTER (SCHOOL)
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationCenter(TimeStampedModel):
    """
    A school registered as a KNEC examination center.
    Each center has a unique 8-digit KNEC center code.
    """

    center_code     = models.CharField(
        max_length=8,
        unique=True,
        validators=[validate_center_code],
        verbose_name=_('KNEC Center Code')
    )
    school_name     = models.CharField(max_length=200)
    county          = models.CharField(max_length=100)
    sub_county      = models.CharField(max_length=100)
    ward            = models.CharField(max_length=100, blank=True)
    physical_address = models.TextField(blank=True)
    postal_address  = models.CharField(max_length=100, blank=True)
    phone           = models.CharField(max_length=15, blank=True)
    email           = models.EmailField(blank=True)

    # Examination officer (the principal or appointed officer)
    examination_officer = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='managed_centers'
    )
    is_active       = models.BooleanField(default=True)

    class Meta:
        ordering = ['school_name']
        verbose_name = _('Examination Center')
        verbose_name_plural = _('Examination Centers')
        indexes = [
            models.Index(fields=['center_code']),
            models.Index(fields=['county']),
        ]

    def __str__(self):
        return f"{self.center_code} – {self.school_name}"


# ─────────────────────────────────────────────────────────────────────────────
# SUBJECT
# ─────────────────────────────────────────────────────────────────────────────

class Subject(TimeStampedModel):
    """
    A KCSE examinable subject. Each subject has one or more papers.
    """

    code            = models.CharField(max_length=10, unique=True)
    name            = models.CharField(max_length=100)
    category        = models.CharField(
        max_length=20,
        choices=SubjectCategory.choices,
        default=SubjectCategory.COMPULSORY
    )
    is_compulsory   = models.BooleanField(default=False)
    number_of_papers = models.PositiveSmallIntegerField(default=2)
    max_marks       = models.PositiveSmallIntegerField(default=100)
    is_active       = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']
        verbose_name = _('Subject')
        verbose_name_plural = _('Subjects')

    def __str__(self):
        return f"{self.code} – {self.name}"


class SubjectPaper(TimeStampedModel):
    """
    Individual papers within a subject (e.g., English Paper 1, Paper 2, Paper 3).
    """

    subject         = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name='papers'
    )
    paper_number    = models.PositiveSmallIntegerField()  # 1, 2, 3
    paper_name      = models.CharField(max_length=100)    # e.g. "Comprehension & Summary"
    max_marks       = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = ['subject', 'paper_number']
        ordering = ['subject', 'paper_number']

    def __str__(self):
        return f"{self.subject.name} – Paper {self.paper_number}"


# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATE
# ─────────────────────────────────────────────────────────────────────────────

class Candidate(TimeStampedModel):
    """
    A Form 4 student registered to sit KCSE.

    Index Number Format:
        - 11 digits total
        - First 8 digits: school's KNEC center code
        - Last 3 digits: candidate number within the school (001–999)
        Example: "10234001" (center) + "023" (student) = "10234001023"

    Full Name:
        Stored in uppercase as per KNEC convention (e.g. GADAFI IMRAN AKIL).
    """

    # ── Identity ─────────────────────────────────────────────────────────────
    index_number    = models.CharField(
        max_length=11,
        validators=[validate_index_number],
        verbose_name=_('KNEC Index Number'),
        db_index=True
    )
    full_name       = models.CharField(
        max_length=200,
        verbose_name=_('Full Name (as per Birth Certificate)')
    )
    gender          = models.CharField(max_length=1, choices=Gender.choices)
    date_of_birth   = models.DateField(null=True, blank=True)

    # ── KCPE Details ─────────────────────────────────────────────────────────
    kcpe_index_number = models.CharField(
        max_length=10,
        validators=[validate_kcpe_index],
        verbose_name=_('KCPE Index Number')
    )
    kcpe_marks      = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(500)]
    )
    birth_certificate_number = models.CharField(max_length=50, blank=True)

    # ── School & Year ─────────────────────────────────────────────────────────
    examination_center = models.ForeignKey(
        ExaminationCenter,
        on_delete=models.PROTECT,
        related_name='candidates'
    )
    examination_year = models.ForeignKey(
        ExaminationYear,
        on_delete=models.PROTECT,
        related_name='candidates'
    )

    # ── Photo ─────────────────────────────────────────────────────────────────
    passport_photo  = models.ImageField(
        upload_to='candidates/photos/%Y/',
        null=True, blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]
    )

    # ── Special Needs ─────────────────────────────────────────────────────────
    has_special_needs = models.BooleanField(default=False)
    special_needs_details = models.TextField(blank=True)

    # ── Registration Workflow ─────────────────────────────────────────────────
    registration_status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.DRAFT
    )
    submitted_at    = models.DateTimeField(null=True, blank=True)
    approved_at     = models.DateTimeField(null=True, blank=True)
    approved_by     = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_candidates'
    )
    rejection_reason = models.TextField(blank=True)

    class Meta:
        # An index number is unique per examination year
        unique_together = [
            ('index_number', 'examination_year'),
            ('kcpe_index_number', 'examination_year'),
        ]
        ordering = ['examination_center', 'index_number']
        verbose_name = _('Candidate')
        verbose_name_plural = _('Candidates')
        indexes = [
            models.Index(fields=['index_number']),
            models.Index(fields=['full_name']),
            models.Index(fields=['examination_year', 'examination_center']),
        ]

    def __str__(self):
        return f"{self.index_number} – {self.full_name}"

    def save(self, *args, **kwargs):
        # Normalize full name to uppercase (KNEC convention)
        self.full_name = self.full_name.strip().upper()
        super().save(*args, **kwargs)

    @property
    def candidate_number(self):
        """Last 3 digits of the index number (student's number within the school)."""
        return self.index_number[-3:] if self.index_number else None

    @property
    def center_code_from_index(self):
        """First 8 digits of the index number (school center code)."""
        return self.index_number[:8] if self.index_number else None


# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATE SUBJECT (Subject Selection)
# ─────────────────────────────────────────────────────────────────────────────

class CandidateSubject(TimeStampedModel):
    """
    Records which subjects a candidate has registered for.
    Compulsory subjects (English, Kiswahili, Maths) are auto-added.
    """

    candidate       = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name='candidate_subjects'
    )
    subject         = models.ForeignKey(
        Subject, on_delete=models.PROTECT, related_name='candidate_subjects'
    )
    is_compulsory   = models.BooleanField(default=False)

    class Meta:
        unique_together = ['candidate', 'subject']
        verbose_name = _('Candidate Subject')
        verbose_name_plural = _('Candidate Subjects')

    def __str__(self):
        return f"{self.candidate.index_number} – {self.subject.name}"


# ─────────────────────────────────────────────────────────────────────────────
# EXAMINATION SCRIPT (Script Tracking)
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationScript(TimeStampedModel):
    """
    Tracks a physical examination answer booklet/script from the exam room
    through transportation to the marking centre and back.
    Uses a unique barcode for chain-of-custody accountability.
    """

    barcode         = models.CharField(max_length=50, unique=True, db_index=True)
    candidate       = models.ForeignKey(
        Candidate, on_delete=models.PROTECT, related_name='scripts'
    )
    subject_paper   = models.ForeignKey(
        SubjectPaper, on_delete=models.PROTECT, related_name='scripts'
    )
    examination_year = models.ForeignKey(
        ExaminationYear, on_delete=models.PROTECT, related_name='scripts'
    )

    status          = models.CharField(
        max_length=20,
        choices=ScriptStatus.choices,
        default=ScriptStatus.AT_CENTER
    )

    # Chain-of-custody timestamps
    collected_at    = models.DateTimeField(null=True, blank=True)
    dispatched_at   = models.DateTimeField(null=True, blank=True)
    received_at_marking = models.DateTimeField(null=True, blank=True)
    marked_at       = models.DateTimeField(null=True, blank=True)

    # Personnel responsible at each stage
    collected_by    = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='collected_scripts'
    )
    received_by     = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='received_scripts'
    )
    assigned_examiner = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_scripts'
    )

    notes           = models.TextField(blank=True)

    class Meta:
        ordering = ['barcode']
        verbose_name = _('Examination Script')
        verbose_name_plural = _('Examination Scripts')
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['status']),
            models.Index(fields=['candidate', 'subject_paper']),
        ]

    def __str__(self):
        return f"Script {self.barcode} – {self.candidate.index_number} / {self.subject_paper}"


# ─────────────────────────────────────────────────────────────────────────────
# MARKS ENTRY
# ─────────────────────────────────────────────────────────────────────────────

class MarksEntry(TimeStampedModel):
    """
    Raw marks entered by an examiner for a candidate's subject paper.

    Validation rules enforced at save:
      - marks cannot exceed the SubjectPaper's max_marks
      - marks cannot be negative
      - duplicate entries (same candidate + paper) are prevented
      - abnormal scores trigger a FLAGGED status
    """

    script          = models.OneToOneField(
        ExaminationScript,
        on_delete=models.PROTECT,
        related_name='marks_entry'
    )
    candidate       = models.ForeignKey(
        Candidate, on_delete=models.PROTECT, related_name='marks_entries'
    )
    subject_paper   = models.ForeignKey(
        SubjectPaper, on_delete=models.PROTECT, related_name='marks_entries'
    )
    examiner        = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='entered_marks'
    )

    marks           = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Validation flags
    status          = models.CharField(
        max_length=20,
        choices=MarksStatus.choices,
        default=MarksStatus.ENTERED
    )
    is_abnormal     = models.BooleanField(default=False)
    abnormality_note = models.TextField(blank=True)

    # Approval chain
    reviewed_by     = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='reviewed_marks'
    )
    reviewed_at     = models.DateTimeField(null=True, blank=True)
    approved_by     = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_marks'
    )
    approved_at     = models.DateTimeField(null=True, blank=True)
    locked_at       = models.DateTimeField(null=True, blank=True)

    # Bulk upload reference
    is_bulk_uploaded = models.BooleanField(default=False)
    upload_batch_id  = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ['candidate', 'subject_paper']
        ordering = ['candidate', 'subject_paper']
        verbose_name = _('Marks Entry')
        verbose_name_plural = _('Marks Entries')
        indexes = [
            models.Index(fields=['candidate', 'subject_paper']),
            models.Index(fields=['status']),
            models.Index(fields=['examiner']),
        ]

    def __str__(self):
        return (
            f"{self.candidate.index_number} – "
            f"{self.subject_paper} – {self.marks}"
        )

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.marks is not None and self.subject_paper_id:
            paper = self.subject_paper
            if self.marks > paper.max_marks:
                raise ValidationError(
                    f"Marks {self.marks} exceed maximum allowed "
                    f"({paper.max_marks}) for {paper}."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        # Flag potentially abnormal marks (e.g., zero or perfect score)
        if self.marks == 0 or self.marks == self.subject_paper.max_marks:
            self.is_abnormal = True
            self.abnormality_note = (
                "Automatically flagged: "
                + ("zero marks." if self.marks == 0 else "perfect score.")
            )
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
# SUBJECT RESULT (Computed after moderation)
# ─────────────────────────────────────────────────────────────────────────────

class SubjectResult(TimeStampedModel):
    """
    Final computed result for a candidate in a single subject.
    Created by the results processing engine after marks moderation.
    """

    candidate       = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name='subject_results'
    )
    subject         = models.ForeignKey(
        Subject, on_delete=models.PROTECT, related_name='subject_results'
    )
    examination_year = models.ForeignKey(
        ExaminationYear, on_delete=models.PROTECT, related_name='subject_results'
    )

    # Marks per paper (JSON for flexibility with multi-paper subjects)
    paper_marks     = models.JSONField(
        default=dict,
        help_text=_('{"paper_1": 45, "paper_2": 38, "paper_3": 20}')
    )
    total_marks     = models.DecimalField(max_digits=5, decimal_places=2)

    # Moderation adjustments
    moderation_adjustment = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    moderated_marks = models.DecimalField(max_digits=5, decimal_places=2)

    # Grade output
    grade           = models.CharField(max_length=2)   # A, A-, B+, … E
    points          = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )

    class Meta:
        unique_together = ['candidate', 'subject', 'examination_year']
        ordering = ['candidate', 'subject']
        verbose_name = _('Subject Result')
        verbose_name_plural = _('Subject Results')
        indexes = [
            models.Index(fields=['candidate', 'examination_year']),
        ]

    def __str__(self):
        return (
            f"{self.candidate.index_number} – "
            f"{self.subject.name}: {self.grade} ({self.points} pts)"
        )


# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATE RESULT (Overall / Aggregate)
# ─────────────────────────────────────────────────────────────────────────────

class CandidateResult(TimeStampedModel):
    """
    Aggregate KCSE result for a candidate — the 'headline' result.
    Contains mean grade, mean points, overall ranking.
    Computed and populated by the results processing engine.
    """

    candidate       = models.OneToOneField(
        Candidate, on_delete=models.CASCADE, related_name='result'
    )
    examination_year = models.ForeignKey(
        ExaminationYear, on_delete=models.PROTECT, related_name='candidate_results'
    )

    # Subject count used for mean calculation
    subjects_sat    = models.PositiveSmallIntegerField(default=0)
    total_points    = models.PositiveSmallIntegerField(default=0)

    # Mean (to 2 decimal places for ranking precision)
    mean_points     = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    mean_grade      = models.CharField(max_length=2, blank=True)  # e.g. B+

    # Rankings
    school_rank     = models.PositiveIntegerField(null=True, blank=True)
    county_rank     = models.PositiveIntegerField(null=True, blank=True)
    national_rank   = models.PositiveIntegerField(null=True, blank=True)

    # Irregularity flag (malpractice)
    is_withheld     = models.BooleanField(default=False)
    withheld_reason = models.TextField(blank=True)

    # Computed by
    processed_at    = models.DateTimeField(null=True, blank=True)
    processed_by    = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='processed_results'
    )

    class Meta:
        ordering = ['-mean_points']
        verbose_name = _('Candidate Result')
        verbose_name_plural = _('Candidate Results')
        indexes = [
            models.Index(fields=['examination_year', 'mean_grade']),
            models.Index(fields=['examination_year', 'national_rank']),
        ]

    def __str__(self):
        return (
            f"{self.candidate.index_number} – "
            f"{self.mean_grade} ({self.mean_points} pts)"
        )


# ─────────────────────────────────────────────────────────────────────────────
# RESULT PUBLICATION CONTROL
# ─────────────────────────────────────────────────────────────────────────────

class ResultPublication(TimeStampedModel):
    """
    Controls when results are made available to the public.
    Only KNEC admin can toggle is_published.
    Once published, results become accessible via the public lookup endpoint.
    """

    examination_year = models.OneToOneField(
        ExaminationYear,
        on_delete=models.CASCADE,
        related_name='publication'
    )
    is_published    = models.BooleanField(default=False)
    published_at    = models.DateTimeField(null=True, blank=True)
    published_by    = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='published_results'
    )
    announcement_message = models.TextField(
        blank=True,
        help_text=_('Optional public message shown alongside results.')
    )

    class Meta:
        verbose_name = _('Result Publication')
        verbose_name_plural = _('Result Publications')

    def __str__(self):
        status = "Published" if self.is_published else "Unpublished"
        return f"KCSE {self.examination_year.year} – {status}"

    def publish(self, user):
        """Mark results as published and record who did it."""
        self.is_published = True
        self.published_at = timezone.now()
        self.published_by = user
        self.save()
        # Also update the ExaminationYear
        self.examination_year.results_published = True
        self.examination_year.results_published_at = self.published_at
        self.examination_year.published_by = user
        self.examination_year.save()


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────────────────────────────────────────

class AuditLog(models.Model):
    """
    Immutable audit trail for all significant actions in the system.
    Records who did what, when, and from where.
    Never updated or deleted — append-only.
    """

    id              = models.BigAutoField(primary_key=True)
    timestamp       = models.DateTimeField(default=timezone.now, db_index=True)

    # Who
    user            = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs'
    )
    user_label      = models.CharField(
        max_length=200, blank=True,
        help_text=_('Snapshot of username at the time of action')
    )
    ip_address      = models.GenericIPAddressField(null=True, blank=True)
    user_agent      = models.TextField(blank=True)

    # What
    action          = models.CharField(
        max_length=20, choices=AuditAction.choices, db_index=True
    )
    description     = models.TextField(blank=True)

    # Which object (generic foreign key pattern without ContentType for simplicity)
    object_type     = models.CharField(max_length=100, blank=True)  # e.g. 'Candidate'
    object_id       = models.CharField(max_length=100, blank=True)  # UUID or PK

    # Snapshot of changed data
    before_data     = models.JSONField(null=True, blank=True)
    after_data      = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['user', 'action']),
            models.Index(fields=['object_type', 'object_id']),
        ]

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.user_label} – {self.action}"

    # Prevent any update or delete on audit logs
    def save(self, *args, **kwargs):
        if self.pk:
            raise PermissionError("Audit logs are immutable and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("Audit logs cannot be deleted.")

    @classmethod
    def log(cls, *, action, user=None, request=None, description='',
            object_type='', object_id='', before_data=None, after_data=None):
        """
        Convenience factory method for creating audit log entries.

        Usage:
            AuditLog.log(
                action=AuditAction.PUBLISH,
                user=request.user,
                request=request,
                description="Published KCSE 2024 results",
                object_type='ResultPublication',
                object_id=str(publication.pk),
            )
        """
        ip = None
        ua = ''
        if request:
            ip = cls._get_client_ip(request)
            ua = request.META.get('HTTP_USER_AGENT', '')[:500]

        cls.objects.create(
            action=action,
            user=user,
            user_label=str(user) if user else 'Anonymous',
            ip_address=ip,
            user_agent=ua,
            description=description,
            object_type=object_type,
            object_id=str(object_id),
            before_data=before_data,
            after_data=after_data,
        )

    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')