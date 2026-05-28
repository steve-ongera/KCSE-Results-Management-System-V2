/**
 * src/pages/dashboard/ScriptsPage.jsx
 *
 * Script tracking — list scripts and update status via barcode scan.
 */

import { useState } from 'react'
import { useScripts } from '../../hooks/useResults'
import { updateScriptStatus } from '../../api/endpoints'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDateTime } from '../../utils/formatters'
import { InlineLoader, ButtonSpinner } from '../../components/common/PageLoader'

const SCRIPT_STATUS_FLOW = [
  'AT_CENTER', 'COLLECTED', 'IN_TRANSIT', 'AT_MARKING', 'MARKED', 'VERIFIED',
]
const STATUS_COLOURS = {
  AT_CENTER:  'badge-gray',
  COLLECTED:  'badge-blue',
  IN_TRANSIT: 'badge-yellow',
  AT_MARKING: 'badge-cyan',
  MARKED:     'badge-green',
  VERIFIED:   'badge-green',
}
const STATUS_LABELS = {
  AT_CENTER:  'At Centre',
  COLLECTED:  'Collected',
  IN_TRANSIT: 'In Transit',
  AT_MARKING: 'At Marking',
  MARKED:     'Marked',
  VERIFIED:   'Verified',
}

export default function ScriptsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [scanBarcode, setScanBarcode] = useState('')
  const [scanStatus, setScanStatus]   = useState('COLLECTED')
  const [scanNote, setScanNote]       = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useScripts({
    status: statusFilter || undefined,
    page,
    page_size: 20,
  })

  const { mutate: updateStatus, isPending: scanning, isSuccess: scanSuccess, isError: scanError } =
    useMutation({
      mutationFn: updateScriptStatus,
      onSuccess:  () => {
        qc.invalidateQueries({ queryKey: ['scripts'] })
        setScanBarcode('')
        setScanNote('')
      },
    })

  const { results = [], pagination } = data || {}

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          Script Tracking
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Monitor examination scripts from centre to marking and back
        </p>
      </div>

      {/* Barcode scan update */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          Update Script Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="form-group">
            <label className="form-label form-label-required">Barcode</label>
            <input
              value={scanBarcode}
              onChange={(e) => setScanBarcode(e.target.value)}
              className="form-input form-input-mono"
              placeholder="Scan or type barcode"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">New Status</label>
            <select value={scanStatus} onChange={(e) => setScanStatus(e.target.value)}
              className="form-input">
              {SCRIPT_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input value={scanNote} onChange={(e) => setScanNote(e.target.value)}
              className="form-input" placeholder="Optional notes" />
          </div>
          <button
            onClick={() => updateStatus({ barcode: scanBarcode, status: scanStatus, notes: scanNote })}
            disabled={!scanBarcode || scanning}
            className="btn btn-primary">
            {scanning ? <ButtonSpinner /> : '✓ Update'}
          </button>
        </div>
        {scanSuccess && <div className="alert alert-success mt-3 text-sm">✓ Status updated.</div>}
        {scanError   && <div className="alert alert-error mt-3 text-sm">⚠ Barcode not found.</div>}
      </div>

      {/* List */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <h2 className="font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>Scripts</h2>
          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="form-input ml-auto" style={{ width: '180px' }}>
            <option value="">All Statuses</option>
            {SCRIPT_STATUS_FLOW.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="p-6"><InlineLoader rows={4} /></div>
        ) : (
          <div className="table-wrapper border-0 shadow-none rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Candidate</th>
                  <th>Subject / Paper</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">
                    No scripts found.
                  </td></tr>
                )}
                {results.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-sm text-gray-700">{s.barcode}</td>
                    <td className="font-mono text-sm">{s.candidate_index}</td>
                    <td className="text-gray-600 text-sm">{s.subject_paper_label}</td>
                    <td>
                      <span className={`badge ${STATUS_COLOURS[s.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="text-gray-400 text-sm">{formatDateTime(s.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination?.total_pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button disabled={!pagination.previous} onClick={() => setPage(p => p - 1)}
                className="btn btn-ghost btn-sm">← Prev</button>
              <button disabled={!pagination.next} onClick={() => setPage(p => p + 1)}
                className="btn btn-ghost btn-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════════════════
// src/pages/admin/AdminDashboardPage.jsx
// ═════════════════════════════════════════════════════════════════════════════

import { Link } from 'react-router-dom'
import { useExaminationYears } from '../../hooks/useResults'

export function AdminDashboardPage() {
  const { data } = useExaminationYears()
  const years = data?.results || []
  const current = years.find((y) => y.is_current)

  return (
    <div className="page-enter space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          KNEC Admin Panel
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          System administration and control for KCSE {current?.year}
        </p>
      </div>

      {/* Year status */}
      {current && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-green-600 font-semibold uppercase tracking-wider">Current Year</div>
              <div className="text-2xl font-bold text-green-900"
                style={{ fontFamily: 'var(--font-display)' }}>KCSE {current.year}</div>
            </div>
            {[
              ['Registration', current.registration_open],
              ['Marking',      current.marking_open],
              ['Published',    current.results_published],
            ].map(([label, active]) => (
              <div key={label}>
                <div className="text-xs text-green-600 font-semibold uppercase tracking-wider">{label}</div>
                <span className={`badge mt-1 ${active ? 'badge-green' : 'badge-gray'}`}>
                  {active ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: '/dashboard/admin/publish',   icon: '📢', title: 'Publish Results',
            desc: 'Release KCSE results to the public portal', colour: 'border-amber-200 hover:border-amber-400' },
          { to: '/dashboard/admin/analytics', icon: '📊', title: 'Analytics & Reports',
            desc: 'National statistics, school rankings, grade distributions', colour: 'border-teal-200 hover:border-teal-400' },
          { to: '/dashboard/admin/audit',     icon: '🔍', title: 'Audit Log',
            desc: 'Review all system actions for accountability', colour: 'border-red-200 hover:border-red-400' },
          { to: '/dashboard/candidates',      icon: '👥', title: 'Manage Candidates',
            desc: 'Approve, reject, or review all candidate registrations', colour: 'border-blue-200 hover:border-blue-400' },
          { to: '/dashboard/marks',           icon: '✏️', title: 'Marks Overview',
            desc: 'Monitor marks entry progress across all centres', colour: 'border-purple-200 hover:border-purple-400' },
        ].map(({ to, icon, title, desc, colour }) => (
          <Link key={to} to={to}
            className={`card card-hover block border-2 transition-colors ${colour}`}
            style={{ textDecoration: 'none' }}>
            <div className="text-3xl mb-3">{icon}</div>
            <div className="font-bold text-gray-900 mb-1">{title}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboardPage


// ═════════════════════════════════════════════════════════════════════════════
// src/pages/admin/PublishResultsPage.jsx
// ═════════════════════════════════════════════════════════════════════════════

import { useForm as useFormRHF } from 'react-hook-form'
import { zodResolver as zr } from '@hookform/resolvers/zod'
import { usePublishResults, useProcessResults, useExaminationYears as useYears } from '../../hooks/useResults'
import { publishResultsSchema } from '../../utils/validators'
import { formatDateTime as fmtDT } from '../../utils/formatters'

export function PublishResultsPage() {
  const { data: yearsData } = useYears()
  const years = yearsData?.results || []

  const { register, handleSubmit, watch, formState: { errors } } = useFormRHF({
    resolver: zr(publishResultsSchema),
    defaultValues: { confirm: false },
  })

  const processMutation = useProcessResults()
  const publishMutation = usePublishResults()

  const selectedYearId = watch('examination_year_id')
  const selectedYear   = years.find((y) => y.id === selectedYearId)

  const onProcess = () => {
    if (!selectedYearId) return
    if (!confirm('Trigger results computation? This may take several minutes.')) return
    processMutation.mutate(selectedYearId)
  }

  const onPublish = (data) => {
    if (!confirm(`FINAL STEP: Publish KCSE ${selectedYear?.year} results publicly? This cannot be undone.`)) return
    publishMutation.mutate(data)
  }

  return (
    <div className="page-enter max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          Publish Results
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Process and release KCSE results to candidates nationwide
        </p>
      </div>

      {/* Warning */}
      <div className="alert alert-warning">
        <span>⚠</span>
        <div className="text-sm">
          <strong>Important:</strong> Publishing is irreversible. Once results are published,
          all candidates can view them via the public portal immediately.
          Ensure all marks have been locked and moderated before proceeding.
        </div>
      </div>

      {/* Step 1 — Select year & process */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-800"
          style={{ fontFamily: 'var(--font-display)' }}>
          Step 1 — Process Results
        </h2>
        <div className="form-group">
          <label className="form-label form-label-required">Examination Year</label>
          <select {...register('examination_year_id')}
            className={`form-input ${errors.examination_year_id ? 'error' : ''}`}>
            <option value="">Select year…</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                KCSE {y.year} {y.results_published ? '(Already Published)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onProcess}
          disabled={!selectedYearId || processMutation.isPending}
          className="btn btn-secondary">
          {processMutation.isPending
            ? <><ButtonSpinner /> Processing…</>
            : '⚙ Compute Grades & Rankings'
          }
        </button>
        {processMutation.isSuccess && (
          <div className="alert alert-success text-sm">
            ✓ Results computation queued. This runs in the background.
          </div>
        )}
      </div>

      {/* Step 2 — Publish */}
      <form onSubmit={handleSubmit(onPublish)} className="card space-y-4">
        <h2 className="font-bold text-gray-800"
          style={{ fontFamily: 'var(--font-display)' }}>
          Step 2 — Publish to Public
        </h2>
        <div className="form-group">
          <label className="form-label">Announcement Message (optional)</label>
          <textarea {...register('announcement_message')} className="form-input" rows={3}
            placeholder="Message shown to candidates alongside their results…" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('confirm')}
            className="accent-green-700 w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">
            I confirm that results for KCSE {selectedYear?.year || '—'} are final
            and ready to be published publicly.
          </span>
        </label>
        {errors.confirm && <p className="form-error">⚠ {errors.confirm.message}</p>}

        <button type="submit"
          disabled={!selectedYearId || publishMutation.isPending}
          className="btn btn-accent">
          {publishMutation.isPending
            ? <><ButtonSpinner /> Publishing…</>
            : '📢 Publish Results'}
        </button>

        {publishMutation.isSuccess && (
          <div className="alert alert-success text-sm">
            ✓ KCSE {selectedYear?.year} results are now live on the public portal.
            Published at {fmtDT(publishMutation.data?.published_at)}
          </div>
        )}
        {publishMutation.isError && (
          <div className="alert alert-error text-sm">
            ⚠ {publishMutation.error?.message}
          </div>
        )}
      </form>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════════════════
// src/pages/admin/AuditLogPage.jsx
// ═════════════════════════════════════════════════════════════════════════════

import { useAuditLogs } from '../../hooks/useResults'

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')

  const { data, isLoading } = useAuditLogs({
    action: actionFilter || undefined,
    date_from: dateFrom || undefined,
    page,
    page_size: 25,
  })

  const { results = [], pagination } = data || {}

  const ACTION_COLOURS = {
    CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
    APPROVE: 'badge-green', REJECT: 'badge-red', PUBLISH: 'badge-yellow',
    LOGIN: 'badge-gray', LOGOUT: 'badge-gray', LOOKUP: 'badge-cyan',
    LOCK: 'badge-gray', SUBMIT: 'badge-blue', BULK_UPLOAD: 'badge-blue',
  }

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          Audit Log
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Immutable record of all system actions
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="form-input" style={{ width: '200px' }}>
            <option value="">All Actions</option>
            {['CREATE','UPDATE','DELETE','APPROVE','REJECT','PUBLISH',
              'LOGIN','LOGOUT','LOOKUP','LOCK','SUBMIT','BULK_UPLOAD'].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="form-group mb-0">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="form-input" />
          </div>
          <button onClick={() => { setActionFilter(''); setDateFrom(''); setPage(1) }}
            className="btn btn-ghost">Clear</button>
        </div>
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="p-6"><InlineLoader rows={5} /></div>
        ) : (
          <div className="table-wrapper border-0 shadow-none rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Object</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10">
                    No audit entries found.
                  </td></tr>
                )}
                {results.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="text-sm font-medium text-gray-700">{log.user_display}</td>
                    <td>
                      <span className={`badge ${ACTION_COLOURS[log.action] || 'badge-gray'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600 max-w-xs truncate">{log.description}</td>
                    <td className="text-xs font-mono text-gray-400">
                      {log.object_type && `${log.object_type}`}
                    </td>
                    <td className="text-xs font-mono text-gray-400">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination?.total_pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pagination.count} entries · Page {pagination.current_page} of {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button disabled={!pagination.previous} onClick={() => setPage(p => p - 1)}
                className="btn btn-ghost btn-sm">← Prev</button>
              <button disabled={!pagination.next} onClick={() => setPage(p => p + 1)}
                className="btn btn-ghost btn-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════════════════
// src/pages/admin/AnalyticsPage.jsx
// ═════════════════════════════════════════════════════════════════════════════

import { useNationalStatistics } from '../../hooks/useResults'
import { gradeColour, formatNumber as fmtNum, gradeHex } from '../../utils/formatters'

export function AnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useNationalStatistics(year)

  const gradeEntries = data?.grade_distribution
    ? Object.entries(data.grade_distribution).sort((a, b) => b[1] - a[1])
    : []
  const totalGraded = gradeEntries.reduce((s, [, c]) => s + c, 0)

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            Analytics & Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">National KCSE performance overview</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="form-input" style={{ width: '160px' }}>
          {[2024, 2023, 2022].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading && <div><InlineLoader rows={4} /></div>}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Candidates', value: fmtNum(data.total_candidates) },
              { label: 'Exam Centres',     value: fmtNum(data.total_centers) },
              { label: 'National Mean',    value: data.national_mean },
              { label: 'Year',             value: data.year },
            ].map(({ label, value }) => (
              <div key={label} className="card text-center">
                <div className="text-2xl font-bold text-green-800"
                  style={{ fontFamily: 'var(--font-display)' }}>{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Grade distribution */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-5"
              style={{ fontFamily: 'var(--font-display)' }}>
              Grade Distribution
            </h2>
            <div className="space-y-3">
              {gradeEntries.map(([grade, count]) => {
                const pct = totalGraded ? (count / totalGraded * 100).toFixed(1) : 0
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <div className={`font-bold w-8 text-right grade-display ${gradeColour(grade)}`}
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {grade}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: gradeHex(grade) }} />
                    </div>
                    <div className="text-sm text-gray-500 w-24 text-right">
                      {fmtNum(count)} ({pct}%)
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top schools */}
          {data.top_schools?.length > 0 && (
            <div className="card p-0">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  Top 10 Schools — KCSE {year}
                </h2>
              </div>
              <div className="table-wrapper border-0 shadow-none rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>School</th>
                      <th>County</th>
                      <th className="text-center">Mean</th>
                      <th className="text-right">Candidates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_schools.map((s, i) => (
                      <tr key={s.center_code}>
                        <td className={`font-bold ${i < 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{s.school_name}</div>
                          <div className="text-xs font-mono text-gray-400">{s.center_code}</div>
                        </td>
                        <td className="text-gray-500">{s.county}</td>
                        <td className="text-center">
                          <span className={`font-bold text-lg grade-display ${gradeColour(s.mean_grade)}`}
                            style={{ fontFamily: 'var(--font-display)' }}>
                            {s.mean_grade}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">({s.mean_points})</span>
                        </td>
                        <td className="text-right text-gray-500">{fmtNum(s.total_candidates)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!isLoading && !data && (
        <div className="card text-center py-12 text-gray-400">
          No published statistics available for {year}.
        </div>
      )}
    </div>
  )
}