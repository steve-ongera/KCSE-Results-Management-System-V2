/**
 * src/components/common/PageLoader.jsx
 *
 * Loading states for the KCSE Results Portal.
 * 
 * Components:
 * - PageLoader: Full-page loading spinner (Suspense fallback, auth bootstrap)
 * - InlineLoader: Skeleton loader for cards/sections
 * - ButtonSpinner: Compact spinner for buttons during mutations
 * - ResultLoader: Specialized loader for results lookup
 * - TableLoader: Skeleton for data tables
 */

import { useEffect, useState } from 'react'

/**
 * Full-page loading spinner
 * Used for Suspense fallback and auth state bootstrap
 */
export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner">
        <div className="page-loader-ring"></div>
        <div className="page-loader-ring-inner"></div>
        <div className="page-loader-emblem">
          <span>K</span>
        </div>
      </div>
      <p className="page-loader-message">{message}</p>
    </div>
  )
}

/**
 * Inline skeleton loader for cards/sections
 */
export function InlineLoader({ rows = 3, variant = 'default' }) {
  return (
    <div className={`inline-loader inline-loader-${variant}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="inline-loader-row"
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  )
}

/**
 * Spinner for buttons during pending mutations
 */
export function ButtonSpinner({ size = 'sm', color = 'white' }) {
  return (
    <span className={`button-spinner button-spinner-${size} button-spinner-${color}`}>
      <svg className="button-spinner-svg" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
  )
}

/**
 * Specialized loader for results lookup page
 * Shows a skeleton of the results card while fetching
 */
export function ResultLoader() {
  return (
    <div className="result-loader">
      <div className="result-loader-card">
        <div className="result-loader-header">
          <div className="result-loader-name skeleton"></div>
          <div className="result-loader-download skeleton"></div>
        </div>
        <div className="result-loader-stats">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="result-loader-stat">
              <div className="result-loader-stat-label skeleton"></div>
              <div className="result-loader-stat-value skeleton"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="result-loader-table skeleton">
        <div className="result-loader-table-header skeleton"></div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="result-loader-table-row skeleton"></div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton loader for data tables
 */
export function TableLoader({ columns = 4, rows = 5 }) {
  return (
    <div className="table-loader">
      <div className="table-loader-header">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="table-loader-header-cell skeleton"></div>
        ))}
      </div>
      <div className="table-loader-body">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="table-loader-row">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="table-loader-cell skeleton"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Dot pulse loader for inline status indicators
 */
export function DotLoader({ message = 'Loading' }) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dot-loader">
      <div className="dot-loader-dots">
        <span className="dot-loader-dot"></span>
        <span className="dot-loader-dot"></span>
        <span className="dot-loader-dot"></span>
      </div>
      <span className="dot-loader-text">{message}{dots}</span>
    </div>
  )
}