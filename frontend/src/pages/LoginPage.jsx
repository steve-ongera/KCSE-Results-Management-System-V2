/**
 * src/pages/LoginPage.jsx
 *
 * Staff login page. Only accessible when not authenticated.
 * Uses JWT credentials → redirects to /dashboard on success.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'

import { useAuth } from '../context/AuthContext'
import { loginSchema } from '../utils/validators'
import { ButtonSpinner } from '../components/common/PageLoader'

export default function LoginPage() {
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onError: (err) => {
      setServerError(err?.message || 'Invalid username or password.')
    },
  })

  const onSubmit = (data) => {
    setServerError('')
    mutate(data)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className="auth-logo">
          <div className="auth-logo-mark">K</div>
          <div>
            <div className="auth-title">Staff Portal</div>
            <div className="auth-subtitle">KNEC Examinations Management System</div>
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              {...register('username')}
              autoComplete="username"
              className={`form-input${errors.username ? ' error' : ''}`}
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="form-error">⚠ {errors.username.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              autoComplete="current-password"
              className={`form-input${errors.password ? ' error' : ''}`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="form-error">⚠ {errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠</span>
              <span className="alert-content" style={{ fontSize: 'var(--text-sm)' }}>
                {serverError}
              </span>
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary btn-block">
            {isPending ? <><ButtonSpinner /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        {/* ── Footer links ──────────────────────────────────────────────── */}
        <div className="text-center" style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', margin: 0 }}>
            This portal is for authorised KNEC staff only.
          </p>
          <Link to="/" className="text-primary" style={{ fontSize: 'var(--text-sm)' }}>
            ← Back to Public Portal
          </Link>
        </div>

      </div>
    </div>
  )
}