import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import {
  Trophy, TrendingUp, TrendingDown, Minus, Clock, Target,
  Loader2, BarChart3, Award, Zap
} from 'lucide-react'

const Results = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [currentWorkspace?.id])

  const loadStats = async () => {
    if (!currentWorkspace?.id) return
    try {
      setLoading(true)
      const data = await api.getSessionStatistics(currentWorkspace.id)
      setStats(data)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const trendIcon = (direction) => {
    if (direction === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (direction === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}>
        <Loader2 className={`w-8 h-8 ${theme.text.muted} animate-spin`} />
      </div>
    )
  }

  const hasData = stats && stats.total_sessions > 0

  return (
    <div className={`min-h-screen ${theme.bg.primary} p-6`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-2xl font-bold ${theme.text.primary}`}>Performance Results</h1>
          <p className={`${theme.text.secondary} mt-1`}>
            {hasData ? 'Track your progress and performance across training sessions' : 'Complete a training session to see your results here'}
          </p>
        </div>

        {/* Empty State */}
        {!hasData && (
          <div className={`${theme.bg.card} rounded-xl p-12 text-center`}>
            <Trophy className={`w-16 h-16 ${theme.text.muted} mx-auto mb-4`} />
            <h2 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>No results yet</h2>
            <p className={`${theme.text.secondary} mb-6 max-w-md mx-auto`}>
              Complete your first training session to start tracking your performance and see detailed analytics.
            </p>
            <button
              onClick={() => navigate('/scenarios')}
              className={`${theme.button.primary} px-6 py-3 rounded-lg font-medium transition-all`}
            >
              Start Training
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {hasData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions', value: stats.total_sessions, icon: Target, color: 'text-blue-500' },
                { label: 'Completed', value: stats.completed_sessions, icon: Award, color: 'text-green-500' },
                { label: 'Avg Score', value: stats.average_score != null ? `${Math.round(stats.average_score)}%` : '—', icon: BarChart3, color: 'text-purple-500' },
                { label: 'Practice Time', value: `${stats.total_practice_time_minutes}m`, icon: Clock, color: 'text-orange-500' },
              ].map((card, i) => (
                <div key={i} className={`${theme.bg.card} rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                    <span className={`text-sm ${theme.text.muted}`}>{card.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${theme.text.primary}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Best Score */}
            {stats.best_score != null && (
              <div className={`${theme.bg.card} rounded-xl p-6 flex items-center gap-4`}>
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className={`text-sm ${theme.text.muted}`}>Best Score</p>
                  <p className={`text-3xl font-bold ${theme.text.primary}`}>{stats.best_score}%</p>
                </div>
                {stats.performance_trends && (
                  <div className="ml-auto flex items-center gap-2">
                    {trendIcon(stats.performance_trends.trend_direction)}
                    <span className={`text-sm ${theme.text.secondary} capitalize`}>
                      {stats.performance_trends.trend_direction?.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Scenario Breakdown */}
            {stats.performance_trends?.by_scenario?.length > 0 && (
              <div>
                <h2 className={`text-lg font-semibold ${theme.text.primary} mb-3`}>By Scenario</h2>
                <div className="space-y-3">
                  {stats.performance_trends.by_scenario.map((scenario, i) => (
                    <div key={i} className={`${theme.bg.card} rounded-xl p-5`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${theme.text.primary}`}>{scenario.scenario_name}</p>
                          <p className={`text-sm ${theme.text.muted}`}>
                            {scenario.session_count} session{scenario.session_count !== 1 ? 's' : ''} · Best: {scenario.best_score}%
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xl font-bold ${theme.text.primary}`}>{Math.round(scenario.average_score)}%</span>
                          {trendIcon(scenario.trend)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {stats.recent_sessions?.length > 0 && (
              <div>
                <h2 className={`text-lg font-semibold ${theme.text.primary} mb-3`}>Recent Sessions</h2>
                <div className="space-y-2">
                  {stats.recent_sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/session/${session.id}/feedback`)}
                      className={`w-full ${theme.bg.card} rounded-lg p-4 text-left ${theme.hover.card} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${theme.text.primary}`}>{session.summary || 'Training Session'}</p>
                          <p className={`text-sm ${theme.text.muted}`}>
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Zap className={`w-4 h-4 ${theme.text.accent}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Results

