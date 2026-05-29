"""
core/urls.py

URL routing for the core app.
Merged into two logical groups:
  - /api/v1/auth/   → JWT authentication routes
  - /api/v1/        → Examination management routes

All prefixes are applied by the project-level urls.py.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    # ── Auth ──────────────────────────────────────────────────────────────────
    CustomTokenObtainPairView,
    LogoutView,
    MeView,
    ChangePasswordView,

    # ── Public ────────────────────────────────────────────────────────────────
    ResultsLookupView,

    # ── Reference data (read) ─────────────────────────────────────────────────
    ExaminationYearListView,
    ExaminationYearDetailView,
    ExaminationCenterListView,
    ExaminationCenterDetailView,
    SubjectListView,

    # ── Candidates ────────────────────────────────────────────────────────────
    CandidateViewSet,

    # ── Scripts ───────────────────────────────────────────────────────────────
    ExaminationScriptViewSet,

    # ── Marks ─────────────────────────────────────────────────────────────────
    MarksEntryViewSet,

    # ── Results ───────────────────────────────────────────────────────────────
    ProcessResultsView,
    PublishResultsView,
    ResultPublicationDetailView,
    CandidateResultListView,
    CandidateResultDetailView,

    # ── Analytics ─────────────────────────────────────────────────────────────
    SchoolPerformanceView,
    NationalStatisticsView,

    # ── Audit ─────────────────────────────────────────────────────────────────
    AuditLogListView,
)


# ── Router (ViewSets) ────────────────────────────────────────────────────────

router = DefaultRouter()
router.register(r'candidates', CandidateViewSet,         basename='candidate')
router.register(r'scripts',    ExaminationScriptViewSet, basename='script')
router.register(r'marks',      MarksEntryViewSet,        basename='marks')


# ── Auth URL patterns  (mounted at /api/v1/auth/ in project urls.py) ─────────

auth_urlpatterns = [
    path('login/',           CustomTokenObtainPairView.as_view(), name='token-obtain'),
    path('refresh/',         TokenRefreshView.as_view(),          name='token-refresh'),
    path('verify/',          TokenVerifyView.as_view(),           name='token-verify'),
    path('logout/',          LogoutView.as_view(),                name='logout'),
    path('me/',              MeView.as_view(),                    name='me'),
    path('change-password/', ChangePasswordView.as_view(),        name='change-password'),
]


# ── Main URL patterns  (mounted at /api/v1/ in project urls.py) ──────────────

urlpatterns = [

    # ViewSet routes (auto-generated)
    path('', include(router.urls)),

    # ── Public ────────────────────────────────────────────────────────────────
    path('results/lookup/', ResultsLookupView.as_view(), name='results-lookup'),

    # ── Examination Years ─────────────────────────────────────────────────────
    path('years/',           ExaminationYearListView.as_view(),   name='year-list'),
    path('years/<uuid:pk>/', ExaminationYearDetailView.as_view(), name='year-detail'),

    # ── Examination Centers ───────────────────────────────────────────────────
    path('centers/',           ExaminationCenterListView.as_view(),   name='center-list'),
    path('centers/<uuid:pk>/', ExaminationCenterDetailView.as_view(), name='center-detail'),

    # ── Subjects ──────────────────────────────────────────────────────────────
    path('subjects/', SubjectListView.as_view(), name='subject-list'),

    # ── Results (staff) ───────────────────────────────────────────────────────
    path('results/candidates/',           CandidateResultListView.as_view(),   name='candidate-result-list'),
    path('results/candidates/<uuid:pk>/', CandidateResultDetailView.as_view(), name='candidate-result-detail'),

    # ── Results (processing & publication — KNEC admin) ───────────────────────
    path('results/process/',              ProcessResultsView.as_view(),          name='results-process'),
    path('results/publish/',              PublishResultsView.as_view(),          name='results-publish'),
    path('results/publication/<uuid:pk>/', ResultPublicationDetailView.as_view(), name='result-publication-detail'),

    # ── Analytics ─────────────────────────────────────────────────────────────
    path('analytics/school/<str:center_code>/', SchoolPerformanceView.as_view(), name='school-performance'),
    path('analytics/national/',                 NationalStatisticsView.as_view(), name='national-statistics'),

    # ── Audit Logs ────────────────────────────────────────────────────────────
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
]