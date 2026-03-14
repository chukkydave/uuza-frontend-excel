import { useState, useRef, useCallback } from 'react'
import {
  X, Upload, FileText, FileType, File, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react'

/**
 * PlaybookUploadModal Component
 *
 * Modal for uploading new playbooks with drag-drop support,
 * multi-step processing states, and metadata form.
 */
const PlaybookUploadModal = ({
  theme,
  isOpen,
  onClose,
  onUpload,
  isOrganization = false
}) => {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStep, setUploadStep] = useState(null) // null, 'uploading', 'processing', 'extracting', 'complete', 'error'
  const [errorMessage, setErrorMessage] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    playbook_type: 'sales_methodology',
    visibility: 'company' // 'company' or 'private' (org only)
  })

  // Playbook type options
  const PLAYBOOK_TYPES = [
    { value: 'sales_methodology', label: 'Sales Methodology' },
    { value: 'product_knowledge', label: 'Product Knowledge' },
    { value: 'objection_handling', label: 'Objection Handling' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'compliance', label: 'Compliance' }
  ]

  // Accepted file types
  const ACCEPTED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.md']
  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  // Get file icon
  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    switch (`.${ext}`) {
      case '.pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case '.docx':
      case '.doc':
        return <FileType className="w-8 h-8 text-blue-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }, [])

  // Validate and set file
  const handleFileSelection = (file) => {
    setErrorMessage('')

    // Check file type
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!ACCEPTED_TYPES.includes(ext)) {
      setErrorMessage(`Invalid file type. Accepted: ${ACCEPTED_TYPES.join(', ')}`)
      return
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds 100MB limit')
      return
    }

    setSelectedFile(file)
    // Auto-populate name from filename
    if (!formData.name) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim()
      setFormData(prev => ({ ...prev, name: cleanName }))
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
    e.target.value = ''
  }

  // Handle upload
  const handleSubmit = async () => {
    if (!selectedFile || !formData.name.trim()) return

    try {
      setUploadStep('uploading')
      setUploadProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create FormData
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      uploadData.append('name', formData.name.trim())
      uploadData.append('description', formData.description.trim() || '')
      uploadData.append('playbook_type', formData.playbook_type)

      // Call upload
      await onUpload(uploadData)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStep('processing')

      // Simulate processing steps
      await new Promise(r => setTimeout(r, 1000))
      setUploadStep('extracting')
      await new Promise(r => setTimeout(r, 1000))
      setUploadStep('complete')

      // Close after success
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (error) {
      setUploadStep('error')
      setErrorMessage(error.message || 'Upload failed')
    }
  }

  // Reset and close
  const handleClose = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStep(null)
    setErrorMessage('')
    setFormData({
      name: '',
      description: '',
      playbook_type: 'sales_methodology',
      visibility: 'company'
    })
    onClose()
  }

  // Get step indicator
  const getStepIndicator = () => {
    const steps = [
      { key: 'uploading', label: 'Uploading...', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
      { key: 'processing', label: 'Processing document...', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
      { key: 'extracting', label: 'Extracting knowledge...', icon: <Loader2 className="w-5 h-5 animate-spin" /> },
      { key: 'complete', label: 'Ready ✓', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
      { key: 'error', label: 'Upload failed', icon: <AlertCircle className="w-5 h-5 text-red-500" /> }
    ]

    const currentStep = steps.find(s => s.key === uploadStep)
    if (!currentStep) return null

    return (
      <div className={`flex items-center justify-center space-x-3 py-4 ${uploadStep === 'complete' ? 'text-green-500' : uploadStep === 'error' ? 'text-red-500' : theme.text.primary}`}>
        {currentStep.icon}
        <span className="font-medium">{currentStep.label}</span>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.isDark ? 'bg-black/60' : 'bg-gray-900/50'} backdrop-blur-sm`}>
      <div className={`${theme.bg.card} rounded-xl w-full max-w-lg mx-4 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Upload Playbook</h2>
          <button
            onClick={handleClose}
            disabled={uploadStep === 'uploading' || uploadStep === 'processing' || uploadStep === 'extracting'}
            className={`p-1 rounded-lg ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
          >
            <X className={`w-5 h-5 ${theme.text.secondary}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Upload Step Indicator */}
          {uploadStep && getStepIndicator()}

          {/* Progress Bar */}
          {uploadStep === 'uploading' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={`p-3 rounded-lg ${theme.isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'} text-sm`}>
              {errorMessage}
            </div>
          )}

          {/* Drag & Drop Zone (only show when not uploading) */}
          {!uploadStep && (
            <>
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                  ? theme.isDark
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-blue-500 bg-blue-50'
                  : theme.isDark
                    ? 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    {getFileIcon(selectedFile.name)}
                    <p className={`mt-2 font-medium ${theme.text.primary}`}>{selectedFile.name}</p>
                    <p className={`text-sm ${theme.text.muted}`}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                      className={`mt-2 text-sm ${theme.isDark ? 'text-red-400' : 'text-red-600'} hover:underline`}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${theme.text.muted}`} />
                    <p className={`font-medium ${theme.text.primary}`}>
                      {isDragging ? 'Drop file here' : 'Drag & drop your file here'}
                    </p>
                    <p className={`text-sm ${theme.text.muted} mt-1`}>
                      or click to browse
                    </p>
                    <p className={`text-xs ${theme.text.muted} mt-3`}>
                      Supported: PDF, DOCX, TXT, MD (max 100MB)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </>
          )}

          {/* Metadata Form (only show when file selected and not uploading) */}
          {selectedFile && !uploadStep && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-1.5`}>
                  Playbook Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a descriptive name"
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.isDark
                    ? 'bg-slate-800 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-1.5`}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this playbook"
                  rows={2}
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.isDark
                    ? 'bg-slate-800 border-white/10 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                />
              </div>

              {/* Type */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-1.5`}>
                  Playbook Type
                </label>
                <select
                  value={formData.playbook_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, playbook_type: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.isDark
                    ? 'bg-slate-800 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  {PLAYBOOK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Visibility (Organization only) */}
              {isOrganization && (
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                    Visibility
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="company"
                        checked={formData.visibility === 'company'}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={`text-sm ${theme.text.primary}`}>Company-Wide</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={formData.visibility === 'private'}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={`text-sm ${theme.text.primary}`}>Private</span>
                    </label>
                  </div>
                  <p className={`text-xs ${theme.text.muted} mt-1`}>
                    {formData.visibility === 'company'
                      ? 'All team members can view this playbook'
                      : 'Only you can view this playbook'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!uploadStep && (
          <div className={`flex justify-end space-x-3 px-6 py-4 border-t ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg font-medium ${theme.isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || !formData.name.trim()}
              className={`px-4 py-2 rounded-lg font-medium ${theme.isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaybookUploadModal

