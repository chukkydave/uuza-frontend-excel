import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { api } from '../utils/api'
import { X, Mail, UserPlus, CheckCircle, AlertCircle } from 'lucide-react'

const InviteTraineeModal = ({ isOpen, onClose, onInviteSuccess }) => {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await api.inviteUser({ email: email.trim() })
      console.log('Invitation response:', response)

      setSuccess(true)
      setEmail('')

      // Call success callback to refresh trainees list
      if (onInviteSuccess) {
        onInviteSuccess(response)
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Failed to send invitation:', error)

      // Extract error message from different possible error structures
      let errorMessage = 'Failed to send invitation. Please try again.'

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setError(null)
    setSuccess(false)
    setIsLoading(false)
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} w-full max-w-md shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.isDark ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text.primary}`}>
                Invite Trainee
              </h2>
              <p className={`text-sm ${theme.text.secondary}`}>
                Send an invitation to join your team
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-md ${theme.text.secondary} ${theme.hover.link} transition-colors`}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success State
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
                Invitation Sent!
              </h3>
              <p className={`text-sm ${theme.text.secondary} mb-4`}>
                The trainee will receive an email invitation to join your team.
              </p>
              <div className={`${theme.isDark ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200 dark:border-green-800 rounded-lg p-3`}>
                <p className={`text-sm text-green-700 dark:text-green-300`}>
                  <strong>Next steps:</strong> The invited user will receive an Auth0 invitation email and can sign up to join your organization.
                </p>
              </div>
            </div>
          ) : (
            // Invite Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 ${theme.text.muted}`} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainee@company.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${theme.isDark
                        ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
                      }`}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              )}

              {/* Info */}
              <div className={`${theme.isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border border-blue-200 dark:border-blue-800 rounded-lg p-3`}>
                <p className={`text-sm text-blue-700 dark:text-blue-300`}>
                  <strong>How it works:</strong> The trainee will receive an Auth0 invitation email.
                  Once they accept and sign up, they'll automatically be added to your organization
                  and can access the training scenarios.
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 px-4 py-2 border rounded-md font-medium transition-colors ${theme.isDark
                      ? 'border-white/20 text-gray-300 hover:bg-white/5'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className={`flex-1 ${theme.button.primary} px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default InviteTraineeModal
