import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication.
 * Uses the useAuth hook to check authentication status.
 * Redirects to /login if user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()
  const theme = useTheme()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.isDark ? 'border-cyan-400' : 'border-blue-600'} mx-auto`}></div>
          <p className={`mt-4 ${theme.text.secondary}`}>Verifying session...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is authenticated, render the protected content
  return children
}

export default ProtectedRoute

