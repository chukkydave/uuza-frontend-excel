import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import {
    Play, Clock, Flame, Trophy, Sparkles, TrendingUp, ArrowRight,
    CheckCircle2, Target, BookOpen, Award, TrendingDown, Minus
} from 'lucide-react'

const Dashboard = () => {
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
                // For legacy Dashboard, only load default scenarios (no workspace-scoped scenarios)
                const [userData, defaultScenariosData, statsData] = await Promise.all([
                    api.getCurrentUser(),
                    api.getDefaultScenarios(1, 50).catch(() => ({ scenarios: [] })),
                    api.getSessionStatistics(currentWorkspace?.id).catch(() => null)
                ])

                setCurrentUser(userData)
                // Use default scenarios for both lists
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

    // Calculate user level based on completed sessions
    const getUserLevel = () => {
        const completed = sessionStats?.completed_sessions || 0
        if (completed < 5) return { level: 1, title: 'Rookie' }
        if (completed < 15) return { level: 2, title: 'Learner' }
        if (completed < 30) return { level: 3, title: 'Practitioner' }
        if (completed < 50) return { level: 4, title: 'Expert' }
        return { level: 5, title: 'Master' }
    }

    // Get recommended scenario based on performance
    const getRecommendedScenario = () => {
        const allScenarios = [...scenarios, ...defaultScenarios]

        // If we have performance data, recommend based on weak areas
        if (sessionStats?.performance_trends?.by_scenario) {
            const weakestScenario = sessionStats.performance_trends.by_scenario
                .filter(s => s.trend === 'declining' || s.average_score < 70)
                .sort((a, b) => a.average_score - b.average_score)[0]

            if (weakestScenario) {
                const scenario = allScenarios.find(s => s.id === weakestScenario.scenario_id)
                if (scenario) {
                    return {
                        scenario,
                        reason: `Your '${weakestScenario.scenario_name}' score dipped ${Math.abs(weakestScenario.average_score - 70).toFixed(0)}% last week. Practice this scenario with Mr. Emma to get back on track.`,
                        proficiency: weakestScenario.average_score
                    }
                }
            }
        }

        // Default: return first available scenario
        const firstScenario = allScenarios[0]
        return {
            scenario: firstScenario,
            reason: 'Start your practice session and improve your skills.',
            proficiency: null
        }
    }

    // Get recent activity/performance by scenario
    const getRecentActivity = () => {
        if (sessionStats?.performance_trends?.by_scenario) {
            return sessionStats.performance_trends.by_scenario.slice(0, 5).map(s => ({
                name: s.scenario_name,
                sessions: s.total_sessions || 0,
                avgScore: s.average_score,
                trend: s.trend
            }))
        }
        return []
    }

    const handleStartTraining = (scenarioId) => {
        navigate(`/training/${scenarioId}`)
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
            case 'advanced': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const getProficiencyColor = (score) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-orange-600 dark:text-orange-400'
    }

    const getProficiencyLabel = (score) => {
        if (score >= 80) return 'Proficient'
        if (score >= 60) return 'Developing'
        return 'Needs Work'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.isDark ? 'border-blue-400' : 'border-blue-600'} mx-auto mb-4`}></div>
                    <p className={theme.text.secondary}>Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    const userLevel = getUserLevel()
    const recommended = getRecommendedScenario()
    const recentActivity = getRecentActivity()
    const allScenarios = [...scenarios, ...defaultScenarios]
    const learningPathScenarios = allScenarios.slice(0, 3)

    return (
        <div className={`p-6 ${theme.bg.primary} min-h-screen`}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Personalized Greeting Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${theme.text.primary} mb-2`}>
                        {getGreeting()}, {currentUser?.first_name || 'there'}!
                    </h1>
                    <p className={`text-lg ${theme.text.secondary} mb-4`}>
                        You're on a roll. Keep up the momentum.
                    </p>

                    {/* Quick Stats Pills */}
                    <div className="flex flex-wrap gap-3">
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${theme.isDark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                            <Flame className={`w-4 h-4 ${theme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                            <span className={`text-sm font-medium ${theme.text.primary}`}>
                                {sessionStats?.streak_days || 0} Day Streak
                            </span>
                        </div>
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${theme.isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'}`}>
                            <Trophy className={`w-4 h-4 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                            <span className={`text-sm font-medium ${theme.text.primary}`}>
                                Lvl {userLevel.level} {userLevel.title}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hero Card - Recommended Scenario */}
                {recommended.scenario && (
                    <div className={`relative overflow-hidden rounded-2xl ${theme.isDark ? 'bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-blue-900/40' : 'bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600'} p-8 border ${theme.isDark ? 'border-purple-500/20' : 'border-purple-400'}`}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Content */}
                            <div className="lg:col-span-2">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                    <span className="text-sm font-medium text-white/90">Recommended for you</span>
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-3">
                                    {recommended.scenario.name}
                                </h2>

                                <p className="text-white/90 text-lg mb-6 max-w-2xl">
                                    {recommended.reason}
                                </p>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handleStartTraining(recommended.scenario.id)}
                                        className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover:bg-gray-100 transition-all hover:scale-105"
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>Start Simulation</span>
                                    </button>
                                    <div className="flex items-center space-x-2 text-white/80">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">{recommended.scenario.estimated_duration_minutes || 12} mins</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Proficiency Indicator */}
                            {recommended.proficiency !== null && (
                                <div className="flex items-center justify-center">
                                    <div className={`${theme.isDark ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm rounded-2xl p-6 border ${theme.isDark ? 'border-white/20' : 'border-white/30'}`}>
                                        <p className="text-white/80 text-sm mb-2 text-center">Current Proficiency</p>
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-white mb-2">
                                                {recommended.proficiency}%
                                            </div>
                                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${recommended.proficiency >= 60 ? 'bg-yellow-500/20 text-yellow-200' : 'bg-orange-500/20 text-orange-200'}`}>
                                                {getProficiencyLabel(recommended.proficiency)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3) - Learning Path */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Your Learning Path */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Your Learning Path</h2>
                                <button
                                    onClick={() => navigate('/trainee/scenarios')}
                                    className={`flex items-center space-x-1 text-sm ${theme.isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                                >
                                    <span>View Roadmap</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {learningPathScenarios.map((scenario, index) => (
                                    <div
                                        key={scenario.id}
                                        className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} hover:border-blue-500 transition-all group cursor-pointer`}
                                        onClick={() => handleStartTraining(scenario.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-lg ${theme.isDark ? 'bg-blue-500/10' : 'bg-blue-50'} flex items-center justify-center flex-shrink-0`}>
                                                    <Target className={`w-6 h-6 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1">
                                                    <h3 className={`text-lg font-semibold ${theme.text.primary} group-hover:text-blue-500 transition-colors mb-1`}>
                                                        {scenario.name}
                                                    </h3>
                                                    <p className={`text-sm ${theme.text.secondary} mb-3 line-clamp-2`}>
                                                        {scenario.description || 'Practice this scenario to improve your skills'}
                                                    </p>

                                                    <div className="flex items-center space-x-4">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(scenario.difficulty_level)}`}>
                                                            {scenario.difficulty_level || 'Standard'}
                                                        </span>
                                                        <div className="flex items-center space-x-1 text-sm">
                                                            <Clock className={`w-4 h-4 ${theme.text.muted}`} />
                                                            <span className={theme.text.muted}>{scenario.estimated_duration_minutes || 10} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Play Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleStartTraining(scenario.id)
                                                }}
                                                className={`w-12 h-12 rounded-full ${theme.isDark ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-blue-100 hover:bg-blue-200'} flex items-center justify-center transition-all group-hover:scale-110`}
                                            >
                                                <Play className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recently Completed */}
                        {sessionStats?.recent_sessions && sessionStats.recent_sessions.filter(s => s.session_status === 'completed').length > 0 && (
                            <div>
                                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>Recently Completed</h2>
                                <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                                    {sessionStats.recent_sessions
                                        .filter(s => s.session_status === 'completed')
                                        .slice(0, 3)
                                        .map((session) => {
                                            const scenario = allScenarios.find(s => s.id === session.scenario_id)
                                            return (
                                                <div
                                                    key={session.id}
                                                    onClick={() => navigate(`/trainee/session/${session.id}/feedback`)}
                                                    className={`flex items-center justify-between p-4 hover:${theme.bg.secondary} cursor-pointer transition-colors`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-lg ${theme.isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                                                            <CheckCircle2 className={`w-5 h-5 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium ${theme.text.primary}`}>
                                                                {scenario?.name || 'Training Session'}
                                                            </p>
                                                            <p className={`text-sm ${theme.text.muted}`}>
                                                                {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className={`w-5 h-5 ${theme.text.muted}`} />
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (1/3) - Recent Activity & Progress */}
                    <div className="space-y-6">
                        {/* Recent Activity by Scenario */}
                        {recentActivity.length > 0 && (
                            <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                <h2 className={`text-xl font-bold ${theme.text.primary} mb-6`}>Recent Activity</h2>

                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => {
                                        const getTrendIcon = () => {
                                            if (activity.trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />
                                            if (activity.trend === 'declining') return <TrendingDown className="w-4 h-4 text-orange-500" />
                                            return <Minus className="w-4 h-4 text-gray-400" />
                                        }

                                        return (
                                            <div key={index} className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium ${theme.text.primary} mb-1`}>
                                                        {activity.name}
                                                    </p>
                                                    <div className="flex items-center space-x-3 text-xs">
                                                        <span className={theme.text.muted}>
                                                            {activity.sessions} session{activity.sessions !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className={`font-medium ${getProficiencyColor(activity.avgScore)}`}>
                                                            {Math.round(activity.avgScore)}% avg
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-2">
                                                    {getTrendIcon()}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Your Progress Card */}
                        <div className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <h2 className={`text-xl font-bold ${theme.text.primary} mb-6`}>Your Progress</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-lg ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                                            <Target className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm ${theme.text.secondary}`}>Avg Score</p>
                                            <p className={`text-lg font-bold ${theme.text.primary}`}>
                                                {sessionStats?.average_score ? `${Math.round(sessionStats.average_score)}%` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-lg ${theme.isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                                            <CheckCircle2 className={`w-5 h-5 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm ${theme.text.secondary}`}>Completed</p>
                                            <p className={`text-lg font-bold ${theme.text.primary}`}>
                                                {sessionStats?.completed_sessions || 0} Sessions
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-lg ${theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center`}>
                                            <Award className={`w-5 h-5 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm ${theme.text.secondary}`}>Best Score</p>
                                            <p className={`text-lg font-bold ${theme.text.primary}`}>
                                                {sessionStats?.best_score ? `${sessionStats.best_score}%` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard

