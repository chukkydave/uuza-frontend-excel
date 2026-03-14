import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useVapiSession } from '../hooks/useVapiSession';
import SessionFeedback from './SessionFeedback';
import { api } from '../utils/api';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Play,
  Award,
  Clock,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const VapiSessionInterface = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentWorkspace } = useWorkspace();

  const {
    // State
    isSessionActive,
    isLoading,
    error,
    callStatus,
    transcript,
    isAnalyzing,
    session,
    feedback,
    feedbackLoaded,

    // Actions
    startTrainingSession,
    startCall,
    endCall,
    getFeedback,
    resetSession,

    // Computed
    canStartCall,
    canEndCall,
    hasTranscript,
    hasFeedback
  } = useVapiSession(scenarioId, currentWorkspace?.id);

  const [sessionPhase, setSessionPhase] = useState('setup'); // setup, active, completed
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const transcriptRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Update session phase based on call status
  useEffect(() => {
    if (callStatus === 'connected' && sessionPhase !== 'active') {
      setSessionPhase('active');
      setStartTime(Date.now());
    } else if (callStatus === 'ended' && sessionPhase === 'active') {
      setSessionPhase('completed');
    }
  }, [callStatus, sessionPhase]);

  // Duration timer
  useEffect(() => {
    let interval;
    if (sessionPhase === 'active' && startTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionPhase, startTime]);

  // We'll get scenario data from the session when it's created
  const [scenario, setScenario] = useState(null);

  // Extract scenario data from session metadata when session is created
  useEffect(() => {
    if (session?.session_metadata) {
      const scenarioData = {
        name: session.session_metadata.scenario_name,
        difficulty_level: session.session_metadata.difficulty_level,
        persona_name: session.session_metadata.persona_name,
        // Add other fields as needed from session_metadata
      };
      setScenario(scenarioData);
    }
  }, [session]);

  const handleStartTraining = async () => {
    try {
      console.log('=== STARTING TRAINING ===');
      console.log('Scenario ID:', scenarioId);
      console.log('Current scenario data:', scenario);
      console.log('Current session:', session);
      console.log('Call status:', callStatus);
      console.log('Is loading:', isLoading);
      console.log('Error:', error);
      console.log('Can start call:', canStartCall);

      await startCall();
    } catch (error) {
      console.error('Failed to start training:', error);
      console.error('Error details:', error);
    }
  };

  const handleEndTraining = async () => {
    try {
      await endCall();
    } catch (error) {
      console.error('Failed to end training:', error);
    }
  };

  const handleBackToDashboard = () => {
    if (isSessionActive) {
      if (window.confirm('Are you sure you want to leave? This will end your training session.')) {
        endCall();
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'text-yellow-500';
      case 'connected': return 'text-green-500';
      case 'ended': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getCallStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'ended': return 'Call Ended';
      default: return 'Ready';
    }
  };



  // Loading state for session operations
  if (isLoading && !session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg.primary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={theme.text.secondary}>Setting up your training session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg.primary}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>Setup Failed</h2>
          <p className={`${theme.text.secondary} mb-6`}>{error}</p>
          <button
            onClick={handleBackToDashboard}
            className={`${theme.button.primary} px-6 py-2 rounded-md font-semibold`}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Don't show "Session Not Found" - we create session when user starts training
  // if (!session) {
  //   return (
  //     <div className={`min-h-screen flex items-center justify-center ${theme.bg.primary}`}>
  //       <div className="text-center">
  //         <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>Session Not Found</h2>
  //         <button
  //           onClick={handleBackToDashboard}
  //           className={`${theme.button.primary} px-6 py-2 rounded-md font-semibold`}
  //         >
  //           Back to Dashboard
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${theme.bg.nav} border-b ${theme.isDark ? 'border-white/20' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className={`mr-4 ${theme.text.secondary} ${theme.hover.link} flex items-center space-x-2`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h1 className={`text-xl font-bold ${theme.text.primary}`}>
                {scenario?.name || 'Training Session'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Call Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-400'
                  }`}></div>
                <span className={`text-sm ${getCallStatusColor()}`}>
                  {getCallStatusText()}
                </span>
              </div>

              {/* Duration */}
              {sessionPhase === 'active' && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className={`text-sm ${theme.text.secondary}`}>
                    {formatDuration(duration)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessionPhase === 'setup' && (
          <SetupPhase
            scenario={scenario}
            theme={theme}
            onStart={handleStartTraining}
            isLoading={isLoading}
            error={error}
            canStart={canStartCall}
          />
        )}

        {sessionPhase === 'active' && (
          <ActivePhase
            scenario={scenario}
            theme={theme}
            transcript={transcript}
            transcriptRef={transcriptRef}
            onEnd={handleEndTraining}
            canEnd={canEndCall}
            duration={duration}
            callStatus={callStatus}
          />
        )}

        {sessionPhase === 'completed' && (
          <CompletedPhase
            session={session}
            feedback={feedback}
            theme={theme}
            isAnalyzing={isAnalyzing}
            feedbackLoaded={feedbackLoaded}
            transcript={transcript}
            duration={duration}
            onBackToDashboard={handleBackToDashboard}
            onRetry={resetSession}
          />
        )}
      </div>
    </div>
  );
};

// Setup Phase Component
const SetupPhase = ({ scenario, theme, onStart, isLoading, error, canStart }) => (
  <div className="text-center space-y-8">
    <div className={`${theme.bg.card} p-8 rounded-lg max-w-2xl mx-auto`}>
      {/* Scenario Info */}
      <div className="mb-6">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${theme.isDark ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}>
          <span className="text-2xl text-white font-bold">
            {scenario?.name?.charAt(0) || 'T'}
          </span>
        </div>
        <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>
          Ready to start training?
        </h2>
        <p className={`text-lg ${theme.text.secondary} mb-6`}>
          {scenario?.name || 'Click the call button to begin your training session'}
        </p>
      </div>

      {/* Scenario Details */}
      {scenario && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg mb-6 text-left`}>
          <div className="text-center">
            <h4 className={`font-semibold ${theme.text.primary} mb-2`}>Training Scenario:</h4>
            <p className={`text-sm ${theme.text.secondary}`}>
              {scenario.name}
            </p>
            {scenario.difficulty_level && (
              <p className={`text-xs ${theme.text.muted} mt-1`}>
                Difficulty: {scenario.difficulty_level}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Round Call Button */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={onStart}
          disabled={!canStart || isLoading}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isLoading
            ? 'bg-yellow-500 animate-pulse'
            : 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl'
            }`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          ) : (
            <Phone className="w-8 h-8 text-white" />
          )}
        </button>

        <div className="text-center">
          <p className={`text-lg font-semibold ${theme.text.primary} mb-1`}>
            {isLoading ? 'Connecting...' : 'Start Training Call'}
          </p>
          <p className={`text-sm ${theme.text.secondary}`}>
            Click the call button to begin your training session
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Active Phase Component
const ActivePhase = ({ scenario, theme, transcript, transcriptRef, onEnd, canEnd, duration, callStatus }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* AI Persona Display */}
    <div className="lg:col-span-1">
      <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} text-center sticky top-8`}>
        <div className="mb-4">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${theme.isDark ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}>
            <span className="text-3xl text-white font-bold">
              {scenario?.name?.charAt(0) || 'T'}
            </span>
          </div>
        </div>

        <h3 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>
          AI Sales Prospect
        </h3>
        <p className={`text-sm ${theme.text.secondary} mb-6`}>
          {scenario?.description || scenario?.generated_scenario_description || 'Training scenario'}
        </p>

        {/* Call Status */}
        <div className="mb-6">
          <div className={`flex items-center justify-center space-x-2 mb-2`}>
            <div className={`w-3 h-3 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            <span className={`text-sm ${theme.text.secondary}`}>
              {callStatus === 'connected' ? 'Live Call' : 'Connecting...'}
            </span>
          </div>

          {/* Voice Activity Indicator */}
          <div className="flex justify-center items-center space-x-1 h-8">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${callStatus === 'connected'
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-300'
                  }`}
                style={{
                  height: callStatus === 'connected'
                    ? `${20 + Math.sin(Date.now() * 0.01 + i) * 10}px`
                    : '8px',
                  animationDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>
        </div>

        {/* Session Info */}
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg mb-6`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${theme.text.secondary}`}>Duration:</span>
            <span className={`text-sm font-mono ${theme.text.primary}`}>
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${theme.text.secondary}`}>Messages:</span>
            <span className={`text-sm font-mono ${theme.text.primary}`}>
              {transcript.length}
            </span>
          </div>
        </div>

        {/* Round End Call Button */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={onEnd}
            disabled={!canEnd}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white transition-all duration-200 transform hover:scale-110 disabled:transform-none flex items-center justify-center shadow-lg hover:shadow-xl"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <p className={`text-sm font-medium ${theme.text.primary}`}>
            End Call
          </p>
        </div>
      </div>
    </div>

    {/* Live Transcript */}
    <div className="lg:col-span-2">
      <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden h-[600px] flex flex-col`}>
        {/* Transcript Header */}
        <div className={`px-6 py-4 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${theme.text.primary} flex items-center space-x-2`}>
              <MessageSquare className="w-5 h-5" />
              <span>Live Conversation</span>
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className={`text-sm ${theme.text.secondary}`}>
                {callStatus === 'connected' ? 'Recording' : 'Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {transcript.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mic className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
                <p className={`${theme.text.secondary}`}>
                  {callStatus === 'connected'
                    ? 'Start speaking to begin the conversation...'
                    : 'Waiting for connection...'
                  }
                </p>
              </div>
            </div>
          ) : (
            transcript.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-md px-4 py-3 rounded-lg ${message.role === 'user'
                    ? `${theme.button.primary} text-white`
                    : `${theme.isDark ? 'bg-white/10' : 'bg-gray-100'} ${theme.text.primary}`
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">
                      {message.role === 'user' ? 'You' : (scenario?.persona_name || 'AI Prospect')}
                    </span>
                    <span className={`text-xs ${message.role === 'user' ? 'text-white/70' : theme.text.muted
                      }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Status Bar */}
        <div className={`px-6 py-3 border-t ${theme.isDark ? 'border-white/10' : 'border-gray-200'} ${theme.isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-green-500" />
              <span className={`text-sm ${theme.text.secondary}`}>
                Voice conversation active - speak naturally
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Completed Phase Component
const CompletedPhase = ({ session, feedback, theme, isAnalyzing, feedbackLoaded, transcript, duration, onBackToDashboard, onRetry }) => (
  <div className="space-y-8">
    {isAnalyzing ? (
      // Analysis in progress
      <div className={`${theme.bg.card} p-8 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} max-w-4xl mx-auto text-center`}>
        <div className="mb-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${theme.isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        </div>
        <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>
          Analyzing Your Performance
        </h2>
        <p className={`text-lg ${theme.text.secondary} mb-6`}>
          Our AI is evaluating your conversation against the success criteria...
        </p>
        <div className="space-y-2">
          <div className={`h-2 ${theme.isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className={`text-sm ${theme.text.muted}`}>
            Processing transcript and evaluating performance metrics...
          </p>
        </div>
      </div>
    ) : feedbackLoaded && feedback ? (
      // Feedback loaded - show SessionFeedback component
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
            Training Session Complete!
          </h2>
          <p className={`text-lg ${theme.text.secondary}`}>
            Great job! Here's your detailed performance analysis.
          </p>
        </div>

        <SessionFeedback
          feedback={feedback}
          session={session}
          transcript={transcript}
          duration={duration}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={onBackToDashboard}
            className={`${theme.button.primary} px-8 py-3 rounded-md font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={onRetry}
            className={`${theme.button.secondary} px-8 py-3 rounded-md font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2`}
          >
            <Play className="w-5 h-5" />
            <span>Practice Again</span>
          </button>
        </div>
      </div>
    ) : (
      // Feedback not available - show fallback
      <div className={`${theme.bg.card} p-8 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} max-w-4xl mx-auto text-center`}>
        <div className="mb-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${theme.isDark ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}>
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>
          Session Complete
        </h2>

        <p className={`text-lg ${theme.text.secondary} mb-8`}>
          Your session has ended, but detailed feedback is still being processed.
        </p>

        {/* Session Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className={`font-semibold ${theme.text.primary} mb-1`}>Duration</h3>
            <p className={`text-2xl font-bold ${theme.text.primary}`}>
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </p>
          </div>

          <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
            </div>
            <h3 className={`font-semibold ${theme.text.primary} mb-1`}>Messages</h3>
            <p className={`text-2xl font-bold ${theme.text.primary}`}>
              {transcript.length}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBackToDashboard}
            className={`${theme.button.primary} px-8 py-3 rounded-md font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={onRetry}
            className={`${theme.button.secondary} px-8 py-3 rounded-md font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2`}
          >
            <Play className="w-5 h-5" />
            <span>Practice Again</span>
          </button>
        </div>
      </div>
    )}
  </div>
);

export default VapiSessionInterface;
