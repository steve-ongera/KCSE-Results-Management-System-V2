/**
 * src/api/endpoints.js
 *
 * Every API call in the KCSE system lives here as a typed function.
 * Components and React Query hooks import from this file — never call
 * axios directly from components.
 *
 * Naming convention:
 *   get*   — GET requests   (used as React Query queryFn)
 *   create* / update* / delete* / do* — mutations
 */

import api from './axios'


// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{ username: string, password: string }} credentials
 * @returns {{ access: string, refresh: string, user: object }}
 */
export const login = (credentials) =>
  api.post('/auth/login/', credentials).then((r) => r.data)

/**
 * @param {{ refresh: string }} payload
 * @returns {{ access: string, refresh?: string }}
 */
export const refreshToken = (payload) =>
  api.post('/auth/refresh/', payload).then((r) => r.data)

export const logout = (payload) =>
  api.post('/auth/logout/', payload).then((r) => r.data)

/** Returns the currently authenticated staff user's profile. */
export const getMe = () =>
  api.get('/auth/me/').then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC — RESULTS LOOKUP (no auth)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Public results lookup — no login required.
 *
 * @param {{ index_number: string, full_name: string }} payload
 * @returns {ResultsLookupResponse}
 */
export const lookupResults = (payload) =>
  api.post('/results/lookup/', payload).then((r) => r.data)

/**
 * Download a candidate's result slip as PDF.
 * Returns a Blob so the caller can trigger a browser download.
 *
 * @param {string} indexNumber
 * @returns {Blob}
 */
export const downloadResultSlip = (indexNumber) =>
  api
    .get(`/results/slip/${indexNumber}/`, { responseType: 'blob' })
    .then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// EXAMINATION YEARS
// ═════════════════════════════════════════════════════════════════════════════

/** @returns {{ results: ExaminationYear[] }} */
export const getExaminationYears = (params) =>
  api.get('/years/', { params }).then((r) => r.data)

/** @param {string} id */
export const getExaminationYear = (id) =>
  api.get(`/years/${id}/`).then((r) => r.data)

/** @param {string} id @param {object} data */
export const updateExaminationYear = (id, data) =>
  api.patch(`/years/${id}/`, data).then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// EXAMINATION CENTERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{ county?: string, sub_county?: string, search?: string, page?: number }} params
 */
export const getExaminationCenters = (params) =>
  api.get('/centers/', { params }).then((r) => r.data)

/** @param {string} id */
export const getExaminationCenter = (id) =>
  api.get(`/centers/${id}/`).then((r) => r.data)

/** @param {object} data */
export const createExaminationCenter = (data) =>
  api.post('/centers/', data).then((r) => r.data)

/** @param {string} id @param {object} data */
export const updateExaminationCenter = (id, data) =>
  api.patch(`/centers/${id}/`, data).then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// SUBJECTS
// ═════════════════════════════════════════════════════════════════════════════

/** @param {{ category?: string, is_compulsory?: boolean }} params */
export const getSubjects = (params) =>
  api.get('/subjects/', { params }).then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// CANDIDATES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{
 *   search?: string,
 *   registration_status?: string,
 *   gender?: string,
 *   examination_year?: string,
 *   examination_center?: string,
 *   page?: number,
 *   page_size?: number,
 *   ordering?: string
 * }} params
 */
export const getCandidates = (params) =>
  api.get('/candidates/', { params }).then((r) => r.data)

/** @param {string} id */
export const getCandidate = (id) =>
  api.get(`/candidates/${id}/`).then((r) => r.data)

/**
 * Register a new candidate. Uses FormData to support passport photo upload.
 * @param {FormData} formData
 */
export const createCandidate = (formData) =>
  api
    .post('/candidates/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

/**
 * @param {string} id
 * @param {FormData} formData
 */
export const updateCandidate = (id, formData) =>
  api
    .patch(`/candidates/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

/** @param {string} id */
export const deleteCandidate = (id) =>
  api.delete(`/candidates/${id}/`).then((r) => r.data)

/** Submit a draft candidate for approval. @param {string} id */
export const submitCandidate = (id) =>
  api.post(`/candidates/${id}/submit/`).then((r) => r.data)

/** KNEC admin approves a submitted candidate. @param {string} id */
export const approveCandidate = (id) =>
  api.post(`/candidates/${id}/approve/`).then((r) => r.data)

/**
 * KNEC admin rejects a candidate.
 * @param {string} id
 * @param {string} reason
 */
export const rejectCandidate = (id, reason) =>
  api.post(`/candidates/${id}/reject/`, { reason }).then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// EXAMINATION SCRIPTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{
 *   status?: string,
 *   examination_year?: string,
 *   subject_paper?: string,
 *   search?: string,
 *   page?: number
 * }} params
 */
export const getScripts = (params) =>
  api.get('/scripts/', { params }).then((r) => r.data)

/** @param {string} id */
export const getScript = (id) =>
  api.get(`/scripts/${id}/`).then((r) => r.data)

/** @param {object} data */
export const createScript = (data) =>
  api.post('/scripts/', data).then((r) => r.data)

/**
 * Update script status via barcode scan.
 * @param {{ barcode: string, status: string, notes?: string }} data
 */
export const updateScriptStatus = (data) =>
  api.post('/scripts/update-status/', data).then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// MARKS ENTRY
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{
 *   status?: string,
 *   subject_paper?: string,
 *   is_abnormal?: boolean,
 *   search?: string,
 *   page?: number
 * }} params
 */
export const getMarksEntries = (params) =>
  api.get('/marks/', { params }).then((r) => r.data)

/** @param {string} id */
export const getMarksEntry = (id) =>
  api.get(`/marks/${id}/`).then((r) => r.data)

/**
 * Enter marks for a script.
 * @param {{ script: string, candidate: string, subject_paper: string, marks: number }} data
 */
export const createMarksEntry = (data) =>
  api.post('/marks/', data).then((r) => r.data)

/** @param {string} id @param {{ marks: number }} data */
export const updateMarksEntry = (id, data) =>
  api.patch(`/marks/${id}/`, data).then((r) => r.data)

/**
 * Approve, lock, or flag a marks entry.
 * @param {string} id
 * @param {{ action: 'approve'|'lock'|'flag', note?: string }} data
 */
export const approveMarksEntry = (id, data) =>
  api.post(`/marks/${id}/approve/`, data).then((r) => r.data)

/**
 * Bulk upload marks via CSV / Excel.
 * @param {File}   file
 * @param {string} subjectPaperId
 */
export const bulkUploadMarks = (file, subjectPaperId) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('subject_paper_id', subjectPaperId)
  return api
    .post('/marks/bulk-upload/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}


// ═════════════════════════════════════════════════════════════════════════════
// RESULTS — STAFF
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{
 *   examination_year?: string,
 *   mean_grade?: string,
 *   is_withheld?: boolean,
 *   search?: string,
 *   ordering?: string,
 *   page?: number
 * }} params
 */
export const getCandidateResults = (params) =>
  api.get('/results/candidates/', { params }).then((r) => r.data)

/** @param {string} id */
export const getCandidateResult = (id) =>
  api.get(`/results/candidates/${id}/`).then((r) => r.data)

/**
 * Withhold or un-withhold a result.
 * @param {string} id
 * @param {{ is_withheld: boolean, withheld_reason?: string }} data
 */
export const updateCandidateResult = (id, data) =>
  api.patch(`/results/candidates/${id}/`, data).then((r) => r.data)

/**
 * Trigger results computation for an examination year (async).
 * @param {string} examinationYearId
 */
export const processResults = (examinationYearId) =>
  api
    .post('/results/process/', { examination_year_id: examinationYearId })
    .then((r) => r.data)

/**
 * Publish results publicly.
 * @param {{ examination_year_id: string, announcement_message?: string, confirm: true }} data
 */
export const publishResults = (data) =>
  api.post('/results/publish/', data).then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS (public — no auth required for published years)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * School performance summary.
 * @param {string} centerCode   — 8-digit KNEC center code
 * @param {number} [year]       — examination year (optional, defaults to current)
 */
export const getSchoolPerformance = (centerCode, year) =>
  api
    .get(`/analytics/school/${centerCode}/`, { params: year ? { year } : {} })
    .then((r) => r.data)

/**
 * National statistics for a published year.
 * @param {number} [year]
 */
export const getNationalStatistics = (year) =>
  api
    .get('/analytics/national/', { params: year ? { year } : {} })
    .then((r) => r.data)


// ═════════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {{
 *   action?: string,
 *   user?: string,
 *   object_type?: string,
 *   date_from?: string,   // YYYY-MM-DD
 *   date_to?: string,
 *   search?: string,
 *   page?: number
 * }} params
 */
export const getAuditLogs = (params) =>
  api.get('/audit-logs/', { params }).then((r) => r.data)