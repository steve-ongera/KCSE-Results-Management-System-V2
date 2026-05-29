
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