/**
 * src/pages/dashboard/MarksEntryPage.jsx
 *
 * Examiner marks entry — list of assigned scripts with marks input,
 * approval actions, and bulk CSV upload.
 */

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useMarksEntries,
  useCreateMarksEntry,
  useApproveMarksEntry,
  useBulkUploadMarks,
} from '../../hooks/useResults'
import { marksEntrySchema } from '../../utils/validators'
import { formatDateTime } from '../../utils/formatters'
import { InlineLoader, ButtonSpinner } from '../../components/common/PageLoader'
import { useAuth } from '../../context/AuthContext'

const STATUS_COLOURS = {
  ENTERED:  'badge-blue',
  FLAGGED:  'badge-yellow',
  APPROVED: 'badge-green',
  LOCKED:   'badge-gray',
}

export default function MarksEntryPage() {
  const { isExaminer } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [bulkPaperId, setBulkPaperId] = useState('')
  const fileRef = useRef()

  const { data, isLoading } = useMarksEntries({
    status: statusFilter || undefined,
    page,
    page_size: 20,
  })

  const createMutation  = useCreateMarksEntry()
  const approveMutation = useApproveMarksEntry()
  const bulkMutation    = useBulkUploadMarks()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(marksEntrySchema),
  })

  const onSubmitMarks = (data) => {
    createMutation.mutate(data, { onSuccess: () => reset() })
  }

  const handleBulkUpload = () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !bulkPaperId) return
    bulkMutation.mutate({ file, subjectPaperId: bulkPaperId })
  }

  const { results = [], pagination } = data || {}

  return (
    <div className="page-enter space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          Marks Entry
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Enter and manage examination marks for assigned scripts
        </p>
      </div>

      {/* ── Single marks entry form ─────────────────────────────────────── */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          Enter Marks
        </h2>
        <form onSubmit={handleSubmit(onSubmitMarks)}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">

          <div className="form-group">
            <label className="form-label form-label-required">Script (UUID)</label>
            <input {...register('script')} className={`form-input ${errors.script ? 'error' : ''}`}
              placeholder="Script ID" />
            {errors.script && <p className="form-error">⚠ {errors.script.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Candidate (UUID)</label>
            <input {...register('candidate')} className={`form-input ${errors.candidate ? 'error' : ''}`}
              placeholder="Candidate ID" />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Marks</label>
            <input
              type="number"
              step="0.5"
              {...register('marks', { valueAsNumber: true })}
              className={`form-input ${errors.marks ? 'error' : ''}`}
              placeholder="0–100"
              min={0} max={100}
            />
            {errors.marks && <p className="form-error">⚠ {errors.marks.message}</p>}
          </div>

          <button type="submit" disabled={createMutation.isPending}
            className="btn btn-primary">
            {createMutation.isPending ? <ButtonSpinner /> : 'Save Marks'}
          </button>
        </form>

        {createMutation.isSuccess && (
          <div className="alert alert-success mt-4 text-sm">✓ Marks saved successfully.</div>
        )}
        {createMutation.isError && (
          <div className="alert alert-error mt-4 text-sm">
            ⚠ {createMutation.error?.message}
          </div>
        )}
      </div>

      {/* ── Bulk upload ─────────────────────────────────────────────────── */}
      <div className="card border-dashed">
        <h2 className="font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          Bulk Upload
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload a CSV or Excel file with columns: <code className="font-mono bg-gray-100 px-1 rounded">barcode</code>, <code className="font-mono bg-gray-100 px-1 rounded">marks</code>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="form-group flex-1">
            <label className="form-label">Subject Paper ID</label>
            <input value={bulkPaperId} onChange={(e) => setBulkPaperId(e.target.value)}
              className="form-input form-input-mono" placeholder="Subject paper UUID" />
          </div>
          <div className="form-group flex-1">
            <label className="form-label">CSV / Excel File</label>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
              className="form-input p-1.5 text-sm" />
          </div>
          <button
            onClick={handleBulkUpload}
            disabled={!bulkPaperId || bulkMutation.isPending}
            className="btn btn-secondary mt-5 sm:mt-0 self-end">
            {bulkMutation.isPending ? <><ButtonSpinner /> Uploading…</> : '⬆ Upload'}
          </button>
        </div>
        {bulkMutation.isSuccess && (
          <div className="alert alert-success mt-3 text-sm">
            ✓ Upload queued. Processing in background — batch ID: {bulkMutation.data?.batch_id}
          </div>
        )}
      </div>

      {/* ── Marks list ──────────────────────────────────────────────────── */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
          <h2 className="font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            Marks Entries
          </h2>
          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="form-input ml-auto" style={{ width: '180px' }}>
            <option value="">All Statuses</option>
            {['ENTERED','FLAGGED','APPROVED','LOCKED'].map((s) => (
              <option key={s} value={s}>{s}</option>
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
                  <th>Candidate Index</th>
                  <th>Subject / Paper</th>
                  <th className="text-center">Marks</th>
                  <th>Status</th>
                  <th>Entered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-10">
                      No marks entries found.
                    </td>
                  </tr>
                )}
                {results.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-sm">{m.candidate_index}</td>
                    <td className="text-gray-600 text-sm">{m.subject_paper_label}</td>
                    <td className="text-center font-bold text-gray-900">{m.marks}</td>
                    <td>
                      <span className={`badge ${STATUS_COLOURS[m.status] || 'badge-gray'}`}>
                        {m.status}
                      </span>
                      {m.is_abnormal && (
                        <span className="badge badge-yellow ml-1">⚠ Abnormal</span>
                      )}
                    </td>
                    <td className="text-gray-400 text-sm">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="text-right">
                      {m.status === 'ENTERED' && (
                        <button
                          onClick={() => approveMutation.mutate({ id: m.id, action: 'approve' })}
                          disabled={approveMutation.isPending}
                          className="btn btn-secondary btn-sm">
                          Approve
                        </button>
                      )}
                      {m.status === 'APPROVED' && (
                        <button
                          onClick={() => approveMutation.mutate({ id: m.id, action: 'lock' })}
                          disabled={approveMutation.isPending}
                          className="btn btn-primary btn-sm">
                          Lock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
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