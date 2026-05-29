/**
 * src/pages/ResultsPage.jsx
 *
 * Public results lookup page. No login required.
 * Candidate enters 11-digit index number + full name → sees full results.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useResultsLookup, useDownloadResultSlip } from '../hooks/useResults'
import { resultsLookupSchema } from '../utils/validators'
import { gradeColour, formatIndexNumber, ordinal } from '../utils/formatters'
import { ButtonSpinner } from '../components/common/PageLoader'

const GRADE_SCALE = [
  ['A','75-100'],['A-','70-74'],['B+','65-69'],['B','60-64'],
  ['B-','55-59'],['C+','50-54'],['C','45-49'],['C-','40-44'],
  ['D+','35-39'],['D','30-34'],['D-','25-29'],['E','0-24'],
]

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
    <div className="page-enter container container-sm"
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="text-center" style={{ marginBottom: 'var(--space-10)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Check Your KCSE Results</h1>
        <p className="text-muted">
          Enter your examination details below. No login or account needed.
        </p>
      </div>

      {/* ── Lookup form ───────────────────────────────────────────────────── */}
      <div className="card card-flat" style={{ marginBottom: 'var(--space-8)' }}>
        <form onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

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

      {results && (
        <ResultsDisplay results={results} onDownload={downloadSlip} downloading={downloading} />
      )}

      {!results && (
        <div className="text-center text-faint"
          style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          <p>Results are available only after KNEC officially publishes them.</p>
          <p>Having trouble? Contact your school examination officer.</p>
        </div>
      )}
    </div>
  )
}

// ── Results Display ───────────────────────────────────────────────────────────

function ResultsDisplay({ results, onDownload, downloading }) {
  const { candidate, result, subjects, announcement } = results

  return (
    <div className="page-enter"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {announcement && (
        <div className="alert alert-info">
          <span className="alert-content" style={{ fontSize: 'var(--text-sm)' }}>
            {announcement}
          </span>
        </div>
      )}

      {/* ── Candidate summary ────────────────────────────────────────────── */}
      <div className="card card-flat">

        {/* Header row: name + download */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            'var(--space-4)',
          marginBottom:   'var(--space-5)',
          paddingBottom:  'var(--space-5)',
          borderBottom:   '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--text-2xl)' }}>
              {candidate.full_name}
            </h2>
            <div style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      'var(--text-sm)',
              color:         'var(--color-ink-muted)',
              letterSpacing: '0.1em',
            }}>
              {formatIndexNumber(candidate.index_number)}
            </div>
            <div style={{
              fontSize:   'var(--text-sm)',
              color:      'var(--color-ink-muted)',
              marginTop:  'var(--space-1)',
            }}>
              {candidate.school_name} &nbsp;·&nbsp; {candidate.county} County
              &nbsp;·&nbsp; KCSE {candidate.year}
            </div>
          </div>
          <button
            onClick={() => onDownload(candidate.index_number)}
            disabled={downloading}
            className="btn btn-outline btn-sm"
            style={{ flexShrink: 0 }}
          >
            {downloading ? <ButtonSpinner /> : '⬇'}&nbsp;Result Slip
          </button>
        </div>

        {/* Mean grade row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>

          <div>
            <div className="label" style={{ marginBottom: 'var(--space-1)' }}>Mean Grade</div>
            <div className={`grade-display ${gradeColour(result.mean_grade)}`}
              style={{ fontSize: 'var(--text-5xl)', lineHeight: 1 }}>
              {result.mean_grade}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <div>
              <div className="label" style={{ marginBottom: 'var(--space-1)' }}>Mean Points</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   'var(--text-2xl)',
                fontWeight: 700,
                color:      'var(--color-ink)',
              }}>
                {result.mean_points}
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 'var(--space-1)' }}>Subjects Sat</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   'var(--text-2xl)',
                fontWeight: 700,
                color:      'var(--color-ink)',
              }}>
                {result.subjects_sat}
              </div>
            </div>
            {result.national_rank && (
              <div>
                <div className="label" style={{ marginBottom: 'var(--space-1)' }}>
                  National Rank
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   'var(--text-2xl)',
                  fontWeight: 700,
                  color:      'var(--color-ink)',
                }}>
                  {ordinal(result.national_rank)}
                  {result.school_rank && (
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)', marginLeft: 'var(--space-2)' }}>
                      · {ordinal(result.school_rank)} in school
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Subject results table ────────────────────────────────────────── */}
      <div className="card card-flat" style={{ padding: 0 }}>
        <div style={{
          padding:      'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Subject Results</h3>
        </div>
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th className="numeric">Marks</th>
                <th className="text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.subject_code}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)', fontSize: 'var(--text-sm)' }}>
                    {s.subject_code}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--color-ink)' }}>
                    {s.subject_name}
                  </td>
                  <td className="numeric">
                    {s.moderated_marks !== undefined ? `${s.moderated_marks}/100` : '—'}
                  </td>
                  <td className="text-center">
                    <span className={`grade-display ${gradeColour(s.grade)}`}
                      style={{ fontSize: 'var(--text-lg)' }}>
                      {s.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Grade scale ──────────────────────────────────────────────────── */}
      <div className="card card-flat" style={{ padding: 0 }}>
        <div style={{
          padding:      'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>KCSE Grading Scale</h3>
        </div>
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <table className="table table-sm">
            <thead>
              <tr>
                {GRADE_SCALE.map(([g]) => (
                  <th key={g} className="text-center" style={{ minWidth: '3rem' }}>{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {GRADE_SCALE.map(([g, r]) => (
                  <td key={g} className="text-center"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                    {r}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
