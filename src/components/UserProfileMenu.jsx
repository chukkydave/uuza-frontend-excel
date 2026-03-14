import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import {
  User,
  Settings,
  CreditCard,
  Users,
  Building2,
  LogOut,
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react'

/**
 * UserProfileMenu Component
 * 
 * Context-aware user profile dropdown with role-based menu items.
 * Shows different options based on workspace type and user role.
 */
const UserProfileMenu = ({ user, collapsed = false }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
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

  const handleLogout = () => {
    api.logout()
  }

  // Determine workspace type and user role
  const isOrgWorkspace = currentWorkspace?.type === 'organization'
  const userRole = currentWorkspace?.role || 'member'
  const isAdminOrOwner = ['owner', 'admin'].includes(userRole.toLowerCase())

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user?.first_name) {
      return user.first_name[0].toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  // Build menu items based on context
  const getMenuItems = () => {
    const items = []

    if (isOrgWorkspace && isAdminOrOwner) {
      items.push(
        { icon: Building2, label: 'Organization Settings', path: '/org/settings', divider: false },
        { icon: Users, label: 'Team Management', path: '/org/team', divider: false },
        { icon: CreditCard, label: 'Billing', path: '/org/billing', divider: true }
      )
    }

    items.push(
      { icon: Settings, label: 'My Settings', path: '/settings', divider: false }
    )

    if (!isOrgWorkspace) {
      items.push(
        { icon: CreditCard, label: 'Billing', path: '/billing', divider: false }
      )
    }

    return items
  }

  const menuItems = getMenuItems()

  // Collapsed view (just avatar)
  if (collapsed) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center
          ${theme.isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'}
          text-white font-semibold text-sm hover:opacity-90 transition-opacity`}
        title={user?.email || 'Profile'}
      >
        {getInitials()}
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg
          ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}
          transition-colors`}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
          ${theme.isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'}
          text-white font-semibold text-sm`}
        >
          {getInitials()}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-medium ${theme.text.primary} truncate`}>
            {user?.first_name || 'User'}
          </p>
          <p className={`text-xs ${theme.text.muted} truncate`}>
            {user?.email || ''}
          </p>
        </div>

        <ChevronDown className={`w-4 h-4 ${theme.text.muted} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 w-full min-w-[200px]
          ${theme.isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'}
          border rounded-lg shadow-lg py-1 z-50`}
        >
          {/* Theme Toggle */}
          <button
            onClick={() => theme.toggleTheme()}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm
              ${theme.text.secondary} ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}
              transition-colors`}
          >
            {theme.isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme.isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className={`border-t ${theme.isDark ? 'border-white/10' : 'border-gray-100'} my-1`} />

          {/* Dynamic Menu Items */}
          {menuItems.map((item, index) => (
            <div key={item.path}>
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate(item.path)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm
                  ${theme.text.secondary} ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}
                  transition-colors`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
              {item.divider && (
                <div className={`border-t ${theme.isDark ? 'border-white/10' : 'border-gray-100'} my-1`} />
              )}
            </div>
          ))}

          <div className={`border-t ${theme.isDark ? 'border-white/10' : 'border-gray-100'} my-1`} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm
              text-red-500 ${theme.isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}
              transition-colors`}
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default UserProfileMenu

