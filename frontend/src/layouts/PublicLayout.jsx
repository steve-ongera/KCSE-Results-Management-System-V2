/**
 * src/layouts/PublicLayout.jsx
 *
 * Shell for all public pages (Home, Results, Rankings, Login).
 * Renders a top navigation bar, the page content via <Outlet />,
 * and a footer with KNEC branding.
 */

import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PublicLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Government banner ───────────────────────────────────────────── */}
      <div className="bg-[#14532d] text-white text-xs py-1.5 px-4 text-center tracking-wide">
        Republic of Kenya &nbsp;·&nbsp; Kenya National Examinations Council (KNEC)
      </div>

      {/* ── Main Navbar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#166534] text-white font-bold text-lg flex-shrink-0"
              style={{ fontFamily: 'var(--font-display)' }}>
              K
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}>
                KCSE Portal
              </div>
              <div className="text-[11px] text-gray-500 leading-tight">Results & Examinations</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/',         label: 'Home',     end: true },
              { to: '/results',  label: 'My Results' },
              { to: '/rankings', label: 'School Rankings' },
            ].map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={{ textDecoration: 'none' }}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Auth CTA */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm">
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-white font-bold mb-3"
                style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                KCSE Results Portal
              </div>
              <p className="text-sm leading-relaxed">
                Official Kenya Certificate of Secondary Education examination
                results system, managed by the Kenya National Examinations Council.
              </p>
            </div>
            <div>
              <div className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
                Quick Links
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/results',  label: 'Check Results' },
                  { to: '/rankings', label: 'School Rankings' },
                  { to: '/login',    label: 'Staff Portal' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to}
                      className="hover:text-white transition-colors"
                      style={{ textDecoration: 'none' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
                Contact KNEC
              </div>
              <ul className="space-y-2 text-sm">
                <li>New Mitihani House, Upper Hill</li>
                <li>Nairobi, Kenya</li>
                <li className="pt-1">
                  <a href="mailto:itsupport@knec.ac.ke" className="hover:text-white">
                    itsupport@knec.ac.ke
                  </a>
                </li>
                <li>
                  <a href="https://www.knec.ac.ke" target="_blank" rel="noopener noreferrer"
                    className="hover:text-white">
                    www.knec.ac.ke
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            © {new Date().getFullYear()} Kenya National Examinations Council. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}