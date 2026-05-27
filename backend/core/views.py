"""
apps/examinations/views.py

API views for the KCSE Management System.

Endpoint groups:
  1. Public  — Results lookup (no authentication)
  2. School  — Candidate registration & management
  3. Examiner — Script tracking & marks entry
  4. KNEC Admin — Approval, moderation, publication, analytics
  5. Shared  — Subjects, years, centers (read)
"""

from django.utils import timezone
from django.db import transaction
from django.db.models import Avg, Count, Q

from rest_framework import (
    generics, status, permissions, filters,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django_filters.rest_framework import DjangoFilterBackend

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
    AuditAction,
    MarksStatus,
    RegistrationStatus,
)
from .serializers import (
    ExaminationYearSerializer,
    ExaminationCenterSerializer,
    SubjectSerializer,
    CandidateRegistrationSerializer,
    CandidateListSerializer,
    CandidateDetailSerializer,
    ExaminationScriptSerializer,
    ScriptStatusUpdateSerializer,
    MarksEntrySerializer,
    MarksEntryApprovalSerializer,
    BulkMarksUploadSerializer,
    ResultsLookupRequestSerializer,
    SubjectResultSerializer,
    CandidateResultSerializer,
    ResultPublicationSerializer,
    PublishResultsSerializer,
    AuditLogSerializer,
    SchoolPerformanceSerializer,
    NationalStatisticsSerializer,
)
from .permissions import (
    IsKNECAdmin,
    IsExaminationOfficer,
    IsExaminer,
    IsSchoolOfficer,
    IsReadOnly,
)
from .grading import compute_candidate_result
from .pagination import StandardResultsSetPagination


# ─────────────────────────────────────────────────────────────────────────────
# THROTTLE
# ─────────────────────────────────────────────────────────────────────────────

class ResultsLookupThrottle(AnonRateThrottle):
    """Limit public result lookups to 20/min per IP to prevent scraping."""
    rate = '20/min'


# ─────────────────────────────────────────────────────────────────────────────
# 1. PUBLIC — RESULTS LOOKUP
# ─────────────────────────────────────────────────────────────────────────────

class ResultsLookupView(APIView):
    """
    POST /api/v1/results/lookup/

    Public endpoint — no login required.
    Candidate supplies their 11-digit index number and full name.
    Returns full subject results if found and published.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes   = [ResultsLookupThrottle]

    def post(self, request, *args, **kwargs):
        serializer = ResultsLookupRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        candidate = serializer.validated_data['_candidate']
        result    = serializer.validated_data['_result']

        subject_results = SubjectResult.objects.filter(
            candidate=candidate,
            examination_year=candidate.examination_year,
        ).select_related('subject').order_by('subject__code')

        # Log the lookup (no user, just IP)
        AuditLog.log(
            action=AuditAction.LOOKUP,
            request=request,
            description=f"Public results lookup: {candidate.index_number}",
            object_type='Candidate',
            object_id=str(candidate.pk),
        )

        response_data = {
            'candidate': {
                'index_number': candidate.index_number,
                'full_name':    candidate.full_name,
                'school_name':  candidate.examination_center.school_name,
                'center_code':  candidate.examination_center.center_code,
                'county':       candidate.examination_center.county,
                'year':         candidate.examination_year.year,
                'gender':       candidate.gender,
            },
            'result': {
                'mean_grade':    result.mean_grade,
                'mean_points':   str(result.mean_points),
                'subjects_sat':  result.subjects_sat,
                'school_rank':   result.school_rank,
                'national_rank': result.national_rank,
            },
            'subjects': SubjectResultSerializer(subject_results, many=True).data,
            'announcement': self._get_announcement(candidate.examination_year),
        }

        return Response(response_data, status=status.HTTP_200_OK)

    def _get_announcement(self, year):
        try:
            return year.publication.announcement_message
        except ResultPublication.DoesNotExist:
            return ''


# ─────────────────────────────────────────────────────────────────────────────
# 2. SHARED — EXAMINATION YEAR, CENTER, SUBJECT (read)
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationYearListView(generics.ListAPIView):
    """GET /api/v1/years/ — List all examination years."""

    queryset           = ExaminationYear.objects.all()
    serializer_class   = ExaminationYearSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ExaminationYearDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/years/{id}/ — Retrieve or update an examination year."""

    queryset           = ExaminationYear.objects.all()
    serializer_class   = ExaminationYearSerializer
    permission_classes = [IsKNECAdmin]


class ExaminationCenterListView(generics.ListCreateAPIView):
    """GET /api/v1/centers/ — List centers. POST — Create (KNEC admin only)."""

    queryset           = ExaminationCenter.objects.filter(is_active=True)
    serializer_class   = ExaminationCenterSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['county', 'sub_county']
    search_fields      = ['school_name', 'center_code']
    pagination_class   = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsKNECAdmin()]
        return [permissions.AllowAny()]


class ExaminationCenterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = ExaminationCenter.objects.all()
    serializer_class   = ExaminationCenterSerializer
    permission_classes = [IsKNECAdmin]


class SubjectListView(generics.ListAPIView):
    """GET /api/v1/subjects/ — List all active KCSE subjects."""

    queryset           = Subject.objects.filter(is_active=True).prefetch_related('papers')
    serializer_class   = SubjectSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['category', 'is_compulsory']


# ─────────────────────────────────────────────────────────────────────────────
# 3. CANDIDATE MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

class CandidateViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for candidate registration.

    GET    /api/v1/candidates/           — List candidates
    POST   /api/v1/candidates/           — Register candidate (school officer)
    GET    /api/v1/candidates/{id}/      — Retrieve candidate
    PUT    /api/v1/candidates/{id}/      — Full update
    PATCH  /api/v1/candidates/{id}/      — Partial update
    DELETE /api/v1/candidates/{id}/      — Delete (draft only)

    POST   /api/v1/candidates/{id}/submit/   — Submit for approval
    POST   /api/v1/candidates/{id}/approve/  — KNEC approve
    POST   /api/v1/candidates/{id}/reject/   — KNEC reject
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['registration_status', 'gender', 'examination_year', 'examination_center']
    search_fields      = ['full_name', 'index_number', 'kcpe_index_number']
    ordering_fields    = ['full_name', 'index_number', 'created_at']
    ordering           = ['index_number']
    pagination_class   = StandardResultsSetPagination
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = Candidate.objects.select_related(
            'examination_center', 'examination_year'
        )
        # School officers only see their own center's candidates
        if hasattr(user, 'examination_center'):
            qs = qs.filter(examination_center=user.examination_center)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return CandidateListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CandidateRegistrationSerializer
        return CandidateDetailSerializer

    def perform_create(self, serializer):
        candidate = serializer.save()
        AuditLog.log(
            action=AuditAction.CREATE,
            user=self.request.user,
            request=self.request,
            description=f"Registered candidate {candidate.index_number} – {candidate.full_name}",
            object_type='Candidate',
            object_id=str(candidate.pk),
        )

    def perform_update(self, serializer):
        before = CandidateDetailSerializer(self.get_object()).data
        candidate = serializer.save()
        AuditLog.log(
            action=AuditAction.UPDATE,
            user=self.request.user,
            request=self.request,
            description=f"Updated candidate {candidate.index_number}",
            object_type='Candidate',
            object_id=str(candidate.pk),
            before_data=before,
            after_data=CandidateDetailSerializer(candidate).data,
        )

    def destroy(self, request, *args, **kwargs):
        candidate = self.get_object()
        if candidate.registration_status != RegistrationStatus.DRAFT:
            return Response(
                {'detail': 'Only draft registrations can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        AuditLog.log(
            action=AuditAction.DELETE,
            user=request.user,
            request=request,
            description=f"Deleted candidate {candidate.index_number}",
            object_type='Candidate',
            object_id=str(candidate.pk),
            before_data=CandidateDetailSerializer(candidate).data,
        )
        return super().destroy(request, *args, **kwargs)

    # ── Workflow actions ────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """School principal submits candidate registration to sub-county."""
        candidate = self.get_object()
        if candidate.registration_status != RegistrationStatus.DRAFT:
            return Response(
                {'detail': 'Only draft registrations can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidate.registration_status = RegistrationStatus.SUBMITTED
        candidate.submitted_at = timezone.now()
        candidate.save()
        AuditLog.log(
            action=AuditAction.SUBMIT,
            user=request.user,
            request=request,
            description=f"Submitted candidate {candidate.index_number} for approval",
            object_type='Candidate',
            object_id=str(candidate.pk),
        )
        return Response(
            {'detail': f'Candidate {candidate.index_number} submitted successfully.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='approve',
            permission_classes=[IsKNECAdmin])
    def approve(self, request, pk=None):
        """KNEC admin approves a submitted candidate."""
        candidate = self.get_object()
        if candidate.registration_status not in [
            RegistrationStatus.SUBMITTED, RegistrationStatus.COUNTY_APPR
        ]:
            return Response(
                {'detail': 'Candidate must be submitted before it can be approved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidate.registration_status = RegistrationStatus.KNEC_APPR
        candidate.approved_at = timezone.now()
        candidate.approved_by = request.user
        candidate.save()
        AuditLog.log(
            action=AuditAction.APPROVE,
            user=request.user,
            request=request,
            description=f"Approved candidate {candidate.index_number}",
            object_type='Candidate',
            object_id=str(candidate.pk),
        )
        return Response(
            {'detail': f'Candidate {candidate.index_number} approved.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='reject',
            permission_classes=[IsKNECAdmin])
    def reject(self, request, pk=None):
        """KNEC admin rejects a submitted candidate with a reason."""
        candidate = self.get_object()
        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'detail': 'A rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidate.registration_status = RegistrationStatus.REJECTED
        candidate.rejection_reason = reason
        candidate.save()
        AuditLog.log(
            action=AuditAction.REJECT,
            user=request.user,
            request=request,
            description=f"Rejected candidate {candidate.index_number}: {reason}",
            object_type='Candidate',
            object_id=str(candidate.pk),
        )
        return Response(
            {'detail': f'Candidate {candidate.index_number} rejected.'},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# 4. SCRIPT TRACKING
# ─────────────────────────────────────────────────────────────────────────────

class ExaminationScriptViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/scripts/               — List scripts
    POST   /api/v1/scripts/               — Register script (barcode)
    GET    /api/v1/scripts/{id}/          — Retrieve script
    PATCH  /api/v1/scripts/{id}/          — Update script
    POST   /api/v1/scripts/update-status/ — Bulk status update by barcode scan
    """

    queryset           = ExaminationScript.objects.select_related(
        'candidate', 'subject_paper__subject', 'examination_year'
    )
    serializer_class   = ExaminationScriptSerializer
    permission_classes = [permissions.IsAuthenticated, IsExaminationOfficer]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['status', 'examination_year', 'subject_paper']
    search_fields      = ['barcode', 'candidate__index_number']
    pagination_class   = StandardResultsSetPagination

    @action(detail=False, methods=['post'], url_path='update-status')
    def update_status(self, request):
        """Barcode-scan based status update for a single script."""
        serializer = ScriptStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        script = ExaminationScript.objects.get(
            barcode=serializer.validated_data['barcode']
        )
        new_status = serializer.validated_data['status']
        notes      = serializer.validated_data.get('notes', '')

        script.status = new_status
        if notes:
            script.notes = notes
        script.save()

        AuditLog.log(
            action=AuditAction.UPDATE,
            user=request.user,
            request=request,
            description=f"Script {script.barcode} status → {new_status}",
            object_type='ExaminationScript',
            object_id=str(script.pk),
        )
        return Response(
            ExaminationScriptSerializer(script).data,
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# 5. MARKS ENTRY
# ─────────────────────────────────────────────────────────────────────────────

class MarksEntryViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/marks/                  — List marks entries (filtered to examiner)
    POST   /api/v1/marks/                  — Enter marks for a script
    GET    /api/v1/marks/{id}/             — Retrieve a marks entry
    PATCH  /api/v1/marks/{id}/             — Update marks (before approval)
    POST   /api/v1/marks/{id}/approve/     — Team leader / chief examiner approval
    POST   /api/v1/marks/bulk-upload/      — Bulk CSV/Excel upload
    """

    serializer_class   = MarksEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsExaminer]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['status', 'subject_paper', 'examiner', 'is_abnormal']
    search_fields      = ['candidate__index_number', 'script__barcode']
    pagination_class   = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        qs = MarksEntry.objects.select_related(
            'candidate', 'subject_paper__subject', 'examiner', 'script'
        )
        # Regular examiners only see their own entries
        if not (user.is_staff or hasattr(user, 'is_knec_admin')):
            qs = qs.filter(examiner=user)
        return qs

    def perform_create(self, serializer):
        entry = serializer.save(examiner=self.request.user)
        AuditLog.log(
            action=AuditAction.CREATE,
            user=self.request.user,
            request=self.request,
            description=(
                f"Marks entered: {entry.candidate.index_number} / "
                f"{entry.subject_paper} = {entry.marks}"
            ),
            object_type='MarksEntry',
            object_id=str(entry.pk),
        )

    def update(self, request, *args, **kwargs):
        entry = self.get_object()
        if entry.status in [MarksStatus.APPROVED, MarksStatus.LOCKED]:
            return Response(
                {'detail': 'Approved or locked marks cannot be modified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Team leader approves, or chief examiner locks marks."""
        entry = self.get_object()
        serializer = MarksEntryApprovalSerializer(
            data=request.data, context={'instance': entry}
        )
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data['action']
        note        = serializer.validated_data.get('note', '')

        if action_type == 'approve':
            entry.status      = MarksStatus.APPROVED
            entry.reviewed_by = request.user
            entry.reviewed_at = timezone.now()
        elif action_type == 'lock':
            entry.status    = MarksStatus.LOCKED
            entry.locked_at = timezone.now()
            entry.approved_by = request.user
            entry.approved_at = timezone.now()
        elif action_type == 'flag':
            entry.status           = MarksStatus.FLAGGED
            entry.abnormality_note = note or 'Manually flagged by reviewer.'

        entry.save()

        AuditLog.log(
            action=AuditAction.APPROVE if action_type != 'flag' else AuditAction.UPDATE,
            user=request.user,
            request=request,
            description=f"Marks {action_type}d: {entry.candidate.index_number} / {entry.subject_paper}",
            object_type='MarksEntry',
            object_id=str(entry.pk),
        )

        return Response(
            MarksEntrySerializer(entry).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], url_path='bulk-upload',
            parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Upload a CSV/Excel file of marks.
        Expected columns: barcode, marks
        """
        serializer = BulkMarksUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file           = serializer.validated_data['file']
        subject_paper_id = serializer.validated_data['subject_paper_id']

        try:
            paper = SubjectPaper.objects.get(pk=subject_paper_id)
        except SubjectPaper.DoesNotExist:
            return Response(
                {'detail': 'Subject paper not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Delegate to async Celery task to avoid request timeout
        from .tasks import process_bulk_marks_upload
        batch_id = str(timezone.now().timestamp()).replace('.', '')
        process_bulk_marks_upload.delay(
            file_content=file.read(),
            file_name=file.name,
            subject_paper_id=str(paper.pk),
            examiner_id=str(request.user.pk),
            batch_id=batch_id,
        )

        AuditLog.log(
            action=AuditAction.BULK_UPLOAD,
            user=request.user,
            request=request,
            description=f"Bulk marks upload queued for {paper} – batch {batch_id}",
            object_type='SubjectPaper',
            object_id=str(paper.pk),
        )

        return Response(
            {
                'detail': 'Bulk upload queued for processing.',
                'batch_id': batch_id,
            },
            status=status.HTTP_202_ACCEPTED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# 6. RESULTS PROCESSING & PUBLICATION
# ─────────────────────────────────────────────────────────────────────────────

class ProcessResultsView(APIView):
    """
    POST /api/v1/results/process/

    Triggers the results computation engine for a given examination year.
    Computes grades, mean scores, and rankings for all candidates.
    KNEC admin only.
    """

    permission_classes = [IsKNECAdmin]

    def post(self, request, *args, **kwargs):
        year_id = request.data.get('examination_year_id')
        if not year_id:
            return Response(
                {'detail': 'examination_year_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            year = ExaminationYear.objects.get(pk=year_id)
        except ExaminationYear.DoesNotExist:
            return Response(
                {'detail': 'Examination year not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Queue as Celery task for large datasets
        from .tasks import process_all_results
        process_all_results.delay(str(year.pk), str(request.user.pk))

        AuditLog.log(
            action=AuditAction.UPDATE,
            user=request.user,
            request=request,
            description=f"Results processing triggered for KCSE {year.year}",
            object_type='ExaminationYear',
            object_id=str(year.pk),
        )

        return Response(
            {'detail': f'Results processing queued for KCSE {year.year}.'},
            status=status.HTTP_202_ACCEPTED,
        )


class PublishResultsView(APIView):
    """
    POST /api/v1/results/publish/

    Makes results publicly accessible via the lookup endpoint.
    Irreversible — requires 'confirm: true' in payload.
    KNEC admin only.
    """

    permission_classes = [IsKNECAdmin]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = PublishResultsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        year = serializer.fields['examination_year_id']._year
        announcement = serializer.validated_data.get('announcement_message', '')

        publication, _ = ResultPublication.objects.get_or_create(
            examination_year=year
        )
        publication.announcement_message = announcement
        publication.publish(user=request.user)

        AuditLog.log(
            action=AuditAction.PUBLISH,
            user=request.user,
            request=request,
            description=f"KCSE {year.year} results published",
            object_type='ResultPublication',
            object_id=str(publication.pk),
        )

        return Response(
            {
                'detail': f'KCSE {year.year} results are now publicly accessible.',
                'published_at': publication.published_at,
            },
            status=status.HTTP_200_OK,
        )


class ResultPublicationDetailView(generics.RetrieveUpdateAPIView):
    """GET /api/v1/results/publication/{id}/ — View or edit publication settings."""

    queryset           = ResultPublication.objects.select_related('examination_year')
    serializer_class   = ResultPublicationSerializer
    permission_classes = [IsKNECAdmin]


# ─────────────────────────────────────────────────────────────────────────────
# 7. CANDIDATE RESULTS (Staff view)
# ─────────────────────────────────────────────────────────────────────────────

class CandidateResultListView(generics.ListAPIView):
    """
    GET /api/v1/results/candidates/
    Staff-only list of all computed candidate results.
    """

    serializer_class   = CandidateResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['examination_year', 'mean_grade', 'is_withheld']
    search_fields      = ['candidate__index_number', 'candidate__full_name']
    ordering_fields    = ['mean_points', 'national_rank', 'school_rank']
    ordering           = ['-mean_points']
    pagination_class   = StandardResultsSetPagination

    def get_queryset(self):
        return CandidateResult.objects.select_related(
            'candidate__examination_center', 'examination_year'
        ).prefetch_related('candidate__subject_results__subject')


class CandidateResultDetailView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/v1/results/candidates/{id}/ — Full candidate result detail
    PATCH /api/v1/results/candidates/{id}/ — Withhold / un-withhold (KNEC admin)
    """

    queryset           = CandidateResult.objects.select_related(
        'candidate__examination_center', 'examination_year'
    )
    serializer_class   = CandidateResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsKNECAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_withheld:
            AuditLog.log(
                action=AuditAction.UPDATE,
                user=self.request.user,
                request=self.request,
                description=(
                    f"Result withheld: {instance.candidate.index_number} – "
                    f"{instance.withheld_reason}"
                ),
                object_type='CandidateResult',
                object_id=str(instance.pk),
            )


# ─────────────────────────────────────────────────────────────────────────────
# 8. ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

class SchoolPerformanceView(APIView):
    """
    GET /api/v1/analytics/school/{center_code}/?year=2024

    Returns performance summary for a specific school.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, center_code, *args, **kwargs):
        year_param = request.query_params.get('year')

        try:
            center = ExaminationCenter.objects.get(center_code=center_code)
        except ExaminationCenter.DoesNotExist:
            return Response(
                {'detail': 'Examination center not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        year_qs = ExaminationYear.objects.filter(results_published=True)
        if year_param:
            year_qs = year_qs.filter(year=year_param)
        year = year_qs.order_by('-year').first()

        if not year:
            return Response(
                {'detail': 'No published results found for the specified year.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        results = CandidateResult.objects.filter(
            candidate__examination_center=center,
            examination_year=year,
            is_withheld=False,
        )

        total     = results.count()
        mean_pts  = results.aggregate(avg=Avg('mean_points'))['avg'] or 0
        grade_dist = dict(
            results.values('mean_grade')
                   .annotate(c=Count('id'))
                   .values_list('mean_grade', 'c')
        )
        school_rank = results.filter(school_rank=1).first()

        from .grading import points_to_grade
        data = {
            'center_code':      center.center_code,
            'school_name':      center.school_name,
            'county':           center.county,
            'year':             year.year,
            'total_candidates': total,
            'mean_points':      round(mean_pts, 2),
            'mean_grade':       points_to_grade(mean_pts),
            'grade_distribution': grade_dist,
            'county_rank':      results.first().county_rank if results.exists() else None,
            'national_rank':    results.first().national_rank if results.exists() else None,
        }

        return Response(SchoolPerformanceSerializer(data).data)


class NationalStatisticsView(APIView):
    """
    GET /api/v1/analytics/national/?year=2024

    Returns national KCSE statistics for a published year.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        year_param = request.query_params.get('year')

        year_qs = ExaminationYear.objects.filter(results_published=True)
        if year_param:
            year_qs = year_qs.filter(year=year_param)
        year = year_qs.order_by('-year').first()

        if not year:
            return Response(
                {'detail': 'No published results available.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        results = CandidateResult.objects.filter(
            examination_year=year, is_withheld=False
        )
        total_candidates = results.count()
        total_centers    = Candidate.objects.filter(
            examination_year=year
        ).values('examination_center').distinct().count()
        national_mean    = results.aggregate(avg=Avg('mean_points'))['avg'] or 0
        grade_dist = dict(
            results.values('mean_grade')
                   .annotate(c=Count('id'))
                   .values_list('mean_grade', 'c')
        )

        # Top 10 schools by mean points
        from django.db.models import Avg as DbAvg
        top_centers = (
            results
            .values(
                'candidate__examination_center__center_code',
                'candidate__examination_center__school_name',
                'candidate__examination_center__county',
            )
            .annotate(avg_pts=DbAvg('mean_points'), cnt=Count('id'))
            .order_by('-avg_pts')[:10]
        )

        from .grading import points_to_grade
        top_schools = [
            {
                'center_code':      r['candidate__examination_center__center_code'],
                'school_name':      r['candidate__examination_center__school_name'],
                'county':           r['candidate__examination_center__county'],
                'year':             year.year,
                'total_candidates': r['cnt'],
                'mean_points':      round(r['avg_pts'], 2),
                'mean_grade':       points_to_grade(r['avg_pts']),
                'grade_distribution': {},
                'county_rank': None,
                'national_rank': None,
            }
            for r in top_centers
        ]

        data = {
            'year':              year.year,
            'total_candidates':  total_candidates,
            'total_centers':     total_centers,
            'national_mean':     round(national_mean, 2),
            'grade_distribution': grade_dist,
            'top_schools':       top_schools,
            'county_means':      [],
        }

        return Response(NationalStatisticsSerializer(data).data)


# ─────────────────────────────────────────────────────────────────────────────
# 9. AUDIT LOG
# ─────────────────────────────────────────────────────────────────────────────

class AuditLogListView(generics.ListAPIView):
    """
    GET /api/v1/audit-logs/

    Read-only audit trail. KNEC admin only.
    Supports filtering by action, user, object_type, and date range.
    """

    serializer_class   = AuditLogSerializer
    permission_classes = [IsKNECAdmin]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['action', 'user', 'object_type']
    search_fields      = ['user_label', 'description', 'object_id', 'ip_address']
    ordering_fields    = ['timestamp']
    ordering           = ['-timestamp']
    pagination_class   = StandardResultsSetPagination

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user')
        # Optional date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        return qs