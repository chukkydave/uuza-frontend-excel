import { useState, useCallback, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { api } from '../utils/api';

// Ringing sound functionality
const playRingingSound = () => {
  // Create a simple ringing tone using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);

  // Play a second ring
  setTimeout(() => {
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator2.type = 'sine';

    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.5);
  }, 600);
};

export const useVapiSession = (scenarioId, workspaceId) => {
  const [vapi, setVapi] = useState(null);
  const [session, setSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [state, setState] = useState({
    isSessionActive: false,
    isLoading: false,
    error: null,
    callStatus: 'idle', // idle, connecting, connected, ended
    transcript: [],
    isAnalyzing: false,
    feedbackLoaded: false
  });

  const transcriptRef = useRef([]);
  const sessionRef = useRef(null);

  // Initialize Vapi instance
  useEffect(() => {
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const baseUrl = import.meta.env.VITE_VAPI_BASE_URL;

    if (!publicKey) {
      setState(prev => ({ ...prev, error: 'Vapi public key not configured' }));
      return;
    }

    const vapiInstance = new Vapi(publicKey, baseUrl);
    setVapi(vapiInstance);

    // Event handlers
    const handleCallStart = () => {
      console.log('Call started');
      setState(prev => ({
        ...prev,
        isSessionActive: true,
        isLoading: false,
        callStatus: 'connected',
        error: null
      }));
    };

    const handleCallEnd = (callData) => {
      console.log('Call ended');

      setState(prev => ({
        ...prev,
        isSessionActive: false,
        isLoading: false,
        callStatus: 'ended',
        isAnalyzing: true
      }));

      // Trigger session analysis
      if (sessionRef.current) {
        handleSessionComplete();
      }
    };

    const handleError = (error) => {
      console.error('Vapi error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Call failed',
        isLoading: false,
        callStatus: 'idle'
      }));
    };

    const handleMessage = (message) => {
      if (message.type === 'transcript') {
        const newEntry = {
          id: Date.now() + Math.random(),
          role: message.role, // 'user' or 'assistant'
          content: message.transcript,
          timestamp: new Date().toISOString(),
          transcriptType: message.transcriptType || 'final'
        };

        // Only add final transcripts to avoid duplicates
        if (message.transcriptType === 'final') {
          transcriptRef.current = [...transcriptRef.current, newEntry];
          setState(prev => ({
            ...prev,
            transcript: [...transcriptRef.current]
          }));
        }
      }
    };

    const handleSpeechStart = () => {
      console.log('Speech started');
    };

    const handleSpeechEnd = () => {
      console.log('Speech ended');
    };

    // Register event listeners
    vapiInstance.on('call-start', handleCallStart);
    vapiInstance.on('call-end', handleCallEnd);
    vapiInstance.on('error', handleError);
    vapiInstance.on('message', handleMessage);
    vapiInstance.on('speech-start', handleSpeechStart);
    vapiInstance.on('speech-end', handleSpeechEnd);

    return () => {
      // Cleanup event listeners
      vapiInstance.off('call-start', handleCallStart);
      vapiInstance.off('call-end', handleCallEnd);
      vapiInstance.off('error', handleError);
      vapiInstance.off('message', handleMessage);
      vapiInstance.off('speech-start', handleSpeechStart);
      vapiInstance.off('speech-end', handleSpeechEnd);
    };
  }, []);

  // Start training session with backend (creates session and gets assistant config)
  const startTrainingSession = useCallback(async () => {
    if (!scenarioId) {
      throw new Error('Scenario ID is required');
    }

    try {
      console.log('Starting training session for scenario:', scenarioId);
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Call the start-training endpoint which returns session_id and assistant_config
      console.log('Calling /sessions/start-training endpoint...');
      const params = workspaceId ? new URLSearchParams({ workspace_id: workspaceId }) : '';
      const trainingData = await api.request(`/sessions/start-training${params ? `?${params.toString()}` : ''}`, {
        method: 'POST',
        body: JSON.stringify({
          scenario_id: scenarioId
        })
      });

      console.log('Received training data:', trainingData);
      console.log('Session metadata:', trainingData.session_metadata);

      // The assistant_config is stored in session_metadata, not as a direct property
      const assistantConfig = trainingData.session_metadata?.assistant_config;
      if (!assistantConfig) {
        console.error('No assistant_config found. Available keys:', Object.keys(trainingData));
        console.error('Session metadata keys:', trainingData.session_metadata ? Object.keys(trainingData.session_metadata) : 'No session_metadata');
        throw new Error('No assistant configuration found in session response');
      }

      // trainingData is a SessionResponse with id, assistant_config property, etc.
      const sessionData = {
        id: trainingData.id, // Use the session id directly
        scenario_id: scenarioId,
        assistant_config: assistantConfig,
        session_metadata: trainingData.session_metadata // Keep metadata for scenario info
      };

      console.log('Created session data:', sessionData);
      setSession(sessionData);
      sessionRef.current = sessionData;

      return sessionData;
    } catch (error) {
      console.error('Failed to start training session:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.status);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start training session',
        isLoading: false
      }));
      throw error;
    }
  }, [scenarioId, workspaceId]);

  // Start call with dynamic assistant
  const startCall = useCallback(async () => {
    if (!vapi) {
      setState(prev => ({ ...prev, error: 'Vapi not initialized' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, callStatus: 'connecting' }));

      // Start training session if not exists (this gets session_id and assistant_config)
      let currentSession = session;
      if (!currentSession) {
        currentSession = await startTrainingSession();
      }

      if (!currentSession.assistant_config) {
        throw new Error('No assistant configuration available for this scenario');
      }

      // Play ringing sound
      playRingingSound();

      console.log('=== ASSISTANT CONFIG BEING SENT TO VAPI ===');
      console.log(JSON.stringify(currentSession.assistant_config, null, 2));

      // Start Vapi call with dynamic assistant configuration
      await vapi.start(currentSession.assistant_config);

    } catch (error) {
      console.error('Failed to start call:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start call',
        isLoading: false,
        callStatus: 'idle'
      }));
    }
  }, [vapi, session, startTrainingSession]);

  // End call
  const endCall = useCallback(async () => {
    if (!vapi) return;

    try {
      // Stop the Vapi call - this will trigger the call-end event
      vapi.stop();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [vapi]);

  // Handle session completion and analysis
  const handleSessionComplete = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      setState(prev => ({ ...prev, isAnalyzing: true }));

      // Wait for Vapi webhook to process and save feedback
      // Check status first to avoid unnecessary 404s
      const maxAttempts = 12;
      const pollInterval = 10000; // 10 seconds
      let attempts = 0;
      let feedbackData = null;

      while (attempts < maxAttempts && !feedbackData) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
          // Check status first
          const wsParams = workspaceId ? `?workspace_id=${workspaceId}` : '';
          const statusData = await api.request(`/sessions/${sessionRef.current.id}/status${wsParams}`);

          console.log(`Poll attempt ${attempts + 1}/${maxAttempts}:`, {
            sessionStatus: statusData.status,
            feedbackStatus: statusData.feedback_status,
            feedbackAvailable: statusData.feedback_available,
            processing: statusData.processing
          });

          if (statusData.feedback_available) {
            try {
              const fbParams = workspaceId ? `?workspace_id=${workspaceId}` : '';
              feedbackData = await api.request(`/sessions/${sessionRef.current.id}/feedback${fbParams}`);
              console.log('✓ Feedback received successfully');
            } catch (error) {
              // Handle 202 (still processing)
              if (error.status === 202) {
                console.log('Feedback still processing, continuing poll...');
                continue;
              }
              throw error; // Other errors should stop polling
            }
          } else if (statusData.feedback_status === 'ERROR') {
            console.error('AI analysis failed, stopping poll');
            throw new Error('Feedback generation failed');
          } else {
            console.log(`AI analysis in progress... (${attempts + 1}/${maxAttempts})`);
          }
        } catch (error) {
          console.log(`Polling attempt ${attempts + 1}/${maxAttempts} failed:`, error.message);
        }

        attempts++;
      }

      if (feedbackData) {
        setFeedback(feedbackData);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          feedbackLoaded: true
        }));
      } else {
        // Feedback not available after max attempts
        console.warn('Feedback not available after polling');
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          feedbackLoaded: false,
          error: 'Feedback is taking longer than expected. Please refresh the page.'
        }));
      }

      return feedbackData;
    } catch (error) {
      console.error('Failed to complete session analysis:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        feedbackLoaded: false,
        error: 'Failed to analyze session performance'
      }));
    }
  }, []);

  // Get session transcript
  const getTranscript = useCallback(async () => {
    if (!sessionRef.current) return null;

    try {
      const wsParams = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const transcript = await api.request(`/sessions/${sessionRef.current.id}/transcript${wsParams}`);
      return transcript;
    } catch (error) {
      console.error('Failed to get transcript:', error);
      return null;
    }
  }, []);

  // Get feedback manually (if needed)
  const getFeedback = useCallback(async () => {
    if (!sessionRef.current) return null;

    try {
      const wsParams = workspaceId ? `?workspace_id=${workspaceId}` : '';
      const feedbackData = await api.request(`/sessions/${sessionRef.current.id}/feedback${wsParams}`);
      setFeedback(feedbackData);
      setState(prev => ({ ...prev, feedbackLoaded: true }));
      return feedbackData;
    } catch (error) {
      console.error('Failed to get feedback:', error);
      return null;
    }
  }, [workspaceId]);

  // Reset session
  const resetSession = useCallback(() => {
    setSession(null);
    setFeedback(null);
    sessionRef.current = null;
    transcriptRef.current = [];
    setState({
      isSessionActive: false,
      isLoading: false,
      error: null,
      callStatus: 'idle',
      transcript: [],
      isAnalyzing: false,
      feedbackLoaded: false
    });
  }, []);

  return {
    // State
    ...state,
    session,
    feedback,

    // Actions
    startTrainingSession,
    startCall,
    endCall,
    getTranscript,
    getFeedback,
    resetSession,

    // Computed
    canStartCall: !state.isSessionActive && !state.isLoading && vapi,
    canEndCall: state.isSessionActive && !state.isLoading,
    hasTranscript: state.transcript.length > 0,
    hasFeedback: state.feedbackLoaded && feedback !== null
  };
};
