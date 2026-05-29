#  KCSE Results Management System V2

A full-stack web application for managing Kenya Certificate of Secondary Education (KCSE) examinations — from candidate registration through results publication. Built with **Django REST Framework** (backend) and **React JSX** (frontend).

---

##  Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Installation & Setup](#installation--setup)
  - [Backend (Django)](#backend-django)
  - [Frontend (React)](#frontend-react)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Grading System](#grading-system)
- [Security & Audit](#security--audit)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The KCSE Management System digitizes and streamlines the entire KCSE examination lifecycle:

1. **Candidate Registration** — Schools register Form 4 students via KNEC-linked portal
2. **Examination Coordination** — Timetables, seating plans, attendance registers
3. **Script Tracking** — Barcode/serial number tracking from exam room to marking centre
4. **Marks Entry & Validation** — Secure examiner portals with automated score validation
5. **Results Processing** — Grade computation, mean scores, rankings, moderation
6. **Results Publication** — Candidates retrieve results using index number + full name (no login required)
7. **Analytics & Reporting** — School performance, county rankings, national statistics

> **Public Access**: Any candidate can retrieve their results by entering their **11-digit KNEC index number** and **full name** — no account or login required.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   React JSX (Vite) │ Tailwind CSS │ Axios │ React Router v6     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS (REST API)
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│         Django REST Framework │ JWT Auth │ CORS Headers         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  examinations/ app (core)  │  accounts/ app  │  analytics/ app  │
│  - Candidate Registration  │  - Staff Auth   │  - Reports       │
│  - Marks Entry             │  - Role-Based   │  - Statistics    │
│  - Results Processing      │    Permissions  │  - Rankings      │
│  - Script Tracking         │                 │                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DATA LAYER                                 │
│      PostgreSQL (primary) │ Redis (cache/sessions) │ S3 (media) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
kcse_system/
├── backend/                          # Django project root
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── kcse_system/                  # Django project config
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   └── apps/
│       ├── examinations/             #  CORE APPLICATION
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py             # All data models
│       │   ├── serializers.py        # DRF serializers
│       │   ├── views.py              # API views
│       │   ├── urls.py               # URL routing
│       │   ├── permissions.py        # Custom permissions
│       │   ├── validators.py         # Business logic validators
│       │   ├── grading.py            # KCSE grading engine
│       │   ├── tasks.py              # Celery async tasks
│       │   ├── signals.py            # Django signals
│       │   ├── filters.py            # DRF filter classes
│       │   ├── pagination.py         # Custom pagination
│       │   ├── tests/
│       │   │   ├── test_models.py
│       │   │   ├── test_views.py
│       │   │   ├── test_serializers.py
│       │   │   └── test_grading.py
│       │   └── migrations/
│       │
│       ├── accounts/                 # User management
│       │   ├── models.py             # Staff user, roles
│       │   ├── serializers.py
│       │   ├── views.py
│       │   └── urls.py
│       │
│       └── analytics/                # Reports & statistics
│           ├── models.py
│           ├── serializers.py
│           ├── views.py
│           └── urls.py
│
└── frontend/                         # React application
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   ├── axios.js
        │   └── endpoints.js
        ├── components/
        │   ├── common/
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   ├── LoadingSpinner.jsx
        │   │   └── ErrorBoundary.jsx
        │   ├── results/
        │   │   ├── ResultsLookup.jsx   # Public index number lookup
        │   │   ├── ResultCard.jsx      # Individual subject results
        │   │   ├── GradeDisplay.jsx    # Grade + points display
        │   │   └── ResultSlip.jsx      # Printable result slip
        │   └── admin/
        │       ├── CandidateForm.jsx
        │       ├── MarksEntry.jsx
        │       └── Dashboard.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── ResultsPage.jsx         # Public results lookup page
        │   ├── AdminDashboard.jsx
        │   └── NotFound.jsx
        ├── hooks/
        │   ├── useResults.js
        │   └── useAuth.js
        ├── context/
        │   └── AuthContext.jsx
        └── utils/
            ├── formatters.js
            └── validators.js
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| Django | 5.0+ | Web framework |
| Django REST Framework | 3.15+ | REST API |
| djangorestframework-simplejwt | 5.3+ | JWT authentication |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching & Celery broker |
| Celery | 5.3+ | Async task queue |
| django-cors-headers | 4.3+ | CORS management |
| django-filter | 23+ | QuerySet filtering |
| Pillow | 10+ | Image processing |
| boto3 | 1.34+ | AWS S3 media storage |
| psycopg2-binary | 2.9+ | PostgreSQL adapter |
| python-decouple | 3.8+ | Environment config |
| drf-spectacular | 0.27+ | OpenAPI/Swagger docs |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool |
| React Router | v6 | Client-side routing |
| Axios | 1.6+ | HTTP client |
| Tailwind CSS | 3.4+ | Utility-first styling |
| React Query | 5+ | Server state management |
| React Hook Form | 7+ | Form handling |
| Zod | 3+ | Schema validation |
| html2canvas + jsPDF | latest | Result slip PDF export |

---

## Core Features

###  Public (No Login Required)
- **Results Lookup**: Enter 11-digit index number + full name → instant results display
- **Result Slip Download**: Print or download PDF result slip
- **School Performance**: View school mean grades and rankings

### School Administration
- Candidate registration with full KNEC data capture
- Subject combination management and validation
- Examination attendance recording
- Access to candidate nominal rolls and timetables

### 📝 Examiner Portal
- Secure marks entry per subject paper
- Bulk marks upload via CSV/Excel
- Real-time validation (range checks, duplicate detection)
- Mark review and approval workflow

### 🏛️ KNEC Administration
- Final candidate approval and index number assignment
- Nationwide marks moderation
- Irregularity and malpractice detection
- Results locking and publication control
- Full audit log viewer

### 📊 Analytics
- School performance reports
- County and national rankings
- Subject performance trends
- Grade distribution statistics

---

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

---

### Backend (Django)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/kcse-system.git
cd kcse-system/backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Linux/macOS
# venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# 5. Create PostgreSQL database
psql -U postgres
CREATE DATABASE kcse_db;
CREATE USER kcse_user WITH PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE kcse_db TO kcse_user;
\q

# 6. Run database migrations
python manage.py migrate

# 7. Load initial data (subjects, grading rules)
python manage.py loaddata fixtures/subjects.json
python manage.py loaddata fixtures/grading_rules.json

# 8. Create superuser
python manage.py createsuperuser

# 9. Start development server
python manage.py runserver

# 10. (Optional) Start Celery worker for async tasks
celery -A kcse_system worker --loglevel=info
```

The API will be available at `http://localhost:8000/api/v1/`

API Documentation (Swagger): `http://localhost:8000/api/docs/`

---

### Frontend (React)

```bash
# From project root
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000/api/v1

# 3. Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173/`

---

## Environment Variables

### Backend `.env`

```ini
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=kcse_db
DB_USER=kcse_user
DB_PASSWORD=strongpassword
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# AWS S3 (for passport photos in production)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=kcse-media
AWS_S3_REGION_NAME=af-south-1

# Email (for staff notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@kcse.go.ke
EMAIL_HOST_PASSWORD=email-password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `.env.local`

```ini
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=KCSE Results Portal
VITE_KNEC_YEAR=2024
```

---

## API Reference

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/results/lookup/` | Look up results by index number + full name |
| `GET` | `/api/v1/results/slip/{index_number}/` | Download result slip PDF |
| `GET` | `/api/v1/schools/performance/` | School mean grade rankings |

### Results Lookup Request

```json
POST /api/v1/results/lookup/
{
  "index_number": "10234001001",
  "full_name": "GADAFI IMRAN AKIL"
}
```

### Results Lookup Response

```json
{
  "candidate": {
    "index_number": "10234001001",
    "full_name": "GADAFI IMRAN AKIL",
    "school_name": "Moi High School Nairobi",
    "year": 2024,
    "gender": "M"
  },
  "results": {
    "mean_grade": "B+",
    "mean_points": 10.3,
    "total_subjects": 8,
    "subjects": [
      {
        "subject_name": "English",
        "subject_code": "101",
        "marks": 72,
        "grade": "B+",
        "points": 10
      },
      {
        "subject_name": "Mathematics",
        "subject_code": "121",
        "marks": 81,
        "grade": "A-",
        "points": 11
      }
    ]
  }
}
```

### Authenticated Endpoints (Staff Only)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login/` | Staff login |
| `POST` | `/api/v1/auth/refresh/` | Refresh JWT token |
| `GET/POST` | `/api/v1/candidates/` | List / register candidates |
| `GET/PUT` | `/api/v1/candidates/{id}/` | Retrieve / update candidate |
| `POST` | `/api/v1/candidates/{id}/submit/` | Submit for KNEC approval |
| `GET/POST` | `/api/v1/marks/` | List / enter marks |
| `POST` | `/api/v1/marks/bulk-upload/` | Bulk marks upload (CSV) |
| `POST` | `/api/v1/marks/{id}/approve/` | Chief examiner approval |
| `POST` | `/api/v1/results/process/` | Trigger results computation |
| `POST` | `/api/v1/results/publish/` | Publish results (KNEC admin) |
| `GET` | `/api/v1/analytics/school/{id}/` | School performance report |
| `GET` | `/api/v1/analytics/national/` | National statistics |
| `GET` | `/api/v1/audit-logs/` | System audit trail |

---

## Data Models

### Core Models (examinations app)

**ExaminationYear** — Controls which year's results are active and published

**ExaminationCenter** — Schools registered as KNEC exam centers with their center codes

**Candidate** — Full student registration data: name, index number, KCPE index, subjects, passport photo, registration status

**Subject** — All KCSE examinable subjects with codes, paper structure, and compulsory/optional flags

**CandidateSubject** — Many-to-many link between candidates and their selected subjects

**ExaminationScript** — Barcode-tracked physical scripts moving from exam room → marking center → examined

**MarksEntry** — Individual examiner mark entries per candidate per subject paper, with validation flags

**SubjectResult** — Computed final marks, grade, and points per subject per candidate after moderation

**CandidateResult** — Aggregate result: mean grade, mean points, division, overall ranking

**ResultPublication** — Controls when results go live: published flag, publish date, authorized by

**AuditLog** — Immutable record of every action: user, timestamp, action type, affected object, IP address

---

## Grading System

KCSE grades are assigned per subject based on marks out of 100:

| Grade | Points | Marks Range |
|---|---|---|
| A | 12 | 75 – 100 |
| A- | 11 | 70 – 74 |
| B+ | 10 | 65 – 69 |
| B | 9 | 60 – 64 |
| B- | 8 | 55 – 59 |
| C+ | 7 | 50 – 54 |
| C | 6 | 45 – 49 |
| C- | 5 | 40 – 44 |
| D+ | 4 | 35 – 39 |
| D | 3 | 30 – 34 |
| D- | 2 | 25 – 29 |
| E | 1 | 00 – 24 |

**Mean Grade** is calculated by averaging points across the best 7 subjects (or as KNEC specifies per year). The mean points determine the overall letter grade using the same scale.

The grading engine lives in `apps/examinations/grading.py` and is invoked by the `process_results` management command / Celery task after marks are locked and moderated.

---

## Security & Audit

- All staff actions are logged to `AuditLog` (user, IP, timestamp, object, action)
- Results are read-only once published — no edits without KNEC admin override + audit entry
- Marks entry is locked per subject once approved by chief examiner
- JWT tokens expire after 60 minutes; refresh tokens after 7 days
- Rate limiting applied on the public `/results/lookup/` endpoint (20 requests/minute per IP)
- Candidate passport photos stored in private S3 bucket, served via signed URLs
- SQL injection and XSS protection via Django ORM and DRF serializers

---

## Running Tests

```bash
# Backend
cd backend
python manage.py test apps.examinations --verbosity=2

# With coverage
pip install coverage
coverage run manage.py test
coverage report
coverage html  # Opens htmlcov/index.html

# Frontend
cd frontend
npm run test
npm run test:coverage
```

---

## Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use `gunicorn` + `nginx` for Django
- [ ] Configure PostgreSQL with connection pooling (pgBouncer)
- [ ] Set up Redis Sentinel or Redis Cluster for HA
- [ ] Configure S3 for media storage
- [ ] Enable HTTPS / SSL certificate (Let's Encrypt)
- [ ] Set up Celery with systemd or supervisor
- [ ] Configure Django's `SECURE_*` settings
- [ ] Run `python manage.py collectstatic`

### Docker (Recommended)

```bash
# Build and start all services
docker compose up --build

# Run migrations inside container
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser
```

`docker-compose.yml` includes: `db` (PostgreSQL), `redis`, `backend` (Django + Gunicorn), `celery`, `frontend` (React + Nginx), `nginx` (reverse proxy).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and ensure all tests pass before submitting.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

> Built for the Kenya National Examinations Council (KNEC) examination management ecosystem.
> For official KNEC information visit [www.knec.ac.ke](https://www.knec.ac.ke)