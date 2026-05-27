/**
 * src/App.jsx
 *
 * Root component.
 * Defines the full client-side route tree using React Router v6.
 *
 * Route groups:
 *   PUBLIC     — accessible by anyone (results lookup, school rankings)
 *   PROTECTED  — requires JWT token (school officer, examiner, admin dashboards)
 *   ADMIN      — requires KNEC_ADMIN role
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import { useAuth } from './context/AuthContext'
import PublicLayout   from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import PageLoader     from './components/common/PageLoader'
import NotFound       from './pages/NotFound'

// ── Lazy-loaded pages (code splitting) ───────────────────────────────────────

// Public
const Home              = lazy(() => import('./pages/Home'))
const ResultsPage       = lazy(() => import('./pages/ResultsPage'))
const SchoolRankingsPage = lazy(() => import('./pages/SchoolRankingsPage'))

// Auth
const LoginPage         = lazy(() => import('./pages/LoginPage'))

// School officer
const DashboardPage     = lazy(() => import('./pages/dashboard/DashboardPage'))
const CandidatesPage    = lazy(() => import('./pages/dashboard/CandidatesPage'))
const CandidateFormPage = lazy(() => import('./pages/dashboard/CandidateFormPage'))
const CandidateDetailPage = lazy(() => import('./pages/dashboard/CandidateDetailPage'))

// Examiner
const MarksEntryPage    = lazy(() => import('./pages/dashboard/MarksEntryPage'))
const ScriptsPage       = lazy(() => import('./pages/dashboard/ScriptsPage'))

// KNEC Admin
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const PublishResultsPage = lazy(() => import('./pages/admin/PublishResultsPage'))
const AuditLogPage       = lazy(() => import('./pages/admin/AuditLogPage'))
const AnalyticsPage      = lazy(() => import('./pages/admin/AnalyticsPage'))


// ── Route guards ──────────────────────────────────────────────────────────────

/**
 * Redirects to /login if the user is not authenticated.
 * Preserves the intended path so after login they return to where they were.
 */
function RequireAuth({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

/**
 * Redirects to /dashboard if the user lacks the required role.
 */
function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user || user.role !== role) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

/**
 * Redirects authenticated users away from the login page.
 */
function RedirectIfAuthed({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}


// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── PUBLIC routes (no login required) ──────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="results"   element={<ResultsPage />} />
          <Route path="rankings"  element={<SchoolRankingsPage />} />
          <Route
            path="login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
        </Route>

        {/* ── PROTECTED routes (authenticated staff) ─────────────────────── */}
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          {/* Default dashboard landing */}
          <Route index element={<DashboardPage />} />

          {/* Candidates (school officers + above) */}
          <Route path="candidates"              element={<CandidatesPage />} />
          <Route path="candidates/new"          element={<CandidateFormPage />} />
          <Route path="candidates/:id"          element={<CandidateDetailPage />} />
          <Route path="candidates/:id/edit"     element={<CandidateFormPage />} />

          {/* Scripts & marks (examiners + above) */}
          <Route path="scripts"                 element={<ScriptsPage />} />
          <Route path="marks"                   element={<MarksEntryPage />} />

          {/* ── KNEC ADMIN only ──────────────────────────────────────────── */}
          <Route
            path="admin"
            element={
              <RequireRole role="KNEC_ADMIN">
                <AdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/publish"
            element={
              <RequireRole role="KNEC_ADMIN">
                <PublishResultsPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/audit"
            element={
              <RequireRole role="KNEC_ADMIN">
                <AuditLogPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/analytics"
            element={
              <RequireRole role="KNEC_ADMIN">
                <AnalyticsPage />
              </RequireRole>
            }
          />
        </Route>

        {/* ── 404 ────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  )
}