import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import {
  Clock, Play, CheckCircle2, XCircle, AlertCircle,
  Loader2, ChevronRight, Trophy, Target, Calendar
} from 'lucide-react'

const statusConfig = {
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  IN_PROGRESS: { label: 'In Progress', icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  TERMINATED: { label: 'Terminated', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ERROR: { label: 'Error', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  EXPIRED: { label: 'Expired', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  WAITING: { label: 'Waiting', icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

const TrainingHub = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [currentWorkspace?.id, page])

  const loadSessions = async () => {
    if (!currentWorkspace?.id) return
    try {
      setLoading(true)
      const data = await api.getSessions(currentWorkspace.id, page, 20)
      setSessions(data.sessions || [])
      setTotalSessions(data.total || 0)
      setHasNext(data.has_next || false)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '—'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  if (loading && sessions.length === 0) {
    return (
      <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}>
        <Loader2 className={`w-8 h-8 ${theme.text.muted} animate-spin`} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} p-6`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-2xl font-bold ${theme.text.primary}`}>Training History</h1>
          <p className={`${theme.text.secondary} mt-1`}>
            {totalSessions > 0
              ? `You have completed ${totalSessions} training session${totalSessions !== 1 ? 's' : ''}`
              : 'Your training sessions will appear here after you practice a scenario'}
          </p>
        </div>

        {/* Empty State */}
        {sessions.length === 0 && !loading && (
          <div className={`${theme.bg.card} rounded-xl p-12 text-center`}>
            <Target className={`w-16 h-16 ${theme.text.muted} mx-auto mb-4`} />
            <h2 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>No training sessions yet</h2>
            <p className={`${theme.text.secondary} mb-6 max-w-md mx-auto`}>
              Start practicing by choosing a scenario from the Scenarios page. Your progress and results will be tracked here.
            </p>
            <button
              onClick={() => navigate('/scenarios')}
              className={`${theme.button.primary} px-6 py-3 rounded-lg font-medium transition-all`}
            >
              <Play className="w-4 h-4 inline mr-2" />
              Browse Scenarios
            </button>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map(session => {
              const status = statusConfig[session.session_status] || statusConfig.WAITING
              const StatusIcon = status.icon
              return (
                <button
                  key={session.id}
                  onClick={() => navigate(`/session/${session.id}/feedback`)}
                  className={`w-full ${theme.bg.card} rounded-xl p-5 text-left ${theme.hover.card} transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${status.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium ${theme.text.primary} truncate`}>
                          {session.summary || `Training Session`}
                        </p>
                        <div className={`flex items-center gap-4 mt-1 text-sm ${theme.text.muted}`}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(session.start_time || session.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(session.duration_seconds)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${theme.text.muted} group-hover:${theme.text.accent} transition-colors`} />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalSessions > 20 && (
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`${theme.button.secondary} px-4 py-2 rounded-lg disabled:opacity-50`}
            >Previous</button>
            <span className={`${theme.text.secondary} py-2`}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
              className={`${theme.button.secondary} px-4 py-2 rounded-lg disabled:opacity-50`}
            >Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainingHub

