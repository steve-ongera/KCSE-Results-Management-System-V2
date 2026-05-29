/**
 * src/pages/SchoolRankingsPage.jsx
 *
 * Public page showing national school performance rankings.
 */

import { useState } from 'react'
import { useNationalStatistics } from '../hooks/useResults'
import { gradeColour, formatNumber } from '../utils/formatters'
import { InlineLoader } from '../components/common/PageLoader'

const RANK_MEDAL = (idx) => {
  if (idx === 0) return '🥇'
  if (idx === 1) return '🥈'
  if (idx === 2) return '🥉'
  return idx + 1
}

export default function SchoolRankingsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading, isError } = useNationalStatistics(year)

  return (
    <div className="page-enter container container-lg" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-heading">School Rankings</h1>
            <p className="page-subheading">National KCSE performance by school</p>
          </div>
          <div className="form-group" style={{ minWidth: '140px' }}>
            <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>
              Examination Year
            </label>
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
      </div>

      {/* ── National summary stat cards ───────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 'var(--space-8)' }}>
          {[
            { label: 'Total Candidates',   value: formatNumber(data.total_candidates), accent: 'accent-primary' },
            { label: 'Examination Centres', value: formatNumber(data.total_centers),   accent: 'accent-blue'    },
            { label: 'National Mean',       value: data.national_mean,                 accent: 'accent-accent'  },
            { label: 'Year',               value: data.year,                           accent: 'accent-primary' },
          ].map(({ label, value, accent }) => (
            <div key={label} className={`stat-card ${accent} text-center`}>
              <div className="stat-value text-primary">{value}</div>
              <div className="stat-label" style={{ marginTop: 'var(--space-1)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rankings table card ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header">
          <h2 className="card-title" style={{ fontSize: 'var(--text-lg)' }}>
            Top Performing Schools — KCSE {year}
          </h2>
        </div>

        {isLoading && (
          <div className="card-body">
            <InlineLoader rows={5} />
          </div>
        )}

        {isError && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-desc">
              Rankings not available yet. Results may not have been published for {year}.
            </p>
          </div>
        )}

        {data?.top_schools?.length > 0 && (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>School</th>
                  <th>County</th>
                  <th className="text-center">Mean Grade</th>
                  <th className="text-center">Mean Pts</th>
                  <th className="numeric">Candidates</th>
                </tr>
              </thead>
              <tbody>
                {data.top_schools.map((school, idx) => (
                  <tr key={school.center_code}>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: idx < 3 ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {RANK_MEDAL(idx)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-ink)' }}>
                        {school.school_name}
                      </div>
                      <div style={{
                        fontSize:    'var(--text-xs)',
                        color:       'var(--color-ink-faint)',
                        fontFamily:  'var(--font-mono)',
                        letterSpacing: '0.04em',
                      }}>
                        {school.center_code}
                      </div>
                    </td>
                    <td className="text-muted">{school.county}</td>
                    <td className="text-center">
                      <span className={`grade-display ${gradeColour(school.mean_grade)}`}
                        style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                        {school.mean_grade}
                      </span>
                    </td>
                    <td className="numeric">{school.mean_points}</td>
                    <td className="numeric text-muted">{formatNumber(school.total_candidates)}</td>
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