/**
 * src/pages/dashboard/DashboardPage.jsx
 *
 * Staff dashboard landing page.
 * Shows role-appropriate stats summary and quick action cards.
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCandidates, useMarksEntries, useExaminationYears } from '../../hooks/useResults'
import { formatNumber, statusBadgeClass, statusLabel } from '../../utils/formatters'
import { InlineLoader } from '../../components/common/PageLoader'

export default function DashboardPage() {
  const { user, isKNECAdmin, isSchoolOfficer, isExaminer } = useAuth()

  const { data: yearsData } = useExaminationYears({ is_current: true })
  const currentYear = yearsData?.results?.[0]

  const { data: candidatesData, isLoading: loadingCandidates } = useCandidates(
    { examination_year: currentYear?.id, page_size: 5 },
    { enabled: !!currentYear?.id && isSchoolOfficer }
  )

  const { data: marksData, isLoading: loadingMarks } = useMarksEntries(
    { page_size: 5 },
    { enabled: isExaminer }
  )

  const firstName = user?.first_name || user?.username || 'Officer'

  return (
    <div className="page-enter space-y-8">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          {currentYear
            ? `KCSE ${currentYear.year} — ${currentYear.registration_open ? 'Registration open' : 'Registration closed'}`
            : 'KCSE Examinations Management System'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Candidates"
          value={formatNumber(candidatesData?.pagination?.count ?? '—')}
          sub="This examination year"
          colour="text-green-700 bg-green-50"
          icon="👥"
          to="/dashboard/candidates"
          visible={isSchoolOfficer}
        />
        <StatCard
          label="Pending Approval"
          value={formatNumber(
            candidatesData?.results?.filter(c => c.registration_status === 'SUBMITTED').length ?? '—'
          )}
          sub="Awaiting KNEC review"
          colour="text-amber-700 bg-amber-50"
          icon="⏳"
          to="/dashboard/candidates?registration_status=SUBMITTED"
          visible={isSchoolOfficer}
        />
        <StatCard
          label="Marks Entered"
          value={formatNumber(marksData?.pagination?.count ?? '—')}
          sub="Your entries this session"
          colour="text-blue-700 bg-blue-50"
          icon="✏️"
          to="/dashboard/marks"
          visible={isExaminer}
        />
        <StatCard
          label="Scripts Tracked"
          value="—"
          sub="In transit / at marking"
          colour="text-purple-700 bg-purple-50"
          icon="📄"
          to="/dashboard/scripts"
          visible={true}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isSchoolOfficer && (
            <QuickAction
              to="/dashboard/candidates/new"
              title="Register Candidate"
              desc="Add a new Form 4 candidate to the examination register."
              icon="➕"
              colour="border-green-200 hover:border-green-400"
            />
          )}
          {isExaminer && (
            <QuickAction
              to="/dashboard/marks"
              title="Enter Marks"
              desc="Record marks for your assigned scripts."
              icon="✏️"
              colour="border-blue-200 hover:border-blue-400"
            />
          )}
          <QuickAction
            to="/dashboard/scripts"
            title="Track Scripts"
            desc="Update script status — from exam room to marking centre."
            icon="📦"
            colour="border-purple-200 hover:border-purple-400"
          />
          {isKNECAdmin && (
            <>
              <QuickAction
                to="/dashboard/admin/publish"
                title="Publish Results"
                desc="Make KCSE results available to candidates nationwide."
                icon="📢"
                colour="border-amber-200 hover:border-amber-400"
              />
              <QuickAction
                to="/dashboard/admin/analytics"
                title="View Analytics"
                desc="National statistics, school rankings, and grade distributions."
                icon="📊"
                colour="border-teal-200 hover:border-teal-400"
              />
              <QuickAction
                to="/dashboard/admin/audit"
                title="Audit Log"
                desc="Review all system actions and changes for accountability."
                icon="🔍"
                colour="border-red-200 hover:border-red-400"
              />
            </>
          )}
          <QuickAction
            to="/results"
            title="Public Results"
            desc="View the public-facing results lookup portal."
            icon="🌐"
            colour="border-gray-200 hover:border-gray-400"
          />
        </div>
      </div>

      {/* Recent candidates */}
      {isSchoolOfficer && (
        <div className="card p-0">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display)' }}>
              Recent Candidates
            </h2>
            <Link to="/dashboard/candidates"
              className="text-sm text-green-700 hover:text-green-900 font-medium">
              View all →
            </Link>
          </div>
          {loadingCandidates ? (
            <div className="p-5"><InlineLoader rows={4} /></div>
          ) : (
            <div className="table-wrapper border-0 shadow-none rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Index No.</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidatesData?.results?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-gray-400 py-8">
                        No candidates registered yet.
                      </td>
                    </tr>
                  )}
                  {candidatesData?.results?.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/dashboard/candidates/${c.id}`}
                          className="font-mono text-sm text-green-700 hover:underline">
                          {c.index_number}
                        </Link>
                      </td>
                      <td className="font-medium text-gray-800">{c.full_name}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass(c.registration_status)}`}>
                          {statusLabel(c.registration_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colour, icon, to, visible }) {
  if (!visible) return null
  return (
    <Link to={to} className="card card-hover block" style={{ textDecoration: 'none' }}>
      <div className={`inline-flex items-center justify-center w-10 h-10
        rounded-xl text-xl mb-3 ${colour}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5"
        style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </Link>
  )
}

function QuickAction({ to, title, desc, icon, colour }) {
  return (
    <Link to={to}
      className={`card card-hover block border-2 transition-colors ${colour}`}
      style={{ textDecoration: 'none' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-500">{desc}</div>
    </Link>
  )
}