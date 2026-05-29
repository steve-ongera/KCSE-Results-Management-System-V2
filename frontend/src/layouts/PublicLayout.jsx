/**
 * src/layouts/PublicLayout.jsx
 *
 * Shell for all public pages (Home, Results, Rankings, Login).
 * Renders a top navigation bar with mobile hamburger menu,
 * the page content via <Outlet />, and a footer with KNEC branding.
 * 
 * Fully responsive with drawer sidebar on small screens.
 */

import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../App.css'

// Bootstrap Icons (make sure to import in your main entry file)
// Add this to index.html or main.jsx: 
// import 'bootstrap-icons/font/bootstrap-icons.css'

const NAV_LINKS = [
  { to: '/',         label: 'Home',            end: true, icon: 'bi-house-door' },
  { to: '/results',  label: 'My Results',      end: false, icon: 'bi-file-text' },
  { to: '/rankings', label: 'School Rankings', end: false, icon: 'bi-trophy' },
]

const FOOTER_LINKS = [
  { to: '/results',  label: 'Check Results'  },
  { to: '/rankings', label: 'School Rankings' },
  { to: '/login',    label: 'Staff Portal'   },
]

export default function PublicLayout() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="public-layout">

      {/* ── Government banner ───────────────────────────────────────────── */}
      <div className="knec-brand-bar knce-brand-bar-center">
        <i className="bi bi-shield-check"></i>
        <span>Republic of Kenya &nbsp;·&nbsp; Kenya National Examinations Council (KNEC)</span>
      </div>

      {/* ── Main Navbar ─────────────────────────────────────────────────── */}
      <header className="public-nav">
        <div className="container public-nav-inner">

          {/* Mobile hamburger button with Bootstrap Icon */}
          <button 
            className="menu-toggle mobile-only"
            onClick={toggleMobileMenu}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <i className="bi bi-list menu-toggle-icon"></i>
          </button>

          {/* Logo + Title - VISIBLE ON ALL DEVICES */}
          <Link to="/" className="knec-logo-area" onClick={closeMobileMenu}>
            <div className="knec-emblem bg-primary">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="knec-logo-text">
              <div className="knec-site-title">KCSE Portal</div>
              <div className="knec-site-sub">Results &amp; Examinations</div>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="public-nav-links desktop-only">
            {NAV_LINKS.map(({ to, label, end, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `public-nav-link${isActive ? ' active' : ''}`
                }
              >
                <i className={`${icon} nav-icon`}></i>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Auth CTA - Desktop */}
          <div className="auth-cta desktop-only">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                <i className="bi bi-speedometer2"></i>
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm">
                <i className="bi bi-box-arrow-in-right"></i>
                Staff Login
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* ── Mobile Drawer Sidebar ────────────────────────────────────────── */}
      <>
        {/* Backdrop overlay */}
        <div 
          className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'visible' : ''}`}
          onClick={closeMobileMenu}
        />
        
        {/* Drawer navigation */}
        <aside className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-logo">
              <div className="knec-emblem-sm bg-primary">
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <div>
                <div className="mobile-drawer-title">KCSE Portal</div>
                <div className="mobile-drawer-sub">Results &amp; Examinations</div>
              </div>
            </div>
            <button 
              className="mobile-drawer-close"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <nav className="mobile-drawer-nav">
            {NAV_LINKS.map(({ to, label, end, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `mobile-drawer-link${isActive ? ' active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <i className={`${icon} mobile-drawer-icon`}></i>
                {label}
              </NavLink>
            ))}
            <div className="mobile-drawer-divider" />
            {user ? (
              <Link 
                to="/dashboard" 
                className="mobile-drawer-link"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-speedometer2 mobile-drawer-icon"></i>
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="mobile-drawer-link"
                onClick={closeMobileMenu}
              >
                <i className="bi bi-box-arrow-in-right mobile-drawer-icon"></i>
                Staff Login
              </Link>
            )}
          </nav>

          <div className="mobile-drawer-footer">
            <div className="mobile-drawer-contact">
              <small><i className="bi bi-envelope"></i> Contact KNEC</small>
              <a href="mailto:itsupport@knec.ac.ke">
                <i className="bi bi-envelope-paper"></i> itsupport@knec.ac.ke
              </a>
              <a href="https://www.knec.ac.ke" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-globe"></i> www.knec.ac.ke
              </a>
            </div>
          </div>
        </aside>
      </>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="public-layout-main">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="public-footer public-footer-dark">
        <div className="container">
          <div className="footer-grid">
            
            {/* Brand blurb */}
            <div className="footer-brand">
              <div className="footer-brand-title">
                <i className="bi bi-mortarboard-fill"></i> KCSE Results Portal
              </div>
              <p className="footer-brand-text">
                Official Kenya Certificate of Secondary Education examination
                results system, managed by the Kenya National Examinations Council.
              </p>
            </div>

            {/* Quick links */}
            <div className="footer-links">
              <div className="footer-label">
                <i className="bi bi-link-45deg"></i> Quick Links
              </div>
              <ul className="footer-link-list">
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
            <div className="footer-contact">
              <div className="footer-label">
                <i className="bi bi-geo-alt"></i> Contact KNEC
              </div>
              <ul className="footer-contact-list">
                <li><i className="bi bi-building"></i> New Mitihani House, Upper Hill</li>
                <li><i className="bi bi-pin-map"></i> Nairobi, Kenya</li>
                <li className="footer-contact-email">
                  <a href="mailto:itsupport@knec.ac.ke" className="public-footer-link">
                    <i className="bi bi-envelope"></i> itsupport@knec.ac.ke
                  </a>
                </li>
                <li>
                  <a href="https://www.knec.ac.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-footer-link">
                    <i className="bi bi-globe"></i> www.knec.ac.ke
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="footer-divider" />
          <div className="footer-copyright">
            <i className="bi bi-c-circle"></i> {new Date().getFullYear()} Kenya National Examinations Council. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}