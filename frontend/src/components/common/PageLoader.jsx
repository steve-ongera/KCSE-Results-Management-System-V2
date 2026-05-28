/**
 * src/components/common/PageLoader.jsx
 *
 * Full-page loading spinner shown during Suspense fallback
 * and while auth state is being bootstrapped.
 */

export default function PageLoader({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-green-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent
            border-t-green-700 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-green-700/10 flex items-center
            justify-center text-green-800 font-bold text-lg"
            style={{ fontFamily: 'var(--font-display)' }}>
            K
          </div>
        </div>
        <p className="text-sm text-gray-500 font-medium">{message}</p>
      </div>
    </div>
  )
}

/**
 * Inline (non-fullpage) loading state — use inside cards/sections.
 */
export function InlineLoader({ rows = 3 }) {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 rounded-lg" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  )
}

/**
 * Spinner button indicator — used inside buttons while a mutation is pending.
 */
export function ButtonSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}