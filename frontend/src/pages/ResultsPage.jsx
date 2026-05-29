/**
 * src/pages/ResultsPage.jsx
 *
 * Public results lookup page. No login required.
 * Candidate enters 11-digit index number + full name → sees full results.
 * 
 * Responsive layout:
 * - Laptop/Desktop: Form on left, Results on right (side by side)
 * - Tablet/Mobile: Form above, Results below (stacked)
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useResultsLookup, useDownloadResultSlip } from '../hooks/useResults'
import { resultsLookupSchema } from '../utils/validators'
import { gradeColour, formatIndexNumber, ordinal } from '../utils/formatters'
import { ButtonSpinner } from '../components/common/PageLoader'

export default function ResultsPage() {
  const [results, setResults] = useState(null)

  const { mutate: lookup, isPending, isError, error, reset } = useResultsLookup()
  const { mutate: downloadSlip, isPending: downloading } = useDownloadResultSlip()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resultsLookupSchema) })

  const onSubmit = (data) => {
    reset()
    setResults(null)
    lookup(data, { onSuccess: (res) => setResults(res) })
  }

  return (
    <div className="results-page">
      <div className="container">
        
        {/* Page Header */}
        <div className="results-page-header">
          <h1>Check Your KCSE Results</h1>
          <p className="text-muted">
            Enter your examination details below. No login or account needed.
          </p>
        </div>

        {/* Responsive Layout: Form + Results side by side on desktop */}
        <div className="results-layout">
          
          {/* Left Column: Search Form */}
          <div className="results-form-col">
            <div className="results-form-card">
              <form onSubmit={handleSubmit(onSubmit)} className="results-form">
                
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="index_number">
                    Examination Index Number
                  </label>
                  <input
                    id="index_number"
                    {...register('index_number')}
                    placeholder="e.g. 10234001023"
                    className={`form-input form-input-mono${errors.index_number ? ' error' : ''}`}
                    maxLength={11}
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  {errors.index_number && (
                    <p className="form-error">⚠ {errors.index_number.message}</p>
                  )}
                  <p className="form-hint">
                    11-digit code from your KNEC admission card
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="full_name">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="e.g. GADAFI IMRAN AKIL"
                    className={`form-input${errors.full_name ? ' error' : ''}`}
                    autoComplete="off"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.full_name && (
                    <p className="form-error">⚠ {errors.full_name.message}</p>
                  )}
                  <p className="form-hint">As it appears on your birth certificate — all capitals</p>
                </div>

                {isError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠</span>
                    <span className="alert-content">
                      {error?.message || 'Could not retrieve results. Please check your details.'}
                    </span>
                  </div>
                )}

                <button type="submit" disabled={isPending} className="btn btn-primary btn-lg btn-block">
                  {isPending ? <><ButtonSpinner /> Searching…</> : 'View My Results'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Results Display */}
          <div className="results-display-col">
            {results ? (
              <ResultsDisplay 
                results={results} 
                onDownload={downloadSlip} 
                downloading={downloading} 
              />
            ) : (
              <div className="results-placeholder">
                <div className="results-placeholder-icon">
                  <i className="bi bi-search"></i>
                </div>
                <p>Enter your index number and name above to view your results.</p>
                <p className="text-faint text-sm">
                  Results are available only after KNEC officially publishes them.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

// ── Results Display Component ─────────────────────────────────────────────────

function ResultsDisplay({ results, onDownload, downloading }) {
  const { candidate, result, subjects } = results

  // Calculate total points (sum of all subject points, whole number only)
  const totalPoints = subjects.reduce((sum, subject) => sum + (subject.points || 0), 0)

  return (
    <div className="results-display">
      
      {/* Candidate Summary Card */}
      <div className="results-candidate-card">
        <div className="results-candidate-header">
          <div>
            <h2 className="results-candidate-name">{candidate.full_name}</h2>
            <div className="results-candidate-meta">
              <span className="results-index-number">
                {formatIndexNumber(candidate.index_number)}
              </span>
              <span className="results-school">
                {candidate.school_name} · {candidate.county} County
              </span>
              <span className="results-year">KCSE {candidate.year}</span>
            </div>
          </div>
          <button
            onClick={() => onDownload(candidate.index_number)}
            disabled={downloading}
            className="btn btn-outline btn-sm results-download-btn"
          >
            <i className="bi bi-download"></i>
            {downloading ? 'Downloading...' : 'Result Slip'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="results-stats">
          <div className="results-stat">
            <div className="results-stat-label">Mean Grade</div>
            <div className={`results-stat-value ${gradeColour(result.mean_grade)}`}>
              {result.mean_grade}
            </div>
          </div>
          <div className="results-stat">
            <div className="results-stat-label">Total Points</div>
            <div className="results-stat-value">
              {totalPoints}
            </div>
          </div>
          <div className="results-stat">
            <div className="results-stat-label">Subjects Sat</div>
            <div className="results-stat-value">
              {result.subjects_sat}
            </div>
          </div>
          {result.national_rank && (
            <div className="results-stat">
              <div className="results-stat-label">National Rank</div>
              <div className="results-stat-value">
                {ordinal(result.national_rank)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subjects Table - Minimal Design */}
      <div className="results-subjects-card">
        <h3 className="results-subjects-title">Subject Results</h3>
        <div className="results-subjects-table-wrapper">
          <table className="results-subjects-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th className="results-table-numeric">Marks</th>
                <th className="results-table-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, idx) => (
                <tr key={subject.subject_code}>
                  <td className="results-subject-name">
                    <span className="results-subject-code">{subject.subject_code}</span>
                    {subject.subject_name}
                  </td>
                  <td className="results-table-numeric">
                    {subject.moderated_marks !== undefined ? subject.moderated_marks : '—'}
                  </td>
                  <td className="results-table-center">
                    <span className={`results-grade-badge ${gradeColour(subject.grade)}`}>
                      {subject.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}