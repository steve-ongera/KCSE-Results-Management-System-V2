/**
 * src/pages/dashboard/CandidatesPage.jsx
 *
 * Paginated candidate list with search, status filter, and quick actions.
 * School officers see only their own center's candidates.
 */

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCandidates, useSubmitCandidate } from '../../hooks/useResults'
import { statusLabel, statusBadgeClass, formatDate } from '../../utils/formatters'
import { InlineLoader } from '../../components/common/PageLoader'
import { useAuth } from '../../context/AuthContext'

const STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses' },
  { value: 'DRAFT',       label: 'Draft' },
  { value: 'SUBMITTED',   label: 'Submitted' },
  { value: 'COUNTY_APPR', label: 'County Approved' },
  { value: 'KNEC_APPR',   label: 'KNEC Approved' },
  { value: 'REJECTED',    label: 'Rejected' },
]

export default function CandidatesPage() {
  const { isKNECAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') || ''
  const status = searchParams.get('registration_status') || ''
  const page   = Number(searchParams.get('page') || 1)

  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = useCandidates({
    search,
    registration_status: status || undefined,
    page,
    page_size: 20,
    ordering: 'index_number',
  })

  const { mutate: submitCandidate } = useSubmitCandidate()

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParam('search', searchInput.trim())
  }

  const { results = [], pagination } = data || {}

  return (
    <div className="page-enter space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            Candidates
          </h1>
          {pagination && (
            <p className="text-gray-500 text-sm mt-0.5">
              {pagination.count} candidates registered
            </p>
          )}
        </div>
        <Link to="/dashboard/candidates/new" className="btn btn-primary">
          + Register Candidate
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or index number…"
            className="form-input flex-1"
          />
          <select
            value={status}
            onChange={(e) => updateParam('registration_status', e.target.value)}
            className="form-input sm:w-48"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary whitespace-nowrap">
            Search
          </button>
          {(search || status) && (
            <button type="button"
              onClick={() => { setSearchInput(''); setSearchParams({}); }}
              className="btn btn-ghost whitespace-nowrap">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading && <div className="p-6"><InlineLoader rows={5} /></div>}
        {isError && (
          <div className="p-8 text-center text-gray-400">
            Failed to load candidates. Please try again.
          </div>
        )}
        {!isLoading && !isError && (
          <div className="table-wrapper border-0 shadow-none rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Index No.</th>
                  <th>Full Name</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-12">
                      No candidates found.
                      {!search && !status && (
                        <span> <Link to="/dashboard/candidates/new"
                          className="text-green-700">Register the first one.</Link></span>
                      )}
                    </td>
                  </tr>
                )}
                {results.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono text-sm text-gray-700">
                        {c.index_number}
                      </span>
                    </td>
                    <td>
                      <Link to={`/dashboard/candidates/${c.id}`}
                        className="font-medium text-gray-900 hover:text-green-700">
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="text-gray-500">
                      {c.gender === 'M' ? 'Male' : 'Female'}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(c.registration_status)}`}>
                        {statusLabel(c.registration_status)}
                      </span>
                    </td>
                    <td className="text-gray-400 text-sm">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/dashboard/candidates/${c.id}`}
                          className="btn btn-ghost btn-sm">
                          View
                        </Link>
                        {c.registration_status === 'DRAFT' && (
                          <>
                            <Link to={`/dashboard/candidates/${c.id}/edit`}
                              className="btn btn-ghost btn-sm">
                              Edit
                            </Link>
                            <button
                              onClick={() => submitCandidate(c.id)}
                              className="btn btn-secondary btn-sm">
                              Submit
                            </button>
                          </>
                        )}
                        {isKNECAdmin && c.registration_status === 'SUBMITTED' && (
                          <Link to={`/dashboard/candidates/${c.id}`}
                            className="btn btn-primary btn-sm">
                            Review
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={!pagination.previous}
                onClick={() => updateParam('page', page - 1)}
                className="btn btn-ghost btn-sm">
                ← Previous
              </button>
              <button
                disabled={!pagination.next}
                onClick={() => updateParam('page', page + 1)}
                className="btn btn-ghost btn-sm">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}