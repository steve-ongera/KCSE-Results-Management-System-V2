/**
 * src/pages/SchoolRankingsPage.jsx
 *
 * Public page showing national school performance rankings.
 * Features: Year selector, statistics cards, rankings table,
 * medal icons, and responsive design.
 */

import { useState } from 'react'
import { useNationalStatistics } from '../hooks/useResults'
import { gradeColour, formatNumber } from '../utils/formatters'
import { InlineLoader } from '../components/common/PageLoader'

// Medal icons using Bootstrap Icons
const getRankIcon = (idx) => {
  if (idx === 0) return <i className="bi bi-trophy-fill" style={{ color: '#fbbf24', fontSize: '1.25rem' }} />
  if (idx === 1) return <i className="bi bi-trophy-fill" style={{ color: '#9ca3af', fontSize: '1.25rem' }} />
  if (idx === 2) return <i className="bi bi-trophy-fill" style={{ color: '#cd7a32', fontSize: '1.25rem' }} />
  return <span className="rank-number">{idx + 1}</span>
}

export default function SchoolRankingsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading, isError } = useNationalStatistics(year)

  return (
    <div className="rankings-page">
      <div className="container">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="rankings-header">
          <div className="rankings-header-content">
            <div className="rankings-badge">
              <i className="bi bi-bar-chart-steps"></i>
              <span>National Performance</span>
            </div>
            <h1 className="rankings-title">School Rankings</h1>
            <p className="rankings-subtitle">National KCSE performance by school</p>
          </div>
          <div className="rankings-year-selector">
            <label className="rankings-year-label">
              <i className="bi bi-calendar3"></i>
              Examination Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="form-input rankings-year-select"
            >
              {[2024, 2023, 2022, 2021].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── National summary stat cards ───────────────────────────────────── */}
        {data && (
          <div className="rankings-stats-grid">
            <div className="rankings-stat-card">
              <div className="rankings-stat-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="rankings-stat-content">
                <div className="rankings-stat-value">{formatNumber(data.total_candidates)}</div>
                <div className="rankings-stat-label">Total Candidates</div>
              </div>
            </div>

            <div className="rankings-stat-card">
              <div className="rankings-stat-icon">
                <i className="bi bi-building"></i>
              </div>
              <div className="rankings-stat-content">
                <div className="rankings-stat-value">{formatNumber(data.total_centers)}</div>
                <div className="rankings-stat-label">Examination Centres</div>
              </div>
            </div>

            <div className="rankings-stat-card">
              <div className="rankings-stat-icon">
                <i className="bi bi-graph-up"></i>
              </div>
              <div className="rankings-stat-content">
                <div className="rankings-stat-value">{data.national_mean}</div>
                <div className="rankings-stat-label">National Mean</div>
              </div>
            </div>

            <div className="rankings-stat-card">
              <div className="rankings-stat-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="rankings-stat-content">
                <div className="rankings-stat-value">{data.year}</div>
                <div className="rankings-stat-label">Examination Year</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rankings table ───────────────────────────────────────────────── */}
        <div className="rankings-table-card">
          <div className="rankings-table-header">
            <h2 className="rankings-table-title">
              <i className="bi bi-trophy"></i>
              Top Performing Schools — KCSE {year}
            </h2>
            <div className="rankings-table-info">
              <i className="bi bi-info-circle"></i>
              <span>Ranked by mean points</span>
            </div>
          </div>

          {isLoading && (
            <div className="rankings-loading">
              <InlineLoader rows={5} />
            </div>
          )}

          {isError && (
            <div className="rankings-empty">
              <div className="rankings-empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3 className="rankings-empty-title">No Data Available</h3>
              <p className="rankings-empty-desc">
                Rankings not available yet. Results may not have been published for {year}.
              </p>
            </div>
          )}

          {data?.top_schools?.length > 0 && (
            <div className="rankings-table-wrapper">
              <table className="rankings-table">
                <thead>
                  <tr>
                    <th className="rankings-col-rank">Rank</th>
                    <th className="rankings-col-school">School</th>
                    <th className="rankings-col-county">County</th>
                    <th className="rankings-col-grade">Mean Grade</th>
                    <th className="rankings-col-points">Points</th>
                    <th className="rankings-col-candidates">Candidates</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_schools.map((school, idx) => (
                    <tr key={school.center_code} className="rankings-table-row">
                      <td className="rankings-rank-cell">
                        <div className="rankings-rank-badge">
                          {getRankIcon(idx)}
                        </div>
                      </td>
                      <td className="rankings-school-cell">
                        <div className="rankings-school-name">{school.school_name}</div>
                        <div className="rankings-school-code">{school.center_code}</div>
                      </td>
                      <td className="rankings-county-cell">
                        <i className="bi bi-geo-alt-fill"></i>
                        {school.county}
                      </td>
                      <td className="rankings-grade-cell">
                        <span className={`rankings-mean-grade ${gradeColour(school.mean_grade)}`}>
                          {school.mean_grade}
                        </span>
                      </td>
                      <td className="rankings-points-cell">{school.mean_points}</td>
                      <td className="rankings-candidates-cell">{formatNumber(school.total_candidates)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Information note ──────────────────────────────────────────────── */}
        <div className="rankings-note">
          <i className="bi bi-shield-check"></i>
          <div>
            <strong>Official KNEC Data</strong>
            <p>Rankings are based on mean points calculated from the best 7 subjects per candidate.</p>
          </div>
        </div>

      </div>
    </div>
  )
}