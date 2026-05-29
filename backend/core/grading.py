# ═════════════════════════════════════════════════════════════════════════════
# core/grading.py
#
# KCSE grading engine.
# Converts raw marks → points → grade.
# Computes mean grade from a candidate's best N subject results.
# ═════════════════════════════════════════════════════════════════════════════
 
"""
core/grading.py
"""
 
from django.conf import settings
from decimal import Decimal, ROUND_HALF_UP
 
 
# ── Mark → Points → Grade ─────────────────────────────────────────────────────
 
def marks_to_grade(marks: float) -> tuple[int, str]:
    """
    Convert a subject's total marks (0–100) to points and grade letter.
 
    Returns:
        (points: int, grade: str)  e.g. (10, 'B+')
    """
    scale = settings.KCSE.get('MARKS_TO_POINTS', [])
    for min_marks, max_marks, points, grade in scale:
        if min_marks <= marks <= max_marks:
            return points, grade
    return 1, 'E'
 
 
def points_to_grade(mean_points: float) -> str:
    """
    Convert a candidate's mean points (average across subjects) to a mean grade.
 
    Args:
        mean_points: float between 1.0 and 12.0
 
    Returns:
        grade string e.g. 'B+'
    """
    scale = settings.KCSE.get('GRADE_SCALE', [])
    for min_pts, max_pts, grade in scale:
        if min_pts <= float(mean_points) <= max_pts:
            return grade
    return 'E'
 
 
# ── Candidate Result Computation ──────────────────────────────────────────────
 
def compute_candidate_result(candidate, examination_year, processed_by=None):
    """
    Compute the aggregate result for a single candidate.
 
    Steps:
      1. Fetch all SubjectResults for the candidate in the given year.
      2. Pick the best N subjects (N = KCSE['SUBJECTS_FOR_MEAN'], default 7).
      3. Compute mean points from the best N.
      4. Convert mean points to mean grade.
      5. Create or update the CandidateResult record.
 
    Args:
        candidate:        Candidate model instance
        examination_year: ExaminationYear model instance
        processed_by:     User who triggered processing (optional)
 
    Returns:
        CandidateResult instance
    """
    from .models import SubjectResult, CandidateResult
    from django.utils import timezone
 
    n = settings.KCSE.get('SUBJECTS_FOR_MEAN', 7)
 
    subject_results = SubjectResult.objects.filter(
        candidate=candidate,
        examination_year=examination_year,
    ).order_by('-points')   # Descending: best subjects first
 
    if not subject_results.exists():
        return None
 
    best_results   = subject_results[:n]
    subjects_sat   = subject_results.count()
    total_points   = sum(r.points for r in best_results)
    mean_pts_raw   = total_points / len(best_results) if best_results else 0
    mean_points    = Decimal(str(mean_pts_raw)).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )
    mean_grade     = points_to_grade(float(mean_points))
 
    result, _ = CandidateResult.objects.update_or_create(
        candidate=candidate,
        examination_year=examination_year,
        defaults={
            'subjects_sat':  subjects_sat,
            'total_points':  total_points,
            'mean_points':   mean_points,
            'mean_grade':    mean_grade,
            'processed_at':  timezone.now(),
            'processed_by':  processed_by,
        },
    )
    return result
 
 
def compute_all_results(examination_year, processed_by=None):
    """
    Compute results for every candidate in an examination year.
    Called by the Celery task `process_all_results`.
 
    After computing individual results, triggers ranking computation.
 
    Args:
        examination_year: ExaminationYear instance
        processed_by:     User instance (KNEC admin who triggered processing)
 
    Returns:
        dict with counts: {'processed': int, 'skipped': int, 'errors': int}
    """
    from .models import Candidate, RegistrationStatus
 
    candidates = Candidate.objects.filter(
        examination_year=examination_year,
        registration_status=RegistrationStatus.KNEC_APPR,
    ).select_related('examination_center')
 
    processed = skipped = errors = 0
 
    for candidate in candidates:
        try:
            result = compute_candidate_result(candidate, examination_year, processed_by)
            if result:
                processed += 1
            else:
                skipped += 1
        except Exception as exc:  # noqa: BLE001
            import logging
            logger = logging.getLogger('apps.examinations')
            logger.error(
                "Error computing result for candidate %s: %s",
                candidate.index_number, exc
            )
            errors += 1
 
    # Compute school, county, and national rankings
    _compute_rankings(examination_year)
 
    return {'processed': processed, 'skipped': skipped, 'errors': errors}
 
 
def _compute_rankings(examination_year):
    """
    After all individual results are computed, assign school, county,
    and national rankings based on mean points (descending).
    """
    from .models import CandidateResult, ExaminationCenter
 
    all_results = (
        CandidateResult.objects
        .filter(examination_year=examination_year, is_withheld=False)
        .select_related('candidate__examination_center')
        .order_by('-mean_points')
    )
 
    # National ranking
    for rank, result in enumerate(all_results, start=1):
        result.national_rank = rank
 
    # School ranking (within each center)
    centers = ExaminationCenter.objects.filter(
        candidates__examination_year=examination_year
    ).distinct()
 
    for center in centers:
        center_results = (
            all_results.filter(candidate__examination_center=center)
        )
        for rank, result in enumerate(center_results, start=1):
            result.school_rank = rank
 
    # County ranking
    counties = (
        all_results.values_list('candidate__examination_center__county', flat=True)
        .distinct()
    )
    for county in counties:
        county_results = all_results.filter(
            candidate__examination_center__county=county
        )
        for rank, result in enumerate(county_results, start=1):
            result.county_rank = rank
 
    # Bulk update
    CandidateResult.objects.bulk_update(
        all_results,
        ['national_rank', 'school_rank', 'county_rank'],
        batch_size=500,
    )
 
 