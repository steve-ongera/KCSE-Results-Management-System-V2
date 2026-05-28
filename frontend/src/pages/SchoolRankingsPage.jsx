/**
 * src/pages/SchoolRankingsPage.jsx
 *
 * Public page showing national school performance rankings.
 */

import { useState } from 'react'
import { useNationalStatistics } from '../hooks/useResults'
import { gradeColour, formatNumber } from '../utils/formatters'
import { InlineLoader } from '../components/common/PageLoader'

export default function SchoolRankingsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading, isError } = useNationalStatistics(year)

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 sm:px-6 py-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            School Rankings
          </h1>
          <p className="text-gray-500 mt-1">National KCSE performance by school</p>
        </div>
        <div className="form-group" style={{ minWidth: '140px' }}>
          <label className="form-label text-xs">Examination Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="form-input"
          >
            {[2024, 2023, 2022, 2021].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* National summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Candidates', value: formatNumber(data.total_candidates) },
            { label: 'Examination Centres', value: formatNumber(data.total_centers) },
            { label: 'National Mean', value: data.national_mean },
            { label: 'Year', value: data.year },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <div className="text-2xl font-bold text-green-800"
                style={{ fontFamily: 'var(--font-display)' }}>
                {value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rankings table */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            Top Performing Schools — KCSE {year}
          </h2>
        </div>

        {isLoading && <div className="p-6"><InlineLoader rows={5} /></div>}
        {isError && (
          <div className="p-8 text-center text-gray-400">
            Rankings not available yet. Results may not have been published for {year}.
          </div>
        )}

        {data?.top_schools?.length > 0 && (
          <div className="table-wrapper border-0 rounded-none shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>School</th>
                  <th>County</th>
                  <th className="text-center">Mean Grade</th>
                  <th className="text-center">Mean Pts</th>
                  <th className="text-right">Candidates</th>
                </tr>
              </thead>
              <tbody>
                {data.top_schools.map((school, idx) => (
                  <tr key={school.center_code}>
                    <td>
                      <span className={`font-bold ${idx < 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{school.school_name}</div>
                      <div className="text-xs text-gray-400 font-mono">{school.center_code}</div>
                    </td>
                    <td className="text-gray-500">{school.county}</td>
                    <td className="text-center">
                      <span className={`font-bold text-lg grade-display ${gradeColour(school.mean_grade)}`}
                        style={{ fontFamily: 'var(--font-display)' }}>
                        {school.mean_grade}
                      </span>
                    </td>
                    <td className="text-center font-mono text-sm">{school.mean_points}</td>
                    <td className="text-right text-gray-500">{formatNumber(school.total_candidates)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════════════════
// src/pages/LoginPage.jsx
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Staff login page. Authenticated users are redirected away by App.jsx.
 */