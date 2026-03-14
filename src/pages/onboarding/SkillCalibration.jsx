import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { Mic, Square, Play, RotateCcw, Send, ChevronDown } from 'lucide-react'

const PRACTICE_CONTEXTS = {
  'elevator-pitch': {
    label: 'Elevator Pitch',
    instruction: 'You have 30 seconds to introduce yourself and what you do.',
    duration: 30
  },
  'difficult-conversation': {
    label: 'Difficult Conversation',
    instruction: 'Practice delivering bad news to a client constructively.',
    duration: 30
  },
  'public-speaking': {
    label: 'Public Speaking Intro',
    instruction: 'Record the opening 30 seconds of a keynote speech.',
    duration: 30
  }
}

const SkillCalibration = () => {
  const theme = useTheme()
  const navigate = useNavigate()

  const [selectedContext, setSelectedContext] = useState('elevator-pitch')
  const [recordingState, setRecordingState] = useState('idle') // 'idle' | 'recording' | 'review'
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const timerRef = useRef(null)
  const maxDuration = PRACTICE_CONTEXTS[selectedContext].duration

  // Timer logic
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= maxDuration) {
            handleStopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recordingState, maxDuration])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = () => {
    setRecordingState('recording')
    setElapsedTime(0)
    console.log('Recording started...')
  }

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRecordingState('review')
    console.log('Recording stopped')
  }

  const handlePlayRecording = () => {
    setIsPlaying(true)
    console.log('Playing recording...')
    // Mock playback
    setTimeout(() => setIsPlaying(false), 2000)
  }

  const handleReRecord = () => {
    setRecordingState('idle')
    setElapsedTime(0)
    setIsPlaying(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    console.log('Audio submitted')
    // Mock submission delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    navigate('/dashboard')
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const currentContext = PRACTICE_CONTEXTS[selectedContext]

  return (
    <div className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className={`w-full max-w-xl ${theme.bg.card} rounded-2xl p-8 shadow-lg`}>
          {/* Header */}
          <h1 className={`text-2xl font-bold text-center mb-2 ${theme.text.primary}`}>
            Let's set your baseline
          </h1>
          <p className={`text-center mb-8 ${theme.text.secondary}`}>
            Record a short clip so our AI can personalize your training.
          </p>

          {/* Context Selector */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
              What do you want to practice?
            </label>
            <div className="relative">
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                disabled={recordingState !== 'idle'}
                className={`w-full appearance-none ${theme.bg.secondary} ${theme.text.primary} border ${theme.isDark ? 'border-white/10' : 'border-gray-200'
                  } rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50`}
              >
                {Object.entries(PRACTICE_CONTEXTS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.text.muted} pointer-events-none`} />
            </div>
          </div>

          {/* Instruction Box */}
          <div className={`mb-8 p-4 rounded-xl border ${theme.isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
            }`}>
            <p className={`text-center ${theme.isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {currentContext.instruction}
            </p>
          </div>

          {/* Recording Interface */}
          <div className="flex flex-col items-center mb-8">
            {recordingState === 'idle' && (
              <button
                onClick={handleStartRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/30"
              >
                <Mic className="w-8 h-8" />
              </button>
            )}

            {recordingState === 'recording' && (
              <div className="flex flex-col items-center space-y-4">
                {/* Timer */}
                <div className={`text-2xl font-mono ${theme.text.primary}`}>
                  <span className="text-red-500">{formatTime(elapsedTime)}</span>
                  <span className={theme.text.muted}> / {formatTime(maxDuration)}</span>
                </div>

                {/* Pulsating indicator */}
                <div className="relative">
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-red-500/30 animate-ping" />
                  <button
                    onClick={handleStopRecording}
                    className="relative w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                </div>

                <p className={`text-sm ${theme.text.muted}`}>Recording... Click to stop</p>
              </div>
            )}

            {recordingState === 'review' && (
              <div className="flex flex-col items-center space-y-4 w-full">
                {/* Recording info */}
                <div className={`text-lg ${theme.text.primary}`}>
                  Recording: {formatTime(elapsedTime)}
                </div>

                {/* Control buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayRecording}
                    disabled={isPlaying}
                    className={`w-12 h-12 rounded-full ${theme.button.secondary} flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50`}
                  >
                    <Play className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                  </button>

                  <button
                    onClick={handleReRecord}
                    className={`w-12 h-12 rounded-full ${theme.button.secondary} flex items-center justify-center transition-all duration-300 hover:scale-105`}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold flex items-center space-x-2 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
                  </button>
                </div>
              </div>
            )}

            {recordingState === 'idle' && (
              <p className={`mt-4 text-sm ${theme.text.muted}`}>
                Click to start recording
              </p>
            )}
          </div>

          {/* Skip Link */}
          <div className="text-center">
            <button
              onClick={handleSkip}
              className={`text-sm ${theme.text.muted} hover:${theme.text.secondary} underline transition-colors`}
            >
              Skip - I'll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillCalibration

