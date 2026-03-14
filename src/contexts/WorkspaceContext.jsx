import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '../utils/api'

/**
 * WorkspaceContext
 *
 * Manages workspace state for the application:
 * - Current workspace ID and data
 * - List of available workspaces
 * - Workspace switching functionality
 * - Multi-account token management
 *
 * Architecture:
 * - Stores current workspace ID in localStorage
 * - Supports multi-account by storing tokens per email
 * - Provides workspace switcher data with UI hints
 * - Only fetches data when user is authenticated
 */

const WorkspaceContext = createContext(null)

// localStorage keys
const STORAGE_KEYS = {
  CURRENT_WORKSPACE: 'kuuza_current_workspace_id',
  ACCOUNT_TOKENS: 'kuuza_account_tokens', // { email: sessionCookie }
}

export function WorkspaceProvider({ children }) {
  // State
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE) || null
  })
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const [workspaces, setWorkspaces] = useState({
    personal: [],
    organization: [],
    total: 0
  })
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * Fetch workspace switcher data from API
   * Only fetches if user is authenticated - silently fails on 401
   */
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await api.getWorkspaceSwitcherData()

      // If we got here, user is authenticated
      setIsAuthenticated(true)

      setWorkspaces({
        personal: data.personal_workspaces || [],
        organization: data.organization_workspaces || [],
        total: data.total_workspaces || 0
      })
      setSuggestion(data.suggestion)
      setUserEmail(data.user_email)

      // Auto-select workspace if none selected
      if (!currentWorkspaceId && data.total_workspaces > 0) {
        const allWorkspaces = [
          ...(data.personal_workspaces || []),
          ...(data.organization_workspaces || [])
        ]
        if (allWorkspaces.length > 0) {
          await switchWorkspace(allWorkspaces[0].id)
        }
      } else if (currentWorkspaceId) {
        // Fetch current workspace details
        await fetchCurrentWorkspaceDetails(currentWorkspaceId)
      }
    } catch (err) {
      // Handle 401 Unauthorized silently - user is not logged in
      if (err instanceof ApiError && err.status === 401) {
        setIsAuthenticated(false)
        // Don't set error - this is expected for unauthenticated users
        return
      }
      console.error('Failed to fetch workspaces:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentWorkspaceId])

  /**
   * Fetch detailed info for current workspace
   */
  const fetchCurrentWorkspaceDetails = async (workspaceId) => {
    try {
      const details = await api.getWorkspace(workspaceId)
      setCurrentWorkspace(details)
    } catch (err) {
      console.error('Failed to fetch workspace details:', err)
      // Workspace might not exist anymore, clear selection
      localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKSPACE)
      setCurrentWorkspaceId(null)
      setCurrentWorkspace(null)
    }
  }

  /**
   * Switch to a different workspace
   */
  const switchWorkspace = useCallback(async (workspaceId) => {
    try {
      setLoading(true)
      localStorage.setItem(STORAGE_KEYS.CURRENT_WORKSPACE, workspaceId)
      setCurrentWorkspaceId(workspaceId)
      await fetchCurrentWorkspaceDetails(workspaceId)
      return true
    } catch (err) {
      console.error('Failed to switch workspace:', err)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new personal workspace
   */
  const createPersonalWorkspace = async (name = null) => {
    try {
      const workspace = await api.createPersonalWorkspace(name)
      await fetchWorkspaces() // Refresh list
      await switchWorkspace(workspace.id)
      return workspace
    } catch (err) {
      console.error('Failed to create personal workspace:', err)
      throw err
    }
  }

  /**
   * Clear workspace selection (for logout)
   */
  const clearWorkspace = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKSPACE)
    setCurrentWorkspaceId(null)
    setCurrentWorkspace(null)
    setWorkspaces({ personal: [], organization: [], total: 0 })
    setIsAuthenticated(false)
    setUserEmail(null)
  }

  // NOTE: We intentionally do NOT auto-fetch on mount.
  // This prevents 401 errors on public pages (landing, login, etc.)
  // Authenticated layouts (TraineeLayout, OrgLayout) should call
  // refreshWorkspaces() when they mount.

  /**
   * Get the current user's role in the current workspace.
   * Returns the role from the workspace switcher data (which includes role per workspace).
   */
  const getCurrentRole = () => {
    if (!currentWorkspaceId) return null

    // Find the workspace in our lists to get the role
    const allWs = [...workspaces.personal, ...workspaces.organization]
    const ws = allWs.find(w => w.id === currentWorkspaceId)
    return ws?.role || null
  }

  /**
   * Check if current user is admin or owner in current workspace.
   */
  const isAdminOrOwner = () => {
    const role = getCurrentRole()
    return role && ['owner', 'admin'].includes(role.toLowerCase())
  }

  // Context value
  const value = {
    // Auth state
    isAuthenticated,

    // Current workspace
    currentWorkspaceId,
    currentWorkspace,
    currentRole: getCurrentRole(),
    isAdminOrOwner: isAdminOrOwner(),
    userEmail,

    // Workspace lists
    workspaces,
    allWorkspaces: [...workspaces.personal, ...workspaces.organization],
    hasPersonalWorkspace: workspaces.personal.length > 0,
    hasOrganizationWorkspace: workspaces.organization.length > 0,

    // UI suggestion
    suggestion,

    // State
    loading,
    error,

    // Actions
    switchWorkspace,
    createPersonalWorkspace,
    refreshWorkspaces: fetchWorkspaces,
    clearWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

export default WorkspaceContext

