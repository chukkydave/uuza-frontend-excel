import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { api } from '../../utils/api'
import {
  Building2, User, ChevronDown, AlertTriangle, Trophy,
  TrendingUp, TrendingDown, Users, Target, Clock, LogOut,
  Bell, Settings, BarChart3, Award, Minus
} from 'lucide-react'

// Mock workspace data - will be replaced with real context
const WORKSPACES = [
  { id: 'personal', name: 'Personal Workspace', type: 'personal' },
  { id: 'acme', name: 'Acme Corporation', type: 'organization' }
]

// Mock data
const MOCK_TEAM_STATS = {
  readinessScore: 78,
  totalMembers: 24,
  activeThisWeek: 18,
  avgSessionsPerMember: 3.2
}

const MOCK_SKILL_GAPS = [
  { skill: 'Negotiation', score: 62, trend: 'improving' },
  { skill: 'Empathy', score: 58, trend: 'declining' },
  { skill: 'Crisis Communication', score: 71, trend: 'stable' },
  { skill: 'Active Listening', score: 68, trend: 'improving' },
  { skill: 'Closing', score: 75, trend: 'stable' }
]

const MOCK_ALERTS = [
  { id: 1, type: 'warning', message: '3 members haven\'t trained this week', action: 'Send Reminder' },
  { id: 2, type: 'info', message: 'New training module available', action: 'Review' },
  { id: 3, type: 'success', message: 'Team completed Q4 certification', action: 'View Report' }
]

const MOCK_TOP_PERFORMERS = [
  { id: 1, name: 'Sarah Chen', score: 94, sessionsCompleted: 12, trend: 'up' },
  { id: 2, name: 'Michael Ross', score: 91, sessionsCompleted: 10, trend: 'up' },
  { id: 3, name: 'Emily Park', score: 88, sessionsCompleted: 9, trend: 'stable' },
  { id: 4, name: 'James Wilson', score: 85, sessionsCompleted: 11, trend: 'up' },
  { id: 5, name: 'Lisa Johnson', score: 83, sessionsCompleted: 8, trend: 'down' }
]

const OrganizationDashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [currentWorkspace, setCurrentWorkspace] = useState(WORKSPACES[1]) // Default to org
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false)
  const [loading, setLoading] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.workspace-switcher')) {
        setShowWorkspaceSwitcher(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleWorkspaceChange = async (workspace) => {
    setLoading(true)
    setCurrentWorkspace(workspace)
    setShowWorkspaceSwitcher(false)

    // Mock loading delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (workspace.type === 'personal') {
      navigate('/dashboard')
    } else {
      setLoading(false)
      // TODO: Refresh org dashboard data
      console.log('Switching to workspace:', workspace.name)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return theme.isDark ? 'text-green-400' : 'text-green-600'
    if (score >= 60) return theme.isDark ? 'text-yellow-400' : 'text-yellow-600'
    return theme.isDark ? 'text-red-400' : 'text-red-600'
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining':
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getAlertStyle = (type) => {
    switch (type) {
      case 'warning':
        return theme.isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
      case 'success':
        return theme.isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
      default:
        return theme.isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${theme.bg.nav} border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Workspace Switcher */}
            <div className="relative workspace-switcher">
              <button
                onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors`}
              >
                <div className={`w-8 h-8 rounded-lg ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                  {currentWorkspace.type === 'personal' ? (
                    <User className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  ) : (
                    <Building2 className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  )}
                </div>
                <span className={`font-medium ${theme.text.primary}`}>{currentWorkspace.name}</span>
                <ChevronDown className={`w-4 h-4 ${theme.text.secondary}`} />
              </button>

              {/* Workspace Dropdown */}
              {showWorkspaceSwitcher && (
                <div className={`absolute top-full left-0 mt-2 w-64 ${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} shadow-lg py-2 z-50`}>
                  <div className={`px-3 py-2 text-xs font-medium uppercase ${theme.text.muted}`}>
                    Switch Workspace
                  </div>
                  {WORKSPACES.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceChange(workspace)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors ${currentWorkspace.id === workspace.id ? theme.isDark ? 'bg-white/10' : 'bg-blue-50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${workspace.type === 'personal' ? theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100' : theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                        {workspace.type === 'personal' ? (
                          <User className={`w-4 h-4 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        ) : (
                          <Building2 className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        )}
                      </div>
                      <span className={`${theme.text.primary}`}>{workspace.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
              <button className={`p-2 rounded-lg ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors`}>
                <Bell className={`w-5 h-5 ${theme.text.secondary}`} />
              </button>
              <button className={`p-2 rounded-lg ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors`}>
                <Settings className={`w-5 h-5 ${theme.text.secondary}`} />
              </button>
              <button
                onClick={() => api.logout()}
                className={`p-2 rounded-lg ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} transition-colors`}
                title="Logout"
              >
                <LogOut className={`w-5 h-5 ${theme.text.secondary}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className={`${theme.bg.card} p-6 rounded-xl`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-3 ${theme.text.secondary}`}>Switching workspace...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text.primary} mb-2`}>Organization Dashboard</h1>
          <p className={`text-lg ${theme.text.secondary}`}>
            Monitor team performance and manage training across your organization
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <Users className={`w-6 h-6 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${theme.text.primary}`}>{MOCK_TEAM_STATS.totalMembers}</p>
            <p className={`text-sm ${theme.text.secondary}`}>Team Members</p>
          </div>
          <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <Target className={`w-6 h-6 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${theme.text.primary}`}>{MOCK_TEAM_STATS.activeThisWeek}</p>
            <p className={`text-sm ${theme.text.secondary}`}>Active This Week</p>
          </div>
          <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className={`w-6 h-6 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${theme.text.primary}`}>{MOCK_TEAM_STATS.avgSessionsPerMember}</p>
            <p className={`text-sm ${theme.text.secondary}`}>Avg Sessions/Member</p>
          </div>
          <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <Clock className={`w-6 h-6 ${theme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${theme.text.primary}`}>42m</p>
            <p className={`text-sm ${theme.text.secondary}`}>Avg Training Time</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Performance */}
          <div className="space-y-6">
            {/* Team Readiness Score */}
            <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-6`}>Team Readiness Score</h3>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={theme.isDark ? '#374151' : '#e5e7eb'}
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={MOCK_TEAM_STATS.readinessScore >= 70 ? '#22c55e' : MOCK_TEAM_STATS.readinessScore >= 50 ? '#eab308' : '#ef4444'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(MOCK_TEAM_STATS.readinessScore / 100) * 440} 440`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl font-bold ${getScoreColor(MOCK_TEAM_STATS.readinessScore)}`}>
                      {MOCK_TEAM_STATS.readinessScore}%
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-center mt-4 ${theme.text.secondary}`}>
                Your team is performing above average
              </p>
            </div>

            {/* Skill Gaps */}
            <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-6`}>Skill Gaps</h3>
              <div className="space-y-4">
                {MOCK_SKILL_GAPS.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${theme.text.primary}`}>{skill.skill}</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(skill.trend)}
                          <span className={`text-sm font-medium ${getScoreColor(skill.score)}`}>{skill.score}%</span>
                        </div>
                      </div>
                      <div className={`h-2 rounded-full ${theme.isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full rounded-full ${skill.score >= 70 ? 'bg-green-500' : skill.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Alerts & Leaderboard */}
          <div className="space-y-6">
            {/* Needs Attention */}
            <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Needs Attention</h3>
                <AlertTriangle className={`w-5 h-5 ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <div className="space-y-3">
                {MOCK_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getAlertStyle(alert.type)}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${theme.text.primary}`}>{alert.message}</p>
                      <button className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">
                        {alert.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Top Performers</h3>
                <Trophy className={`w-5 h-5 ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <div className="space-y-3">
                {MOCK_TOP_PERFORMERS.map((performer, index) => (
                  <div
                    key={performer.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${theme.isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white' : index === 2 ? 'bg-orange-600 text-white' : theme.isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-medium ${theme.text.primary}`}>{performer.name}</p>
                        <p className={`text-xs ${theme.text.muted}`}>{performer.sessionsCompleted} sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(performer.trend)}
                      <span className={`font-bold ${getScoreColor(performer.score)}`}>{performer.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrganizationDashboard
