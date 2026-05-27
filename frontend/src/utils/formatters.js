/**
 * src/utils/formatters.js
 *
 * Pure formatting utilities used across the KCSE frontend.
 * No side effects, no imports — safe to use anywhere.
 */


// ── KCSE Grading ──────────────────────────────────────────────────────────────

/**
 * KCSE mark-to-grade mapping (mirrors KCSE['MARKS_TO_POINTS'] in settings.py).
 * Used for client-side grade preview before results are committed.
 */
const MARKS_TO_GRADE = [
  { min: 75, max: 100, points: 12, grade: 'A'  },
  { min: 70, max:  74, points: 11, grade: 'A-' },
  { min: 65, max:  69, points: 10, grade: 'B+' },
  { min: 60, max:  64, points:  9, grade: 'B'  },
  { min: 55, max:  59, points:  8, grade: 'B-' },
  { min: 50, max:  54, points:  7, grade: 'C+' },
  { min: 45, max:  49, points:  6, grade: 'C'  },
  { min: 40, max:  44, points:  5, grade: 'C-' },
  { min: 35, max:  39, points:  4, grade: 'D+' },
  { min: 30, max:  34, points:  3, grade: 'D'  },
  { min: 25, max:  29, points:  2, grade: 'D-' },
  { min:  0, max:  24, points:  1, grade: 'E'  },
]

/**
 * Mean-points to mean-grade mapping.
 */
const MEAN_SCALE = [
  { min: 11.5, max: 12.0, grade: 'A'  },
  { min: 10.5, max: 11.4, grade: 'A-' },
  { min:  9.5, max: 10.4, grade: 'B+' },
  { min:  8.5, max:  9.4, grade: 'B'  },
  { min:  7.5, max:  8.4, grade: 'B-' },
  { min:  6.5, max:  7.4, grade: 'C+' },
  { min:  5.5, max:  6.4, grade: 'C'  },
  { min:  4.5, max:  5.4, grade: 'C-' },
  { min:  3.5, max:  4.4, grade: 'D+' },
  { min:  2.5, max:  3.4, grade: 'D'  },
  { min:  1.5, max:  2.4, grade: 'D-' },
  { min:  0.0, max:  1.4, grade: 'E'  },
]

/**
 * Convert subject marks (0–100) to grade and points.
 * @param {number} marks
 * @returns {{ grade: string, points: number }}
 */
export function marksToGrade(marks) {
  const entry = MARKS_TO_GRADE.find((r) => marks >= r.min && marks <= r.max)
  return entry ? { grade: entry.grade, points: entry.points } : { grade: 'E', points: 1 }
}

/**
 * Convert mean points to mean grade letter.
 * @param {number} meanPoints
 * @returns {string}
 */
export function meanPointsToGrade(meanPoints) {
  const pts  = parseFloat(meanPoints)
  const entry = MEAN_SCALE.find((r) => pts >= r.min && pts <= r.max)
  return entry?.grade ?? 'E'
}

/**
 * Grade colour for visual display.
 * Returns a Tailwind text colour class.
 * @param {string} grade
 * @returns {string}
 */
export function gradeColour(grade) {
  if (!grade) return 'text-gray-400'
  const g = grade.toUpperCase()
  if (g === 'A')  return 'text-emerald-600'
  if (g === 'A-') return 'text-emerald-500'
  if (g === 'B+') return 'text-teal-600'
  if (g === 'B')  return 'text-teal-500'
  if (g === 'B-') return 'text-cyan-600'
  if (g === 'C+') return 'text-blue-600'
  if (g === 'C')  return 'text-blue-500'
  if (g === 'C-') return 'text-yellow-600'
  if (g === 'D+') return 'text-orange-500'
  if (g === 'D')  return 'text-orange-600'
  if (g === 'D-') return 'text-red-500'
  return 'text-red-700' // E
}

/**
 * Grade background colour as a hex string (for charts/badges).
 * @param {string} grade
 * @returns {string}
 */
export function gradeHex(grade) {
  if (!grade) return '#9ca3af'
  const map = {
    'A':  '#059669', 'A-': '#10b981',
    'B+': '#0d9488', 'B':  '#14b8a6', 'B-': '#06b6d4',
    'C+': '#2563eb', 'C':  '#3b82f6', 'C-': '#ca8a04',
    'D+': '#f97316', 'D':  '#ea580c', 'D-': '#ef4444',
    'E':  '#b91c1c',
  }
  return map[grade.toUpperCase()] ?? '#6b7280'
}


// ── Index Number ──────────────────────────────────────────────────────────────

/**
 * Format an 11-digit index number with a visual separator for readability.
 * "10234001023" → "10234001 / 023"
 *
 * @param {string} indexNumber
 * @returns {string}
 */
export function formatIndexNumber(indexNumber) {
  if (!indexNumber || indexNumber.length !== 11) return indexNumber ?? ''
  return `${indexNumber.slice(0, 8)} / ${indexNumber.slice(8)}`
}

/**
 * Strip formatting from an index number back to 11 raw digits.
 * @param {string} formatted
 * @returns {string}
 */
export function unformatIndexNumber(formatted) {
  return (formatted ?? '').replace(/\D/g, '')
}


// ── Names ─────────────────────────────────────────────────────────────────────

/**
 * Normalise a candidate's full name to KNEC uppercase convention.
 * "gadafi imran akil" → "GADAFI IMRAN AKIL"
 *
 * @param {string} name
 * @returns {string}
 */
export function normaliseName(name) {
  return (name ?? '').trim().toUpperCase()
}

/**
 * Title-case a name for display (not for submission to the API).
 * "GADAFI IMRAN AKIL" → "Gadafi Imran Akil"
 *
 * @param {string} name
 * @returns {string}
 */
export function titleCaseName(name) {
  return (name ?? '')
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}


// ── Dates ─────────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string or Date to a Kenya-style short date.
 * "2024-11-15" → "15 Nov 2024"
 *
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-KE', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    })
  } catch {
    return String(value)
  }
}

/**
 * Format an ISO datetime string to date + time.
 * "2024-11-15T09:30:00Z" → "15 Nov 2024, 12:30 EAT"
 *
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-KE', {
      day:      '2-digit',
      month:    'short',
      year:     'numeric',
      hour:     '2-digit',
      minute:   '2-digit',
      timeZone: 'Africa/Nairobi',
    })
  } catch {
    return String(value)
  }
}

/**
 * Relative time ("3 hours ago", "2 days ago").
 * Falls back to formatDateTime for older dates.
 *
 * @param {string|Date} value
 * @returns {string}
 */
export function timeAgo(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60)            return 'just now'
  if (seconds < 3600)          return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400)         return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 86400 * 7)     return `${Math.floor(seconds / 86400)} days ago`
  return formatDate(value)
}


// ── Registration Status ───────────────────────────────────────────────────────

const STATUS_LABELS = {
  DRAFT:       'Draft',
  SUBMITTED:   'Submitted',
  COUNTY_APPR: 'County Approved',
  KNEC_APPR:   'KNEC Approved',
  REJECTED:    'Rejected',
}

const STATUS_COLOURS = {
  DRAFT:       'bg-gray-100 text-gray-700',
  SUBMITTED:   'bg-blue-100 text-blue-700',
  COUNTY_APPR: 'bg-cyan-100 text-cyan-700',
  KNEC_APPR:   'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-red-100 text-red-700',
}

/**
 * Human-readable label for a registration status code.
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

/**
 * Tailwind badge classes for a registration status.
 * @param {string} status
 * @returns {string}
 */
export function statusBadgeClass(status) {
  return STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-600'
}


// ── Numbers ───────────────────────────────────────────────────────────────────

/**
 * Ordinal suffix: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th"
 * @param {number} n
 * @returns {string}
 */
export function ordinal(n) {
  if (!n && n !== 0) return '—'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Format a number with commas: 10234 → "10,234"
 * @param {number|string} n
 * @returns {string}
 */
export function formatNumber(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return num.toLocaleString('en-KE')
}


// ── Gender ────────────────────────────────────────────────────────────────────

/**
 * @param {'M'|'F'} code
 * @returns {string}
 */
export function genderLabel(code) {
  return code === 'M' ? 'Male' : code === 'F' ? 'Female' : '—'
}


// ── File size ─────────────────────────────────────────────────────────────────

/**
 * Human-readable file size.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}


// ── Download helper ───────────────────────────────────────────────────────────

/**
 * Trigger a browser file download from a Blob.
 * @param {Blob}   blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}