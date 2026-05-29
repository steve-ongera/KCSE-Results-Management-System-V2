/**
 * src/pages/admin/AdminDashboardPage.jsx
 */

import { Link } from 'react-router-dom'
import { useExaminationYears } from '../../hooks/useResults'

export default function AdminDashboardPage() {
  const { data } = useExaminationYears()
  const years   = data?.results || []
  const current = years.find((y) => y.is_current)

  return (
    <div className="page-enter space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-display)' }}>
          KNEC Admin Panel
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          System administration and control for KCSE {current?.year}
        </p>
      </div>

      {/* Current year status */}
      {current && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-green-600 font-semibold uppercase tracking-wider">
                Current Year
              </div>
              <div className="text-2xl font-bold text-green-900"
                style={{ fontFamily: 'var(--font-display)' }}>
                KCSE {current.year}
              </div>
            </div>
            {[
              ['Registration', current.registration_open],
              ['Marking',      current.marking_open],
              ['Published',    current.results_published],
            ].map(([label, active]) => (
              <div key={label}>
                <div className="text-xs text-green-600 font-semibold uppercase tracking-wider">
                  {label}
                </div>
                <span className={`badge mt-1 ${active ? 'badge-green' : 'badge-gray'}`}>
                  {active ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            to: '/dashboard/admin/publish',
            icon: '📢', title: 'Publish Results',
            desc: 'Release KCSE results to the public portal',
            colour: 'border-amber-200 hover:border-amber-400',
          },
          {
            to: '/dashboard/admin/analytics',
            icon: '📊', title: 'Analytics & Reports',
            desc: 'National statistics, school rankings, grade distributions',
            colour: 'border-teal-200 hover:border-teal-400',
          },
          {
            to: '/dashboard/admin/audit',
            icon: '🔍', title: 'Audit Log',
            desc: 'Review all system actions for accountability',
            colour: 'border-red-200 hover:border-red-400',
          },
          {
            to: '/dashboard/candidates',
            icon: '👥', title: 'Manage Candidates',
            desc: 'Approve, reject, or review all candidate registrations',
            colour: 'border-blue-200 hover:border-blue-400',
          },
          {
            to: '/dashboard/marks',
            icon: '✏️', title: 'Marks Overview',
            desc: 'Monitor marks entry progress across all centres',
            colour: 'border-purple-200 hover:border-purple-400',
          },
        ].map(({ to, icon, title, desc, colour }) => (
          <Link
            key={to}
            to={to}
            className={`card card-hover block border-2 transition-colors ${colour}`}
            style={{ textDecoration: 'none' }}>
            <div className="text-3xl mb-3">{icon}</div>
            <div className="font-bold text-gray-900 mb-1">{title}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}