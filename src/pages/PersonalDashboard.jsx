import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import {
  Play, Clock, Flame, Trophy, TrendingUp, ArrowRight,
  CheckCircle2, Target, Award, TrendingDown, Minus, Sparkles, Loader2
} from 'lucide-react'

/**
 * PersonalDashboard Component
 *
 * Dashboard for personal workspace users (B2C focus).
 * Features:
 * - Personalized greeting with time-awareness
 * - Key metrics (streak, completed scenarios, average score)
 * - Recent practice sessions
 * - Recommended scenarios based on performance
 */
const PersonalDashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [loading, setLoading] = useState(true)

  // Data state
  const [scenarios, setScenarios] = useState([])
  const [defaultScenarios, setDefaultScenarios] = useState([])
  const [sessionStats, setSessionStats] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // For personal workspace, only load default scenarios (no workspace-scoped scenarios)
        const [userData, defaultScenariosData, statsData] = await Promise.all([
          api.getCurrentUser(),
          api.getDefaultScenarios(1, 50).catch(() => ({ scenarios: [] })),
          api.getSessionStatistics(currentWorkspace?.id).catch(() => null)
        ])

        setCurrentUser(userData)
        // Use default scenarios for both lists in personal workspace
        const defaultList = Array.isArray(defaultScenariosData?.scenarios) ? defaultScenariosData.scenarios : []
        setScenarios(defaultList)
        setDefaultScenarios(defaultList)
        setSessionStats(statsData)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Get recommended scenarios based on performance
  const getRecommendedScenarios = () => {
    const allScenarios = [...scenarios, ...defaultScenarios]
    const recommended = []

    // If we have performance data, recommend based on weak areas
    if (sessionStats?.performance_trends?.by_scenario) {
      const weakScenarios = sessionStats.performance_trends.by_scenario
        .filter(s => s.trend === 'declining' || s.average_score < 70)
        .sort((a, b) => a.average_score - b.average_score)
        .slice(0, 2)

      for (const weak of weakScenarios) {
        const scenario = allScenarios.find(s => s.id === weak.scenario_id)
        if (scenario) {
          recommended.push({
            ...scenario,
            reason: `Score: ${Math.round(weak.average_score)}% - needs practice`,
            proficiency: weak.average_score
          })
        }
      }
    }

    // Fill remaining slots with untried scenarios
    const triedIds = new Set(sessionStats?.performance_trends?.by_scenario?.map(s => s.scenario_id) || [])
    const untried = allScenarios.filter(s => !triedIds.has(s.id)).slice(0, 3 - recommended.length)
    for (const scenario of untried) {
      recommended.push({
        ...scenario,
        reason: 'New scenario to try',
        proficiency: null
      })
    }

    return recommended.slice(0, 3)
  }

  // Get recent completed sessions
  const getRecentSessions = () => {
    if (!sessionStats?.recent_sessions) return []
    return sessionStats.recent_sessions
      .filter(s => s.session_status === 'completed')
      .slice(0, 3)
  }

  const handleStartTraining = (scenarioId) => {
    navigate(`/training/${scenarioId}`)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advanced': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className={`w-10 h-10 animate-spin mx-auto mb-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={theme.text.secondary}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const allScenarios = [...scenarios, ...defaultScenarios]
  const recommendedScenarios = getRecommendedScenarios()
  const recentSessions = getRecentSessions()

  return (
    <div className={`p-6 min-h-screen ${theme.bg.primary}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className={`relative overflow-hidden rounded-2xl p-8 ${theme.isDark
          ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900/50'
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
          } border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="relative z-10">
            <h1 className={`text-3xl font-bold ${theme.text.primary} mb-2`}>
              {getGreeting()}, {currentUser?.first_name || 'there'}!
            </h1>
            <p className={`text-lg ${theme.text.secondary} mb-6`}>
              Ready to sharpen your skills today?
            </p>
            <button
              onClick={() => navigate('/training')}
              className={`${theme.isDark
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:scale-105`}
            >
              <Play className="w-5 h-5" />
              <span>Start New Practice</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weekly Streak */}
          <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                <Flame className={`w-6 h-6 ${theme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Weekly Streak</p>
                <p className={`text-2xl font-bold ${theme.text.primary}`}>
                  {sessionStats?.streak_days || 0} Days
                </p>
              </div>
            </div>
          </div>

          {/* Scenarios Completed */}
          <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CheckCircle2 className={`w-6 h-6 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Scenarios Completed</p>
                <p className={`text-2xl font-bold ${theme.text.primary}`}>
                  {sessionStats?.completed_sessions || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <TrendingUp className={`w-6 h-6 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Average Score</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-bold ${theme.text.primary}`}>
                    {sessionStats?.average_score ? `${Math.round(sessionStats.average_score)}%` : 'N/A'}
                  </p>
                  {sessionStats?.score_trend && (
                    <span className={`text-sm font-medium ${sessionStats.score_trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {sessionStats.score_trend > 0 ? '+' : ''}{sessionStats.score_trend}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Practice Sessions */}
            <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}">
                <h2 className={`text-xl font-bold ${theme.text.primary}`}>Recent Practice Sessions</h2>
              </div>

              {recentSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <Target className={`w-12 h-12 mx-auto mb-4 ${theme.text.muted}`} />
                  <p className={`${theme.text.secondary} mb-4`}>No practice sessions yet.</p>
                  <button
                    onClick={() => navigate('/training')}
                    className={`${theme.isDark ? 'text-blue-400' : 'text-blue-600'} font-medium hover:underline`}
                  >
                    Start your first scenario →
                  </button>
                </div>
              ) : (
                <div className={`divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                  {recentSessions.map((session) => {
                    const scenario = allScenarios.find(s => s.id === session.scenario_id)
                    const score = session.overall_score || session.score || 0
                    return (
                      <div
                        key={session.id}
                        onClick={() => navigate(`/session/${session.id}/feedback`)}
                        className={`p-4 flex items-center justify-between cursor-pointer ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreBgColor(score)}`}>
                            <CheckCircle2 className={`w-5 h-5 ${getScoreColor(score)}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${theme.text.primary}`}>
                              {scenario?.name || 'Training Session'}
                            </p>
                            <p className={`text-sm ${theme.text.muted}`}>
                              {formatRelativeTime(session.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                            {score}%
                          </span>
                          <ArrowRight className={`w-5 h-5 ${theme.text.muted}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recommended Scenarios - Right Column (1/3) */}
          <div className="space-y-6">
            <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}">
                <div className="flex items-center space-x-2">
                  <Sparkles className={`w-5 h-5 ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <h2 className={`text-xl font-bold ${theme.text.primary}`}>Recommended for You</h2>
                </div>
                <p className={`text-sm ${theme.text.muted} mt-1`}>Based on your recent performance</p>
              </div>

              <div className={`divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                {recommendedScenarios.map((scenario) => (
                  <div key={scenario.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${theme.text.primary} truncate`}>{scenario.name}</h3>
                        <p className={`text-xs ${theme.text.muted} mt-1`}>{scenario.reason}</p>
                      </div>
                      {scenario.difficulty_level && (
                        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyColor(scenario.difficulty_level)}`}>
                          {scenario.difficulty_level}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartTraining(scenario.id)}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors
                        ${theme.isDark
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                    >
                      Start Practice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalDashboard

