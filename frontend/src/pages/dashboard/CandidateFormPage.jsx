/**
 * src/pages/dashboard/CandidateFormPage.jsx
 *
 * Create (new) or edit an existing candidate registration.
 * Uses React Hook Form + Zod validation.
 * Uploads passport photo as multipart/form-data.
 */

import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  useCandidate,
  useCreateCandidate,
  useUpdateCandidate,
  useSubjects,
  useExaminationYears,
  useExaminationCenters,
} from '../../hooks/useResults'
import { candidateRegistrationSchema, setFormErrors } from '../../utils/validators'
import { ButtonSpinner, InlineLoader } from '../../components/common/PageLoader'

export default function CandidateFormPage() {
  const { id } = useParams()
  const isEdit  = !!id
  const navigate = useNavigate()

  const { data: candidate, isLoading: loadingCandidate } = useCandidate(id)
  const { data: subjectsData } = useSubjects({ is_active: true })
  const { data: yearsData }    = useExaminationYears({ registration_open: true })
  const { data: centersData }  = useExaminationCenters({ is_active: true })

  const subjects       = subjectsData?.results || []
  const optionalSubjs  = subjects.filter((s) => !s.is_compulsory)
  const compulsorySubjs = subjects.filter((s) => s.is_compulsory)
  const years          = yearsData?.results || []
  const centers        = centersData?.results || []

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(candidateRegistrationSchema),
    defaultValues: {
      gender: 'M',
      has_special_needs: false,
      subject_ids: [],
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (isEdit && candidate) {
      reset({
        index_number:       candidate.index_number,
        full_name:          candidate.full_name,
        gender:             candidate.gender,
        date_of_birth:      candidate.date_of_birth || '',
        kcpe_index_number:  candidate.kcpe_index_number,
        kcpe_marks:         candidate.kcpe_marks,
        birth_certificate_number: candidate.birth_certificate_number || '',
        examination_center_id: candidate.examination_center?.id,
        examination_year_id:   candidate.examination_year?.id,
        has_special_needs:     candidate.has_special_needs,
        special_needs_details: candidate.special_needs_details || '',
        subject_ids: candidate.candidate_subjects
          ?.filter((cs) => !cs.is_compulsory)
          .map((cs) => cs.subject.id) || [],
      })
    }
  }, [candidate, isEdit, reset])

  const createMutation = useCreateCandidate()
  const updateMutation = useUpdateCandidate(id)

  const hasSpecialNeeds = watch('has_special_needs')

  const onSubmit = async (data) => {
    // Build FormData for multipart upload
    const fd = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (key === 'subject_ids') {
        val.forEach((sid) => fd.append('subject_ids', sid))
      } else if (key === 'passport_photo' && val?.[0]) {
        fd.append('passport_photo', val[0])
      } else if (val !== null && val !== undefined && val !== '') {
        fd.append(key, val)
      }
    })

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(isEdit ? fd : fd, {
      onSuccess: (res) => navigate(`/dashboard/candidates/${res.id}`),
      onError: (err) => {
        if (err.errors) setFormErrors(err.errors, setError)
        else setError('root', { message: err.message })
      },
    })
  }

  if (isEdit && loadingCandidate) {
    return <div className="p-8"><InlineLoader rows={6} /></div>
  }

  return (
    <div className="page-enter max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/dashboard/candidates" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Edit Candidate' : 'Register Candidate'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? `Editing ${candidate?.full_name}` : 'Add a new Form 4 candidate'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Identity ────────────────────────────────────────────────────── */}
        <section className="card space-y-5">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            Candidate Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group sm:col-span-2">
              <label className="form-label form-label-required">Full Name</label>
              <input {...register('full_name')}
                className={`form-input ${errors.full_name ? 'error' : ''}`}
                placeholder="e.g. GADAFI IMRAN AKIL"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.full_name && <p className="form-error">⚠ {errors.full_name.message}</p>}
              <p className="form-hint">As on birth certificate — all capitals</p>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Gender</label>
              <select {...register('gender')} className={`form-input ${errors.gender ? 'error' : ''}`}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" {...register('date_of_birth')}
                className={`form-input ${errors.date_of_birth ? 'error' : ''}`} />
              {errors.date_of_birth && <p className="form-error">⚠ {errors.date_of_birth.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Birth Certificate No.</label>
              <input {...register('birth_certificate_number')}
                className="form-input" placeholder="e.g. BN1234567" />
            </div>

            <div className="form-group">
              <label className="form-label">Passport Photo</label>
              <input type="file" accept="image/jpeg,image/png"
                {...register('passport_photo')}
                className="form-input p-1.5 text-sm" />
              <p className="form-hint">JPG/PNG, max 2 MB</p>
            </div>
          </div>
        </section>

        {/* ── KCPE Details ─────────────────────────────────────────────── */}
        <section className="card space-y-5">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            KCPE Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label form-label-required">KCPE Index Number</label>
              <input {...register('kcpe_index_number')}
                className={`form-input form-input-mono ${errors.kcpe_index_number ? 'error' : ''}`}
                placeholder="10-digit KCPE index" inputMode="numeric" maxLength={10} />
              {errors.kcpe_index_number && <p className="form-error">⚠ {errors.kcpe_index_number.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">KCPE Marks</label>
              <input type="number" {...register('kcpe_marks', { valueAsNumber: true })}
                className="form-input" placeholder="0–500" min={0} max={500} />
            </div>
          </div>
        </section>

        {/* ── Examination Details ──────────────────────────────────────── */}
        <section className="card space-y-5">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            Examination Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group sm:col-span-2">
              <label className="form-label form-label-required">Index Number</label>
              <input {...register('index_number')}
                className={`form-input form-input-mono ${errors.index_number ? 'error' : ''}`}
                placeholder="11-digit KNEC index" inputMode="numeric" maxLength={11}
                disabled={isEdit} />
              {errors.index_number && <p className="form-error">⚠ {errors.index_number.message}</p>}
              <p className="form-hint">8-digit center code + 3-digit candidate number</p>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Examination Year</label>
              <select {...register('examination_year_id')}
                className={`form-input ${errors.examination_year_id ? 'error' : ''}`}>
                <option value="">Select year…</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>KCSE {y.year}</option>
                ))}
              </select>
              {errors.examination_year_id && <p className="form-error">⚠ {errors.examination_year_id.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Examination Centre</label>
              <select {...register('examination_center_id')}
                className={`form-input ${errors.examination_center_id ? 'error' : ''}`}>
                <option value="">Select centre…</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.center_code} — {c.school_name}
                  </option>
                ))}
              </select>
              {errors.examination_center_id && <p className="form-error">⚠ {errors.examination_center_id.message}</p>}
            </div>
          </div>
        </section>

        {/* ── Subject Selection ────────────────────────────────────────── */}
        <section className="card space-y-4">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            Subject Selection
          </h2>

          {compulsorySubjs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Compulsory Subjects (auto-added)
              </p>
              <div className="flex flex-wrap gap-2">
                {compulsorySubjs.map((s) => (
                  <span key={s.id} className="badge badge-green">✓ {s.name}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Optional Subjects (select up to 6)
            </p>
            <Controller
              name="subject_ids"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {optionalSubjs.map((s) => {
                    const checked = field.value.includes(s.id)
                    return (
                      <label key={s.id}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border
                          cursor-pointer text-sm transition-colors
                          ${checked
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          className="accent-green-700"
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (field.value.length < 6) field.onChange([...field.value, s.id])
                            } else {
                              field.onChange(field.value.filter((id) => id !== s.id))
                            }
                          }}
                        />
                        <span className="text-xs font-mono text-gray-400">{s.code}</span>
                        {s.name}
                      </label>
                    )
                  })}
                </div>
              )}
            />
            {errors.subject_ids && (
              <p className="form-error mt-2">⚠ {errors.subject_ids.message}</p>
            )}
          </div>
        </section>

        {/* ── Special Needs ────────────────────────────────────────────── */}
        <section className="card space-y-4">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            Special Needs
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('has_special_needs')}
              className="accent-green-700 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">
              This candidate has special needs or requires accommodations
            </span>
          </label>
          {hasSpecialNeeds && (
            <div className="form-group">
              <label className="form-label">Special Needs Details</label>
              <textarea {...register('special_needs_details')}
                className="form-input"
                rows={3}
                placeholder="Describe the accommodation required…" />
            </div>
          )}
        </section>

        {/* Root error */}
        {errors.root && (
          <div className="alert alert-error">{errors.root.message}</div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting
              ? <><ButtonSpinner /> {isEdit ? 'Saving…' : 'Registering…'}</>
              : isEdit ? 'Save Changes' : 'Register Candidate'
            }
          </button>
          <Link to="/dashboard/candidates" className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}