
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

