"""
core/management/commands/seed_data.py

Populates the database with realistic Kenyan KCSE seed data for
development and testing.

Usage:
    python manage.py seed_data
    python manage.py seed_data --year 2024
    python manage.py seed_data --candidates 200
    python manage.py seed_data --clear

What gets created:
    - 1 ExaminationYear (current)
    - 47 counties (all Kenyan counties)
    - 40 ExaminationCenters (real Kenyan school names)
    - All KCSE subjects (compulsory + optional)
    - Staff users for each role
    - Candidates with Kenyan names and realistic marks
    - Subject results + candidate aggregate results
    - ResultPublication record
    - Sample AuditLog entries
"""

import random
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import (
    AuditAction,
    AuditLog,
    CandidateResult,
    CandidateSubject,
    ExaminationCenter,
    ExaminationScript,
    ExaminationYear,
    MarksEntry,
    MarksStatus,
    RegistrationStatus,
    ResultPublication,
    ScriptStatus,
    Subject,
    SubjectCategory,
    SubjectPaper,
    SubjectResult,
    UserRole,
    Candidate,
    Gender,
)

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# KENYAN DATA FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

KENYAN_COUNTIES = [
    ("Mombasa",        "Coast"),
    ("Kwale",          "Coast"),
    ("Kilifi",         "Coast"),
    ("Tana River",     "Coast"),
    ("Lamu",           "Coast"),
    ("Taita-Taveta",   "Coast"),
    ("Garissa",        "North Eastern"),
    ("Wajir",          "North Eastern"),
    ("Mandera",        "North Eastern"),
    ("Marsabit",       "Eastern"),
    ("Isiolo",         "Eastern"),
    ("Meru",           "Eastern"),
    ("Tharaka-Nithi",  "Eastern"),
    ("Embu",           "Eastern"),
    ("Kitui",          "Eastern"),
    ("Machakos",       "Eastern"),
    ("Makueni",        "Eastern"),
    ("Nyandarua",      "Central"),
    ("Nyeri",          "Central"),
    ("Kirinyaga",      "Central"),
    ("Murang'a",       "Central"),
    ("Kiambu",         "Central"),
    ("Turkana",        "Rift Valley"),
    ("West Pokot",     "Rift Valley"),
    ("Samburu",        "Rift Valley"),
    ("Trans-Nzoia",    "Rift Valley"),
    ("Uasin Gishu",    "Rift Valley"),
    ("Elgeyo-Marakwet","Rift Valley"),
    ("Nandi",          "Rift Valley"),
    ("Baringo",        "Rift Valley"),
    ("Laikipia",       "Rift Valley"),
    ("Nakuru",         "Rift Valley"),
    ("Narok",          "Rift Valley"),
    ("Kajiado",        "Rift Valley"),
    ("Kericho",        "Rift Valley"),
    ("Bomet",          "Rift Valley"),
    ("Kakamega",       "Western"),
    ("Vihiga",         "Western"),
    ("Bungoma",        "Western"),
    ("Busia",          "Western"),
    ("Siaya",          "Nyanza"),
    ("Kisumu",         "Nyanza"),
    ("Homa Bay",       "Nyanza"),
    ("Migori",         "Nyanza"),
    ("Kisii",          "Nyanza"),
    ("Nyamira",        "Nyanza"),
    ("Nairobi",        "Nairobi"),
]

# Real Kenyan secondary school names mapped to county
KENYAN_SCHOOLS = [
    # Nairobi
    ("Nairobi",    "Alliance High School",              "10100001"),
    ("Nairobi",    "Nairobi School",                    "10100002"),
    ("Nairobi",    "Upper Hill School",                 "10100003"),
    ("Nairobi",    "Starehe Boys' Centre",              "10100004"),
    ("Nairobi",    "Kenya High School",                 "10100005"),
    ("Nairobi",    "Maryhill Girls High School",        "10100006"),
    ("Nairobi",    "Westlands Secondary School",        "10100007"),
    ("Nairobi",    "Dagoretti High School",             "10100008"),
    # Central
    ("Nyeri",      "Nyeri High School",                 "10200001"),
    ("Nyeri",      "Tumutumu Girls High School",        "10200002"),
    ("Kiambu",     "Limuru Girls High School",          "10300001"),
    ("Kiambu",     "St. Joseph's Githunguri",           "10300002"),
    ("Murang'a",   "Murang'a High School",              "10400001"),
    ("Kirinyaga",  "Kerugoya High School",              "10500001"),
    # Rift Valley
    ("Nakuru",     "Nakuru High School",                "10600001"),
    ("Nakuru",     "Molo High School",                  "10600002"),
    ("Uasin Gishu","Eldoret High School",               "10700001"),
    ("Uasin Gishu","St. Joseph's Chepterit",            "10700002"),
    ("Kericho",    "Kericho High School",               "10800001"),
    ("Baringo",    "Kabarnet High School",              "10900001"),
    # Western
    ("Kakamega",   "Kakamega High School",              "11000001"),
    ("Kakamega",   "Musingu High School",               "11000002"),
    ("Bungoma",    "Bungoma High School",               "11100001"),
    ("Vihiga",     "St. Paul's Butere Girls",           "11200001"),
    # Nyanza
    ("Kisumu",     "Kisumu Boys High School",           "11300001"),
    ("Kisumu",     "Kisumu Girls High School",          "11300002"),
    ("Kisii",      "Kisii High School",                 "11400001"),
    ("Homa Bay",   "Ogande Girls High School",          "11500001"),
    ("Siaya",      "Maasai Girls Secondary",            "11600001"),
    # Eastern
    ("Machakos",   "Machakos High School",              "11700001"),
    ("Meru",       "Meru High School",                  "11800001"),
    ("Embu",       "Embu High School",                  "11900001"),
    ("Kitui",      "Kitui High School",                 "12000001"),
    ("Makueni",    "Makueni Girls High School",         "12100001"),
    # Coast
    ("Mombasa",    "Coast High School",                 "12200001"),
    ("Mombasa",    "Shimo La Tewa High School",         "12200002"),
    ("Kilifi",     "Kilifi High School",                "12300001"),
    ("Kwale",      "Kwale High School",                 "12400001"),
    # North Eastern
    ("Garissa",    "Garissa High School",               "12500001"),
    ("Wajir",      "Wajir High School",                 "12600001"),
]

# Kenyan first names (male)
MALE_FIRST_NAMES = [
    "BRIAN", "KEVIN", "STEPHEN", "DANIEL", "MICHAEL", "JAMES", "JOHN",
    "SAMUEL", "DAVID", "PETER", "GEORGE", "FRANCIS", "CHARLES", "JOSEPH",
    "PAUL", "JULIUS", "VICTOR", "DENNIS", "ERIC", "SIMON", "MARK",
    "ALEX", "RAYMOND", "PATRICK", "ANTONY", "CLINTON", "OSCAR", "TONY",
    "BONIFACE", "EZEKIEL", "CORNELIUS", "FESTUS", "GIDEON", "TOBIAS",
    "ELIJAH", "ISAIAH", "CALEB", "JOSHUA", "NATHANIEL", "SOLOMON",
]

# Kenyan first names (female)
FEMALE_FIRST_NAMES = [
    "GRACE", "FAITH", "MERCY", "JOY", "ESTHER", "MARY", "SARAH",
    "RUTH", "DIANA", "CAROLINE", "LINDA", "JANET", "ALICE", "ROSE",
    "ANN", "CATHERINE", "ELIZABETH", "MARGARET", "JACQUELINE", "MILLICENT",
    "BEATRICE", "AGNES", "WANJIRU", "WANGARI", "NJERI", "WAIRIMU",
    "AWINO", "ACHIENG", "ATIENO", "AKELLO", "ADHIAMBO", "AUMA",
    "FATUMA", "HALIMA", "AMINA", "ZAINAB", "LEILA", "MARYAM",
]

# Kenyan surnames (cross-ethnic mix)
KENYAN_SURNAMES = [
    # Kikuyu
    "KAMAU", "MWANGI", "KARIUKI", "NJOROGE", "WANJIKU", "GITAU",
    "MACHARIA", "MUGO", "GICHERU", "KINYUA", "GATHONI", "NDEGWA",
    # Luo
    "OTIENO", "ODHIAMBO", "OWINO", "OGOLA", "ADHOLA", "OKECH",
    "OMONDI", "OBIERO", "ALOO", "ONDIEK", "OCHIENG", "AWUOR",
    # Luhya
    "WAFULA", "WEKESA", "SIMIYU", "BARASA", "NAMUKANDA", "WANYONYI",
    "KHISA", "MUYALE", "MAKHANU", "WANGILA", "WABWIRE", "MAKOKHA",
    # Kalenjin
    "KOSGEI", "BETT", "RUTO", "CHERUIYOT", "KIPROP", "KIPTOO",
    "KIRUI", "MUTAI", "CHEPKEMOI", "NGETICH", "SANG", "CHELIMO",
    # Kamba
    "MUTUA", "MWENDA", "NDUNDA", "MUNYAO", "MUSYOKA", "NZISA",
    "MUTHINI", "KIOKO", "NZIOKA", "MUEMA", "MBATHA", "NTHENGE",
    # Coastal/Swahili/Somali
    "OMAR", "HASSAN", "AHMED", "HUSSEIN", "IBRAHIM", "ALI",
    "MWAMBA", "MWANASITI", "KOMBO", "SAID", "SALIM", "HAMISI",
]

# KCSE subjects (code, name, category, is_compulsory, papers, max_marks)
KCSE_SUBJECTS = [
    # Compulsory
    ("101", "English",                SubjectCategory.COMPULSORY, True,  3, 100),
    ("102", "Kiswahili",              SubjectCategory.COMPULSORY, True,  3, 100),
    ("121", "Mathematics",            SubjectCategory.COMPULSORY, True,  2, 100),
    ("312", "Christian Religious Ed", SubjectCategory.HUMANITIES,  False, 2, 100),
    # Sciences
    ("233", "Biology",                SubjectCategory.SCIENCES,   False, 3, 100),
    ("232", "Chemistry",              SubjectCategory.SCIENCES,   False, 3, 100),
    ("231", "Physics",                SubjectCategory.SCIENCES,   False, 3, 100),
    ("443", "Agriculture",            SubjectCategory.TECHNICALS, False, 3, 100),
    # Humanities
    ("311", "History & Government",   SubjectCategory.HUMANITIES,  False, 3, 100),
    ("313", "Geography",              SubjectCategory.HUMANITIES,  False, 3, 100),
    # Languages
    ("113", "French",                 SubjectCategory.LANGUAGES,  False, 2, 100),
    ("114", "German",                 SubjectCategory.LANGUAGES,  False, 2, 100),
    ("441", "Home Science",           SubjectCategory.TECHNICALS, False, 3, 100),
    ("444", "Computer Studies",       SubjectCategory.TECHNICALS, False, 2, 100),
    ("451", "Business Studies",       SubjectCategory.HUMANITIES,  False, 2, 100),
    ("563", "Art & Design",           SubjectCategory.TECHNICALS, False, 3, 100),
    ("565", "Music",                  SubjectCategory.TECHNICALS, False, 2, 100),
]

# KNEC grading scale: (min_marks, grade, points)
GRADE_SCALE = [
    (75, "A",  12),
    (70, "A-", 11),
    (65, "B+", 10),
    (60, "B",   9),
    (55, "B-",  8),
    (50, "C+",  7),
    (45, "C",   6),
    (40, "C-",  5),
    (35, "D+",  4),
    (30, "D",   3),
    (25, "D-",  2),
    ( 0, "E",   1),
]


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def marks_to_grade(marks: float):
    """Convert a raw marks score to (grade, points) using the KNEC scale."""
    for threshold, grade, points in GRADE_SCALE:
        if marks >= threshold:
            return grade, points
    return "E", 1


def random_kenyan_name(gender: str):
    """Return a realistic Kenyan full name (SURNAME FIRSTNAME [MIDDLENAME])."""
    if gender == Gender.MALE:
        first = random.choice(MALE_FIRST_NAMES)
    else:
        first = random.choice(FEMALE_FIRST_NAMES)
    surname  = random.choice(KENYAN_SURNAMES)
    # 60% chance of a middle name
    if random.random() < 0.6:
        if gender == Gender.MALE:
            middle = random.choice(MALE_FIRST_NAMES)
        else:
            middle = random.choice(FEMALE_FIRST_NAMES)
        return f"{surname} {first} {middle}"
    return f"{surname} {first}"


def random_dob(min_age=16, max_age=22):
    today = date.today()
    days  = random.randint(min_age * 365, max_age * 365)
    return today - timedelta(days=days)


def random_phone():
    prefix = random.choice(["0722", "0733", "0700", "0711", "0729", "0743", "0756"])
    return prefix + str(random.randint(100000, 999999))


def random_marks(mean: float, std: float, lo: float = 0, hi: float = 100) -> float:
    """Normally distributed marks clamped to [lo, hi]."""
    val = random.gauss(mean, std)
    return round(max(lo, min(hi, val)), 2)


# ─────────────────────────────────────────────────────────────────────────────
# COMMAND
# ─────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the database with realistic Kenyan KCSE data for development."

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            default=2024,
            help="Examination year to seed (default: 2024)",
        )
        parser.add_argument(
            "--candidates",
            type=int,
            default=120,
            help="Total number of candidates to generate (default: 120)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Drop all seeded data before re-seeding",
        )

    def handle(self, *args, **options):
        year_val        = options["year"]
        total_candidates = options["candidates"]

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\n🌍  KCSE Seed Data — {year_val}\n"
        ))

        if options["clear"]:
            self._clear_data()

        exam_year = self._seed_exam_year(year_val)
        subjects, papers = self._seed_subjects()
        centers = self._seed_centers()
        self._seed_staff_users(centers)
        candidates = self._seed_candidates(exam_year, centers, total_candidates)
        self._seed_candidate_subjects(candidates, subjects)
        self._seed_marks_and_results(candidates, subjects, papers, exam_year)
        self._seed_publication(exam_year)
        self._seed_audit_logs(exam_year)

        self.stdout.write(self.style.SUCCESS(
            f"\n✅  Seeding complete. "
            f"{total_candidates} candidates across {len(centers)} schools.\n"
        ))

    # ── Clear ────────────────────────────────────────────────────────────────

    def _clear_data(self):
        self.stdout.write("  🗑  Clearing existing seed data…")
        AuditLog.objects.all().delete()
        CandidateResult.objects.all().delete()
        SubjectResult.objects.all().delete()
        MarksEntry.objects.all().delete()
        ExaminationScript.objects.all().delete()
        CandidateSubject.objects.all().delete()
        Candidate.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        ResultPublication.objects.all().delete()
        ExaminationYear.objects.all().delete()
        ExaminationCenter.objects.all().delete()
        SubjectPaper.objects.all().delete()
        Subject.objects.all().delete()
        self.stdout.write("     Done.\n")

    # ── Examination Year ─────────────────────────────────────────────────────

    def _seed_exam_year(self, year_val: int) -> ExaminationYear:
        self.stdout.write(f"  📅  Creating ExaminationYear {year_val}…")
        exam_year, created = ExaminationYear.objects.update_or_create(
            year=year_val,
            defaults=dict(
                is_current=True,
                registration_open=False,
                marking_open=False,
                results_published=True,
                results_published_at=timezone.now() - timedelta(days=7),
                notes=f"KCSE {year_val} — Main Sitting",
            ),
        )
        self.stdout.write(f"     {'Created' if created else 'Updated'} KCSE {year_val}.")
        return exam_year

    # ── Subjects & Papers ────────────────────────────────────────────────────

    def _seed_subjects(self):
        self.stdout.write("  📚  Creating KCSE subjects and papers…")
        subjects = {}
        papers   = {}

        PAPER_NAMES = {
            3: ["Listening & Speaking / Writing",
                "Reading / Comprehension",
                "Literature / Oral"],
            2: ["Paper 1", "Paper 2"],
        }

        for code, name, category, is_comp, num_papers, max_marks in KCSE_SUBJECTS:
            paper_max = max_marks // num_papers

            subj, _ = Subject.objects.update_or_create(
                code=code,
                defaults=dict(
                    name=name,
                    category=category,
                    is_compulsory=is_comp,
                    number_of_papers=num_papers,
                    max_marks=max_marks,
                    is_active=True,
                ),
            )
            subjects[code] = subj
            papers[code]   = []

            paper_labels = PAPER_NAMES.get(num_papers, [f"Paper {i}" for i in range(1, num_papers + 1)])
            for i in range(1, num_papers + 1):
                label = paper_labels[i - 1] if i - 1 < len(paper_labels) else f"Paper {i}"
                sp, _ = SubjectPaper.objects.update_or_create(
                    subject=subj,
                    paper_number=i,
                    defaults=dict(
                        paper_name=label,
                        max_marks=paper_max,
                    ),
                )
                papers[code].append(sp)

        self.stdout.write(f"     {len(subjects)} subjects, {sum(len(v) for v in papers.values())} papers.")
        return subjects, papers

    # ── Examination Centers ──────────────────────────────────────────────────

    def _seed_centers(self):
        self.stdout.write("  🏫  Creating examination centers (schools)…")
        centers = []
        county_map = {name: region for name, region in KENYAN_COUNTIES}

        for county, school_name, center_code in KENYAN_SCHOOLS:
            sub_county = f"{county} Central"  # simplified
            center, _ = ExaminationCenter.objects.update_or_create(
                center_code=center_code,
                defaults=dict(
                    school_name=school_name,
                    county=county,
                    sub_county=sub_county,
                    ward=f"{county} Ward",
                    physical_address=f"P.O. Box {random.randint(1,999)}, {county}",
                    phone=random_phone(),
                    email=f"principal@{school_name.lower().replace(' ', '').replace('\'', '')[:15]}.sc.ke",
                    is_active=True,
                ),
            )
            centers.append(center)

        self.stdout.write(f"     {len(centers)} centers created.")
        return centers

    # ── Staff Users ──────────────────────────────────────────────────────────

    def _seed_staff_users(self, centers):
        self.stdout.write("  👤  Creating staff users…")
        count = 0

        # Superuser / KNEC admin
        if not User.objects.filter(username="knec_admin").exists():
            User.objects.create_superuser(
                username="knec_admin",
                email="admin@knec.ac.ke",
                password="KnecAdmin2024!",
                first_name="KNEC",
                last_name="Administrator",
                role=UserRole.KNEC_ADMIN,
                employee_id="KNEC0001",
                phone="0722000001",
                county="Nairobi",
            )
            count += 1

        # Chief examiner
        if not User.objects.filter(username="chief_examiner").exists():
            User.objects.create_user(
                username="chief_examiner",
                email="chiefexaminer@knec.ac.ke",
                password="Chief2024!",
                first_name="JOHN",
                last_name="MWANGI",
                role=UserRole.CHIEF_EXAMINER,
                employee_id="KNEC0010",
                phone="0733000002",
                county="Nairobi",
                is_active_examiner=True,
            )
            count += 1

        # County officers — one per county region (sample)
        sample_counties = ["Nairobi", "Nakuru", "Kisumu", "Mombasa", "Eldoret"]
        for i, county_name in enumerate(sample_counties, start=1):
            uname = f"county_officer_{i}"
            if not User.objects.filter(username=uname).exists():
                User.objects.create_user(
                    username=uname,
                    email=f"county{i}@education.go.ke",
                    password="County2024!",
                    first_name=random.choice(MALE_FIRST_NAMES + FEMALE_FIRST_NAMES),
                    last_name=random.choice(KENYAN_SURNAMES),
                    role=UserRole.COUNTY_OFFICER,
                    employee_id=f"CEO{i:04d}",
                    phone=random_phone(),
                    county=county_name,
                )
                count += 1

        # School officers — one per center
        for i, center in enumerate(centers[:20], start=1):  # first 20 centers
            uname = f"school_officer_{i}"
            if not User.objects.filter(username=uname).exists():
                officer = User.objects.create_user(
                    username=uname,
                    email=f"officer{i}@{center.center_code}.sc.ke",
                    password="School2024!",
                    first_name=random.choice(MALE_FIRST_NAMES + FEMALE_FIRST_NAMES),
                    last_name=random.choice(KENYAN_SURNAMES),
                    role=UserRole.SCHOOL_OFFICER,
                    employee_id=f"SCH{i:04d}",
                    phone=random_phone(),
                    county=center.county,
                    examination_center=center,
                )
                count += 1

        # Examiners
        for i in range(1, 11):
            uname = f"examiner_{i}"
            if not User.objects.filter(username=uname).exists():
                User.objects.create_user(
                    username=uname,
                    email=f"examiner{i}@knec.ac.ke",
                    password="Examiner2024!",
                    first_name=random.choice(MALE_FIRST_NAMES + FEMALE_FIRST_NAMES),
                    last_name=random.choice(KENYAN_SURNAMES),
                    role=UserRole.EXAMINER,
                    employee_id=f"EXM{i:04d}",
                    phone=random_phone(),
                    county="Nairobi",
                    is_active_examiner=True,
                )
                count += 1

        self.stdout.write(f"     {count} users created.")

    # ── Candidates ───────────────────────────────────────────────────────────

    def _seed_candidates(self, exam_year, centers, total: int):
        self.stdout.write(f"  🎓  Generating {total} candidates…")
        candidates = []

        # Distribute candidates across centers
        per_center = max(1, total // len(centers))

        for center in centers:
            center_count = min(
                per_center + random.randint(-2, 5),
                total - len(candidates)
            )
            if center_count <= 0:
                break

            for seq in range(1, center_count + 1):
                gender = random.choice([Gender.MALE, Gender.FEMALE])
                full_name = random_kenyan_name(gender)

                # Index: center_code (8 digits) + seq (3 digits, zero-padded)
                index_number = f"{center.center_code}{seq:03d}"

                # KCPE index: 10 random digits
                kcpe_index = str(random.randint(1000000000, 9999999999))

                # Realistic KCPE marks (most candidates: 200-350)
                kcpe_marks = random.randint(180, 420)

                try:
                    c = Candidate.objects.create(
                        index_number=index_number,
                        full_name=full_name,
                        gender=gender,
                        date_of_birth=random_dob(),
                        kcpe_index_number=kcpe_index,
                        kcpe_marks=kcpe_marks,
                        birth_certificate_number=f"BC{random.randint(1000000,9999999)}",
                        examination_center=center,
                        examination_year=exam_year,
                        has_special_needs=random.random() < 0.02,  # 2% SEN
                        registration_status=RegistrationStatus.KNEC_APPR,
                        submitted_at=timezone.now() - timedelta(days=random.randint(180, 240)),
                        approved_at=timezone.now() - timedelta(days=random.randint(120, 179)),
                    )
                    candidates.append(c)
                except Exception:
                    # Skip duplicates silently
                    continue

            if len(candidates) >= total:
                break

        self.stdout.write(f"     {len(candidates)} candidates registered.")
        return candidates

    # ── Candidate Subjects ───────────────────────────────────────────────────

    def _seed_candidate_subjects(self, candidates, subjects):
        self.stdout.write("  📝  Assigning subjects to candidates…")

        compulsory_codes  = [c for c, s in subjects.items() if s.is_compulsory]
        optional_codes    = [c for c, s in subjects.items() if not s.is_compulsory]

        bulk = []
        for candidate in candidates:
            # All 3 compulsory
            for code in compulsory_codes:
                bulk.append(CandidateSubject(
                    candidate=candidate,
                    subject=subjects[code],
                    is_compulsory=True,
                ))
            # 5–7 optional subjects (KCSE allows up to 9 total)
            n_optional = random.randint(5, min(7, len(optional_codes)))
            chosen = random.sample(optional_codes, n_optional)
            for code in chosen:
                bulk.append(CandidateSubject(
                    candidate=candidate,
                    subject=subjects[code],
                    is_compulsory=False,
                ))

        CandidateSubject.objects.bulk_create(bulk, ignore_conflicts=True)
        self.stdout.write(f"     {len(bulk)} candidate-subject records created.")

    # ── Marks & Results ──────────────────────────────────────────────────────

    def _seed_marks_and_results(self, candidates, subjects, papers, exam_year):
        self.stdout.write("  📊  Computing marks and results…")

        examiners = list(
            User.objects.filter(role=UserRole.EXAMINER, is_active_examiner=True)
        )
        if not examiners:
            self.stdout.write(self.style.WARNING("     No examiners found — skipping marks."))
            return

        subject_results_bulk = []
        candidate_results    = []

        for candidate in candidates:
            # Each candidate has a latent "ability" that shapes their marks
            ability_mean = random.gauss(55, 18)  # national mean ~55
            ability_mean = max(10, min(90, ability_mean))

            candidate_subjects = list(
                CandidateSubject.objects.filter(candidate=candidate)
                .select_related("subject")
            )

            all_points = []

            for cs in candidate_subjects:
                subj       = cs.subject
                subj_code  = subj.code
                subj_papers = papers.get(subj_code, [])

                if not subj_papers:
                    continue

                # Variation per subject
                subj_mean = random.gauss(ability_mean, 8)
                subj_mean = max(5, min(98, subj_mean))

                paper_marks_dict  = {}
                total_paper_marks = 0

                for sp in subj_papers:
                    paper_max = sp.max_marks
                    # Scale marks proportionally to paper max
                    scaled_mean = subj_mean * (paper_max / 100)
                    raw = random_marks(scaled_mean, paper_max * 0.12, 0, paper_max)
                    paper_marks_dict[f"paper_{sp.paper_number}"] = float(raw)
                    total_paper_marks += raw

                    # Create marks entry
                    examiner = random.choice(examiners)
                    script_barcode = f"SCR{candidate.index_number}{sp.pk}"

                    script, _ = ExaminationScript.objects.get_or_create(
                        barcode=script_barcode,
                        defaults=dict(
                            candidate=candidate,
                            subject_paper=sp,
                            examination_year=exam_year,
                            status=ScriptStatus.MARKED,
                            marked_at=timezone.now() - timedelta(days=random.randint(30, 90)),
                            assigned_examiner=examiner,
                        ),
                    )

                    MarksEntry.objects.get_or_create(
                        candidate=candidate,
                        subject_paper=sp,
                        defaults=dict(
                            script=script,
                            examiner=examiner,
                            marks=Decimal(str(round(raw, 2))),
                            status=MarksStatus.LOCKED,
                            approved_at=timezone.now() - timedelta(days=random.randint(20, 50)),
                            locked_at=timezone.now() - timedelta(days=random.randint(10, 19)),
                        ),
                    )

                # Normalise to 100
                total_marks = min(100, (total_paper_marks / subj.max_marks) * 100)

                # Small moderation adjustment (±0–3 marks)
                mod_adj = Decimal(str(round(random.uniform(-2, 3), 2)))
                moderated = Decimal(str(round(max(0, min(100, total_marks + float(mod_adj))), 2)))

                grade, points = marks_to_grade(float(moderated))
                all_points.append(points)

                subject_results_bulk.append(SubjectResult(
                    candidate=candidate,
                    subject=subj,
                    examination_year=exam_year,
                    paper_marks=paper_marks_dict,
                    total_marks=Decimal(str(round(total_marks, 2))),
                    moderation_adjustment=mod_adj,
                    moderated_marks=moderated,
                    grade=grade,
                    points=points,
                ))

            # ── Compute candidate aggregate ───────────────────────────────
            if not all_points:
                continue

            # KCSE: best 7 subjects for mean calculation
            best7 = sorted(all_points, reverse=True)[:7]
            total_pts  = sum(best7)
            subjects_n = len(best7)
            mean_pts   = Decimal(str(round(total_pts / subjects_n, 2)))

            # Map mean points to mean grade
            grade_map = {
                range(11, 13): "A",
                range(10, 11): "A-",
                range(9,  10): "B+",
                range(8,   9): "B",
                range(7,   8): "B-",
                range(6,   7): "C+",
                range(5,   6): "C",
                range(4,   5): "C-",
                range(3,   4): "D+",
                range(2,   3): "D",
                range(1,   2): "D-",
            }
            mean_grade = "E"
            for r, g in grade_map.items():
                if round(float(mean_pts)) in r:
                    mean_grade = g
                    break

            candidate_results.append(CandidateResult(
                candidate=candidate,
                examination_year=exam_year,
                subjects_sat=subjects_n,
                total_points=total_pts,
                mean_points=mean_pts,
                mean_grade=mean_grade,
                is_withheld=random.random() < 0.005,  # 0.5% withheld
                processed_at=timezone.now() - timedelta(days=7),
            ))

        # Bulk insert
        SubjectResult.objects.bulk_create(subject_results_bulk, ignore_conflicts=True)
        self.stdout.write(f"     {len(subject_results_bulk)} subject results saved.")

        CandidateResult.objects.bulk_create(candidate_results, ignore_conflicts=True)
        self.stdout.write(f"     {len(candidate_results)} candidate results saved.")

        # Assign national & school ranks
        self._assign_ranks(exam_year)

    def _assign_ranks(self, exam_year):
        """Set national_rank and school_rank on all CandidateResult rows."""
        self.stdout.write("  🏆  Assigning national and school ranks…")

        all_results = list(
            CandidateResult.objects
            .filter(examination_year=exam_year, is_withheld=False)
            .order_by("-mean_points")
            .select_related("candidate__examination_center")
        )
        for national_rank, cr in enumerate(all_results, start=1):
            cr.national_rank = national_rank

        CandidateResult.objects.bulk_update(all_results, ["national_rank"])

        # School ranks
        center_groups = {}
        for cr in all_results:
            key = cr.candidate.examination_center_id
            center_groups.setdefault(key, []).append(cr)

        school_rank_updates = []
        for center_id, group in center_groups.items():
            sorted_group = sorted(group, key=lambda x: x.mean_points, reverse=True)
            for school_rank, cr in enumerate(sorted_group, start=1):
                cr.school_rank = school_rank
                school_rank_updates.append(cr)

        CandidateResult.objects.bulk_update(school_rank_updates, ["school_rank"])
        self.stdout.write(f"     Ranks assigned to {len(all_results)} candidates.")

    # ── Result Publication ───────────────────────────────────────────────────

    def _seed_publication(self, exam_year):
        self.stdout.write("  📢  Creating result publication record…")
        admin = User.objects.filter(role=UserRole.KNEC_ADMIN).first()

        pub, created = ResultPublication.objects.update_or_create(
            examination_year=exam_year,
            defaults=dict(
                is_published=True,
                published_at=timezone.now() - timedelta(days=7),
                published_by=admin,
                announcement_message=(
                    f"The Kenya National Examinations Council is pleased to announce "
                    f"the release of KCSE {exam_year.year} results. "
                    f"Candidates can access their results on this portal using their "
                    f"index number and full name. "
                    f"Original result slips will be available from your school. "
                    f"Congratulations to all candidates."
                ),
            ),
        )
        self.stdout.write(f"     Publication {'created' if created else 'updated'}.")

    # ── Audit Logs ───────────────────────────────────────────────────────────

    def _seed_audit_logs(self, exam_year):
        self.stdout.write("  🔍  Creating sample audit log entries…")
        admin = User.objects.filter(role=UserRole.KNEC_ADMIN).first()

        sample_logs = [
            dict(
                action=AuditAction.PUBLISH,
                user=admin,
                description=f"Published KCSE {exam_year.year} results to the public portal.",
                object_type="ResultPublication",
                object_id=str(exam_year.pk),
            ),
            dict(
                action=AuditAction.CREATE,
                user=admin,
                description=f"ExaminationYear KCSE {exam_year.year} created and set as current.",
                object_type="ExaminationYear",
                object_id=str(exam_year.pk),
            ),
            dict(
                action=AuditAction.LOCK,
                user=User.objects.filter(role=UserRole.CHIEF_EXAMINER).first(),
                description="All marks locked for KCSE 2024 — marking season closed.",
                object_type="MarksEntry",
                object_id="bulk",
            ),
            dict(
                action=AuditAction.MODERATION,
                user=admin,
                description="National moderation adjustments applied across all subjects.",
                object_type="SubjectResult",
                object_id="bulk",
            ),
        ]

        count = 0
        for log_data in sample_logs:
            if log_data.get("user"):
                try:
                    AuditLog.log(**log_data)
                    count += 1
                except Exception:
                    pass

        # Random candidate lookup events
        candidates_sample = list(Candidate.objects.order_by("?")[:10])
        for candidate in candidates_sample:
            try:
                AuditLog.log(
                    action=AuditAction.LOOKUP,
                    user=None,
                    description=f"Public results lookup for {candidate.index_number}.",
                    object_type="Candidate",
                    object_id=str(candidate.pk),
                )
                count += 1
            except Exception:
                pass

        self.stdout.write(f"     {count} audit log entries created.")