import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { api } from '../../utils/api'
import { Upload, FileText, CheckCircle, ArrowRight, Target, Loader2, Sparkles, Mic } from 'lucide-react'

/**
 * PersonalSetupWizard
 * 
 * Onboarding wizard for personal workspace users.
 * Steps:
 * 1. Upload a playbook (optional) - to generate personalized scenarios
 * 2. Generate a scenario (optional) - quick start with AI-generated scenario
 * 3. Complete - redirect to dashboard
 */
const PersonalSetupWizard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace, refreshWorkspaces } = useWorkspace()
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Playbook Upload
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedPlaybookId, setUploadedPlaybookId] = useState(null)
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    playbook_type: 'sales_methodology'
  })

  // Step 2: Scenario Generation
  const [scenarioType, setScenarioType] = useState('')
  const [scenarioDescription, setScenarioDescription] = useState('')

  // Loading states
  const [isProcessing, setIsProcessing] = useState(false)

  const scenarioTypeOptions = [
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'discovery', label: 'Discovery Call' },
    { value: 'elevator_pitch', label: 'Elevator Pitch' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'interview', label: 'Job Interview' }
  ]

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
      if (!uploadFormData.name) {
        const cleanName = files[0].name.replace(/\.[^/.]+$/, "").trim()
        setUploadFormData(prev => ({ ...prev, name: cleanName }))
      }
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      if (!uploadFormData.name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").trim()
        setUploadFormData(prev => ({ ...prev, name: cleanName }))
      }
    }
  }

  const handleContinueStep1 = async () => {
    if (!selectedFile || !currentWorkspace?.id) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', uploadFormData.name.trim() || selectedFile.name.replace(/\.[^/.]+$/, "").trim())
      formData.append('description', uploadFormData.description.trim() || '')
      formData.append('playbook_type', uploadFormData.playbook_type)

      const response = await api.uploadPlaybook(currentWorkspace.id, formData)
      setUploadedPlaybookId(response.playbook_id)
      console.log('✅ Playbook uploaded successfully:', response)
      setCurrentStep(2)
    } catch (error) {
      console.error('Failed to upload playbook:', error)
      alert('Failed to upload playbook. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipStep1 = () => setCurrentStep(2)

  const handleGenerateScenario = async () => {
    if (!scenarioType) {
      alert('Please select a scenario type')
      return
    }

    setIsProcessing(true)
    try {
      const generationRequest = {
        playbook_ids: uploadedPlaybookId ? [uploadedPlaybookId] : [],
        scenario_type: [scenarioType],
        difficulty_level: 'intermediate',
        n_scenarios: 1,
        user_scenario_description: scenarioDescription.trim() || null
      }

      await api.generateScenarios(generationRequest)
      console.log('✅ Scenario generated successfully')
      handleFinish()
    } catch (error) {
      console.error('Failed to generate scenario:', error)
      alert('Failed to generate scenario. You can create scenarios later from the dashboard.')
      handleFinish()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipStep2 = () => handleFinish()

  const handleFinish = async () => {
    await refreshWorkspaces()
    navigate('/dashboard')
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center p-6`}>
      <div className={`w-full max-w-2xl ${theme.bg.card} rounded-2xl shadow-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className={`w-10 h-10 rounded-lg ${theme.isDark ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-blue-600 to-cyan-600'} flex items-center justify-center`}>
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className={`text-2xl font-bold ${theme.text.primary}`}>Kuuza AI</span>
          </div>
          <h1 className={`text-3xl font-bold ${theme.text.primary} mb-2`}>
            Let's Get You Started!
          </h1>
          <p className={`text-sm ${theme.text.secondary}`}>
            Set up your personal training workspace in just a minute
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1
              ? theme.isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
              : theme.isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
            } font-semibold text-sm`}>
            1
          </div>
          <div className={`w-16 h-1 ${currentStep >= 2
              ? theme.isDark ? 'bg-blue-500' : 'bg-blue-600'
              : theme.isDark ? 'bg-white/10' : 'bg-gray-200'
            }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2
              ? theme.isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
              : theme.isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
            } font-semibold text-sm`}>
            2
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {/* Step 1: Upload Document */}
          {currentStep === 1 && (
            <>
              <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2 text-center`}>
                Upload Your Training Material
              </h2>
              <p className={`text-sm ${theme.text.secondary} text-center mb-6`}>
                Upload a document to create personalized practice scenarios
              </p>

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging
                    ? theme.isDark ? 'border-blue-400 bg-blue-500/10' : 'border-blue-600 bg-blue-50'
                    : selectedFile
                      ? theme.isDark ? 'border-green-400 bg-green-500/10' : 'border-green-600 bg-green-50'
                      : theme.isDark ? 'border-white/20 bg-white/5 hover:border-white/30' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-4">
                    <CheckCircle className={`w-16 h-16 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <p className={`text-lg font-semibold ${theme.text.primary}`}>{selectedFile.name}</p>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className={`text-sm ${theme.isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} underline`}
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <Upload className={`w-16 h-16 ${theme.text.secondary}`} />
                    <div>
                      <p className={`text-lg font-medium ${theme.text.primary} mb-2`}>
                        Drag & Drop File Here
                      </p>
                      <p className={`text-sm ${theme.text.secondary} mb-4`}>
                        Resume, pitch deck, presentation notes, etc.
                      </p>
                    </div>
                    <label className={`${theme.button.primary} px-6 py-3 rounded-lg cursor-pointer inline-flex items-center space-x-2`}>
                      <FileText className="w-5 h-5" />
                      <span>Browse Files</span>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Playbook Metadata Form */}
              {selectedFile && (
                <div className={`mt-6 ${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Document Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={uploadFormData.name}
                        onChange={(e) => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter a descriptive name"
                        className={`w-full px-3 py-2 border rounded-lg ${theme.isDark
                          ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                        Type
                      </label>
                      <select
                        value={uploadFormData.playbook_type}
                        onChange={(e) => setUploadFormData(prev => ({ ...prev, playbook_type: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg ${theme.isDark
                          ? 'bg-gray-800 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="sales_methodology">Sales Methodology</option>
                        <option value="product_knowledge">Product Knowledge</option>
                        <option value="presentation">Presentation</option>
                        <option value="interview_prep">Interview Prep</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Generate Scenario */}
          {currentStep === 2 && (
            <>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full ${theme.isDark ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center mx-auto mb-4`}>
                  <Sparkles className={`w-8 h-8 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
                  Create Your First Practice Scenario
                </h2>
                <p className={`text-sm ${theme.text.secondary}`}>
                  Our AI will generate a realistic practice scenario for you
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                    What do you want to practice?
                  </label>
                  <select
                    value={scenarioType}
                    onChange={(e) => setScenarioType(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.isDark ? 'border-white/10' : 'border-gray-300'} ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select a scenario type...</option>
                    {scenarioTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                    Additional Context <span className={`text-xs ${theme.text.secondary}`}>(Optional)</span>
                  </label>
                  <textarea
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    placeholder="Describe the specific situation you want to practice..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.isDark ? 'border-white/10' : 'border-gray-300'} ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between">
          {currentStep === 1 && (
            <>
              <button
                onClick={handleSkipStep1}
                className={`text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors underline`}
              >
                Skip for now
              </button>
              <button
                onClick={handleContinueStep1}
                disabled={!selectedFile || isProcessing}
                className={`${theme.button.primary} px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <button
                onClick={handleSkipStep2}
                className={`text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors underline`}
              >
                Skip & Go to Dashboard
              </button>
              <button
                onClick={handleGenerateScenario}
                disabled={isProcessing}
                className={`${theme.button.primary} px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate & Continue</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonalSetupWizard

