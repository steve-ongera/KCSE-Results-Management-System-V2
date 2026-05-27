/**
 * src/hooks/useResults.js
 *
 * React Query hooks for all results-related API calls.
 *
 * Each hook returns the standard React Query shape:
 *   { data, isLoading, isError, error, ... }
 *
 * Mutations return { mutate, mutateAsync, isPending, isError, error, ... }
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  lookupResults,
  downloadResultSlip,
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  submitCandidate,
  approveCandidate,
  rejectCandidate,
  getMarksEntries,
  getMarksEntry,
  createMarksEntry,
  updateMarksEntry,
  approveMarksEntry,
  bulkUploadMarks,
  getCandidateResults,
  getCandidateResult,
  updateCandidateResult,
  processResults,
  publishResults,
  getSchoolPerformance,
  getNationalStatistics,
  getAuditLogs,
  getExaminationYears,
  getExaminationCenters,
  getSubjects,
  getScripts,
} from '../api/endpoints'
import { downloadBlob } from '../utils/formatters'


// ── Query key factory — centralises cache key management ─────────────────────

export const keys = {
  years:              (params)       => ['years', params],
  centers:            (params)       => ['centers', params],
  subjects:           (params)       => ['subjects', params],

  candidates:         (params)       => ['candidates', params],
  candidate:          (id)           => ['candidate', id],

  scripts:            (params)       => ['scripts', params],

  marks:              (params)       => ['marks', params],
  marksEntry:         (id)           => ['marksEntry', id],

  results:            (params)       => ['results', params],
  result:             (id)           => ['result', id],

  schoolPerformance:  (code, year)   => ['schoolPerf', code, year],
  nationalStats:      (year)         => ['nationalStats', year],

  auditLogs:          (params)       => ['auditLogs', params],
}


// ═════════════════════════════════════════════════════════════════════════════
// REFERENCE DATA
// ═════════════════════════════════════════════════════════════════════════════

export function useExaminationYears(params) {
  return useQuery({
    queryKey:  keys.years(params),
    queryFn:   () => getExaminationYears(params),
    staleTime: 10 * 60 * 1000,  // Years rarely change
  })
}

export function useExaminationCenters(params) {
  return useQuery({
    queryKey: keys.centers(params),
    queryFn:  () => getExaminationCenters(params),
  })
}

export function useSubjects(params) {
  return useQuery({
    queryKey:  keys.subjects(params),
    queryFn:   () => getSubjects(params),
    staleTime: 30 * 60 * 1000,  // Subjects almost never change
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC RESULTS LOOKUP
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Mutation for the public results lookup form.
 *
 * Usage:
 *   const { mutate, data, isPending, isError, error } = useResultsLookup()
 *   mutate({ index_number: '...', full_name: '...' })
 */
export function useResultsLookup() {
  return useMutation({
    mutationFn: lookupResults,
  })
}

/**
 * Download a result slip PDF.
 * Automatically triggers a browser download.
 *
 * Usage:
 *   const { mutate, isPending } = useDownloadResultSlip()
 *   mutate('10234001023')
 */
export function useDownloadResultSlip() {
  return useMutation({
    mutationFn: async (indexNumber) => {
      const blob = await downloadResultSlip(indexNumber)
      downloadBlob(blob, `KCSE_Result_${indexNumber}.pdf`)
    },
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// CANDIDATES
// ═════════════════════════════════════════════════════════════════════════════

/** Paginated candidate list with filters. */
export function useCandidates(params) {
  return useQuery({
    queryKey: keys.candidates(params),
    queryFn:  () => getCandidates(params),
    keepPreviousData: true,  // Smooth pagination
  })
}

/** Single candidate detail (with subject list). */
export function useCandidate(id) {
  return useQuery({
    queryKey: keys.candidate(id),
    queryFn:  () => getCandidate(id),
    enabled:  !!id,
  })
}

export function useCreateCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCandidate,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })
}

export function useUpdateCandidate(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData) => updateCandidate(id, formData),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: keys.candidate(id) })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useDeleteCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCandidate,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })
}

export function useSubmitCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitCandidate,
    onSuccess:  (_, id) => {
      qc.invalidateQueries({ queryKey: keys.candidate(id) })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useApproveCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: approveCandidate,
    onSuccess:  (_, id) => {
      qc.invalidateQueries({ queryKey: keys.candidate(id) })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useRejectCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => rejectCandidate(id, reason),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.candidate(id) })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// SCRIPTS
// ═════════════════════════════════════════════════════════════════════════════

export function useScripts(params) {
  return useQuery({
    queryKey: keys.scripts(params),
    queryFn:  () => getScripts(params),
    keepPreviousData: true,
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// MARKS ENTRY
// ═════════════════════════════════════════════════════════════════════════════

export function useMarksEntries(params) {
  return useQuery({
    queryKey: keys.marks(params),
    queryFn:  () => getMarksEntries(params),
    keepPreviousData: true,
  })
}

export function useMarksEntry(id) {
  return useQuery({
    queryKey: keys.marksEntry(id),
    queryFn:  () => getMarksEntry(id),
    enabled:  !!id,
  })
}

export function useCreateMarksEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMarksEntry,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['marks'] }),
  })
}

export function useUpdateMarksEntry(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => updateMarksEntry(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: keys.marksEntry(id) })
      qc.invalidateQueries({ queryKey: ['marks'] })
    },
  })
}

export function useApproveMarksEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => approveMarksEntry(id, data),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.marksEntry(id) })
      qc.invalidateQueries({ queryKey: ['marks'] })
    },
  })
}

export function useBulkUploadMarks() {
  return useMutation({
    mutationFn: ({ file, subjectPaperId }) => bulkUploadMarks(file, subjectPaperId),
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// CANDIDATE RESULTS (Staff)
// ═════════════════════════════════════════════════════════════════════════════

export function useCandidateResults(params) {
  return useQuery({
    queryKey: keys.results(params),
    queryFn:  () => getCandidateResults(params),
    keepPreviousData: true,
  })
}

export function useCandidateResult(id) {
  return useQuery({
    queryKey: keys.result(id),
    queryFn:  () => getCandidateResult(id),
    enabled:  !!id,
  })
}

export function useUpdateCandidateResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => updateCandidateResult(id, data),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.result(id) })
      qc.invalidateQueries({ queryKey: ['results'] })
    },
  })
}

export function useProcessResults() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: processResults,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['results'] }),
  })
}

export function usePublishResults() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishResults,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['results'] })
      qc.invalidateQueries({ queryKey: ['years'] })
    },
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

export function useSchoolPerformance(centerCode, year) {
  return useQuery({
    queryKey: keys.schoolPerformance(centerCode, year),
    queryFn:  () => getSchoolPerformance(centerCode, year),
    enabled:  !!centerCode,
    staleTime: 5 * 60 * 1000,
  })
}

export function useNationalStatistics(year) {
  return useQuery({
    queryKey: keys.nationalStats(year),
    queryFn:  () => getNationalStatistics(year),
    staleTime: 5 * 60 * 1000,
  })
}


// ═════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═════════════════════════════════════════════════════════════════════════════

export function useAuditLogs(params) {
  return useQuery({
    queryKey: keys.auditLogs(params),
    queryFn:  () => getAuditLogs(params),
    keepPreviousData: true,
    staleTime: 30 * 1000,  // Audit logs refresh frequently
  })
}


// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useAuth.js
// Re-exports useAuth from AuthContext for convenient import from hooks/
// ─────────────────────────────────────────────────────────────────────────────

export { useAuth } from '../context/AuthContext'