import { useState, useRef, useEffect } from 'react'
import { api } from '../utils/api'
import {
  MessageSquare, Info, Loader2, CheckCircle2,
  Plus, X, Edit, Trash2, Lightbulb
} from 'lucide-react'

const PromptGenerationTab = ({
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
  const [selectedTypes, setSelectedTypes] = useState(['cold_call'])
  const [customType, setCustomType] = useState('')
  const [showCustomType, setShowCustomType] = useState(false)
  const [difficulty, setDifficulty] = useState('INTERMEDIATE')
  const [scenarioCount, setScenarioCount] = useState(1)
  const [description, setDescription] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [generationStatus, setGenerationStatus] = useState(null) // 'polling', 'complete', 'error'
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
        // Don't stop polling on transient errors
      }
    }

    // Poll immediately, then every 3 seconds
    await poll()
    if (!resolved) {
      pollingRef.current = setInterval(poll, 3000)

      // Safety timeout: stop polling after 5 minutes
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

    if (!description.trim()) {
      setError('Please provide a scenario description')
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
        scenario_type: selectedTypes,
        difficulty_level: difficulty,
        n_scenarios: scenarioCount,
        user_scenario_description: description.trim()
      }

      const response = await api.generateScenarios(workspaceId, generationRequest)

      // Response is now a job response: { job_id, scenario_ids, status, message, n_scenarios }
      // Poll the placeholder scenarios until they're done generating
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

  const examplePrompts = [
    {
      title: "Enterprise Software Sale",
      description: "A complex B2B software sale to a Fortune 500 company. The prospect is a CTO who is skeptical about switching from their current solution. They have budget constraints and need to see clear ROI within 6 months."
    },
    {
      title: "Startup Pitch",
      description: "Pitching to a fast-growing startup that needs to scale quickly. The founder is tech-savvy but cost-conscious. They want a solution that can grow with them and won't require extensive training."
    },
    {
      title: "Healthcare Compliance Sale",
      description: "Selling to a healthcare organization that must comply with HIPAA regulations. The decision-maker is risk-averse and needs extensive documentation and security guarantees."
    }
  ]

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
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${scenario.difficulty_level === 'BEGINNER' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              scenario.difficulty_level === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                scenario.difficulty_level === 'ADVANCED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
              {scenario.difficulty_level?.charAt(0).toUpperCase() + scenario.difficulty_level?.slice(1).toLowerCase()}
            </span>
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
        <span className={`text-xs ${theme.text.muted}`}>
          Generated from prompt
        </span>
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
          <div className="mb-6">
            <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>Generate from Description</h2>
            <p className={`${theme.text.secondary}`}>
              Describe your ideal training scenario and let AI create a comprehensive training experience.
            </p>
          </div>

          {/* Generation Form */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Left Column - Example Prompts */}
              <div className="xl:col-span-1">
                <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden sticky top-4`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`text-lg font-semibold ${theme.text.primary} flex items-center space-x-2`}>
                      <Lightbulb className="w-5 h-5" />
                      <span>Examples</span>
                    </h3>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>
                      Click to use as starting point
                    </p>
                  </div>

                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {examplePrompts.map((example, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${theme.isDark ? 'border-white/10 hover:border-blue-500/50 hover:bg-blue-900/10' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                        onClick={() => setDescription(example.description)}
                      >
                        <h4 className={`font-medium ${theme.text.primary} mb-1 text-sm`}>
                          {example.title}
                        </h4>
                        <p className={`text-xs ${theme.text.secondary} line-clamp-2 mb-2`}>
                          {example.description}
                        </p>
                        <p className={`text-xs ${theme.text.accent}`}>
                          Click to use →
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className={`${theme.isDark ? 'bg-blue-900/10' : 'bg-blue-50'} p-3 rounded-lg`}>
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className={`text-xs font-medium ${theme.text.primary} mb-1`}>
                            Pro Tips
                          </h4>
                          <ul className={`text-xs ${theme.text.secondary} space-y-0.5`}>
                            <li>• Include persona details</li>
                            <li>• Describe business context</li>
                            <li>• Mention specific objections</li>
                            <li>• Add timeline constraints</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Description Input */}
              <div className="xl:col-span-2">
                <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`text-xl font-semibold ${theme.text.primary}`}>
                      Describe Your Scenario
                    </h3>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>
                      Provide detailed context for AI to create realistic training scenarios
                    </p>
                  </div>

                  <div className="p-6">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the scenario in detail. Include information about the customer persona, their business context, specific challenges they're facing, objections they might have, and what you want to achieve in this training scenario..."
                      rows={16}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${theme.isDark
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className={`text-xs ${theme.text.muted}`}>
                        💡 Be as detailed as possible for better results
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${description.length > 100
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                        {description.length} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Generation Settings */}
              <div className="xl:col-span-1">
                <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden sticky top-4`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`text-xl font-semibold ${theme.text.primary}`}>
                      Settings
                    </h3>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>
                      Configure generation options
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Scenario Types */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <h4 className={`text-sm font-semibold ${theme.text.primary}`}>Scenario Types</h4>
                        <Info className="w-4 h-4 text-gray-400" title="Select the types of sales scenarios" />
                      </div>
                      <div className="grid grid-cols-1 gap-2 mb-3">
                        {scenarioTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => handleTypeToggle(type)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left ${selectedTypes.includes(type)
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
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="Enter custom scenario type..."
                            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomType()}
                          />
                          <button
                            onClick={handleAddCustomType}
                            className={`${theme.button.primary} px-3 py-2 rounded-lg`}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setShowCustomType(false)}
                            className={`${theme.button.secondary} px-3 py-2 rounded-lg`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCustomType(true)}
                          className={`text-sm ${theme.text.accent} ${theme.hover.link} flex items-center space-x-1`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add custom type</span>
                        </button>
                      )}

                      {/* Selected Types */}
                      {selectedTypes.length > 0 && (
                        <div className="mt-3">
                          <p className={`text-xs ${theme.text.muted} mb-2`}>Selected types:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedTypes.map(type => (
                              <span
                                key={type}
                                className={`inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}
                              >
                                {formatScenarioType(type)}
                                <button
                                  onClick={() => handleRemoveType(type)}
                                  className="ml-1 hover:text-blue-600"
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
                    <div className="grid grid-cols-1 gap-4">
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
                  </div>

                  {/* Generate Button */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !description.trim()}
                      className={`w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg whitespace-nowrap`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{generationStatus === 'polling' ? 'AI is generating scenarios...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-5 h-5" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>

                    {/* Helper text */}
                    <p className={`text-xs ${theme.text.muted} text-center mt-2`}>
                      💡 Tip: More detailed descriptions create better scenarios
                    </p>
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
      )
      }
    </div >
  )
}

export default PromptGenerationTab
