import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import { api } from '../utils/api'

/**
 * AuthCallback Component
 *
 * Handles post-authentication routing based on workspace membership.
 *
 * Workspace-Centric Routing Logic:
 * 1. Fetch user's workspace data
 * 2. If user has workspaces -> /dashboard
 * 3. If user has no workspaces -> /onboarding/workspace-select
 * 4. Handle invitation tokens if present
 */
const AuthCallback = () => {
  const { user, loading, isAuthenticated, refetch } = useAuth()
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const theme = useTheme()

  useEffect(() => {
    const handlePostAuth = async () => {
      if (loading) return

      if (!isAuthenticated) {
        navigate('/login', { replace: true })
        return
      }

      try {
        setProcessing(true)

        // Check for invitation token in URL (from invitation flow)
        const invitationToken = searchParams.get('invitation_token')
        if (invitationToken) {
          try {
            await api.acceptWorkspaceInvitation(invitationToken)
            console.log('Invitation accepted successfully')
          } catch (inviteErr) {
            console.error('Failed to accept invitation:', inviteErr)
            // Continue with normal flow even if invitation fails
          }
        }

        // Fetch workspace data to determine routing
        const workspaceData = await api.getWorkspaceSwitcherData()

        if (workspaceData.total_workspaces === 0) {
          // New user with no workspaces - send to workspace selection
          navigate('/onboarding/workspace-select', { replace: true })
        } else if (workspaceData.organization_workspaces.length > 0) {
          // User has organization workspace - go to org dashboard
          // Set the first org workspace as current
          const orgWorkspace = workspaceData.organization_workspaces[0]
          localStorage.setItem('kuuza_current_workspace_id', orgWorkspace.id)

          if (orgWorkspace.role === 'owner' || orgWorkspace.role === 'admin') {
            navigate('/org/dashboard', { replace: true })
          } else {
            navigate('/dashboard', { replace: true })
          }
        } else if (workspaceData.personal_workspaces.length > 0) {
          // User has personal workspace only
          const personalWorkspace = workspaceData.personal_workspaces[0]
          localStorage.setItem('kuuza_current_workspace_id', personalWorkspace.id)
          navigate('/dashboard', { replace: true })
        } else {
          // Fallback to workspace selection
          navigate('/onboarding/workspace-select', { replace: true })
        }
      } catch (err) {
        console.error('Error in post-auth routing:', err)
        setError('Failed to set up your workspace. Please try again.')
      } finally {
        setProcessing(false)
      }
    }

    handlePostAuth()
  }, [user, loading, isAuthenticated, navigate, searchParams])

  // Show loading state while processing
  return (
    <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}>
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className={`${theme.text.primary} mb-4`}>{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.isDark ? 'border-cyan-400' : 'border-blue-600'} mx-auto`}></div>
            <p className={`mt-4 ${theme.text.secondary}`}>
              Setting up your workspace...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback

