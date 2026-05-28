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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
            bg-green-800 text-white text-2xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}>
            K
          </div>
          <h1 className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display)' }}>
            Staff Portal
          </h1>
          <p className="text-gray-500 text-sm mt-1">KNEC Examinations Management System</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                {...register('username')}
                autoComplete="username"
                className={`form-input ${errors.username ? 'error' : ''}`}
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
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="form-error">⚠ {errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="alert alert-error text-sm">
                <span>⚠</span>
                <span>{serverError}</span>
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn btn-primary w-full">
              {isPending ? <><ButtonSpinner /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-gray-400">
            This portal is for authorised KNEC staff only.
          </p>
          <Link to="/" className="text-sm text-green-700 hover:text-green-900">
            ← Back to Public Portal
          </Link>
        </div>
      </div>
    </div>
  )
}