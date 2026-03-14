import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { api } from '../../utils/api'
import {
    BookOpen, Target, Users, TrendingUp, AlertCircle, Eye, Send,
    Activity, Clock, Trophy, Medal, Award, Zap, ChevronDown
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const OrgAdminDashboard = () => {
    const theme = useTheme()
    const { currentWorkspace } = useWorkspace()
    const [loading, setLoading] = useState(true)

    // Analytics data
    const [analytics, setAnalytics] = useState(null)
    const [userStats, setUserStats] = useState(null)
    const [playbooks, setPlaybooks] = useState([])
    const [scenarios, setScenarios] = useState([])
    const [trainees, setTrainees] = useState([])

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchDashboardData()
        }
    }, [currentWorkspace?.id])

    const fetchDashboardData = async () => {
        if (!currentWorkspace?.id) return

        try {
            setLoading(true)
            const [analyticsData, userStatsData, playbooksData, scenariosData, traineesData] = await Promise.all([
                api.getAdminAnalytics(currentWorkspace.id, 6).catch(() => null),
                api.getCompanyUserStats().catch(() => null),
                api.getPlaybooks(currentWorkspace.id).catch(() => []),
                api.getScenarios(currentWorkspace.id).catch(() => []),
                api.getCompanyUsers().catch(() => [])
            ])

            setAnalytics(analyticsData)
            setUserStats(userStatsData)
            setPlaybooks(Array.isArray(playbooksData?.playbooks) ? playbooksData.playbooks : [])
            setScenarios(Array.isArray(scenariosData?.scenarios) ? scenariosData.scenarios : [])
            setTrainees(Array.isArray(traineesData) ? traineesData : [])
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Mock data for demonstration
    const teamReadinessScore = analytics?.overall_completion_rate || 85
    const readinessTrend = 5

    const quickStats = {
        activePlaybooks: Array.isArray(playbooks) ? playbooks.filter(p => p.status === 'active').length : 0,
        trainingScenarios: Array.isArray(scenarios) ? scenarios.length : 0,
        activeTrainees: userStats?.active_users || 0,
        completionRate: analytics?.overall_completion_rate || 0
    }

    // Skill gaps data with target vs actual (for vertical bar chart)
    const skillGapsData = [
        { skill: 'Discovery', target: 100, actual: 85 },
        { skill: 'Objection', target: 100, actual: 45 },
        { skill: 'Closing', target: 100, actual: 58 },
        { skill: 'Negotiation', target: 100, actual: 52 },
        { skill: 'Product Knowledge', target: 100, actual: 95 }
    ]

    // Alerts/Needs Attention
    const alerts = [
        { id: 1, type: 'inactive', message: '3 trainees haven\'t logged in this week', action: 'Nudge All' },
        { id: 2, type: 'performance', message: 'Sarah\'s score dropped 20%', action: 'View Progress' }
    ]

    // Top performers
    const topPerformers = analytics?.top_performers?.slice(0, 3) || [
        { id: 1, name: 'Alex Johnson', score: 94, rank: 1 },
        { id: 2, name: 'Maria Garcia', score: 91, rank: 2 },
        { id: 3, name: 'James Chen', score: 88, rank: 3 }
    ]

    // Activity feed
    const activityFeed = [
        { id: 1, time: '2 min ago', user: 'Sarah', action: 'completed', scenario: 'Cold Call', score: 89 },
        { id: 2, time: '15 min ago', user: 'Alex', action: 'started', scenario: 'Objection Handling', score: null },
        { id: 3, time: '1 hour ago', user: 'Maria', action: 'completed', scenario: 'Product Demo', score: 92 },
        { id: 4, time: '2 hours ago', user: 'James', action: 'completed', scenario: 'Closing Call', score: 85 }
    ]

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Trophy className="w-5 h-5 text-yellow-500" />
            case 2: return <Medal className="w-5 h-5 text-gray-400" />
            case 3: return <Award className="w-5 h-5 text-amber-600" />
            default: return null
        }
    }

    const getScoreColor = (score) => {
        if (score >= 80) return theme.isDark ? 'text-green-400' : 'text-green-600'
        if (score >= 60) return theme.isDark ? 'text-yellow-400' : 'text-yellow-600'
        return theme.isDark ? 'text-red-400' : 'text-red-600'
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center p-12`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.isDark ? 'border-blue-400' : 'border-blue-600'} mx-auto mb-4`}></div>
                    <p className={theme.text.secondary}>Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`p-6 ${theme.bg.primary}`}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (65% - 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Team Readiness Score */}
                        <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <h2 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Team Readiness Score</h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className={`text-5xl font-bold ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {teamReadinessScore}%
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-medium text-green-500">+{readinessTrend}% from last week</span>
                                    </div>
                                </div>
                                <div className={`w-24 h-24 rounded-full ${theme.isDark ? 'bg-blue-500/10' : 'bg-blue-50'} flex items-center justify-center`}>
                                    <Zap className={`w-12 h-12 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className={`${theme.bg.card} rounded-xl p-4 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <BookOpen className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                    <span className={`text-xs font-medium ${theme.text.secondary}`}>Active Playbooks</span>
                                </div>
                                <div className={`text-2xl font-bold ${theme.text.primary}`}>{quickStats.activePlaybooks}</div>
                            </div>

                            <div className={`${theme.bg.card} rounded-xl p-4 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Target className={`w-5 h-5 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
                                    <span className={`text-xs font-medium ${theme.text.secondary}`}>Training Scenarios</span>
                                </div>
                                <div className={`text-2xl font-bold ${theme.text.primary}`}>{quickStats.trainingScenarios}</div>
                            </div>

                            <div className={`${theme.bg.card} rounded-xl p-4 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Users className={`w-5 h-5 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                    <span className={`text-xs font-medium ${theme.text.secondary}`}>Active Trainees</span>
                                </div>
                                <div className={`text-2xl font-bold ${theme.text.primary}`}>{quickStats.activeTrainees}</div>
                            </div>

                            <div className={`${theme.bg.card} rounded-xl p-4 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Activity className={`w-5 h-5 ${theme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                                    <span className={`text-xs font-medium ${theme.text.secondary}`}>Completion Rate</span>
                                </div>
                                <div className={`text-2xl font-bold ${theme.text.primary}`}>{quickStats.completionRate}%</div>
                            </div>
                        </div>

                        {/* Team Skill Gaps - Vertical Bar Chart */}
                        <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Team Skill Gaps</h2>
                                    <p className={`text-sm ${theme.text.secondary}`}>Performance vs Target across key competencies</p>
                                </div>
                                <button className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} ${theme.text.secondary} hover:${theme.bg.secondary}`}>
                                    <span className="text-sm">All Teams</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
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
                                    <Bar dataKey="actual" fill={theme.isDark ? '#6366f1' : '#4f46e5'} name="Team Average" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Column (35% - 1 col) */}
                    <div className="space-y-6">
                        {/* Needs Attention */}
                        <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-2 mb-4">
                                <AlertCircle className={`w-5 h-5 ${theme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Needs Attention</h2>
                            </div>
                            <div className="space-y-3">
                                {alerts.map(alert => (
                                    <div key={alert.id} className={`p-4 rounded-lg ${theme.isDark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                                        <p className={`text-sm ${theme.text.primary} mb-3`}>{alert.message}</p>
                                        <button className={`w-full ${theme.isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2`}>
                                            {alert.action === 'Nudge All' ? <Send className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            <span>{alert.action}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-2 mb-4">
                                <Trophy className={`w-5 h-5 ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Top Performers</h2>
                            </div>
                            <div className="space-y-3">
                                {topPerformers.map(performer => (
                                    <div key={performer.id} className={`p-4 rounded-lg ${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-between`}>
                                        <div className="flex items-center space-x-3">
                                            {getRankIcon(performer.rank)}
                                            <div>
                                                <p className={`font-medium ${theme.text.primary}`}>{performer.name}</p>
                                                <p className={`text-xs ${theme.text.secondary}`}>Rank #{performer.rank}</p>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-bold ${getScoreColor(performer.score)}`}>
                                            {performer.score}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-2 mb-4">
                                <Activity className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Activity Feed</h2>
                            </div>
                            <div className="space-y-3">
                                {activityFeed.map(activity => (
                                    <div key={activity.id} className={`pb-3 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'} last:border-0 last:pb-0`}>
                                        <div className="flex items-start space-x-2">
                                            <Clock className={`w-4 h-4 ${theme.text.secondary} mt-0.5`} />
                                            <div className="flex-1">
                                                <p className={`text-sm ${theme.text.secondary}`}>{activity.time}</p>
                                                <p className={`text-sm ${theme.text.primary} mt-1`}>
                                                    <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                                                    <span className="font-medium">'{activity.scenario}'</span>
                                                    {activity.score && (
                                                        <span className={`ml-2 font-semibold ${getScoreColor(activity.score)}`}>
                                                            ({activity.score}%)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
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

export default OrgAdminDashboard

