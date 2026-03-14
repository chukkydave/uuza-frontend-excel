import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { api } from '../../utils/api'
import {
  BookOpen, Target, Users, TrendingUp, Activity, Clock, Trophy, Medal, Award,
  Zap, ChevronDown, UserPlus, Plus, ArrowRight, Loader2, Play, CheckCircle2, Flame
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

/**
 * OrgDashboard Component
 *
 * Dashboard for organization workspace users (B2B focus).
 * Renders different views based on user role:
 * - Admin View (OWNER/ADMIN): Team performance overview, leaderboard, activity feed
 * - Member View (MEMBER): Personal training focus with team context
 */
const OrgDashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace, currentRole, isAdminOrOwner } = useWorkspace()

  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d

  // Admin data
  const [analytics, setAnalytics] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [playbooks, setPlaybooks] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [trainees, setTrainees] = useState([])

  // Member data
  const [sessionStats, setSessionStats] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchDashboardData()
    }
  }, [dateRange, isAdminOrOwner, currentWorkspace?.id])

  const fetchDashboardData = async () => {
    if (!currentWorkspace?.id) return

    try {
      setLoading(true)

      if (isAdminOrOwner) {
        // Admin view data
        const [analyticsData, userStatsData, playbooksData, scenariosData, traineesData] = await Promise.all([
          api.getAdminAnalytics(currentWorkspace.id, dateRange === '7d' ? 1 : dateRange === '30d' ? 4 : 12).catch(() => null),
          api.getCompanyUserStats().catch(() => null),
          api.getPlaybooks(currentWorkspace.id).catch(() => ({ playbooks: [] })),
          api.getScenarios(currentWorkspace.id).catch(() => ({ scenarios: [] })),
          api.getCompanyUsers().catch(() => [])
        ])

        setAnalytics(analyticsData)
        setUserStats(userStatsData)
        setPlaybooks(Array.isArray(playbooksData?.playbooks) ? playbooksData.playbooks : [])
        setScenarios(Array.isArray(scenariosData?.scenarios) ? scenariosData.scenarios : [])
        setTrainees(Array.isArray(traineesData) ? traineesData : [])
      } else {
        // Member view data - use default scenarios for members
        const [userData, statsData, scenariosData] = await Promise.all([
          api.getCurrentUser(),
          api.getSessionStatistics(currentWorkspace.id).catch(() => null),
          api.getDefaultScenarios().catch(() => ({ scenarios: [] }))
        ])

        setCurrentUser(userData)
        setSessionStats(statsData)
        setScenarios(Array.isArray(scenariosData?.scenarios) ? scenariosData.scenarios : [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className={`w-10 h-10 animate-spin mx-auto mb-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={theme.text.secondary}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Render appropriate view based on role
  if (isAdminOrOwner) {
    return (
      <AdminDashboardView
        theme={theme}
        navigate={navigate}
        currentWorkspace={currentWorkspace}
        dateRange={dateRange}
        setDateRange={setDateRange}
        analytics={analytics}
        userStats={userStats}
        playbooks={playbooks}
        scenarios={scenarios}
        trainees={trainees}
      />
    )
  }

  return (
    <MemberDashboardView
      theme={theme}
      navigate={navigate}
      currentWorkspace={currentWorkspace}
      currentUser={currentUser}
      sessionStats={sessionStats}
      scenarios={scenarios}
    />
  )
}

/**
 * Admin Dashboard View
 * For OWNER and ADMIN roles
 */
const AdminDashboardView = ({
  theme, navigate, currentWorkspace, dateRange, setDateRange,
  analytics, userStats, playbooks, scenarios, trainees
}) => {
  // Calculate metrics
  const teamReadinessScore = analytics?.overall_completion_rate || 0
  const activeMembers = userStats?.active_users || trainees.length || 0
  const totalSessions = analytics?.total_sessions || 0
  const teamAvgScore = analytics?.average_score || 0
  const completionRate = analytics?.overall_completion_rate || 0

  // Top performers
  const topPerformers = analytics?.top_performers?.slice(0, 5) || []

  // Activity feed (mock for now - would come from API)
  const activityFeed = analytics?.recent_activity || []

  // Skill gaps data
  const skillGapsData = analytics?.skill_gaps || [
    { skill: 'Discovery', target: 100, actual: 85 },
    { skill: 'Objection', target: 100, actual: 65 },
    { skill: 'Closing', target: 100, actual: 72 },
    { skill: 'Negotiation', target: 100, actual: 58 },
    { skill: 'Product', target: 100, actual: 90 }
  ]

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2: return <Medal className="w-5 h-5 text-gray-400" />
      case 3: return <Award className="w-5 h-5 text-amber-600" />
      default: return <span className={`text-sm font-bold ${theme.text.muted}`}>#{rank}</span>
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return theme.isDark ? 'text-green-400' : 'text-green-600'
    if (score >= 60) return theme.isDark ? 'text-yellow-400' : 'text-yellow-600'
    return theme.isDark ? 'text-red-400' : 'text-red-600'
  }

  return (
    <div className={`p-6 min-h-screen ${theme.bg.primary}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${theme.text.primary}`}>Team Performance Overview</h1>
            <p className={`${theme.text.secondary}`}>{currentWorkspace?.name || 'Organization'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${theme.isDark
                ? 'bg-slate-800 border-white/10 text-white'
                : 'bg-white border-gray-200 text-gray-900'
                } focus:ring-2 focus:ring-blue-500`}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">This Quarter</option>
            </select>
          </div>
        </div>

        {/* High-Level Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            theme={theme}
            icon={Users}
            iconColor="purple"
            label="Active Members"
            value={activeMembers}
          />
          <MetricCard
            theme={theme}
            icon={Activity}
            iconColor="blue"
            label="Total Sessions"
            value={totalSessions}
          />
          <MetricCard
            theme={theme}
            icon={Trophy}
            iconColor="yellow"
            label="Team Avg Score"
            value={`${Math.round(teamAvgScore)}%`}
          />
          <MetricCard
            theme={theme}
            icon={Target}
            iconColor="green"
            label="Completion Rate"
            value={`${Math.round(completionRate)}%`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Readiness Score */}
            <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Team Readiness Score</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-5xl font-bold ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.round(teamReadinessScore)}%
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">+5% from last period</span>
                  </div>
                </div>
                <div className={`w-20 h-20 rounded-full ${theme.isDark ? 'bg-blue-500/10' : 'bg-blue-50'} flex items-center justify-center`}>
                  <Zap className={`w-10 h-10 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
            </div>

            {/* Skill Gaps Chart */}
            <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Team Skill Gaps</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillGapsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? '#ffffff20' : '#00000010'} />
                  <XAxis
                    dataKey="skill"
                    tick={{ fill: theme.isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                    stroke={theme.isDark ? '#ffffff20' : '#00000020'}
                  />
                  <YAxis
                    tick={{ fill: theme.isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                    stroke={theme.isDark ? '#ffffff20' : '#00000020'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${theme.isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: theme.isDark ? '#f3f4f6' : '#111827'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="target" fill={theme.isDark ? '#4b5563' : '#d1d5db'} name="Goal" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill={theme.isDark ? '#6366f1' : '#4f46e5'} name="Team Avg" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/org/team')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${theme.isDark ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 hover:bg-blue-100'} transition-colors`}
                >
                  <UserPlus className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`font-medium ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`}>Invite Team Members</span>
                </button>
                <button
                  onClick={() => navigate('/org/playbooks')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${theme.isDark ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'bg-purple-50 hover:bg-purple-100'} transition-colors`}
                >
                  <Plus className={`w-5 h-5 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-medium ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`}>Create New Playbook</span>
                </button>
              </div>
            </div>

            {/* Top Performers */}
            <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className={`w-5 h-5 ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Top Performers</h2>
              </div>
              {topPerformers.length === 0 ? (
                <p className={`text-sm ${theme.text.muted} text-center py-4`}>No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.id || index} className={`p-3 rounded-lg ${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-between`}>
                      <div className="flex items-center space-x-3">
                        {getRankIcon(index + 1)}
                        <div>
                          <p className={`font-medium ${theme.text.primary}`}>{performer.name}</p>
                          <p className={`text-xs ${theme.text.muted}`}>{performer.sessions || 0} sessions</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(performer.score)}`}>
                        {Math.round(performer.score)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2 mb-4">
                <Activity className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Team Activity</h2>
              </div>
              {activityFeed.length === 0 ? (
                <p className={`text-sm ${theme.text.muted} text-center py-4`}>No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.slice(0, 5).map((activity, index) => (
                    <div key={index} className={`pb-3 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-100'} last:border-0 last:pb-0`}>
                      <p className={`text-sm ${theme.text.primary}`}>
                        <span className="font-medium">{activity.user_name}</span> {activity.action}{' '}
                        <span className="font-medium">'{activity.scenario_name}'</span>
                        {activity.score && (
                          <span className={`ml-1 font-semibold ${getScoreColor(activity.score)}`}>
                            ({activity.score}%)
                          </span>
                        )}
                      </p>
                      <p className={`text-xs ${theme.text.muted} mt-1`}>{activity.time_ago}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Member Dashboard View
 * For MEMBER role - personal training focus with team context
 */
const MemberDashboardView = ({
  theme, navigate, currentWorkspace, currentUser, sessionStats, scenarios
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
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

  const recentSessions = sessionStats?.recent_sessions?.filter(s => s.session_status === 'completed').slice(0, 3) || []

  return (
    <div className={`p-6 min-h-screen ${theme.bg.primary}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className={`relative overflow-hidden rounded-2xl p-8 ${theme.isDark
          ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-purple-900/50'
          : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
          } border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="relative z-10">
            <p className={`text-sm ${theme.text.muted} mb-1`}>{currentWorkspace?.name}</p>
            <h1 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
              {getGreeting()}, {currentUser?.first_name || 'there'}!
            </h1>
            <p className={`${theme.text.secondary} mb-6`}>
              Stay on track with your training goals
            </p>
            <button
              onClick={() => navigate('/org/scenarios')}
              className={`${theme.isDark
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                } text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:scale-105`}
            >
              <Play className="w-5 h-5" />
              <span>Start Training</span>
            </button>
          </div>
        </div>

        {/* Personal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            theme={theme}
            icon={Flame}
            iconColor="orange"
            label="Weekly Streak"
            value={`${sessionStats?.streak_days || 0} Days`}
          />
          <MetricCard
            theme={theme}
            icon={CheckCircle2}
            iconColor="green"
            label="Completed"
            value={sessionStats?.completed_sessions || 0}
          />
          <MetricCard
            theme={theme}
            icon={TrendingUp}
            iconColor="blue"
            label="Avg Score"
            value={sessionStats?.average_score ? `${Math.round(sessionStats.average_score)}%` : 'N/A'}
          />
        </div>

        {/* Recent Sessions */}
        <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}">
            <h2 className={`text-xl font-bold ${theme.text.primary}`}>Recent Sessions</h2>
          </div>

          {recentSessions.length === 0 ? (
            <div className="p-8 text-center">
              <Target className={`w-12 h-12 mx-auto mb-4 ${theme.text.muted}`} />
              <p className={`${theme.text.secondary} mb-4`}>No sessions completed yet.</p>
              <button
                onClick={() => navigate('/org/scenarios')}
                className={`${theme.isDark ? 'text-blue-400' : 'text-blue-600'} font-medium hover:underline`}
              >
                Start your first training →
              </button>
            </div>
          ) : (
            <div className={`divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
              {recentSessions.map((session) => {
                const scenario = scenarios.find(s => s.id === session.scenario_id)
                const score = session.overall_score || session.score || 0
                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/org/session/${session.id}/feedback`)}
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
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</span>
                      <ArrowRight className={`w-5 h-5 ${theme.text.muted}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Team Context Widget */}
        {sessionStats?.team_rank && (
          <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Trophy className={`w-6 h-6 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${theme.text.muted}`}>Your Team Ranking</p>
                <p className={`text-lg font-bold ${theme.text.primary}`}>
                  #{sessionStats.team_rank} of {sessionStats.team_size} members this week
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Reusable Metric Card Component
 */
const MetricCard = ({ theme, icon: Icon, iconColor, label, value }) => {
  const colorMap = {
    blue: { bg: theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100', text: theme.isDark ? 'text-blue-400' : 'text-blue-600' },
    green: { bg: theme.isDark ? 'bg-green-500/20' : 'bg-green-100', text: theme.isDark ? 'text-green-400' : 'text-green-600' },
    purple: { bg: theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100', text: theme.isDark ? 'text-purple-400' : 'text-purple-600' },
    yellow: { bg: theme.isDark ? 'bg-yellow-500/20' : 'bg-yellow-100', text: theme.isDark ? 'text-yellow-400' : 'text-yellow-600' },
    orange: { bg: theme.isDark ? 'bg-orange-500/20' : 'bg-orange-100', text: theme.isDark ? 'text-orange-400' : 'text-orange-600' },
  }

  const colors = colorMap[iconColor] || colorMap.blue

  return (
    <div className={`${theme.bg.card} rounded-xl p-5 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div>
          <p className={`text-sm ${theme.text.muted}`}>{label}</p>
          <p className={`text-2xl font-bold ${theme.text.primary}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

export default OrgDashboard

