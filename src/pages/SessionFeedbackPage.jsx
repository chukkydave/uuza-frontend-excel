import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../utils/api';
import SessionFeedback from '../components/SessionFeedback';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';

const SessionFeedbackPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { currentWorkspace } = useWorkspace();

  // Determine if we're in org context based on URL path
  const isOrgContext = location.pathname.startsWith('/org');
  const [session, setSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch session and feedback data
      const workspaceId = currentWorkspace?.id;
      const [sessionData, feedbackData] = await Promise.all([
        api.getSession(workspaceId, sessionId),
        api.getSessionFeedback(workspaceId, sessionId).catch(() => null) // Feedback might not exist yet
      ]);

      setSession(sessionData);
      setFeedback(feedbackData);
    } catch (err) {
      console.error('Failed to load session data:', err);
      setError('Failed to load session feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className={`w-8 h-8 ${theme.text.muted} animate-spin`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(isOrgContext ? '/org/dashboard' : '/dashboard')}
            className={`flex items-center space-x-2 ${theme.text.secondary} hover:${theme.text.primary} mb-6 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className={`${theme.bg.card} p-8 rounded-xl border ${theme.isDark ? 'border-red-500/20' : 'border-red-200'}`}>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className={theme.text.primary}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(isOrgContext ? '/org/dashboard' : '/dashboard')}
            className={`flex items-center space-x-2 ${theme.text.secondary} hover:${theme.text.primary} mb-4 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className={`text-3xl font-bold ${theme.text.primary}`}>
            Session Feedback
          </h1>
        </div>

        {/* Session Feedback Component */}
        <SessionFeedback
          feedback={feedback}
          session={session}
          transcript={session?.transcript || []}
          duration={session?.duration_seconds || 0}
        />
      </div>
    </div>
  );
};

export default SessionFeedbackPage;

