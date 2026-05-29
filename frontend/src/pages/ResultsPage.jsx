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
import { gradeColour, formatIndexNumber, formatDate, ordinal } from '../utils/formatters'
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
    <div className="page-enter container container-sm" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="text-center" style={{ marginBottom: 'var(--space-10)' }}>
        <h1 style={{ marginBottom: 'var(--space-3)' }}>Check Your KCSE Results</h1>
        <p className="text-muted">
          Enter your examination details below. No login or account needed.
        </p>
      </div>

      {/* ── Lookup form ───────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

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
              11-digit code from your KNEC admission card (e.g. 10234001023)
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

          {/* API error */}
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

      {/* ── Results display ───────────────────────────────────────────────── */}
      {results && (
        <ResultsDisplay results={results} onDownload={downloadSlip} downloading={downloading} />
      )}

      {/* ── Help note ─────────────────────────────────────────────────────── */}
      {!results && (
        <div className="text-center text-faint" style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
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
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* Announcement banner */}
      {announcement && (
        <div className="alert alert-info">
          <span className="alert-content" style={{ fontSize: 'var(--text-sm)' }}>{announcement}</span>
        </div>
      )}

      {/* ── Mean grade hero card ─────────────────────────────────────────── */}
      <div className="result-card">
        <div className="result-card-inner flex flex-col sm:flex-row sm:items-center gap-6">

          {/* Grade */}
          <div className="text-center" style={{ textAlign: 'left' }}>
            <div className="result-meta-label" style={{ marginBottom: 'var(--space-1)' }}>
              Mean Grade
            </div>
            <div className="result-card mean-grade" style={{ fontSize: 'clamp(4rem,10vw,5rem)' }}>
              {result.mean_grade}
            </div>
            <div style={{ color: 'var(--color-primary-300)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              {result.mean_points} points · {result.subjects_sat} subjects
            </div>
          </div>

          {/* Candidate info */}
          <div style={{ flex: 1 }}>
            <div className="result-card candidate-name" style={{ marginBottom: 'var(--space-1)' }}>
              {candidate.full_name}
            </div>
            <div className="result-card index-number" style={{ marginBottom: 'var(--space-3)' }}>
              {formatIndexNumber(candidate.index_number)}
            </div>
            <div style={{ color: 'var(--color-primary-200)', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div>{candidate.school_name}</div>
              <div>{candidate.county} County · KCSE {candidate.year}</div>
            </div>
            {result.national_rank && (
              <div className="hero-badge" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
                🏆 {ordinal(result.national_rank)} Nationally
                {result.school_rank && ` · ${ordinal(result.school_rank)} in School`}
              </div>
            )}
          </div>

          {/* Download */}
          <div style={{ alignSelf: 'flex-start' }}>
            <button
              onClick={() => onDownload(candidate.index_number)}
              disabled={downloading}
              className="btn btn-sm"
              style={{
                background:  'rgba(255,255,255,0.15)',
                color:       '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              {downloading ? <ButtonSpinner /> : '⬇'}&nbsp;Result Slip
            </button>
          </div>
        </div>
      </div>

      {/* ── Subject results ──────────────────────────────────────────────── */}
      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Subject Results</h2>
        <div className="subject-list">
          {subjects.map((s) => (
            <div key={s.subject_code} className="subject-row">
              <div className="subject-name">
                <span className="font-mono text-faint" style={{ fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)' }}>
                  {s.subject_code}
                </span>
                {s.subject_name}
              </div>
              <div className="subject-marks">
                {s.moderated_marks !== undefined ? `${s.moderated_marks}/100` : '—'}
              </div>
              <div className={`subject-grade grade-display ${gradeColour(s.grade)}`}>
                {s.grade}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grade scale guide ────────────────────────────────────────────── */}
      <div className="card" style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border)' }}>
        <div className="label" style={{ marginBottom: 'var(--space-3)' }}>
          KCSE Grading Scale
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {GRADE_SCALE.map(([g, r]) => (
            <div key={g} style={{
              textAlign:     'center',
              padding:       'var(--space-2)',
              borderRadius:  'var(--radius-md)',
              background:    'var(--color-surface)',
              border:        '1px solid var(--color-border)',
            }}>
              <div className={`grade-display ${gradeColour(g)}`} style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                {g}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--color-ink-faint)', marginTop: 'var(--space-1)' }}>
                {r}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}