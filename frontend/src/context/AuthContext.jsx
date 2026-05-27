/**
 * src/context/AuthContext.jsx
 *
 * JWT authentication context.
 *
 * Provides:
 *   user        — decoded user object from JWT payload (or null)
 *   isLoading   — true while checking stored token on first mount
 *   login()     — POST credentials → store tokens → set user
 *   logout()    — clear tokens → null user → redirect /login
 *   hasRole()   — helper to check user role
 *
 * Token storage: localStorage (keys defined in api/axios.js tokenStorage)
 * Token decode:  jwt-decode (lightweight, no network call)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

import { login as apiLogin, logout as apiLogout, getMe } from '../api/endpoints'
import { tokenStorage } from '../api/axios'


// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

/**
 * Safely decode a JWT. Returns null if the token is missing, malformed,
 * or expired.
 */
function decodeToken(token) {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    // Reject expired tokens immediately
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
    return decoded
  } catch {
    return null
  }
}


// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  // Full user profile (from /auth/me/ after login)
  const [user,      setUser]      = useState(null)
  // Decoded JWT payload (fast, no network call)
  const [tokenData, setTokenData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ── Bootstrap: check stored token on first mount ────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      const accessToken = tokenStorage.getAccess()
      const decoded     = decodeToken(accessToken)

      if (!decoded) {
        // No valid token — clear storage and stay logged out
        tokenStorage.clearTokens()
        setIsLoading(false)
        return
      }

      setTokenData(decoded)

      // Fetch the full user profile (role, name, center, etc.)
      try {
        const profile = await getMe()
        setUser(profile)
      } catch {
        // Token may be valid syntactically but rejected by server
        tokenStorage.clearTokens()
        setUser(null)
        setTokenData(null)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [])


  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    // 1. Exchange credentials for tokens
    const tokenResponse = await apiLogin(credentials)
    tokenStorage.setTokens({
      access:  tokenResponse.access,
      refresh: tokenResponse.refresh,
    })

    // 2. Decode token payload (contains role, user_id etc.)
    const decoded = decodeToken(tokenResponse.access)
    setTokenData(decoded)

    // 3. Fetch full profile
    const profile = await getMe()
    setUser(profile)

    // 4. Navigate to dashboard
    navigate('/dashboard', { replace: true })

    return profile
  }, [navigate])


  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = tokenStorage.getRefresh()
      if (refresh) {
        // Tell the server to blacklist the refresh token
        await apiLogout({ refresh })
      }
    } catch {
      // Continue logout even if the server call fails
    } finally {
      tokenStorage.clearTokens()
      setUser(null)
      setTokenData(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])


  // ── Role helper ───────────────────────────────────────────────────────────
  const hasRole = useCallback(
    (role) => user?.role === role,
    [user],
  )

  const isKNECAdmin     = hasRole('KNEC_ADMIN')
  const isSchoolOfficer = ['SCHOOL_OFFICER', 'SUBCOUNTY_OFFICER', 'COUNTY_OFFICER', 'KNEC_ADMIN']
    .includes(user?.role)
  const isExaminer      = ['EXAMINER', 'TEAM_LEADER', 'CHIEF_EXAMINER', 'KNEC_ADMIN']
    .includes(user?.role)


  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user,
    tokenData,
    isLoading,
    isAuthenticated: !!user,

    // Role shorthands
    isKNECAdmin,
    isSchoolOfficer,
    isExaminer,

    // Actions
    login,
    logout,
    hasRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

export default AuthContext