import { useState, useRef, useEffect } from 'react'
import { api } from '../utils/api'
import {
  Wand2, BookOpen, Info, Loader2, CheckCircle2,
  Plus, X, Edit, Trash2, Target, Clock
} from 'lucide-react'

const PlaybookGenerationTab = ({
  playbooks,
  theme,
  scenarioTypes,
  difficultyLevels,
  formatScenarioType,
  isGenerating,
  setIsGenerating,
  generationResults,
  setGenerationResults,
  setError,
  workspaceId
}) => {
  const [selectedPlaybooks, setSelectedPlaybooks] = useState([])
  const [selectedTypes, setSelectedTypes] = useState(['cold_call'])
  const [customType, setCustomType] = useState('')
  const [showCustomType, setShowCustomType] = useState(false)
  const [difficulty, setDifficulty] = useState('INTERMEDIATE')
  const [scenarioCount, setScenarioCount] = useState(1)
  const [description, setDescription] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [generationStatus, setGenerationStatus] = useState(null)
  const pollingRef = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const pollScenarios = async (scenarioIds, jobId) => {
    setGenerationStatus('polling')
    let resolved = false

    const poll = async () => {
      try {
        const results = await Promise.all(
          scenarioIds.map(id => api.getScenario(id, workspaceId))
        )

        const allDone = results.every(
          s => s.scenario_status !== 'GENERATING'
        )

        if (allDone) {
          resolved = true
          if (pollingRef.current) clearInterval(pollingRef.current)
          pollingRef.current = null
          setGenerationResults(results)
          setGenerationStatus('complete')
          setIsGenerating(false)
          setShowResults(true)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    await poll()
    if (!resolved) {
      pollingRef.current = setInterval(poll, 3000)

      setTimeout(() => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          setGenerationStatus('error')
          setIsGenerating(false)
          setError('Scenario generation timed out. Check your scenarios list for results.')
        }
      }, 5 * 60 * 1000)
    }
  }

  const handlePlaybookToggle = (playbookId) => {
    setSelectedPlaybooks(prev =>
      prev.includes(playbookId)
        ? prev.filter(id => id !== playbookId)
        : [...prev, playbookId]
    )
  }

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleAddCustomType = () => {
    if (customType.trim() && !selectedTypes.includes(customType.trim())) {
      setSelectedTypes(prev => [...prev, customType.trim()])
      setCustomType('')
      setShowCustomType(false)
    }
  }

  const handleRemoveType = (type) => {
    setSelectedTypes(prev => prev.filter(t => t !== type))
  }

  const handleGenerate = async () => {
    if (!workspaceId) {
      setError('No workspace selected. Please select a workspace first.')
      return
    }

    if (selectedPlaybooks.length === 0) {
      setError('Please select at least one playbook')
      return
    }

    if (selectedTypes.length === 0) {
      setError('Please select at least one scenario type')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const generationRequest = {
        playbook_ids: selectedPlaybooks,
        scenario_type: selectedTypes,
        difficulty_level: difficulty,
        n_scenarios: scenarioCount,
        user_scenario_description: description.trim() || null
      }

      const response = await api.generateScenarios(workspaceId, generationRequest)

      // Response is now a job response: { job_id, scenario_ids, status, message, n_scenarios }
      await pollScenarios(response.scenario_ids, response.job_id)
    } catch (err) {
      console.error('Generation failed:', err)
      setError('Failed to generate scenarios. Please try again.')
      setIsGenerating(false)
    }
  }

  const handleEditScenario = (scenarioId) => {
    // TODO: Implement scenario editing
    console.log('Edit scenario:', scenarioId)
  }

  const handleDeleteScenario = async (scenarioId) => {
    try {
      await api.deleteScenario(workspaceId, scenarioId)
      setGenerationResults(prev => prev.filter(s => s.id !== scenarioId))
    } catch (err) {
      setError('Failed to delete scenario')
    }
  }

  const PlaybookCard = ({ playbook, isSelected, onToggle }) => (
    <div
      onClick={() => onToggle(playbook.id)}
      className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${isSelected
        ? `border-blue-500 ${theme.isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`
        : `border-gray-200 dark:border-gray-700 ${theme.bg.card} ${theme.hover.card}`
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <h4 className={`font-medium ${theme.text.primary} mb-1 break-words`}>
            {playbook.name}
          </h4>
          <p className={`text-sm ${theme.text.secondary} line-clamp-2 mb-2 break-words`}>
            {playbook.description || 'No description available'}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${playbook.rawStatus === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
              {playbook.status}
            </span>
            <span className={`text-xs ${theme.text.muted}`}>
              {playbook.file_type?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isSelected
          ? 'border-blue-500 bg-blue-500 shadow-lg'
          : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700'
          }`}>
          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>
    </div>
  )

  const GeneratedScenarioCard = ({ scenario }) => (
    <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>
            {scenario.name}
          </h4>
          <div className="flex items-center space-x-2 mb-3">
            {scenario.scenario_type?.map((type, index) => (
              <span
                key={index}
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800'}`}
              >
                {formatScenarioType(type)}
              </span>
            ))}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditScenario(scenario.id)}
            className={`text-sm ${theme.text.accent} ${theme.hover.link} flex items-center space-x-1`}
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDeleteScenario(scenario.id)}
            className="text-sm text-red-600 hover:text-red-900 flex items-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <p className={`text-sm ${theme.text.secondary} mb-4 line-clamp-3`}>
        {scenario.description || scenario.generated_scenario_description}
      </p>

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

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
            <Target className="w-3 h-3" />
            <span>{scenario.scenario_playbooks?.length || 0} playbook(s)</span>
          </span>
          {scenario.estimated_duration_minutes && (
            <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
              <Clock className="w-3 h-3" />
              <span>{scenario.estimated_duration_minutes}min</span>
            </span>
          )}
        </div>
        <button className={`${theme.button.primary} px-4 py-2 rounded-md text-sm font-medium`}>
          Use Scenario
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {!showResults ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>Generate from Playbooks</h2>
            <p className={`${theme.text.secondary}`}>
              Select your playbooks and let AI create realistic training scenarios based on your sales methodology.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedPlaybooks.length > 0
                  ? 'bg-blue-500 text-white'
                  : `${theme.bg.secondary} ${theme.text.secondary}`
                  }`}>
                  1
                </div>
                <span className={`ml-2 text-sm font-medium ${theme.text.primary}`}>Select Playbooks</span>
              </div>
              <div className={`w-8 h-0.5 ${selectedPlaybooks.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedPlaybooks.length > 0 && selectedTypes.length > 0
                  ? 'bg-blue-500 text-white'
                  : `${theme.bg.secondary} ${theme.text.secondary}`
                  }`}>
                  2
                </div>
                <span className={`ml-2 text-sm font-medium ${theme.text.primary}`}>Configure</span>
              </div>
              <div className={`w-8 h-0.5 ${selectedPlaybooks.length > 0 && selectedTypes.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${theme.bg.secondary} ${theme.text.secondary}`}>
                  3
                </div>
                <span className={`ml-2 text-sm font-medium ${theme.text.primary}`}>Generate</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              {/* Playbook Selection - Takes up 3 columns on xl screens */}
              <div className="xl:col-span-3">
                <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xl font-semibold ${theme.text.primary}`}>
                        Choose Your Playbooks
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${theme.text.secondary}`}>
                          {selectedPlaybooks.length} of {playbooks.length} selected
                        </span>
                        {selectedPlaybooks.length > 0 && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${theme.text.secondary} mt-2`}>
                      Select the playbooks you want to use as the foundation for your training scenarios
                    </p>
                  </div>

                  <div className="p-6">
                    {playbooks.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                        {playbooks.map((playbook) => (
                          <PlaybookCard
                            key={playbook.id}
                            playbook={playbook}
                            isSelected={selectedPlaybooks.includes(playbook.id)}
                            onToggle={handlePlaybookToggle}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
                        <h4 className={`text-lg font-medium ${theme.text.primary} mb-2`}>No Playbooks Available</h4>
                        <p className={`${theme.text.secondary} max-w-sm mx-auto`}>
                          Upload playbooks first to generate scenarios based on your sales methodology.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuration Panel - Takes up 2 columns */}
              <div className="xl:col-span-2">
                <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden sticky top-4`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`text-xl font-semibold ${theme.text.primary}`}>
                      Configuration
                    </h3>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>
                      Customize your scenario generation settings
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Scenario Types Section */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <h4 className={`text-sm font-semibold ${theme.text.primary}`}>Scenario Types</h4>
                        <Info className="w-4 h-4 text-gray-400" title="Select the types of sales scenarios you want to generate" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {scenarioTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => handleTypeToggle(type)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTypes.includes(type)
                              ? 'bg-blue-500 text-white shadow-sm'
                              : `${theme.bg.secondary} ${theme.text.secondary} hover:${theme.bg.hover} hover:scale-105`
                              }`}
                          >
                            {formatScenarioType(type)}
                          </button>
                        ))}
                      </div>

                      {/* Custom Type Input */}
                      {showCustomType ? (
                        <div className="flex space-x-2 mb-3">
                          <input
                            type="text"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="Enter custom type..."
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomType()}
                          />
                          <button
                            onClick={handleAddCustomType}
                            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowCustomType(false)}
                            className={`px-3 py-2 text-sm rounded-lg ${theme.button.secondary}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCustomType(true)}
                          className={`text-sm ${theme.text.accent} ${theme.hover.link} flex items-center space-x-1 mb-3`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add custom type</span>
                        </button>
                      )}

                      {/* Selected Types Display */}
                      {selectedTypes.length > 0 && (
                        <div>
                          <p className={`text-xs ${theme.text.muted} mb-2`}>Selected ({selectedTypes.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedTypes.map(type => (
                              <span
                                key={type}
                                className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              >
                                {formatScenarioType(type)}
                                <button
                                  onClick={() => handleRemoveType(type)}
                                  className="ml-1 hover:text-blue-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Generation Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
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
                        <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>
                          Count
                        </label>
                        <select
                          value={scenarioCount}
                          onChange={(e) => setScenarioCount(parseInt(e.target.value))}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num} scenario{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Optional Description */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <h4 className={`text-sm font-semibold ${theme.text.primary}`}>Additional Context</h4>
                        <Info className="w-4 h-4 text-gray-400" title="Provide specific details about personas, settings, or circumstances" />
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe specific persona details, business context, or circumstances you want included..."
                        rows={4}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${theme.isDark
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                      />
                      <p className={`text-xs ${theme.text.muted} mt-2 leading-relaxed`}>
                        💡 <strong>Tip:</strong> Include persona role, company size, industry, specific challenges, or objections for more realistic scenarios.
                      </p>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || selectedPlaybooks.length === 0}
                      className={`w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{generationStatus === 'polling' ? 'AI is generating scenarios...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Results View */
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>Generated Scenarios</h2>
              <p className={`${theme.text.secondary}`}>
                {generationResults.length} scenario(s) generated successfully
              </p>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className={`${theme.button.secondary} px-4 py-2 rounded-lg font-medium`}
            >
              Generate More
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {generationResults.map((scenario) => (
              <GeneratedScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaybookGenerationTab
