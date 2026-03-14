import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import {
  Play, Edit, Trash2, Eye, Clock, Target, Users,
  BookOpen, Sparkles, ChevronDown, ChevronUp, X, Save, AlertTriangle, Archive, Plus
} from 'lucide-react'

const SectionHeader = ({ title, count, isExpanded, onToggle, icon: Icon, theme }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between p-4 ${theme.bg.card} rounded-lg border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} hover:shadow-md transition-all duration-200`}
  >
    <div className="flex items-center space-x-3">
      <Icon className={`w-5 h-5 ${theme.text.accent}`} />
      <h2 className={`text-xl font-semibold ${theme.text.primary}`}>
        {title}
      </h2>
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        {count} scenario{count !== 1 ? 's' : ''}
      </span>
    </div>
    {isExpanded ? (
      <ChevronUp className={`w-5 h-5 ${theme.text.secondary}`} />
    ) : (
      <ChevronDown className={`w-5 h-5 ${theme.text.secondary}`} />
    )}
  </button>
)

const AvailableScenariosTab = ({
  defaultScenarios,
  userScenarios,
  theme,
  getDifficultyColor,
  formatScenarioType,
  onScenariosUpdate,
  workspaceId
}) => {
  const navigate = useNavigate()
  const [showDefaultScenarios, setShowDefaultScenarios] = useState(true)
  const [showUserScenarios, setShowUserScenarios] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ]

  const handleViewScenario = (scenario) => {
    setSelectedScenario(scenario)
    setShowModal(true)
  }

  const handleStartTraining = (scenario) => {
    navigate(`/training/${scenario.id}`)
  }

  const handleEditScenario = (scenario) => {
    setSelectedScenario(scenario)
    setEditFormData({
      name: scenario.name || '',
      generated_scenario_description: scenario.generated_scenario_description || '',
      persona_name: scenario.persona_name || '',
      persona_description: scenario.persona_description || '',
      objectives: scenario.objectives || [],
      success_criteria: scenario.success_criteria || [],
      failure_conditions: scenario.failure_conditions || [],
      conversation_starters: scenario.conversation_starters || [],
      skills_targeted: scenario.skills_targeted || [],
      estimated_duration_minutes: scenario.estimated_duration_minutes || 15,
      difficulty_level: scenario.difficulty_level || 'intermediate'
    })
    setShowEditModal(true)
  }

  const handleDeleteScenario = (scenario) => {
    setSelectedScenario(scenario)
    setShowDeleteModal(true)
  }

  const handleArchiveScenario = (scenario) => {
    setSelectedScenario(scenario)
    setShowArchiveModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setShowEditModal(false)
    setShowDeleteModal(false)
    setShowArchiveModal(false)
    setSelectedScenario(null)
    setEditFormData({})
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

    if (showModal || showEditModal || showDeleteModal || showArchiveModal) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleClickOutside)

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showModal, showEditModal, showDeleteModal, showArchiveModal])

  const handleUpdateScenario = async () => {
    if (!selectedScenario) return

    setIsLoading(true)
    setError(null)

    try {
      await api.updateScenario(workspaceId, selectedScenario.id, editFormData)
      closeModal()
      if (onScenariosUpdate) {
        onScenariosUpdate()
      }
    } catch (err) {
      console.error('Failed to update scenario:', err)
      setError('Failed to update scenario. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedScenario) return

    setIsLoading(true)
    setError(null)

    try {
      await api.deleteScenario(workspaceId, selectedScenario.id)
      closeModal()
      if (onScenariosUpdate) {
        onScenariosUpdate()
      }
    } catch (err) {
      console.error('Failed to delete scenario:', err)
      setError('Failed to delete scenario. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmArchive = async () => {
    if (!selectedScenario) return

    setIsLoading(true)
    setError(null)

    try {
      await api.updateScenario(workspaceId, selectedScenario.id, { scenario_status: 'ARCHIVED' })
      closeModal()
      if (onScenariosUpdate) {
        onScenariosUpdate()
      }
    } catch (err) {
      console.error('Failed to archive scenario:', err)
      setError('Failed to archive scenario. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayFieldChange = (field, index, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field, index) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const ScenarioCard = ({ scenario, isUserGenerated = false }) => (
    <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} hover:shadow-lg transition-all duration-200`}>
      {/* Title and Generated Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${theme.text.primary} truncate`}>
            {scenario.name}
          </h3>
          {isUserGenerated && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 flex-shrink-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Generated
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button
            onClick={() => handleViewScenario(scenario)}
            className={`p-2 ${theme.text.accent} ${theme.hover.link} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
          >
            <Eye className="w-4 h-4" />
          </button>
          {isUserGenerated && (
            <>
              <button
                onClick={() => handleEditScenario(scenario)}
                className={`p-2 ${theme.text.accent} ${theme.hover.link} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
                title="Edit scenario"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleArchiveScenario(scenario)}
                className="p-2 text-orange-600 hover:text-orange-900 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20"
                title="Archive scenario"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteScenario(scenario)}
                className="p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete scenario"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats and Start Button */}
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
        <button
          onClick={() => handleStartTraining(scenario)}
          className={`${theme.button.primary} px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 hover:scale-105 transition-transform duration-200`}
        >
          <Play className="w-4 h-4" />
          <span>Start Training</span>
        </button>
      </div>
    </div>
  )



  return (
    <div className="space-y-6">
      {/* Default Scenarios Section */}
      <div>
        <SectionHeader
          title="Default Scenarios"
          count={defaultScenarios.length}
          isExpanded={showDefaultScenarios}
          onToggle={() => setShowDefaultScenarios(!showDefaultScenarios)}
          icon={BookOpen}
          theme={theme}
        />

        {showDefaultScenarios && (
          <div className="mt-4">
            {defaultScenarios.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {defaultScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    isUserGenerated={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
                <h4 className={`text-lg font-medium ${theme.text.primary} mb-2`}>No Default Scenarios</h4>
                <p className={`${theme.text.secondary} max-w-sm mx-auto`}>
                  Default scenarios will appear here when available.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Generated Scenarios Section */}
      <div>
        <SectionHeader
          title="Your Generated Scenarios"
          count={userScenarios.length}
          isExpanded={showUserScenarios}
          onToggle={() => setShowUserScenarios(!showUserScenarios)}
          icon={Sparkles}
          theme={theme}
        />

        {showUserScenarios && (
          <div className="mt-4">
            {userScenarios.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {userScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    isUserGenerated={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
                <h4 className={`text-lg font-medium ${theme.text.primary} mb-2`}>No Generated Scenarios Yet</h4>
                <p className={`${theme.text.secondary} max-w-sm mx-auto`}>
                  Scenarios you create using the generation tabs will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario Detail Modal */}
      {showModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <h2 className={`text-xl font-semibold ${theme.text.primary}`}>
                  {selectedScenario.name}
                </h2>
                {selectedScenario.created_by_user_id && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generated
                  </span>
                )}
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
                    <p className={`text-sm font-medium ${theme.text.primary} mb-1`}>
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

              {/* Objectives */}
              {selectedScenario.objectives && selectedScenario.objectives.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Objectives</h3>
                  <ul className="space-y-1">
                    {selectedScenario.objectives.map((objective, index) => (
                      <li key={index} className={`text-sm ${theme.text.secondary} flex items-start`}>
                        <span className="mr-2">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Targeted */}
              {selectedScenario.skills_targeted && selectedScenario.skills_targeted.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Skills Targeted</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.skills_targeted.map((skill, index) => (
                      <span
                        key={index}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Criteria */}
              {selectedScenario.success_criteria && selectedScenario.success_criteria.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Success Criteria</h3>
                  <ul className="space-y-1">
                    {selectedScenario.success_criteria.map((criteria, index) => (
                      <li key={index} className={`text-sm ${theme.text.secondary} flex items-start`}>
                        <span className="mr-2">✓</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conversation Starters */}
              {selectedScenario.conversation_starters && selectedScenario.conversation_starters.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Conversation Starters</h3>
                  <div className="space-y-2">
                    {selectedScenario.conversation_starters.map((starter, index) => (
                      <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-3 rounded-lg`}>
                        <p className={`text-sm ${theme.text.secondary}`}>"{starter}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center space-x-4">
                  {selectedScenario.estimated_duration_minutes && (
                    <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
                      <Clock className="w-3 h-3" />
                      <span>{selectedScenario.estimated_duration_minutes}min</span>
                    </span>
                  )}
                  {selectedScenario.skills_targeted && selectedScenario.skills_targeted.length > 0 && (
                    <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
                      <Users className="w-3 h-3" />
                      <span>{selectedScenario.skills_targeted.length} skill(s)</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleStartTraining(selectedScenario)}
                  className={`${theme.button.primary} px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 hover:scale-105 transition-transform duration-200`}
                >
                  <Play className="w-4 h-4" />
                  <span>Start Training</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold ${theme.text.primary}`}>
                Edit Scenario
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 ${theme.text.secondary} hover:${theme.text.primary} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Scenario Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Difficulty Level
                    </label>
                    <select
                      value={editFormData.difficulty_level || 'intermediate'}
                      onChange={(e) => handleFormChange('difficulty_level', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                      {difficultyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Estimated Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={editFormData.estimated_duration_minutes || 15}
                      onChange={(e) => handleFormChange('estimated_duration_minutes', parseInt(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                  </div>
                </div>

                {/* Persona Info */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Persona Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.persona_name || ''}
                      onChange={(e) => handleFormChange('persona_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Persona Description
                    </label>
                    <textarea
                      rows="4"
                      value={editFormData.persona_description || ''}
                      onChange={(e) => handleFormChange('persona_description', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Array Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Objectives */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${theme.text.primary}`}>
                      Objectives
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem('objectives')}
                      className={`p-1 ${theme.text.accent} hover:${theme.text.primary} rounded`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editFormData.objectives || []).map((objective, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={objective}
                          onChange={(e) => handleArrayFieldChange('objectives', index, e.target.value)}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          placeholder="Enter objective..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('objectives', index)}
                          className="p-1 text-red-600 hover:text-red-900 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Criteria */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${theme.text.primary}`}>
                      Success Criteria
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem('success_criteria')}
                      className={`p-1 ${theme.text.accent} hover:${theme.text.primary} rounded`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editFormData.success_criteria || []).map((criteria, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={criteria}
                          onChange={(e) => handleArrayFieldChange('success_criteria', index, e.target.value)}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          placeholder="Enter success criteria..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('success_criteria', index)}
                          className="p-1 text-red-600 hover:text-red-900 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Targeted */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${theme.text.primary}`}>
                      Skills Targeted
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem('skills_targeted')}
                      className={`p-1 ${theme.text.accent} hover:${theme.text.primary} rounded`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editFormData.skills_targeted || []).map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleArrayFieldChange('skills_targeted', index, e.target.value)}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          placeholder="Enter skill..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('skills_targeted', index)}
                          className="p-1 text-red-600 hover:text-red-900 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Failure Conditions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${theme.text.primary}`}>
                      Failure Conditions
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem('failure_conditions')}
                      className={`p-1 ${theme.text.accent} hover:${theme.text.primary} rounded`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editFormData.failure_conditions || []).map((condition, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={condition}
                          onChange={(e) => handleArrayFieldChange('failure_conditions', index, e.target.value)}
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          placeholder="Enter failure condition..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('failure_conditions', index)}
                          className="p-1 text-red-600 hover:text-red-900 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Scenario Description
                </label>
                <textarea
                  rows="4"
                  value={editFormData.generated_scenario_description || ''}
                  onChange={(e) => handleFormChange('generated_scenario_description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={closeModal}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${theme.text.secondary} hover:${theme.text.primary} hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateScenario}
                  disabled={isLoading}
                  className={`${theme.button.primary} px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 disabled:opacity-50`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-md w-full`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>
                  Delete Scenario
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
                Are you sure you want to delete "<strong>{selectedScenario.name}</strong>"? This action cannot be undone.
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
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-md w-full`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <Archive className="w-5 h-5 text-orange-600" />
                <h2 className={`text-lg font-semibold ${theme.text.primary}`}>
                  Archive Scenario
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
                Are you sure you want to archive "<strong>{selectedScenario.name}</strong>"? Archived scenarios can be restored later but won't appear in the active scenarios list.
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
                  onClick={handleConfirmArchive}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
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

export default AvailableScenariosTab
