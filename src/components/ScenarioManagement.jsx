import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import AvailableScenariosTab from './AvailableScenariosTab'
import ArchivedScenariosTab from './ArchivedScenariosTab'
import PlaybookGenerationTab from './PlaybookGenerationTab'
import PromptGenerationTab from './PromptGenerationTab'
import {
  Wand2, BookOpen, MessageSquare, Filter, Search, Plus,
  ChevronDown, Info, Loader2, AlertCircle, CheckCircle2,
  Play, Edit, Trash2, Eye, Clock, Target, Users, Archive
} from 'lucide-react'

const ScenarioManagement = () => {
  const theme = useTheme()
  const { currentWorkspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState('playbook')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [defaultScenarios, setDefaultScenarios] = useState([])
  const [userScenarios, setUserScenarios] = useState([])
  const [archivedScenarios, setArchivedScenarios] = useState([])
  const [playbooks, setPlaybooks] = useState([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResults, setGenerationResults] = useState([])

  // Predefined scenario types
  const scenarioTypes = [
    'cold_call', 'discovery', 'demo', 'objection_handling',
    'closing', 'follow_up', 'negotiation', 'presentation'
  ]

  const difficultyLevels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' }
  ]

  const tabs = [
    {
      id: 'playbook',
      name: 'Playbook Generation',
      icon: Wand2,
      description: 'Generate scenarios from your playbooks'
    },
    {
      id: 'prompt',
      name: 'Prompt Generation',
      icon: MessageSquare,
      description: 'Create scenarios from descriptions'
    },
    {
      id: 'available',
      name: 'Available Scenarios',
      icon: BookOpen,
      description: 'Browse and search all available scenarios'
    },
    {
      id: 'archived',
      name: 'Archived Scenarios',
      icon: Archive,
      description: 'View and restore archived scenarios'
    }
  ]

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'available') {
      loadDefaultScenarios()
      loadUserScenarios()
    } else if (activeTab === 'archived') {
      loadArchivedScenarios()
    } else if (activeTab === 'playbook') {
      loadPlaybooks()
    }
  }, [activeTab, selectedTypes, selectedDifficulty])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadDefaultScenarios(),
        loadUserScenarios(),
        loadArchivedScenarios(),
        loadPlaybooks()
      ])
    } catch (err) {
      setError('Failed to load initial data')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDefaultScenarios = async () => {
    try {
      const response = await api.getDefaultScenarios(
        1, 50, selectedTypes.length > 0 ? selectedTypes : null, selectedDifficulty || null
      )
      setDefaultScenarios(response.scenarios || [])
    } catch (err) {
      console.error('Error loading default scenarios:', err)
      setError('Failed to load default scenarios')
    }
  }

  const loadUserScenarios = async () => {
    if (!currentWorkspace?.id) return

    try {
      const response = await api.getScenarios(
        currentWorkspace.id, 1, 50, selectedTypes.length > 0 ? selectedTypes : null, selectedDifficulty || null, 'ACTIVE'
      )
      setUserScenarios(response.scenarios || [])
    } catch (err) {
      console.error('Error loading user scenarios:', err)
      // Don't set error for user scenarios as they might not exist yet
    }
  }

  const loadArchivedScenarios = async () => {
    if (!currentWorkspace?.id) return

    try {
      const response = await api.getScenarios(
        currentWorkspace.id, 1, 50, selectedTypes.length > 0 ? selectedTypes : null, selectedDifficulty || null, 'ARCHIVED'
      )
      setArchivedScenarios(response.scenarios || [])
    } catch (err) {
      console.error('Error loading archived scenarios:', err)
      // Don't set error for archived scenarios as they might not exist yet
    }
  }

  const loadPlaybooks = async () => {
    if (!currentWorkspace?.id) return

    try {
      const response = await api.getPlaybooks(currentWorkspace.id, 1, 50, 'ACTIVE')
      const playbooksData = response.playbooks || []

      // Transform playbooks to ensure proper display names
      const transformedPlaybooks = playbooksData.map(playbook => ({
        ...playbook,
        name: playbook.file_name,
      }))

      setPlaybooks(transformedPlaybooks)
    } catch (err) {
      console.error('Error loading playbooks:', err)
      setError('Failed to load playbooks')
    }
  }

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const formatScenarioType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const filteredScenarios = (scenarios) => {
    return scenarios.filter(scenario => {
      const matchesSearch = !searchTerm ||
        scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scenario.persona_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.some(type => scenario.scenario_type?.includes(type))

      const matchesDifficulty = !selectedDifficulty ||
        scenario.difficulty_level === selectedDifficulty

      return matchesSearch && matchesType && matchesDifficulty
    })
  }

  if (loading && defaultScenarios.length === 0 && playbooks.length === 0) {
    return (
      <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-8 h-8 animate-spin ${theme.text.primary} mx-auto mb-4`} />
          <p className={theme.text.secondary}>Loading scenarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary}`}>
      {/* Header */}
      <div className={`${theme.bg.card} border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text.primary}`}>Scenario Management</h1>
              <p className={`mt-2 text-lg ${theme.text.secondary}`}>
                Create, manage, and organize your training scenarios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${theme.bg.card} border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${isActive
                    ? `border-blue-500 ${theme.text.accent}`
                    : `border-transparent ${theme.text.secondary} hover:${theme.text.primary} hover:border-gray-300`
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`${theme.bg.card} border border-red-200 rounded-lg p-4 flex items-center space-x-3`}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters - Only show for Available and Archived Scenarios tabs */}
        {(activeTab === 'available' || activeTab === 'archived') && (
          <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} mb-8`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Search Scenarios
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or persona..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                </div>
              </div>

              {/* Scenario Types */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Scenario Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {scenarioTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedTypes.includes(type)
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : `${theme.bg.secondary} ${theme.text.secondary} hover:${theme.bg.hover}`
                        }`}
                    >
                      {formatScenarioType(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.isDark
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="">All Difficulties</option>
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'playbook' && (
          <PlaybookGenerationTab
            playbooks={playbooks}
            theme={theme}
            scenarioTypes={scenarioTypes}
            difficultyLevels={difficultyLevels}
            formatScenarioType={formatScenarioType}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            generationResults={generationResults}
            setGenerationResults={setGenerationResults}
            setError={setError}
            workspaceId={currentWorkspace?.id}
          />
        )}

        {activeTab === 'prompt' && (
          <PromptGenerationTab
            theme={theme}
            scenarioTypes={scenarioTypes}
            difficultyLevels={difficultyLevels}
            formatScenarioType={formatScenarioType}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            generationResults={generationResults}
            setGenerationResults={setGenerationResults}
            setError={setError}
            workspaceId={currentWorkspace?.id}
          />
        )}

        {activeTab === 'available' && (
          <AvailableScenariosTab
            defaultScenarios={filteredScenarios(defaultScenarios)}
            userScenarios={filteredScenarios(userScenarios)}
            theme={theme}
            getDifficultyColor={getDifficultyColor}
            formatScenarioType={formatScenarioType}
            workspaceId={currentWorkspace?.id}
            onScenariosUpdate={() => {
              loadDefaultScenarios()
              loadUserScenarios()
              loadArchivedScenarios()
            }}
          />
        )}

        {activeTab === 'archived' && (
          <ArchivedScenariosTab
            archivedScenarios={filteredScenarios(archivedScenarios)}
            theme={theme}
            getDifficultyColor={getDifficultyColor}
            formatScenarioType={formatScenarioType}
            workspaceId={currentWorkspace?.id}
            onScenariosUpdate={() => {
              loadDefaultScenarios()
              loadUserScenarios()
              loadArchivedScenarios()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ScenarioManagement
