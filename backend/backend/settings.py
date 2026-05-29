import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────────────────────────────────────

SECRET_KEY = config(
    'DJANGO_SECRET_KEY',
    default='django-insecure-44&@k^_x_=zqgv@7xnbf&xiy++g23_)9c*5xgg4!8(o26y1@y('
)

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=Csv())


# ─────────────────────────────────────────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────────────────────────────────────────

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'storages',
]

LOCAL_APPS = [
    'core',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ─────────────────────────────────────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',          # Must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────────────────────

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOM USER MODEL
# ─────────────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'core.User'


# ─────────────────────────────────────────────────────────────────────────────
# PASSWORD VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 10},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# INTERNATIONALISATION
# ─────────────────────────────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Africa/Nairobi'   # EAT (UTC+3)
USE_I18N      = True
USE_TZ        = True


# ─────────────────────────────────────────────────────────────────────────────
# DEFAULT PK
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ─────────────────────────────────────────────────────────────────────────────
# STATIC & MEDIA FILES
# ─────────────────────────────────────────────────────────────────────────────

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ─────────────────────────────────────────────────────────────────────────────
# DJANGO REST FRAMEWORK
# ─────────────────────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    # Authentication
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    # Default: authenticated staff only; public endpoints set AllowAny explicitly
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # Pagination — use built-in until your custom paginator is created
    # TODO: swap to 'core.pagination.StandardResultsSetPagination' once created
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Filtering
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # Throttling
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '2000/hour',
    },
    # Schema generation
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # Parser classes
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    # Renderer classes
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # disable in production
    ],
    # Date/time formats — ISO 8601
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%SZ',
    'DATE_FORMAT':     '%Y-%m-%d',
}


# ─────────────────────────────────────────────────────────────────────────────
# SIMPLE JWT
# ─────────────────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN':        True,
    'ALGORITHM':                'HS256',
    'AUTH_HEADER_TYPES':        ('Bearer',),
    'AUTH_TOKEN_CLASSES':       ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM':         'token_type',
    'JTI_CLAIM':                'jti',
    # TODO: swap to 'core.serializers.CustomTokenObtainPairSerializer' once created
    'TOKEN_OBTAIN_SERIALIZER':  'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
}


# ─────────────────────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# ─────────────────────────────────────────────────────────────────────────────
# CACHE — Redis
# ─────────────────────────────────────────────────────────────────────────────

# REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

# CACHES = {
#     'default': {
#         'BACKEND':  'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': REDIS_URL,
#         'OPTIONS': {
#             'CLIENT_CLASS': 'django_redis.client.DefaultClient',
#         },
#         'TIMEOUT': 300,  # 5 minutes default cache timeout
#         'KEY_PREFIX': 'kcse',
#     }
# }


SESSION_ENGINE      = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'


# ─────────────────────────────────────────────────────────────────────────────
# CELERY — Async Task Queue
# ─────────────────────────────────────────────────────────────────────────────

# CELERY_BROKER_URL         = REDIS_URL
# CELERY_RESULT_BACKEND     = REDIS_URL
# CELERY_ACCEPT_CONTENT     = ['json']
# CELERY_TASK_SERIALIZER    = 'json'
# CELERY_RESULT_SERIALIZER  = 'json'
# CELERY_TIMEZONE           = 'Africa/Nairobi'
# CELERY_TASK_TRACK_STARTED = True
# CELERY_TASK_TIME_LIMIT    = 30 * 60    # 30 minutes hard limit
# CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes soft limit

# CELERY_BEAT_SCHEDULE = {
#     'recompute-rankings-nightly': {
#         'task':     'core.tasks.recompute_rankings',
#         'schedule': 3600 * 24,  # every 24 hours
#     },
# }


# ─────────────────────────────────────────────────────────────────────────────
# EMAIL
# ─────────────────────────────────────────────────────────────────────────────

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST          = config('EMAIL_HOST',     default='smtp.gmail.com')
EMAIL_PORT          = config('EMAIL_PORT',     default=587, cast=int)
EMAIL_USE_TLS       = config('EMAIL_USE_TLS',  default=True, cast=bool)
EMAIL_HOST_USER     = config('EMAIL_HOST_USER',     default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL  = config('DEFAULT_FROM_EMAIL',  default='KCSE Portal <noreply@kcse.go.ke>')


# ─────────────────────────────────────────────────────────────────────────────
# STORAGE — AWS S3 (for passport photos & media in production)
# ─────────────────────────────────────────────────────────────────────────────

USE_S3 = config('USE_S3', default=False, cast=bool)

if USE_S3:
    AWS_ACCESS_KEY_ID       = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY   = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME      = config('AWS_S3_REGION_NAME', default='af-south-1')
    AWS_S3_CUSTOM_DOMAIN    = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_FILE_OVERWRITE   = False
    AWS_DEFAULT_ACL         = None
    AWS_S3_SIGNATURE_VERSION = 's3v4'

    AWS_QUERYSTRING_AUTH    = True
    AWS_QUERYSTRING_EXPIRE  = 3600

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'bucket_name': AWS_STORAGE_BUCKET_NAME,
                'location':    'media',
            },
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
            'OPTIONS': {
                'bucket_name': AWS_STORAGE_BUCKET_NAME,
                'location':    'static',
            },
        },
    }
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'


# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────

LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)  # auto-create logs/ directory if missing

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {process:d} {thread:d} — {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{asctime}] {levelname} — {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'class':     'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class':       'logging.handlers.RotatingFileHandler',
            'filename':    LOGS_DIR / 'kcse.log',
            'maxBytes':    10 * 1024 * 1024,  # 10 MB
            'backupCount': 5,
            'formatter':   'verbose',
        },
        'mail_admins': {
            'level':   'ERROR',
            'class':   'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],
        },
    },
    'loggers': {
        'django': {
            'handlers':  ['console', 'file'],
            'level':     'WARNING',
            'propagate': True,
        },
        'celery': {
            'handlers': ['console', 'file'],
            'level':    'INFO',
        },
    },
    'root': {
        'handlers': ['console'],
        'level':    'WARNING',
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# DRF SPECTACULAR (OpenAPI / Swagger)
# ─────────────────────────────────────────────────────────────────────────────

SPECTACULAR_SETTINGS = {
    'TITLE':       'KCSE Management System API',
    'DESCRIPTION': (
        'REST API for the Kenya Certificate of Secondary Education (KCSE) '
        'examination management system. Covers candidate registration, '
        'marks entry, results processing, and public results lookup.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
    },
    'CONTACT': {
        'name':  'KNEC IT Support',
        'email': 'itsupport@knec.ac.ke',
        'url':   'https://www.knec.ac.ke',
    },
    'LICENSE': {
        'name': 'MIT',
    },
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Public',     'description': 'Public endpoints — no authentication required'},
        {'name': 'Auth',       'description': 'JWT authentication'},
        {'name': 'Candidates', 'description': 'Candidate registration & management'},
        {'name': 'Scripts',    'description': 'Examination script tracking'},
        {'name': 'Marks',      'description': 'Marks entry & approval'},
        {'name': 'Results',    'description': 'Results processing & publication'},
        {'name': 'Analytics',  'description': 'School & national performance analytics'},
        {'name': 'Admin',      'description': 'KNEC admin operations'},
        {'name': 'Audit',      'description': 'System audit trail'},
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
# FILE UPLOAD LIMITS
# ─────────────────────────────────────────────────────────────────────────────

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB

ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']
MAX_PHOTO_SIZE_MB    = 2


# ─────────────────────────────────────────────────────────────────────────────
# KCSE BUSINESS RULES
# ─────────────────────────────────────────────────────────────────────────────

KCSE = {
    'MIN_CANDIDATE_AGE':    14,
    'MAX_OPTIONAL_SUBJECTS': 6,
    'MIN_TOTAL_SUBJECTS':    7,
    'MAX_TOTAL_SUBJECTS':    9,
    'SUBJECTS_FOR_MEAN':     7,
    'GRADE_SCALE': [
        (11.5, 12.0, 'A'),
        (10.5, 11.4, 'A-'),
        (9.5,  10.4, 'B+'),
        (8.5,   9.4, 'B'),
        (7.5,   8.4, 'B-'),
        (6.5,   7.4, 'C+'),
        (5.5,   6.4, 'C'),
        (4.5,   5.4, 'C-'),
        (3.5,   4.4, 'D+'),
        (2.5,   3.4, 'D'),
        (1.5,   2.4, 'D-'),
        (0.0,   1.4, 'E'),
    ],
    'MARKS_TO_POINTS': [
        (75, 100, 12, 'A'),
        (70,  74, 11, 'A-'),
        (65,  69, 10, 'B+'),
        (60,  64,  9, 'B'),
        (55,  59,  8, 'B-'),
        (50,  54,  7, 'C+'),
        (45,  49,  6, 'C'),
        (40,  44,  5, 'C-'),
        (35,  39,  4, 'D+'),
        (30,  34,  3, 'D'),
        (25,  29,  2, 'D-'),
        ( 0,  24,  1, 'E'),
    ],
}