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
    lookup(data, {
      onSuccess: (res) => setResults(res),
    })
  }

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-12">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: 'var(--font-display)' }}>
          Check Your KCSE Results
        </h1>
        <p className="text-gray-500">
          Enter your examination details below. No login or account needed.
        </p>
      </div>

      {/* ── Lookup form ───────────────────────────────────────────────────── */}
      <div className="card mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="index_number">
              Examination Index Number
            </label>
            <input
              id="index_number"
              {...register('index_number')}
              placeholder="e.g. 10234001023"
              className={`form-input form-input-mono ${errors.index_number ? 'error' : ''}`}
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
              className={`form-input ${errors.full_name ? 'error' : ''}`}
              autoComplete="off"
              style={{ textTransform: 'uppercase' }}
            />
            {errors.full_name && (
              <p className="form-error">⚠ {errors.full_name.message}</p>
            )}
            <p className="form-hint">
              As it appears on your birth certificate — all capitals
            </p>
          </div>

          {/* API error */}
          {isError && (
            <div className="alert alert-error">
              <span>⚠</span>
              <span>{error?.message || 'Could not retrieve results. Please check your details.'}</span>
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary w-full btn-lg">
            {isPending ? <><ButtonSpinner /> Searching…</> : 'View My Results'}
          </button>
        </form>
      </div>

      {/* ── Results display ───────────────────────────────────────────────── */}
      {results && <ResultsDisplay results={results} onDownload={downloadSlip} downloading={downloading} />}

      {/* ── Help note ─────────────────────────────────────────────────────── */}
      {!results && (
        <div className="text-center text-sm text-gray-400 mt-6 space-y-1">
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
    <div className="space-y-6 page-enter">

      {/* Announcement banner */}
      {announcement && (
        <div className="alert alert-info text-sm">{announcement}</div>
      )}

      {/* Mean grade hero card */}
      <div className="result-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Grade */}
          <div className="text-center sm:text-left">
            <div className="text-xs font-semibold tracking-widest text-green-300 uppercase mb-1">
              Mean Grade
            </div>
            <div className="mean-grade" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '5rem',
              fontWeight: 800,
              lineHeight: 1,
              color: '#fbbf24',
            }}>
              {result.mean_grade}
            </div>
            <div className="text-green-300 text-sm mt-1">
              {result.mean_points} points · {result.subjects_sat} subjects
            </div>
          </div>

          {/* Candidate info */}
          <div className="flex-1">
            <div className="candidate-name mb-1"
              style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff' }}>
              {candidate.full_name}
            </div>
            <div className="index-number text-green-300 text-sm mb-3"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              {formatIndexNumber(candidate.index_number)}
            </div>
            <div className="text-green-200 text-sm space-y-0.5">
              <div>{candidate.school_name}</div>
              <div>{candidate.county} County · KCSE {candidate.year}</div>
            </div>
            {result.national_rank && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-full
                px-3 py-1 text-xs font-medium text-white">
                🏆 {ordinal(result.national_rank)} Nationally
                {result.school_rank && ` · ${ordinal(result.school_rank)} in School`}
              </div>
            )}
          </div>

          {/* Download button */}
          <div className="sm:self-start">
            <button
              onClick={() => onDownload(candidate.index_number)}
              disabled={downloading}
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)' }}>
              {downloading ? <ButtonSpinner /> : '⬇'}
              &nbsp;Result Slip
            </button>
          </div>
        </div>
      </div>

      {/* Subject results */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          Subject Results
        </h2>
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.subject_code} className="subject-row">
              <div className="subject-name">
                <span className="text-xs font-mono text-gray-400 mr-2">{s.subject_code}</span>
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

      {/* Grade guide */}
      <div className="card bg-gray-50 border-gray-100">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          KCSE Grading Scale
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {[
            ['A','75-100'],['A-','70-74'],['B+','65-69'],['B','60-64'],
            ['B-','55-59'],['C+','50-54'],['C','45-49'],['C-','40-44'],
            ['D+','35-39'],['D','30-34'],['D-','25-29'],['E','0-24'],
          ].map(([g, r]) => (
            <div key={g} className="text-center p-1.5 rounded-lg bg-white border border-gray-100">
              <div className={`font-bold text-sm grade-display ${gradeColour(g)}`}
                style={{ fontFamily: 'var(--font-display)' }}>
                {g}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{r}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}