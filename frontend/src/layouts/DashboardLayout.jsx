/**
 * src/layouts/DashboardLayout.jsx
 *
 * Shell for all authenticated staff pages.
 * Features a collapsible left sidebar with role-sensitive navigation,
 * a top header with user info, and the page content via <Outlet />.
 */

import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Nav items by role ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    end: true,
    icon: HomeIcon,
    roles: ['SCHOOL_OFFICER', 'EXAMINER', 'TEAM_LEADER', 'CHIEF_EXAMINER',
            'SUBCOUNTY_OFFICER', 'COUNTY_OFFICER', 'KNEC_ADMIN'],
  },
  {
    label: 'Candidates',
    to: '/dashboard/candidates',
    icon: UsersIcon,
    roles: ['SCHOOL_OFFICER', 'SUBCOUNTY_OFFICER', 'COUNTY_OFFICER', 'KNEC_ADMIN'],
  },
  {
    label: 'Scripts',
    to: '/dashboard/scripts',
    icon: DocumentIcon,
    roles: ['SCHOOL_OFFICER', 'EXAMINER', 'TEAM_LEADER', 'CHIEF_EXAMINER',
            'SUBCOUNTY_OFFICER', 'COUNTY_OFFICER', 'KNEC_ADMIN'],
  },
  {
    label: 'Marks Entry',
    to: '/dashboard/marks',
    icon: PencilIcon,
    roles: ['EXAMINER', 'TEAM_LEADER', 'CHIEF_EXAMINER', 'KNEC_ADMIN'],
  },
  // Admin-only section
  {
    label: 'Admin Panel',
    to: '/dashboard/admin',
    icon: ShieldIcon,
    roles: ['KNEC_ADMIN'],
    divider: true,
  },
  {
    label: 'Publish Results',
    to: '/dashboard/admin/publish',
    icon: BroadcastIcon,
    roles: ['KNEC_ADMIN'],
  },
  {
    label: 'Analytics',
    to: '/dashboard/admin/analytics',
    icon: ChartIcon,
    roles: ['KNEC_ADMIN'],
  },
  {
    label: 'Audit Log',
    to: '/dashboard/admin/audit',
    icon: LogIcon,
    roles: ['KNEC_ADMIN'],
  },
]

// ── Role display label ────────────────────────────────────────────────────────

const ROLE_LABELS = {
  KNEC_ADMIN:        'KNEC Administrator',
  COUNTY_OFFICER:    'County Officer',
  SUBCOUNTY_OFFICER: 'Sub-County Officer',
  SCHOOL_OFFICER:    'School Officer',
  EXAMINER:          'Examiner',
  TEAM_LEADER:       'Team Leader',
  CHIEF_EXAMINER:    'Chief Examiner',
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-[#14532d] text-white
      ${mobile ? 'w-64' : sidebarOpen ? 'w-56' : 'w-16'}
      transition-all duration-200
    `}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-green-800">
        <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center
          text-white font-bold flex-shrink-0"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
          K
        </div>
        {(mobile || sidebarOpen) && (
          <div>
            <div className="text-sm font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
              KCSE Portal
            </div>
            <div className="text-[10px] text-green-300 leading-tight">Staff Dashboard</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleItems.map((item, i) => (
          <div key={item.to}>
            {item.divider && (
              <div className="border-t border-green-800 my-3 mx-3" />
            )}
            <NavLink
              to={item.to}
              end={item.end}
              onClick={() => mobile && setMobileOpen(false)}
              style={{ textDecoration: 'none' }}
              className={({ isActive }) => `
                flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors group
                ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-green-200 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(mobile || sidebarOpen) && <span>{item.label}</span>}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-green-800">
        {(mobile || sidebarOpen) ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center
              text-white font-bold text-sm flex-shrink-0">
              {user?.first_name?.[0] || user?.username?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </div>
              <div className="text-[10px] text-green-300 truncate">
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="text-green-300 hover:text-white p-1 rounded transition-colors">
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Sign out"
            className="w-full flex justify-center py-2 text-green-300 hover:text-white transition-colors">
            <LogoutIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative flex flex-col h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-14
          flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
              <MenuIcon className="w-5 h-5" />
            </button>
            {/* Desktop sidebar toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <MenuIcon className="w-5 h-5" />
            </button>
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              style={{ textDecoration: 'none' }}>
              ← Public Portal
            </Link>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="hidden sm:inline">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center
              justify-center text-white font-semibold text-sm">
              {user?.first_name?.[0] || user?.username?.[0] || '?'}
            </div>
          </div>
        </header>

        {/* Scrollable page area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Inline SVG icon components ────────────────────────────────────────────────

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
    </svg>
  )
}
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}
function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
function PencilIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  )
}
function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}
function BroadcastIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 1 8.835-2.535m0 0A23.74 23.74 0 0 1 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
    </svg>
  )
}
function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}
function LogIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
    </svg>
  )
}
function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}
function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  )
}