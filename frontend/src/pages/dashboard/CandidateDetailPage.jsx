/**
 * src/pages/dashboard/CandidateDetailPage.jsx
 *
 * Full candidate profile view with subjects, registration status,
 * and approve/reject/submit workflow actions.
 */

import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  useCandidate,
  useSubmitCandidate,
  useApproveCandidate,
  useRejectCandidate,
  useDeleteCandidate,
} from '../../hooks/useResults'
import { useAuth } from '../../context/AuthContext'
import {
  statusLabel, statusBadgeClass, formatDate,
  formatDateTime, formatIndexNumber, genderLabel,
} from '../../utils/formatters'
import { InlineLoader } from '../../components/common/PageLoader'
import { ButtonSpinner } from '../../components/common/PageLoader'

export default function CandidateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isKNECAdmin } = useAuth()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const { data: candidate, isLoading, isError } = useCandidate(id)
  const submitMutation  = useSubmitCandidate()
  const approveMutation = useApproveCandidate()
  const rejectMutation  = useRejectCandidate()
  const deleteMutation  = useDeleteCandidate()

  if (isLoading) return <div className="p-8"><InlineLoader rows={6} /></div>
  if (isError || !candidate) {
    return (
      <div className="text-center py-20 text-gray-400">
        Candidate not found. <Link to="/dashboard/candidates" className="text-green-700">Back to list</Link>
      </div>
    )
  }

  const canSubmit  = candidate.registration_status === 'DRAFT'
  const canApprove = isKNECAdmin && ['SUBMITTED', 'COUNTY_APPR'].includes(candidate.registration_status)
  const canDelete  = candidate.registration_status === 'DRAFT'

  const handleDelete = () => {
    if (!confirm(`Delete ${candidate.full_name}? This cannot be undone.`)) return
    deleteMutation.mutate(id, { onSuccess: () => navigate('/dashboard/candidates') })
  }

  return (
    <div className="page-enter max-w-3xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/dashboard/candidates" className="hover:text-gray-600">Candidates</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{candidate.full_name}</span>
      </div>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar / photo */}
          <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center
            text-green-800 text-3xl font-bold flex-shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}>
            {candidate.full_name?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900"
                style={{ fontFamily: 'var(--font-display)' }}>
                {candidate.full_name}
              </h1>
              <span className={`badge ${statusBadgeClass(candidate.registration_status)}`}>
                {statusLabel(candidate.registration_status)}
              </span>
            </div>
            <div className="text-sm font-mono text-gray-500 mb-3">
              {formatIndexNumber(candidate.index_number)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
              <span className="text-gray-400">Gender</span>
              <span className="text-gray-700 font-medium sm:col-span-2">
                {genderLabel(candidate.gender)}
              </span>
              <span className="text-gray-400">School</span>
              <span className="text-gray-700 font-medium sm:col-span-2">
                {candidate.examination_center?.school_name}
              </span>
              <span className="text-gray-400">Year</span>
              <span className="text-gray-700 font-medium sm:col-span-2">
                KCSE {candidate.examination_year?.year}
              </span>
              <span className="text-gray-400">Registered</span>
              <span className="text-gray-700 sm:col-span-2">
                {formatDate(candidate.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            {canSubmit && (
              <button
                onClick={() => submitMutation.mutate(id)}
                disabled={submitMutation.isPending}
                className="btn btn-primary btn-sm">
                {submitMutation.isPending ? <ButtonSpinner /> : '↑'} Submit
              </button>
            )}
            {canApprove && !showRejectForm && (
              <>
                <button
                  onClick={() => approveMutation.mutate(id)}
                  disabled={approveMutation.isPending}
                  className="btn btn-primary btn-sm">
                  {approveMutation.isPending ? <ButtonSpinner /> : '✓'} Approve
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="btn btn-danger btn-sm">
                  ✗ Reject
                </button>
              </>
            )}
            {candidate.registration_status === 'DRAFT' && (
              <Link to={`/dashboard/candidates/${id}/edit`}
                className="btn btn-secondary btn-sm">
                Edit
              </Link>
            )}
            {canDelete && (
              <button onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn btn-ghost btn-sm text-red-500 hover:text-red-700">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Reject form */}
        {showRejectForm && (
          <div className="mt-5 border-t border-gray-100 pt-5 space-y-3">
            <p className="text-sm font-medium text-gray-700">Rejection reason:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Describe why this registration is being rejected…"
            />
            <div className="flex gap-2">
              <button
                onClick={() => rejectMutation.mutate(
                  { id, reason: rejectReason },
                  { onSuccess: () => setShowRejectForm(false) }
                )}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="btn btn-danger btn-sm">
                {rejectMutation.isPending ? <ButtonSpinner /> : 'Confirm Rejection'}
              </button>
              <button onClick={() => setShowRejectForm(false)}
                className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Rejection reason display */}
        {candidate.registration_status === 'REJECTED' && candidate.rejection_reason && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="alert alert-error text-sm">
              <span>✗</span>
              <div>
                <div className="font-medium">Rejection Reason</div>
                <div>{candidate.rejection_reason}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KCPE Details */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          KCPE Details
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['KCPE Index', candidate.kcpe_index_number],
            ['KCPE Marks', candidate.kcpe_marks ?? '—'],
            ['Birth Cert. No.', candidate.birth_certificate_number || '—'],
            ['Date of Birth', formatDate(candidate.date_of_birth)],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-gray-400 text-xs">{label}</div>
              <div className="font-medium text-gray-800 font-mono text-sm">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          Registered Subjects
        </h2>
        <div className="space-y-2">
          {candidate.candidate_subjects?.map((cs) => (
            <div key={cs.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg
                bg-gray-50 border border-gray-100">
              <div>
                <span className="text-xs font-mono text-gray-400 mr-2">
                  {cs.subject.code}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {cs.subject.name}
                </span>
              </div>
              <span className={`badge ${cs.is_compulsory ? 'badge-green' : 'badge-blue'}`}>
                {cs.is_compulsory ? 'Compulsory' : 'Optional'}
              </span>
            </div>
          ))}
          {(!candidate.candidate_subjects || candidate.candidate_subjects.length === 0) && (
            <p className="text-gray-400 text-sm">No subjects registered.</p>
          )}
        </div>
      </div>

      {/* Special needs */}
      {candidate.has_special_needs && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'var(--font-display)' }}>
            Special Needs
          </h2>
          <p className="text-sm text-gray-600">
            {candidate.special_needs_details || 'Accommodations required (no details provided).'}
          </p>
        </div>
      )}

      {/* Timestamps */}
      <div className="card bg-gray-50 border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <div>Registered</div>
            <div className="font-medium text-gray-600">{formatDateTime(candidate.created_at)}</div>
          </div>
          {candidate.submitted_at && (
            <div>
              <div>Submitted</div>
              <div className="font-medium text-gray-600">{formatDateTime(candidate.submitted_at)}</div>
            </div>
          )}
          {candidate.approved_at && (
            <div>
              <div>Approved</div>
              <div className="font-medium text-gray-600">{formatDateTime(candidate.approved_at)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}