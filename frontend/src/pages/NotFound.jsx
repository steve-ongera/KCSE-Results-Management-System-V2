/**
 * src/pages/NotFound.jsx
 * 404 page
 */

import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-green-800 mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: 'var(--font-display)' }}>
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-primary">Go to Home</Link>
          <Link to="/results" className="btn btn-secondary">Check Results</Link>
        </div>
      </div>
    </div>
  )
}