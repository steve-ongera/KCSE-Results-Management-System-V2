/**
 * src/pages/dashboard/ScriptsPage.jsx
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useScripts } from '../../hooks/useResults'
import { updateScriptStatus } from '../../api/endpoints'
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

  const {
    mutate: updateStatus,
    isPending: scanning,
    isSuccess: scanSuccess,
    isError: scanError,
  } = useMutation({
    mutationFn: updateScriptStatus,
    onSuccess: () => {
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
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="form-input ml-auto"
            style={{ width: '180px' }}>
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
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-10">
                      No scripts found.
                    </td>
                  </tr>
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