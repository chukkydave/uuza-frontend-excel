import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { api } from '../../utils/api'
import { User, Building2, ArrowRight, Loader2 } from 'lucide-react'

/**
 * WorkspaceDiscovery Page
 *
 * Shown to new users after authentication to choose their workspace type.
 * Connects to the workspace API to create personal or organization workspaces.
 */
const WorkspaceDiscovery = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { refreshWorkspaces } = useWorkspace()
  const [loading, setLoading] = useState(null) // 'personal' | 'organization' | null
  const [error, setError] = useState(null)

  const handleCreatePersonalWorkspace = async () => {
    setLoading('personal')
    setError(null)
    try {
      // Initialize personal workspace for new user
      // Uses POST /workspaces/initialize endpoint
      const workspace = await api.initializeWorkspace('personal')
      console.log('Initialized personal workspace:', workspace)

      // Store workspace ID and refresh context
      localStorage.setItem('kuuza_current_workspace_id', workspace.id)
      await refreshWorkspaces()

      // Navigate to personal setup wizard
      navigate('/onboarding/personal-wizard')
    } catch (err) {
      console.error('Failed to initialize personal workspace:', err)

      // Handle specific error cases
      if (err.message?.includes('already has active workspaces')) {
        // User already has workspaces - redirect to dashboard
        await refreshWorkspaces()
        navigate('/dashboard')
        return
      }

      setError(err.message || 'Failed to create workspace. Please try again.')
      setLoading(null)
    }
  }

  const handleCreateOrganizationWorkspace = () => {
    setLoading('organization')
    // Navigate to organization setup flow (creates company + workspace)
    navigate('/org/setup')
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}>
      {/* Centered Container */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold ${theme.text.gradient}`}>
              Kuuza AI
            </h2>
          </div>

          {/* Header */}
          <h1 className={`text-3xl md:text-4xl font-bold text-center mb-4 ${theme.text.primary}`}>
            Welcome to Kuuza!
          </h1>
          <p className={`text-lg text-center mb-12 ${theme.text.secondary}`}>
            How will you be training today?
          </p>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Card A - Personal / B2C */}
            <div
              className={`${theme.bg.card} rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group ${loading === 'personal' ? 'ring-2 ring-blue-500' : ''
                }`}
              onClick={!loading ? handleCreatePersonalWorkspace : undefined}
            >
              <div className={`w-16 h-16 rounded-2xl ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <User className={`w-8 h-8 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>

              <h3 className={`text-2xl font-bold mb-3 ${theme.text.primary}`}>
                For Myself
              </h3>

              <p className={`${theme.text.secondary} mb-8 leading-relaxed`}>
                Practice presentations, interviews, or sales pitches privately.
                Perfect for personal development and skill building.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!loading) handleCreatePersonalWorkspace()
                }}
                disabled={loading !== null}
                className={`w-full ${theme.button.primary} font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === 'personal' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Personal Workspace</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Card B - Organization / B2B */}
            <div
              className={`${theme.bg.card} rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group ${loading === 'organization' ? 'ring-2 ring-purple-500' : ''
                }`}
              onClick={!loading ? handleCreateOrganizationWorkspace : undefined}
            >
              <div className={`w-16 h-16 rounded-2xl ${theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Building2 className={`w-8 h-8 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>

              <h3 className={`text-2xl font-bold mb-3 ${theme.text.primary}`}>
                For My Team
              </h3>

              <p className={`${theme.text.secondary} mb-8 leading-relaxed`}>
                Create training simulations for your employees and track
                performance across your organization.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!loading) handleCreateOrganizationWorkspace()
                }}
                disabled={loading !== null}
                className={`w-full ${theme.button.secondary} font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === 'organization' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  <>
                    <span>Create Organization Workspace</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Footer */}
          <p className={`text-center ${theme.text.muted} text-sm`}>
            Joining an existing team? Check your email for an invite link.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WorkspaceDiscovery

