/**
 * src/pages/admin/PublishResultsPage.jsx
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePublishResults, useProcessResults, useExaminationYears } from '../../hooks/useResults'
import { publishResultsSchema } from '../../utils/validators'
import { formatDateTime } from '../../utils/formatters'
import { ButtonSpinner } from '../../components/common/PageLoader'

export default function PublishResultsPage() {
  const { data: yearsData } = useExaminationYears()
  const years = yearsData?.results || []

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(publishResultsSchema),
    defaultValues: { confirm: false },
  })

  const processMutation = useProcessResults()
  const publishMutation = usePublishResults()

  const selectedYearId = watch('examination_year_id')
  const selectedYear   = years.find((y) => y.id === selectedYearId)

  const onProcess = () => {
    if (!selectedYearId) return
    if (!confirm('Trigger results computation? This may take several minutes.')) return
    processMutation.mutate(selectedYearId)
  }

  const onPublish = (data) => {
    if (!confirm(
      `FINAL STEP: Publish KCSE ${selectedYear?.year} results publicly? This cannot be undone.`
    )) return
    publishMutation.mutate(data)
  }

  return (
    <div className="page-enter max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          Publish Results
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Process and release KCSE results to candidates nationwide
        </p>
      </div>

      {/* Warning banner */}
      <div className="alert alert-warning">
        <span>⚠</span>
        <div className="text-sm">
          <strong>Important:</strong> Publishing is irreversible. Once results are published,
          all candidates can view them via the public portal immediately.
          Ensure all marks have been locked and moderated before proceeding.
        </div>
      </div>

      {/* Step 1 — Select year & process */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-800"
          style={{ fontFamily: 'var(--font-display)' }}>
          Step 1 — Process Results
        </h2>
        <div className="form-group">
          <label className="form-label form-label-required">Examination Year</label>
          <select
            {...register('examination_year_id')}
            className={`form-input ${errors.examination_year_id ? 'error' : ''}`}>
            <option value="">Select year…</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                KCSE {y.year} {y.results_published ? '(Already Published)' : ''}
              </option>
            ))}
          </select>
          {errors.examination_year_id && (
            <p className="form-error">⚠ {errors.examination_year_id.message}</p>
          )}
        </div>
        <button
          onClick={onProcess}
          disabled={!selectedYearId || processMutation.isPending}
          className="btn btn-secondary">
          {processMutation.isPending
            ? <><ButtonSpinner /> Processing…</>
            : '⚙ Compute Grades & Rankings'
          }
        </button>
        {processMutation.isSuccess && (
          <div className="alert alert-success text-sm">
            ✓ Results computation queued. This runs in the background.
          </div>
        )}
      </div>

      {/* Step 2 — Publish */}
      <form onSubmit={handleSubmit(onPublish)} className="card space-y-4">
        <h2 className="font-bold text-gray-800"
          style={{ fontFamily: 'var(--font-display)' }}>
          Step 2 — Publish to Public
        </h2>
        <div className="form-group">
          <label className="form-label">Announcement Message (optional)</label>
          <textarea
            {...register('announcement_message')}
            className="form-input"
            rows={3}
            placeholder="Message shown to candidates alongside their results…"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('confirm')}
            className="accent-green-700 w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">
            I confirm that results for KCSE {selectedYear?.year || '—'} are final
            and ready to be published publicly.
          </span>
        </label>
        {errors.confirm && <p className="form-error">⚠ {errors.confirm.message}</p>}

        <button
          type="submit"
          disabled={!selectedYearId || publishMutation.isPending}
          className="btn btn-accent">
          {publishMutation.isPending
            ? <><ButtonSpinner /> Publishing…</>
            : '📢 Publish Results'
          }
        </button>

        {publishMutation.isSuccess && (
          <div className="alert alert-success text-sm">
            ✓ KCSE {selectedYear?.year} results are now live on the public portal.
            Published at {formatDateTime(publishMutation.data?.published_at)}
          </div>
        )}
        {publishMutation.isError && (
          <div className="alert alert-error text-sm">
            ⚠ {publishMutation.error?.message}
          </div>
        )}
      </form>
    </div>
  )
}