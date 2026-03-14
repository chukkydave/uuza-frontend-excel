import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useTheme } from '../contexts/ThemeContext'

const Login = () => {
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const theme = useTheme()
  const navigate = useNavigate()
  const inviteToken = searchParams.get('invite_token')
  const authError = searchParams.get('error')

  // Check if user is already authenticated and redirect appropriately
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const sessionInfo = await api.validateSession()
        if (sessionInfo.authenticated) {
          // User is already authenticated - redirect based on their status
          // The backend validates session returns redirect_url based on user role/status
          if (sessionInfo.redirect_url) {
            navigate(sessionInfo.redirect_url)
          } else {
            // Fallback to dashboard
            navigate('/dashboard')
          }
          return
        }
      } catch (error) {
        console.log('No existing authentication found')
      }
      setCheckingAuth(false)
    }

    checkExistingAuth()
  }, [navigate])

  const handleLogin = () => {
    setIsLoading(true)
    api.login(inviteToken)
  }

  const handleSignup = () => {
    setIsLoading(true)
    api.signup(inviteToken)
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Checking authentication...
              </h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-primary-600">Kuuza AI</h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {inviteToken ? 'Accept Invitation' : 'Welcome to Kuuza AI'}
        </h2>
        {inviteToken && (
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join a company. Sign in or create an account to continue.
          </p>
        )}
        {!inviteToken && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your account or create a new one to get started.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Auth Error Alert */}
          {authError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Authentication failed. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redirecting...' : 'Sign In'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redirecting...' : 'Create New Account'}
            </button>
          </div>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-primary-600"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          {inviteToken && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Invitation Link Detected
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      You're using an invitation link. After signing in, you'll automatically be added to the company.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
