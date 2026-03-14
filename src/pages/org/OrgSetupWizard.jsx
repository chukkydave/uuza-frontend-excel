import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { api } from '../../utils/api'
import { Upload, FileText, CheckCircle, ArrowRight, Target, Users, Mail, Loader2 } from 'lucide-react'

const OrgSetupWizard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
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
  const [trainingFor, setTrainingFor] = useState('sales') // 'sales' or 'service'
  const [scenarioType, setScenarioType] = useState('')
  const [scenarioDescription, setScenarioDescription] = useState('')

  // Step 3: Team Invites
  const [inviteEmails, setInviteEmails] = useState(['', '', ''])

  // Loading states
  const [isProcessing, setIsProcessing] = useState(false)

  // Scenario type options based on training category
  const scenarioTypeOptions = {
    sales: [
      { value: 'cold_call', label: 'Cold Call' },
      { value: 'discovery', label: 'Discovery' },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'closing', label: 'Closing' }
    ],
    service: [
      { value: 'de_escalation', label: 'De-escalation' },
      { value: 'troubleshooting', label: 'Troubleshooting' },
      { value: 'refund_request', label: 'Refund Request' }
    ]
  }

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
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      // Auto-populate name from file if empty
      if (!uploadFormData.name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").trim()
        setUploadFormData(prev => ({
          ...prev,
          name: cleanName
        }))
      }
    }
  }

  const handleContinueStep1 = async () => {
    if (!selectedFile) {
      return
    }

    if (!currentWorkspace?.id) {
      alert('No workspace selected. Please try again.')
      return
    }

    setIsProcessing(true)
    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', uploadFormData.name.trim() || selectedFile.name.replace(/\.[^/.]+$/, "").trim())
      formData.append('description', uploadFormData.description.trim() || '')
      formData.append('playbook_type', uploadFormData.playbook_type)

      // Upload playbook with workspace_id
      const response = await api.uploadPlaybook(currentWorkspace.id, formData)

      // Store playbook ID for Step 2
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

  const handleSkipStep1 = () => {
    setCurrentStep(2)
  }

  const handleGenerateScenario = async () => {
    if (!scenarioType) {
      alert('Please select a scenario type')
      return
    }

    setIsProcessing(true)
    try {
      // Prepare generation request
      const generationRequest = {
        playbook_ids: uploadedPlaybookId ? [uploadedPlaybookId] : [],
        scenario_type: [scenarioType],
        difficulty_level: 'intermediate',
        n_scenarios: 1,
        user_scenario_description: scenarioDescription.trim() || null
      }

      console.log('Step 2 - Generating Scenario:', generationRequest)

      // Call scenario generation API
      const response = await api.generateScenarios(generationRequest)
      console.log('✅ Scenario generated successfully:', response)

      setCurrentStep(3)
    } catch (error) {
      console.error('Failed to generate scenario:', error)
      alert('Failed to generate scenario. You can skip this step and create scenarios later.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipStep2 = () => {
    setCurrentStep(3)
  }

  const handleSendInvites = async () => {
    setIsProcessing(true)
    const validEmails = inviteEmails.filter(email => email.trim() !== '')
    console.log('Step 3 - Sending Invites to:', validEmails)
    // TODO: Implement actual invite API call
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsProcessing(false)
    navigate('/org/dashboard')
  }

  const handleSkipStep3 = () => {
    navigate('/org/dashboard')
  }

  const handleEmailChange = (index, value) => {
    const newEmails = [...inviteEmails]
    newEmails[index] = value
    setInviteEmails(newEmails)
  }

  const handleTrainingForChange = (value) => {
    setTrainingFor(value)
    setScenarioType('') // Reset scenario type when category changes
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
            Welcome to Kuuza AI, Admin!
          </h1>
          <p className={`text-sm ${theme.text.secondary}`}>
            Let's get your team set up in just 1 minute
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
          <div className={`w-16 h-1 ${currentStep >= 3
            ? theme.isDark ? 'bg-blue-500' : 'bg-blue-600'
            : theme.isDark ? 'bg-white/10' : 'bg-gray-200'
            }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3
            ? theme.isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
            : theme.isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
            } font-semibold text-sm`}>
            3
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {/* Step 1: Upload Core Document */}
          {currentStep === 1 && (
            <>
              <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2 text-center`}>
                Upload Your Core Document
              </h2>
              <p className={`text-sm ${theme.text.secondary} text-center mb-6`}>
                Our AI will use this to create personalized scenarios.
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
                        Sales Playbook, Product Sheet, Training Manual, etc.
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

              {/* Playbook Metadata Form (shown when file is selected) */}
              {selectedFile && (
                <div className={`mt-6 ${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Playbook Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                        Playbook Name *
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
                        Description (Optional)
                      </label>
                      <textarea
                        value={uploadFormData.description}
                        onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this playbook"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg ${theme.isDark
                          ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                        Playbook Type
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
                        <option value="objection_handling">Objection Handling</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="customer_service">Customer Service</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Create First Simulation */}
          {currentStep === 2 && (
            <>
              <div className="text-center mb-6">
                <p className={`text-xs font-semibold ${theme.isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                  STEP 2 OF 3: QUICK START
                </p>
                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
                  Let's build your first training simulation
                </h2>
              </div>

              <div className="space-y-6">
                {/* Training Category */}
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary} mb-3`}>
                    Who is this training for?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleTrainingForChange('sales')}
                      className={`p-4 rounded-xl border-2 transition-all ${trainingFor === 'sales'
                        ? theme.isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-600 bg-blue-50'
                        : theme.isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Target className={`w-8 h-8 mx-auto mb-2 ${trainingFor === 'sales' ? theme.isDark ? 'text-blue-400' : 'text-blue-600' : theme.text.secondary}`} />
                      <p className={`font-semibold ${trainingFor === 'sales' ? theme.isDark ? 'text-blue-400' : 'text-blue-600' : theme.text.primary}`}>
                        Sales
                      </p>
                    </button>
                    <button
                      onClick={() => handleTrainingForChange('service')}
                      className={`p-4 rounded-xl border-2 transition-all ${trainingFor === 'service'
                        ? theme.isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-600 bg-blue-50'
                        : theme.isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Users className={`w-8 h-8 mx-auto mb-2 ${trainingFor === 'service' ? theme.isDark ? 'text-blue-400' : 'text-blue-600' : theme.text.secondary}`} />
                      <p className={`font-semibold ${trainingFor === 'service' ? theme.isDark ? 'text-blue-400' : 'text-blue-600' : theme.text.primary}`}>
                        Customer Service
                      </p>
                    </button>
                  </div>
                </div>

                {/* Scenario Type */}
                <div>
                  <label htmlFor="scenarioType" className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                    What is the scenario type?
                  </label>
                  <select
                    id="scenarioType"
                    value={scenarioType}
                    onChange={(e) => setScenarioType(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.isDark ? 'border-white/10 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'
                      } ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 transition-colors`}
                  >
                    <option value="">Select a scenario type...</option>
                    {scenarioTypeOptions[trainingFor].map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Scenario Description */}
                <div>
                  <label htmlFor="scenarioDescription" className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                    Scenario Description <span className={`text-xs ${theme.text.secondary}`}>(Optional)</span>
                  </label>
                  <textarea
                    id="scenarioDescription"
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    placeholder="Describe the specific situation or context for this training scenario..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.isDark ? 'border-white/10 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'
                      } ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 transition-colors resize-none`}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Invite Team */}
          {currentStep === 3 && (
            <>
              <div className="text-center mb-6">
                <p className={`text-xs font-semibold ${theme.isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                  STEP 3 OF 3: BUILD YOUR SQUAD
                </p>
                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
                  Invite your team to start training
                </h2>
              </div>

              <div className="space-y-4">
                {inviteEmails.map((email, index) => (
                  <div key={index}>
                    <label htmlFor={`email-${index}`} className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Email Address {index + 1}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.text.secondary}`} />
                      <input
                        type="email"
                        id={`email-${index}`}
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        placeholder="teammate@company.com"
                        className={`w-full pl-11 pr-4 py-3 rounded-lg border ${theme.isDark ? 'border-white/10 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'
                          } ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 transition-colors`}
                      />
                    </div>
                  </div>
                ))}
                <p className={`text-xs ${theme.text.secondary} text-center mt-4`}>
                  Team members will be invited as "Members" and can start training immediately.
                </p>
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
                disabled={!selectedFile}
                className={`${theme.button.primary} px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <button
                onClick={handleSkipStep2}
                className={`text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors underline`}
              >
                Skip
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
                    <span>Generate Scenario</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 3 && (
            <>
              <button
                onClick={handleSkipStep3}
                className={`text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors underline`}
              >
                Skip & Finish
              </button>
              <button
                onClick={handleSendInvites}
                disabled={isProcessing}
                className={`${theme.button.primary} px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Invites & Finish</span>
                    <CheckCircle className="w-5 h-5" />
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

export default OrgSetupWizard

