import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import UserProfileMenu from './UserProfileMenu'

/**
 * AppShell Component
 * 
 * Unified application shell with:
 * - Collapsible sidebar (240px expanded, 64px collapsed)
 * - Workspace switcher
 * - Context-aware navigation
 * - User profile menu
 * 
 * Props:
 * - navItems: Array of { icon, label, path } for navigation
 * - logoIcon: React component for logo icon
 * - sectionLabel: Optional section label for nav (e.g., "MANAGEMENT")
 */
const AppShell = ({ navItems = [], logoIcon: LogoIcon, sectionLabel }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshWorkspaces } = useWorkspace()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getCurrentUser()
        setCurrentUser(userData)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    fetchUser()
    refreshWorkspaces()
  }, [])

  const isActive = (path) => location.pathname === path

  // Sidebar width classes
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-60'

  return (
    <div className={`min-h-screen flex ${theme.isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`${sidebarWidth} ${theme.isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'} 
        border-r transition-all duration-300 flex flex-col fixed h-screen z-40`}>
        
        {/* Logo Section */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} 
          border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
              ${theme.isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
              {LogoIcon ? (
                <LogoIcon className="w-5 h-5 text-white" />
              ) : (
                <span className="text-white font-bold text-sm">K</span>
              )}
            </div>
            {!isCollapsed && (
              <span className={`text-lg font-bold ${theme.text.primary}`}>Kuuza</span>
            )}
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className={`${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'} border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <WorkspaceSwitcher collapsed={isCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sectionLabel && !isCollapsed && (
            <div className={`px-4 mb-3 text-[11px] font-semibold uppercase tracking-wider ${theme.text.muted}`}>
              {sectionLabel}
            </div>
          )}
          <div className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} 
                    ${isCollapsed ? 'px-2' : 'px-3'} py-2.5 rounded-lg transition-all text-sm
                    ${active
                      ? theme.isDark 
                        ? 'bg-blue-500/15 text-blue-400 font-medium' 
                        : 'bg-blue-50 text-blue-600 font-medium'
                      : `${theme.text.secondary} ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? '' : ''}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className={`${isCollapsed ? 'px-2' : 'px-3'} py-2 border-t ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} 
              px-3 py-2 rounded-lg ${theme.text.muted} 
              ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors text-sm`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className={`${isCollapsed ? 'px-2 py-3' : 'px-3 py-4'} border-t ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <UserProfileMenu user={currentUser} collapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isCollapsed ? 'ml-16' : 'ml-60'} transition-all duration-300 min-h-screen`}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell

