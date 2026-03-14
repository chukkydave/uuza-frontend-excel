import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import { api } from '../utils/api'
import { CheckCircle, XCircle, Loader2, Mail, LogIn, AlertTriangle } from 'lucide-react'

/**
 * AcceptInvitation Page
 * 
 * Handles workspace invitation acceptance flow.
 * URL format: /accept-invite?token=XYZ&email=john@acme.com
 * 
 * Flow:
 * 1. If user is logged in:
 *    - Attempt to accept the invitation
 *    - If email mismatch, show error with option to switch accounts
 * 2. If user is not logged in:
 *    - Redirect to login with invitation token preserved
 */
const AcceptInvitation = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  
  const [status, setStatus] = useState('loading') // loading | success | error | email_mismatch | not_logged_in
  const [error, setError] = useState(null)
  const [workspaceName, setWorkspaceName] = useState(null)
  
  const token = searchParams.get('token')
  const invitedEmail = searchParams.get('email')

  useEffect(() => {
    const handleInvitation = async () => {
      if (authLoading) return
      
      if (!token) {
        setStatus('error')
        setError('Invalid invitation link. No token provided.')
        return
      }

      if (!isAuthenticated) {
        setStatus('not_logged_in')
        return
      }

      // Check email match
      if (invitedEmail && user?.email && user.email.toLowerCase() !== invitedEmail.toLowerCase()) {
        setStatus('email_mismatch')
        return
      }

      // Attempt to accept invitation
      try {
        setStatus('loading')
        const result = await api.acceptWorkspaceInvitation(token)
        setWorkspaceName(result.workspace_name || 'the workspace')
        setStatus('success')
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 2000)
      } catch (err) {
        console.error('Failed to accept invitation:', err)
        setStatus('error')
        
        // Parse error message
        if (err.message?.includes('expired')) {
          setError('This invitation has expired. Please request a new one.')
        } else if (err.message?.includes('already')) {
          setError('You are already a member of this workspace.')
        } else if (err.message?.includes('not found')) {
          setError('This invitation is no longer valid.')
        } else {
          setError(err.message || 'Failed to accept invitation. Please try again.')
        }
      }
    }

    handleInvitation()
  }, [token, invitedEmail, user, authLoading, isAuthenticated, navigate])

  const handleLogin = () => {
    // Preserve invitation params through login flow
    const loginUrl = `/login?invitation_token=${encodeURIComponent(token)}${invitedEmail ? `&hint_email=${encodeURIComponent(invitedEmail)}` : ''}`
    navigate(loginUrl)
  }

  const handleSwitchAccount = () => {
    // Logout and redirect to login with invitation
    api.logout()
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className={`w-16 h-16 mx-auto animate-spin ${theme.isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <h2 className={`mt-6 text-2xl font-bold ${theme.text.primary}`}>
              Accepting Invitation...
            </h2>
            <p className={`mt-2 ${theme.text.secondary}`}>
              Please wait while we set up your access.
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className={`mt-6 text-2xl font-bold ${theme.text.primary}`}>
              Welcome to {workspaceName}!
            </h2>
            <p className={`mt-2 ${theme.text.secondary}`}>
              You've successfully joined the workspace. Redirecting to dashboard...
            </p>
          </div>
        )

      case 'email_mismatch':
        return (
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-amber-500" />
            <h2 className={`mt-6 text-2xl font-bold ${theme.text.primary}`}>
              Wrong Account
            </h2>
            <p className={`mt-2 ${theme.text.secondary}`}>
              This invitation is for <strong className={theme.text.primary}>{invitedEmail}</strong>,
              but you're logged in as <strong className={theme.text.primary}>{user?.email}</strong>.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleSwitchAccount}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Switch Account</span>
              </button>
              <Link to="/dashboard" className="block w-full btn-secondary text-center">
                Continue to Dashboard
              </Link>
            </div>
          </div>
        )

      case 'not_logged_in':
        return (
          <div className="text-center">
            <Mail className={`w-16 h-16 mx-auto ${theme.isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <h2 className={`mt-6 text-2xl font-bold ${theme.text.primary}`}>
              You've Been Invited!
            </h2>
            <p className={`mt-2 ${theme.text.secondary}`}>
              {invitedEmail 
                ? `Sign in with ${invitedEmail} to accept this invitation.`
                : 'Sign in to accept this workspace invitation.'}
            </p>
            <button
              onClick={handleLogin}
              className="mt-6 w-full btn-primary flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Accept</span>
            </button>
          </div>
        )

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <h2 className={`mt-6 text-2xl font-bold ${theme.text.primary}`}>
              Invitation Error
            </h2>
            <p className={`mt-2 ${theme.text.secondary}`}>{error}</p>
            <div className="mt-6 space-y-3">
              <Link to="/dashboard" className="block w-full btn-primary text-center">
                Go to Dashboard
              </Link>
              <Link to="/" className="block w-full btn-secondary text-center">
                Back to Home
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center px-4`}>
      <div className={`max-w-md w-full ${theme.bg.card} rounded-2xl p-8 shadow-xl`}>
        {renderContent()}
      </div>
    </div>
  )
}

export default AcceptInvitation

