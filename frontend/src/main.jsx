/**
 * src/main.jsx
 *
 * React application entry point.
 * Mounts the root App component with all global providers:
 *   - React Query  (server state)
 *   - React Router (client routing)
 *   - AuthContext  (JWT auth state)
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import App from './App'
import { AuthProvider } from './context/AuthContext'

import './index.css'

// ── React Query client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Re-fetch stale data after 5 minutes
      staleTime:        5 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime:           10 * 60 * 1000,
      // Retry failed requests twice before showing error
      retry:            2,
      retryDelay:       (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      // Don't re-fetch when window re-focuses for exam data (stable data)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ── Mount ─────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
)