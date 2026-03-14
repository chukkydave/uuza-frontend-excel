import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import {
  Play, Eye, Clock, Target, Users, Archive, RotateCcw, X
} from 'lucide-react'

const ArchivedScenariosTab = ({
  archivedScenarios,
  theme,
  getDifficultyColor,
  formatScenarioType,
  onScenariosUpdate,
  workspaceId
}) => {
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleViewScenario = (scenario) => {
    setSelectedScenario(scenario)
    setShowModal(true)
  }

  const handleRestoreScenario = (scenario) => {
    setSelectedScenario(scenario)
    setShowRestoreModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setShowRestoreModal(false)
    setSelectedScenario(null)
    setError(null)
  }

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        closeModal()
      }
    }

    if (showModal || showRestoreModal) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleClickOutside)

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showModal, showRestoreModal])

  const handleConfirmRestore = async () => {
    if (!selectedScenario) return

    setIsLoading(true)
    setError(null)

    try {
      await api.updateScenario(workspaceId, selectedScenario.id, { scenario_status: 'ACTIVE' })
      closeModal()
      if (onScenariosUpdate) {
        onScenariosUpdate()
      }
    } catch (err) {
      console.error('Failed to restore scenario:', err)
      setError('Failed to restore scenario. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const ScenarioCard = ({ scenario }) => (
    <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} hover:shadow-lg transition-all duration-200 opacity-75`}>
      {/* Title and Archived Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${theme.text.primary} truncate`}>
            {scenario.name}
          </h3>
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 flex-shrink-0">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button
            onClick={() => handleViewScenario(scenario)}
            className={`p-2 ${theme.text.accent} ${theme.hover.link} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
            title="View scenario"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRestoreScenario(scenario)}
            className="p-2 text-green-600 hover:text-green-900 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Restore scenario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persona */}
      {scenario.persona_name && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-3 rounded-lg mb-4`}>
          <p className={`text-sm font-medium ${theme.text.primary}`}>
            {scenario.persona_name}
          </p>
          {scenario.persona_description && (
            <p className={`text-xs ${theme.text.secondary} mt-1 line-clamp-2`}>
              {scenario.persona_description}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {scenario.estimated_duration_minutes && scenario.estimated_duration_minutes !== null && scenario.estimated_duration_minutes > 0 && (
            <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
              <Clock className="w-3 h-3" />
              <span>{scenario.estimated_duration_minutes}min</span>
            </span>
          )}
          {scenario.skills_targeted && scenario.skills_targeted.length > 0 && (
            <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
              <Users className="w-3 h-3" />
              <span>{scenario.skills_targeted.length} skill(s)</span>
            </span>
          )}
        </div>
        <span className={`text-xs ${theme.text.muted}`}>
          Archived
        </span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Archived Scenarios Section */}
      <div>
        {archivedScenarios.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {archivedScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Archive className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
            <h4 className={`text-lg font-medium ${theme.text.primary} mb-2`}>No Archived Scenarios</h4>
            <p className={`${theme.text.secondary} max-w-sm mx-auto`}>
              Scenarios you archive will appear here. You can restore them anytime.
            </p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <h2 className={`text-xl font-semibold ${theme.text.primary}`}>
                  {selectedScenario.name}
                </h2>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  <Archive className="w-3 h-3 mr-1" />
                  Archived
                </span>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 ${theme.text.secondary} hover:${theme.text.primary} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Scenario Types */}
              {selectedScenario.scenario_type && selectedScenario.scenario_type.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Scenario Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.scenario_type.map((type, index) => (
                      <span
                        key={index}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {formatScenarioType(type)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Level */}
              {selectedScenario.difficulty_level && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Difficulty Level</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(selectedScenario.difficulty_level)}`}>
                    {selectedScenario.difficulty_level?.charAt(0).toUpperCase() + selectedScenario.difficulty_level?.slice(1)}
                  </span>
                </div>
              )}

              {/* Description */}
              {(selectedScenario.description || selectedScenario.generated_scenario_description) && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Description</h3>
                  <p className={`text-sm ${theme.text.secondary}`}>
                    {selectedScenario.description || selectedScenario.generated_scenario_description}
                  </p>
                </div>
              )}

              {/* Persona Information */}
              {selectedScenario.persona_name && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Persona</h3>
                  <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <p className={`font-medium ${theme.text.primary} mb-2`}>
                      {selectedScenario.persona_name}
                    </p>
                    {selectedScenario.persona_description && (
                      <p className={`text-sm ${theme.text.secondary}`}>
                        {selectedScenario.persona_description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center space-x-4">
                  {selectedScenario.estimated_duration_minutes && (
                    <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
                      <Clock className="w-3 h-3" />
                      <span>{selectedScenario.estimated_duration_minutes} minutes</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    closeModal()
                    handleRestoreScenario(selectedScenario)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Scenario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-md w-full`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-green-600" />
                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>
                  Restore Scenario
                </h2>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 ${theme.text.secondary} hover:${theme.text.primary} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <p className={`text-sm ${theme.text.secondary} mb-6`}>
                Are you sure you want to restore "<strong>{selectedScenario.name}</strong>"? This will make it available in the active scenarios list again.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${theme.text.secondary} hover:${theme.text.primary} hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRestore}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchivedScenariosTab
