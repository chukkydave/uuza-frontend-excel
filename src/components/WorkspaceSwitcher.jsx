import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import {
  ChevronDown,
  Check,
  User,
  Building2,
  Plus,
  Loader2,
  Users,
  ChevronsUpDown
} from 'lucide-react'

/**
 * WorkspaceSwitcher Component
 *
 * Dropdown component for switching between workspaces.
 * Shows personal and organization workspaces grouped by type.
 * Includes context-aware suggestions (e.g., "Add Personal Account").
 */
const WorkspaceSwitcher = ({ collapsed = false }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const {
    isAuthenticated,
    currentWorkspaceId,
    currentWorkspace,
    workspaces,
    suggestion,
    loading,
    switchWorkspace,
  } = useWorkspace()

  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return null
  }

  const handleWorkspaceSwitch = async (workspaceId) => {
    if (workspaceId === currentWorkspaceId) {
      setIsOpen(false)
      return
    }

    setSwitching(workspaceId)
    const success = await switchWorkspace(workspaceId)
    setSwitching(null)

    if (success) {
      setIsOpen(false)
      // Navigate to appropriate dashboard based on workspace type
      const ws = [...workspaces.personal, ...workspaces.organization].find(w => w.id === workspaceId)
      if (ws?.type === 'organization') {
        navigate('/org/dashboard')
      } else {
        navigate('/dashboard')
      }
    }
  }

  const handleSuggestionClick = () => {
    if (suggestion?.redirect_url) {
      setIsOpen(false)
      window.location.href = suggestion.redirect_url
    }
  }

  // Get current workspace display name
  const currentName = currentWorkspace?.name || 'Select Workspace'
  const currentType = currentWorkspace?.type || 'personal'
  const isOrg = currentType === 'organization'

  // Collapsed view (just icon with tooltip)
  if (collapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center
            ${theme.isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}
            transition-colors`}
          title={currentName}
        >
          {loading ? (
            <Loader2 className={`w-5 h-5 animate-spin ${theme.text.muted}`} />
          ) : isOrg ? (
            <Building2 className={`w-5 h-5 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          ) : (
            <User className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          )}
        </button>

        {/* Collapsed Dropdown */}
        {isOpen && (
          <WorkspaceDropdown
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            switching={switching}
            suggestion={suggestion}
            onSwitch={handleWorkspaceSwitch}
            onSuggestionClick={handleSuggestionClick}
            theme={theme}
            position="right"
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
          ${theme.isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}
          transition-colors group`}
      >
        {/* Workspace Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${isOrg
            ? theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100'
            : theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}
        >
          {loading ? (
            <Loader2 className={`w-4 h-4 animate-spin ${theme.text.muted}`} />
          ) : isOrg ? (
            <Building2 className={`w-4 h-4 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          ) : (
            <User className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          )}
        </div>

        {/* Workspace Name */}
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-medium ${theme.text.primary} truncate`}>
            {loading ? 'Loading...' : currentName}
          </p>
          <p className={`text-xs ${theme.text.muted} truncate`}>
            {isOrg ? 'Organization' : 'Personal'}
          </p>
        </div>

        {/* Chevron */}
        <ChevronsUpDown className={`w-4 h-4 ${theme.text.muted} flex-shrink-0`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <WorkspaceDropdown
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
          switching={switching}
          suggestion={suggestion}
          onSwitch={handleWorkspaceSwitch}
          onSuggestionClick={handleSuggestionClick}
          theme={theme}
          position="bottom"
        />
      )}
    </div>
  )
}

/**
 * Workspace Dropdown Menu
 */
const WorkspaceDropdown = ({
  workspaces,
  currentWorkspaceId,
  switching,
  suggestion,
  onSwitch,
  onSuggestionClick,
  theme,
  position = 'bottom'
}) => {
  const positionClasses = position === 'right'
    ? 'left-full top-0 ml-2'
    : 'top-full left-0 mt-2'

  return (
    <div className={`absolute ${positionClasses} w-72
      ${theme.isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'}
      border rounded-xl shadow-xl py-2 z-50`}
    >
      {/* Empty State */}
      {workspaces.personal.length === 0 && workspaces.organization.length === 0 && (
        <div className={`px-4 py-6 text-center ${theme.text.muted}`}>
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No workspaces found</p>
        </div>
      )}

      {/* Personal Workspaces */}
      {workspaces.personal.length > 0 && (
        <>
          <div className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider ${theme.text.muted}`}>
            Personal
          </div>
          {workspaces.personal.map((ws) => (
            <WorkspaceItem
              key={ws.id}
              workspace={ws}
              isActive={ws.id === currentWorkspaceId}
              isSwitching={switching === ws.id}
              onClick={() => onSwitch(ws.id)}
              theme={theme}
            />
          ))}
        </>
      )}

      {/* Organization Workspaces */}
      {workspaces.organization.length > 0 && (
        <>
          {workspaces.personal.length > 0 && (
            <div className={`border-t ${theme.isDark ? 'border-white/10' : 'border-gray-100'} my-2`} />
          )}
          <div className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider ${theme.text.muted}`}>
            Organizations
          </div>
          {workspaces.organization.map((ws) => (
            <WorkspaceItem
              key={ws.id}
              workspace={ws}
              isActive={ws.id === currentWorkspaceId}
              isSwitching={switching === ws.id}
              onClick={() => onSwitch(ws.id)}
              theme={theme}
            />
          ))}
        </>
      )}

      {/* Context-Aware Suggestion */}
      {suggestion && (
        <>
          <div className={`border-t ${theme.isDark ? 'border-white/10' : 'border-gray-100'} my-2`} />
          <button
            onClick={onSuggestionClick}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm
              ${theme.isDark ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-blue-600 hover:bg-blue-50'}
              transition-colors`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
              ${theme.isDark ? 'bg-cyan-500/10' : 'bg-blue-50'}`}
            >
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-medium">{suggestion.label}</p>
              {suggestion.description && (
                <p className={`text-xs ${theme.text.muted}`}>{suggestion.description}</p>
              )}
            </div>
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Individual workspace item in the dropdown
 */
const WorkspaceItem = ({ workspace, isActive, isSwitching, onClick, theme }) => {
  const isOrg = workspace.type === 'organization'

  return (
    <button
      onClick={onClick}
      disabled={isSwitching}
      className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors
        ${isActive
          ? theme.isDark ? 'bg-blue-500/10' : 'bg-blue-50'
          : theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
        }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${isOrg
          ? theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100'
          : theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'
        }`}
      >
        {isOrg ? (
          <Building2 className={`w-4 h-4 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
        ) : (
          <User className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`font-medium truncate ${isActive
          ? theme.isDark ? 'text-blue-400' : 'text-blue-600'
          : theme.text.primary
          }`}>
          {workspace.name}
        </p>
        {workspace.company_name && (
          <p className={`text-xs ${theme.text.muted} truncate`}>{workspace.company_name}</p>
        )}
      </div>

      {/* Right side: member count + status */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {workspace.member_count > 1 && (
          <span className={`text-xs ${theme.text.muted} flex items-center`}>
            <Users className="w-3 h-3 mr-1" />
            {workspace.member_count}
          </span>
        )}
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : isActive ? (
          <Check className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        ) : null}
      </div>
    </button>
  )
}

export default WorkspaceSwitcher

