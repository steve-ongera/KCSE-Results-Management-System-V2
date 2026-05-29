/**
 * src/layouts/PublicLayout.jsx
 *
 * Shell for all public pages (Home, Results, Rankings, Login).
 * Renders a top navigation bar, the page content via <Outlet />,
 * and a footer with KNEC branding.
 */

import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../App.css'

const NAV_LINKS = [
  { to: '/',         label: 'Home',            end: true  },
  { to: '/results',  label: 'My Results',      end: false },
  { to: '/rankings', label: 'School Rankings', end: false },
]

const FOOTER_LINKS = [
  { to: '/results',  label: 'Check Results'  },
  { to: '/rankings', label: 'School Rankings' },
  { to: '/login',    label: 'Staff Portal'   },
]

export default function PublicLayout() {
  const { user } = useAuth()

  return (
    <div className="public-layout">

      {/* ── Government banner ───────────────────────────────────────────── */}
      <div className="knec-brand-bar" style={{ justifyContent: 'center' }}>
        Republic of Kenya &nbsp;·&nbsp; Kenya National Examinations Council (KNEC)
      </div>

      {/* ── Main Navbar ─────────────────────────────────────────────────── */}
      <header className="public-nav">
        <div className="container public-nav-inner">

          {/* Logo + Title */}
          <Link to="/" className="knec-logo-area" style={{ textDecoration: 'none' }}>
            <div className="knec-emblem bg-primary">
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize:   'var(--text-xl)',
                color:      '#fff',
              }}>
                K
              </span>
            </div>
            <div>
              <div className="knec-site-title" style={{ fontSize: 'var(--text-base)' }}>
                KCSE Portal
              </div>
              <div className="knec-site-sub">Results &amp; Examinations</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="public-nav-links" style={{ display: 'flex' }}>
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={{ textDecoration: 'none' }}
                className={({ isActive }) =>
                  `public-nav-link${isActive ? ' active' : ''}`
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
      <main className="public-layout-main">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="public-footer" style={{ background: 'var(--color-gray-900)' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8"
            style={{ paddingBottom: 'var(--space-8)' }}>

            {/* Brand blurb */}
            <div>
              <div style={{
                fontFamily:   'var(--font-display)',
                fontWeight:   700,
                fontSize:     'var(--text-lg)',
                color:        '#fff',
                marginBottom: 'var(--space-3)',
              }}>
                KCSE Results Portal
              </div>
              <p style={{
                fontSize:   'var(--text-sm)',
                lineHeight: 1.7,
                color:      'rgba(255,255,255,0.5)',
                marginBottom: 0,
              }}>
                Official Kenya Certificate of Secondary Education examination
                results system, managed by the Kenya National Examinations Council.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <div className="label" style={{
                color:        'rgba(255,255,255,0.75)',
                marginBottom: 'var(--space-3)',
              }}>
                Quick Links
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {FOOTER_LINKS.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="public-footer-link">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="label" style={{
                color:        'rgba(255,255,255,0.75)',
                marginBottom: 'var(--space-3)',
              }}>
                Contact KNEC
              </div>
              <ul style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           'var(--space-2)',
                fontSize:      'var(--text-sm)',
                color:         'rgba(255,255,255,0.5)',
              }}>
                <li>New Mitihani House, Upper Hill</li>
                <li>Nairobi, Kenya</li>
                <li style={{ paddingTop: 'var(--space-1)' }}>
                  <a href="mailto:itsupport@knec.ac.ke" className="public-footer-link">
                    itsupport@knec.ac.ke
                  </a>
                </li>
                <li>
                  <a href="https://www.knec.ac.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-footer-link">
                    www.knec.ac.ke
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="divider" style={{
            background:   'rgba(255,255,255,0.08)',
            margin:       'var(--space-6) 0 0',
          }} />
          <div style={{
            paddingTop: 'var(--space-6)',
            textAlign:  'center',
            fontSize:   'var(--text-xs)',
            color:      'rgba(255,255,255,0.35)',
          }}>
            © {new Date().getFullYear()} Kenya National Examinations Council. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}