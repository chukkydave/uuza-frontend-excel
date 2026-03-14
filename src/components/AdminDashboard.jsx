import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import ScenarioManagement from './ScenarioManagement'
import InviteTraineeModal from './InviteTraineeModal'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  BarChart3, Users, BookOpen, Target, TrendingUp,
  Upload, LogOut, Activity, Clock,
  Award, Filter, Download, FileText,
  Edit, Trash2, UserPlus, Eye, X, CheckCircle, AlertCircle
} from 'lucide-react'

const AdminDashboard = () => {
  const theme = useTheme()
  const { currentWorkspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Color palette for completion rates chart
  const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
  const [playbooks, setPlaybooks] = useState([])
  const [filteredPlaybooks, setFilteredPlaybooks] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [scenarios, setScenarios] = useState([])
  const [trainees, setTrainees] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  const [newScenario, setNewScenario] = useState({
    name: '',
    persona: '',
    description: ''
  })

  // File upload states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFiles, setUploadFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(new Map())
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    playbook_type: 'sales_methodology'
  })

  // Custom type state for upload
  const [showCustomUploadType, setShowCustomUploadType] = useState(false)
  const [customUploadType, setCustomUploadType] = useState('')
  const fileInputRef = useRef(null)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    playbook_type: 'sales_methodology'
  })

  // Custom type state for edit
  const [showCustomEditType, setShowCustomEditType] = useState(false)
  const [customEditType, setCustomEditType] = useState('')

  // Playbook details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPlaybook, setSelectedPlaybook] = useState(null)

  // Invite trainee modal state
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Trainee detail modal state
  const [showTraineeDetailModal, setShowTraineeDetailModal] = useState(false)
  const [selectedTrainee, setSelectedTrainee] = useState(null)

  // User management sub-tab state
  const [activeUserTab, setActiveUserTab] = useState('trainees')

  // Stats tracking for percentage changes
  const [statsHistory, setStatsHistory] = useState({
    activePlaybooks: { current: 0, previous: 0, lastUpdated: null },
    trainingScenarios: { current: 0, previous: 0, lastUpdated: null },
    activeTrainees: { current: 0, previous: 0, lastUpdated: null },
    completionRate: { current: 0, previous: 0, lastUpdated: null }
  })

  // Predefined playbook types (suggestions) - users can also create custom types
  const PREDEFINED_PLAYBOOK_TYPES = [
    { value: 'pitch_flow', label: 'Pitch Flow' },
    { value: 'objection_handling', label: 'Objection Handling' },
    { value: 'closing_strategies', label: 'Closing Strategies' },
    { value: 'product_info', label: 'Product Information' },
    { value: 'competitor_analysis', label: 'Competitor Analysis' },
    { value: 'case_studies', label: 'Case Studies' },
    { value: 'pricing_guide', label: 'Pricing Guide' },
    { value: 'sales_methodology', label: 'Sales Methodology' },
    { value: 'training_materials', label: 'Training Materials' },
    { value: 'best_practices', label: 'Best Practices' }
  ]

  // Load real data from API
  const loadPlaybooks = async () => {
    if (!currentWorkspace?.id) return

    try {
      const response = await api.getPlaybooks(currentWorkspace.id)

      // Handle the PlaybookListResponse structure
      const playbooksData = response.playbooks || response

      // Ensure we have an array to work with
      if (!Array.isArray(playbooksData)) {
        console.warn('API returned non-array data:', playbooksData)
        setPlaybooks([])
        return
      }

      const transformedPlaybooks = playbooksData.map(playbook => ({
        id: playbook.id,
        name: playbook.name || playbook.file_name,
        description: playbook.description,
        status: getPlaybookStatusDisplay(playbook.playbook_status),
        uploadDate: new Date(playbook.created_at || Date.now()).toISOString().split('T')[0],
        size: playbook.file_size ? `${(playbook.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
        type: playbook.playbook_type,
        rawStatus: playbook.playbook_status // Keep raw status for actions
      }))

      setPlaybooks(transformedPlaybooks)

      // Apply current filter
      applyStatusFilter(transformedPlaybooks, statusFilter)

      // Update stats tracking
      const activeCount = transformedPlaybooks.filter(p => p.rawStatus === 'active').length
      updateStatsHistory('activePlaybooks', activeCount)

    } catch (error) {
      console.error('Failed to load playbooks:', error.message)
      setPlaybooks([]) // Empty state until API is working
    }
  }

  // Helper function to apply status filter
  const applyStatusFilter = (playbooksData, filter) => {
    if (filter === 'all') {
      setFilteredPlaybooks(playbooksData)
    } else {
      const filtered = playbooksData.filter(p => p.rawStatus === filter)
      setFilteredPlaybooks(filtered)
    }
  }

  // Helper function to map backend status to display status
  const getPlaybookStatusDisplay = (backendStatus) => {
    switch (backendStatus) {
      case 'active':
        return 'Active'
      case 'processing':
        return 'Processing'
      case 'uploaded':
        return 'Uploaded'
      case 'error':
        return 'Error'
      case 'archived':
        return 'Archived'
      default:
        console.warn('Unknown playbook status:', backendStatus)
        return 'Unknown'
    }
  }

  // Real-time status polling for processing playbooks
  useEffect(() => {
    const processingPlaybooks = playbooks.filter(p => p.rawStatus === 'processing')

    if (processingPlaybooks.length > 0) {
      const pollInterval = setInterval(async () => {
        console.log('Polling for playbook status updates...')
        await loadPlaybooks()
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [playbooks])

  // Load scenarios from API
  const loadScenarios = async () => {
    if (!currentWorkspace?.id) return

    try {
      const response = await api.getScenarios(currentWorkspace.id, 1, 50) // page=1, offset=50 (max allowed)
      const scenariosData = response.scenarios || []
      console.log('Loaded scenarios:', scenariosData.length, 'scenarios')
      setScenarios(scenariosData)
    } catch (error) {
      console.error('Failed to load scenarios:', error.message)
      setScenarios([]) // Empty state until API is working
    }
  }

  // Load trainees from API
  const loadTrainees = async () => {
    try {
      const traineesData = await api.getCompanyUsers()
      console.log('Loaded trainees:', traineesData.length, 'users')
      setTrainees(traineesData)
    } catch (error) {
      console.error('Failed to load trainees:', error.message)
      setTrainees([]) // Empty state until API is working
    }
  }

  // Load pending invitations from API
  const loadPendingInvitations = async () => {
    try {
      const invitationsData = await api.getPendingInvitations()
      console.log('Loaded pending invitations:', invitationsData.length, 'invitations')
      setPendingInvitations(invitationsData)
    } catch (error) {
      console.error('Failed to load pending invitations:', error.message)
      setPendingInvitations([]) // Empty state until API is working
    }
  }

  // Load admin analytics from API
  const loadAdminAnalytics = async () => {
    try {
      const analyticsData = await api.getAdminAnalytics(currentWorkspace?.id, 6) // Last 6 months
      console.log('Loaded admin analytics:', analyticsData)

      // Transform the data for the charts
      setAnalytics({
        userTrends: analyticsData.user_growth_trends.map(trend => ({
          month: trend.period,
          invited: trend.invited_users,
          signups: trend.new_signups,
          active: trend.active_users
        })),
        completionRates: analyticsData.completion_rates_by_scenario.map(scenario => ({
          scenario: scenario.scenario_name,
          rate: scenario.completion_rate,
          sessions: scenario.total_sessions
        })),
        engagementMetrics: {
          averageSessionTime: analyticsData.average_session_duration_minutes,
          completionRate: analyticsData.overall_completion_rate,
          userSatisfaction: 0, // Not yet implemented
          monthlyGrowth: 0 // Can be calculated from user_growth_trends if needed
        },
        traineePerformance: analyticsData.trainee_performance,
        sessionDistribution: [] // Can be added later if needed
      })
    } catch (error) {
      console.error('Failed to load admin analytics:', error.message)
      // Initialize empty states for analytics
      setAnalytics({
        userTrends: [],
        completionRates: [],
        engagementMetrics: {
          averageSessionTime: 0,
          completionRate: 0,
          userSatisfaction: 0,
          monthlyGrowth: 0
        },
        traineePerformance: [],
        sessionDistribution: []
      })
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load real data from APIs
      await Promise.all([
        loadPlaybooks(),
        loadScenarios(),
        loadTrainees(),
        loadPendingInvitations(),
        loadAdminAnalytics()
      ])
      setLoading(false)
    }

    loadData()
  }, [])

  // Track scenarios stats
  useEffect(() => {
    updateStatsHistory('trainingScenarios', scenarios.length)
  }, [scenarios.length])

  // Track trainees stats
  useEffect(() => {
    const traineeCount = Array.isArray(trainees) ? trainees.filter(user => user.role === 'org_member').length : 0
    updateStatsHistory('activeTrainees', traineeCount)
  }, [trainees])

  // Track completion rate stats
  useEffect(() => {
    const completionRate = analytics.engagementMetrics?.completionRate || 0
    updateStatsHistory('completionRate', completionRate)
  }, [analytics.engagementMetrics?.completionRate])

  // Handle ESC key for closing modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showDetailsModal) {
          handleCloseDetailsModal()
        }
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [showDetailsModal])

  const handleCreateScenario = async (e) => {
    e.preventDefault()
    try {
      console.log('Creating scenario:', newScenario)
      setNewScenario({ name: '', persona: '', description: '' })
    } catch (error) {
      console.error('Error creating scenario:', error)
    }
  }

  const handleLogout = () => {
    api.logout()
  }

  // Helper functions for custom playbook types
  const normalizePlaybookType = (type) => {
    if (!type) return ''
    return type.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  const formatPlaybookTypeLabel = (type) => {
    if (!type) return ''
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const isCustomType = (type) => {
    return !PREDEFINED_PLAYBOOK_TYPES.some(predefined => predefined.value === type)
  }

  // Helper functions for stats tracking
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const updateStatsHistory = (statType, currentValue) => {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    setStatsHistory(prev => {
      const stat = prev[statType]

      // If this is the first time or it's been more than a month, update previous value
      if (!stat.lastUpdated || new Date(stat.lastUpdated) < oneMonthAgo) {
        return {
          ...prev,
          [statType]: {
            current: currentValue,
            previous: stat.current || 0,
            lastUpdated: now.toISOString()
          }
        }
      }

      // Otherwise, just update current value
      return {
        ...prev,
        [statType]: {
          ...stat,
          current: currentValue
        }
      }
    })
  }

  const getStatDisplay = (statType) => {
    const stat = statsHistory[statType]
    const change = calculatePercentageChange(stat.current, stat.previous)
    const isPositive = change >= 0

    return {
      change: Math.abs(change),
      isPositive,
      text: `${isPositive ? '+' : '-'}${Math.abs(change)}% from last month`
    }
  }

  // Playbook action handlers
  const handleShowPlaybookDetails = (playbook) => {
    setSelectedPlaybook(playbook)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedPlaybook(null)
  }

  const handleDeletePlaybook = async (playbookId) => {
    if (!window.confirm('Are you sure you want to delete this playbook? This action cannot be undone.')) {
      return
    }

    if (!currentWorkspace?.id) {
      showNotification('No workspace selected', 'error')
      return
    }

    try {
      await api.deletePlaybook(currentWorkspace.id, playbookId)
      setPlaybooks(prev => prev.filter(p => p.id !== playbookId))
      showNotification('Playbook deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete playbook:', error)
      showNotification('Failed to delete playbook', 'error')
    }
  }

  const handleDownloadPlaybook = async (playbookId, playbookName) => {
    if (!currentWorkspace?.id) {
      showNotification('No workspace selected', 'error')
      return
    }

    try {
      const response = await api.getPlaybookDownloadUrl(currentWorkspace.id, playbookId)

      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = response.download_url
      link.download = playbookName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showNotification('Download started', 'success')
    } catch (error) {
      console.error('Failed to download playbook:', error)
      showNotification('Failed to download playbook', 'error')
    }
  }

  const handleEditPlaybook = (playbook) => {
    setEditingPlaybook(playbook)
    const playbookType = playbook.type || 'sales_methodology'

    // Check if it's a custom type
    if (isCustomType(playbookType)) {
      setShowCustomEditType(true)
      setCustomEditType(playbookType)
      setEditFormData({
        name: playbook.name || '',
        description: playbook.description || '',
        playbook_type: 'CUSTOM'
      })
    } else {
      setShowCustomEditType(false)
      setCustomEditType('')
      setEditFormData({
        name: playbook.name || '',
        description: playbook.description || '',
        playbook_type: playbookType
      })
    }
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    try {
      // Build update data - only include fields that have changed
      const updateData = {}

      // Only include name if it's different from original and not empty
      if (editFormData.name.trim() !== editingPlaybook.name && editFormData.name.trim()) {
        updateData.name = editFormData.name.trim()
      }

      // Only include description if it's different from original
      if (editFormData.description.trim() !== (editingPlaybook.description || '')) {
        updateData.description = editFormData.description.trim() || null
      }

      // Handle playbook_type (including custom types)
      let finalPlaybookType = editFormData.playbook_type
      if (editFormData.playbook_type === 'CUSTOM') {
        finalPlaybookType = normalizePlaybookType(customEditType)
        if (!finalPlaybookType) {
          showNotification('Please enter a custom playbook type', 'error')
          return
        }
      }

      // Only include playbook_type if it's different from original
      if (finalPlaybookType !== editingPlaybook.type) {
        updateData.playbook_type = finalPlaybookType
      }

      // If no changes, just close modal
      if (Object.keys(updateData).length === 0) {
        setShowEditModal(false)
        setEditingPlaybook(null)
        showNotification('No changes to save', 'info')
        return
      }

      if (!currentWorkspace?.id) {
        showNotification('No workspace selected', 'error')
        return
      }

      await api.updatePlaybook(currentWorkspace.id, editingPlaybook.id, updateData)
      await loadPlaybooks() // Refresh the list
      setShowEditModal(false)
      setEditingPlaybook(null)
      showNotification('Playbook updated successfully', 'success')
    } catch (error) {
      console.error('Failed to update playbook:', error)
      showNotification('Failed to update playbook', 'error')
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingPlaybook(null)
    setShowCustomEditType(false)
    setCustomEditType('')
    setEditFormData({
      name: '',
      description: '',
      playbook_type: 'sales_methodology'
    })
  }

  // Helper function for client-side file validation
  const validateFile = (file, maxSize, allowedExtensions) => {
    if (!file) {
      return { isValid: false, error: 'No file provided' }
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return {
        isValid: false,
        error: `File size too large. Maximum allowed size is ${maxSizeMB}MB`
      }
    }

    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' }
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Unsupported file type. Allowed types: ${allowedExtensions.join(', ')}`
      }
    }

    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'Filename too long. Maximum 255 characters allowed'
      }
    }

    return { isValid: true }
  }

  // Helper function to convert technical errors to user-friendly messages
  const getUserFriendlyErrorMessage = (error) => {
    const errorMessage = error.message || error.toString()

    // 🚨 SECURITY: Never expose raw backend errors to users
    // Always return generic, safe error messages

    if (errorMessage.includes('413') || errorMessage.includes('too large') || errorMessage.includes('size')) {
      return 'File is too large. Please select a smaller file.'
    }

    if (errorMessage.includes('415') || errorMessage.includes('unsupported') || errorMessage.includes('type')) {
      return 'File type not supported. Please select a PDF, DOC, DOCX, TXT, or MD file.'
    }

    if (errorMessage.includes('400') || errorMessage.includes('bad request') || errorMessage.includes('invalid')) {
      return 'Invalid file or request. Please check your file and try again.'
    }

    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return 'You are not authorized to upload files. Please log in again.'
    }

    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return 'You do not have permission to upload files. Please contact your administrator.'
    }

    if (errorMessage.includes('422') || errorMessage.includes('validation')) {
      return 'Please fill in all required fields correctly.'
    }

    if (errorMessage.includes('500') || errorMessage.includes('internal server') || errorMessage.includes('database') || errorMessage.includes('SQL') || errorMessage.includes('psycopg')) {
      return 'A server error occurred. Please try again later or contact support.'
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.'
    }

    // 🚨 SECURITY: For any unhandled error, return a generic message
    // Never expose technical details, file paths, SQL errors, etc.
    console.error('Unhandled upload error:', errorMessage) // Log for debugging
    return 'Upload failed. Please try again or contact support if the problem persists.'
  }

  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    // For now, use console - can be replaced with toast library later
    console.log(`[${type.toUpperCase()}] ${message}`)

    // You can also show a temporary alert for important messages
    if (type === 'error') {
      // Could implement a toast notification here
      console.error(message)
    }
  }

  // File upload handlers
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setUploadFiles(files)
      // Auto-populate name from first file if empty
      if (!uploadFormData.name && files[0]) {
        const cleanName = files[0].name.replace(/\.[^/.]+$/, "").trim()
        setUploadFormData(prev => ({
          ...prev,
          name: cleanName,
          description: prev.description || `Uploaded file: ${files[0].name}`
        }))
      }
      setShowUploadModal(true)
    }
    // Clear the input so the same file can be uploaded again if needed
    event.target.value = ''
  }

  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) {
      console.warn('No files selected for upload')
      return
    }

    // 🔍 VALIDATION: Check form data before upload
    if (!uploadFormData.name.trim()) {
      showNotification('Please enter a playbook name before uploading', 'error')
      return
    }

    const uploadResults = []
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md']

    // Update UI state to show upload in progress
    setIsUploading(true)
    setUploadProgress(new Map())
    setShowUploadModal(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = `${file.name}-${Date.now()}-${i}`

      try {
        // Client-side validation
        const validation = validateFile(file, MAX_FILE_SIZE, ALLOWED_EXTENSIONS)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }

        // Update progress for this file
        setUploadProgress(prev => new Map(prev.set(fileId, {
          status: 'uploading',
          progress: 0,
          fileName: file.name
        })))

        // Prepare form data - use user-provided values
        const formData = new FormData()
        formData.append('file', file)

        // 🔍 DEBUG: Log form data to verify it's being sent
        const playbookName = uploadFormData.name.trim() || file.name.replace(/\.[^/.]+$/, "").trim() || `Playbook ${Date.now()}`
        const playbookDescription = uploadFormData.description.trim()
        // Handle custom playbook type
        let playbookType = uploadFormData.playbook_type
        if (uploadFormData.playbook_type === 'CUSTOM') {
          playbookType = normalizePlaybookType(customUploadType)
          if (!playbookType) {
            showNotification('Please enter a custom playbook type', 'error')
            return
          }
        }
        playbookType = playbookType || 'sales_methodology'

        console.log('📤 Sending form data:', {
          fileName: file.name,
          playbookName,
          playbookDescription,
          playbookType
        })

        // Ensure name is always provided (backend requires it)
        if (!playbookName) {
          throw new Error('Playbook name is required')
        }

        formData.append('name', playbookName)

        if (playbookDescription) {
          formData.append('description', playbookDescription)
        }

        formData.append('playbook_type', playbookType)

        // 🔍 DEBUG: Log FormData contents
        console.log('📤 FormData contents:')
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value)
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev.get(fileId)
            if (current && current.status === 'uploading') {
              const newProgress = Math.min(current.progress + 10, 90)
              return new Map(prev.set(fileId, {
                ...current,
                progress: newProgress
              }))
            }
            return prev
          })
        }, 200)

        try {
          if (!currentWorkspace?.id) {
            throw new Error('No workspace selected')
          }
          const response = await api.uploadPlaybook(currentWorkspace.id, formData)

          clearInterval(progressInterval)

          // Success - update progress and store result
          setUploadProgress(prev => new Map(prev.set(fileId, {
            status: 'completed',
            progress: 100,
            fileName: file.name,
            playbookId: response.playbook_id
          })))

          uploadResults.push({
            success: true,
            fileName: file.name,
            playbookId: response.playbook_id,
            message: response.message || 'Upload successful'
          })

          console.log(`✅ Successfully uploaded ${file.name}:`, response)

          // Add to playbooks list immediately with processing status
          const newPlaybook = {
            id: response.playbook_id || Date.now(),
            name: playbookName,
            description: playbookDescription,
            status: 'Processing',
            uploadDate: new Date().toISOString().split('T')[0],
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: playbookType,
            rawStatus: 'processing'
          }
          setPlaybooks(prev => [newPlaybook, ...prev])

          // Refresh playbooks list from server to get accurate data
          setTimeout(() => {
            loadPlaybooks()
          }, 1000)

        } catch (error) {
          clearInterval(progressInterval)
          throw error
        }

      } catch (error) {
        // 🚨 SECURITY: Log full error for debugging but show safe message to user
        console.error(`❌ Failed to upload ${file.name}:`, {
          error: error.message,
          stack: error.stack,
          fileName: file.name,
          formData: {
            name: playbookName,
            description: playbookDescription,
            type: playbookType
          }
        })

        // Get user-friendly error message (never expose backend details)
        const safeErrorMessage = getUserFriendlyErrorMessage(error)

        setUploadProgress(prev => new Map(prev.set(fileId, {
          status: 'error',
          progress: 0,
          fileName: file.name,
          error: safeErrorMessage // Use safe message, not raw error
        })))

        uploadResults.push({
          success: false,
          fileName: file.name,
          error: safeErrorMessage // Use safe message, not raw error
        })

        // Show user-friendly error message
        showNotification(`Failed to upload ${file.name}: ${safeErrorMessage}`, 'error')
      }

      // Add small delay between uploads to prevent overwhelming the server
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Final cleanup and notifications
    setIsUploading(false)

    // Show summary notification
    const successCount = uploadResults.filter(r => r.success).length
    const failureCount = uploadResults.filter(r => !r.success).length

    if (successCount > 0) {
      showNotification(
        `Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}`,
        'success'
      )
    }

    if (failureCount > 0) {
      showNotification(
        `Failed to upload ${failureCount} file${failureCount !== 1 ? 's' : ''}`,
        'error'
      )
    }

    // Refresh playbooks list to show new uploads
    if (successCount > 0) {
      await loadPlaybooks()
    }

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress(new Map())
      setShowUploadModal(false)
    }, 3000)

    return uploadResults
  }

  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Helper function to reset all upload state
  const resetUploadState = () => {
    setShowUploadModal(false)
    setUploadFiles([])
    setUploadProgress(new Map())
    setIsUploading(false)
    setUploadFormData({
      name: '',
      description: '',
      playbook_type: 'sales_methodology'
    })
    setShowCustomUploadType(false)
    setCustomUploadType('')
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle successful trainee invitation
  const handleInviteSuccess = async (response) => {
    console.log('Invitation sent successfully:', response)
    // Reload both trainees and pending invitations
    await Promise.all([loadTrainees(), loadPendingInvitations()])
  }

  const handleViewTraineeProgress = (trainee) => {
    // Find the trainee's performance data from analytics
    const traineePerformance = analytics.traineePerformance?.find(
      tp => tp.user_id === trainee.id
    )
    setSelectedTrainee({ ...trainee, performance: traineePerformance })
    setShowTraineeDetailModal(true)
  }

  const closeTraineeDetailModal = () => {
    setShowTraineeDetailModal(false)
    setSelectedTrainee(null)
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'playbooks', name: 'Playbooks', icon: BookOpen },
    { id: 'scenarios', name: 'Scenarios', icon: Target },
    { id: 'users', name: 'Team', icon: Users }
  ]

  // Filter users by role - safely handle empty/undefined arrays
  const traineeUsers = Array.isArray(trainees) ? trainees.filter(user => user.role === 'org_member') : []
  const adminUsers = Array.isArray(trainees) ? trainees.filter(user => user.role === 'org_admin') : []

  // Filter pending trainee invitations
  const pendingTraineeInvitations = Array.isArray(pendingInvitations)
    ? pendingInvitations.filter(invitation => invitation.role === 'org_member')
    : []

  // Combine trainees and pending invitations for display
  const allTraineeEntries = [...traineeUsers, ...pendingTraineeInvitations]

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg.primary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={theme.text.secondary}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${theme.bg.nav} border-b ${theme.isDark ? 'border-white/20' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg ${theme.isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} flex items-center justify-center`}>
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className={`text-xl font-bold ${theme.text.primary}`}>
                  Kuuza AI
                </h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-600'}`}>
                  Admin
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${theme.text.secondary}`}>Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className={`${theme.button.secondary} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={`${theme.bg.secondary} border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${activeTab === tab.id
                    ? `${theme.text.accent} ${theme.isDark ? 'border-cyan-400' : 'border-blue-500'}`
                    : `${theme.text.secondary} border-transparent ${theme.hover.link}`
                    }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-3xl font-bold ${theme.text.primary}`}>Dashboard Overview</h2>
                <p className={`mt-2 text-lg ${theme.text.secondary}`}>
                  Monitor your team's training progress and performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className={`${theme.button.secondary} px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2`}>
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                <button className={`${theme.button.secondary} px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2`}>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme.text.secondary}`}>Active Playbooks</p>
                    <p className={`text-3xl font-bold ${theme.text.primary} mt-2`}>{playbooks.filter(p => p.rawStatus === 'active').length}</p>
                    <div className="flex items-center mt-2">
                      {(() => {
                        const statDisplay = getStatDisplay('activePlaybooks')
                        return (
                          <>
                            <TrendingUp className={`w-4 h-4 mr-1 ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`text-sm ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {statDisplay.text}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                    <BookOpen className={`w-6 h-6 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
              </div>

              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme.text.secondary}`}>Training Scenarios</p>
                    <p className={`text-3xl font-bold ${theme.text.primary} mt-2`}>{scenarios.length}</p>
                    <div className="flex items-center mt-2">
                      {(() => {
                        const statDisplay = getStatDisplay('trainingScenarios')
                        return (
                          <>
                            <TrendingUp className={`w-4 h-4 mr-1 ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`text-sm ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {statDisplay.text}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme.isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                    <Target className={`w-6 h-6 ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                </div>
              </div>

              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme.text.secondary}`}>Active Trainees</p>
                    <p className={`text-3xl font-bold ${theme.text.primary} mt-2`}>
                      {Array.isArray(trainees) ? trainees.filter(user => user.role === 'org_member').length : 0}
                    </p>
                    <div className="flex items-center mt-2">
                      {(() => {
                        const statDisplay = getStatDisplay('activeTrainees')
                        return (
                          <>
                            <TrendingUp className={`w-4 h-4 mr-1 ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`text-sm ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {statDisplay.text}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme.isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                    <Users className={`w-6 h-6 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                </div>
              </div>

              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme.text.secondary}`}>Completion Rate</p>
                    <p className={`text-3xl font-bold ${theme.text.primary} mt-2`}>{analytics.engagementMetrics?.completionRate || 0}%</p>
                    <div className="flex items-center mt-2">
                      {(() => {
                        const statDisplay = getStatDisplay('completionRate')
                        return (
                          <>
                            <TrendingUp className={`w-4 h-4 mr-1 ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`text-sm ${statDisplay.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {statDisplay.text}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme.isDark ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
                    <Award className={`w-6 h-6 ${theme.isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Invitation Trends */}
              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme.text.primary}`}>User Growth Trends</h3>
                    <p className={`text-sm ${theme.text.secondary}`}>Invitations, signups, and active users</p>
                  </div>
                  <Activity className={`w-5 h-5 ${theme.text.secondary}`} />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.userTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="month"
                        stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis
                        stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                          border: `1px solid ${theme.isDark ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: theme.isDark ? '#f9fafb' : '#111827'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="invited"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Invited"
                      />
                      <Line
                        type="monotone"
                        dataKey="signups"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Signups"
                      />
                      <Line
                        type="monotone"
                        dataKey="active"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Active Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Session Completion Rates */}
              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Training Completion Rates</h3>
                    <p className={`text-sm ${theme.text.secondary}`}>Success rates by scenario type</p>
                  </div>
                  <BarChart3 className={`w-5 h-5 ${theme.text.secondary}`} />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.completionRates}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="scenario"
                        stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis
                        stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                          border: `1px solid ${theme.isDark ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: theme.isDark ? '#f9fafb' : '#111827'
                        }}
                      />
                      <Bar dataKey="rate" name="Completion Rate (%)">
                        {analytics.completionRates.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Trainee Performance Trends Chart */}
            {analytics.traineePerformance && analytics.traineePerformance.length > 0 && (
              <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} mt-8`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Trainee Performance Overview</h3>
                    <p className={`text-sm ${theme.text.secondary}`}>Average scores and improvement trends</p>
                  </div>
                  <TrendingUp className={`w-5 h-5 ${theme.text.secondary}`} />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.traineePerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="user_name"
                        stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                          border: `1px solid ${theme.isDark ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: theme.isDark ? '#f9fafb' : '#111827'
                        }}
                      />
                      <Bar dataKey="average_score" fill="#3b82f6" name="Average Score" />
                      <Bar dataKey="best_score" fill="#10b981" name="Best Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Playbooks Tab */}
        {activeTab === 'playbooks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-3xl font-bold ${theme.text.primary}`}>Playbooks</h2>
                <p className={`mt-2 text-lg ${theme.text.secondary}`}>
                  Manage your training materials and knowledge base ({playbooks.length} total)
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  className={`px-3 py-2 border rounded-md ${theme.isDark
                    ? 'bg-gray-800 border-white/20 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  onChange={(e) => {
                    const newFilter = e.target.value
                    setStatusFilter(newFilter)
                    applyStatusFilter(playbooks, newFilter)
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="processing">Processing</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="error">Error</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={loadPlaybooks}
                  className={`px-3 py-2 border rounded-md ${theme.isDark
                    ? 'bg-gray-800 border-white/20 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                    } transition-colors duration-200 flex items-center space-x-2`}
                  title="Refresh playbooks"
                >
                  <Activity className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`${theme.button.primary} px-6 py-2 rounded-md font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Upload New Playbook'}</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </div>

            <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={theme.isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Upload Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Size
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Type
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                    {filteredPlaybooks.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <BookOpen className={`w-12 h-12 ${theme.text.secondary}`} />
                            <p className={`text-lg font-medium ${theme.text.primary}`}>No playbooks yet</p>
                            <p className={`text-sm ${theme.text.secondary}`}>Upload your first playbook to get started</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPlaybooks.map((playbook) => (
                        <tr key={playbook.id} className={theme.hover.card}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme.text.primary} flex items-center space-x-3`}>
                            <FileText className="w-5 h-5 text-blue-500" />
                            <button
                              onClick={() => handleShowPlaybookDetails(playbook)}
                              className={`text-left hover:${theme.text.accent} transition-colors cursor-pointer underline-offset-2 hover:underline`}
                            >
                              {playbook.name}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${playbook.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : playbook.status === 'Processing'
                                ? 'bg-blue-100 text-blue-800'
                                : playbook.status === 'Error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {playbook.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                            {playbook.uploadDate}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                            {playbook.size}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme.isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                              {formatPlaybookTypeLabel(playbook.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleEditPlaybook(playbook)}
                                className={`${theme.text.accent} ${theme.hover.link} flex items-center space-x-1`}
                              >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              {playbook.rawStatus === 'active' && (
                                <button
                                  onClick={() => handleDownloadPlaybook(playbook.id, playbook.name)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePlaybook(playbook.id)}
                                className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <ScenarioManagement />
        )}

        {/* Team Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-3xl font-bold ${theme.text.primary}`}>Team Management</h2>
                <p className={`mt-2 text-lg ${theme.text.secondary}`}>
                  Manage your team members and track their progress
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className={`${theme.button.primary} px-6 py-2 rounded-md font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            </div>

            {/* Sub-tabs for Trainees and Admins */}
            <div className="border-b border-gray-200 dark:border-white/10">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveUserTab('trainees')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeUserTab === 'trainees'
                    ? `border-blue-500 ${theme.text.accent}`
                    : `border-transparent ${theme.text.secondary} hover:${theme.text.primary} hover:border-gray-300`
                    }`}
                >
                  Trainees ({allTraineeEntries.length})
                </button>
                <button
                  onClick={() => setActiveUserTab('admins')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeUserTab === 'admins'
                    ? `border-blue-500 ${theme.text.accent}`
                    : `border-transparent ${theme.text.secondary} hover:${theme.text.primary} hover:border-gray-300`
                    }`}
                >
                  Admins ({adminUsers.length})
                </button>
              </nav>
            </div>

            <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={theme.isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Email
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Role
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Joined
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${theme.text.muted} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                    {(() => {
                      const currentUsers = activeUserTab === 'trainees' ? allTraineeEntries : adminUsers
                      const userType = activeUserTab === 'trainees' ? 'trainees' : 'admins'

                      if (currentUsers.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className={`px-6 py-12 text-center ${theme.text.secondary}`}>
                              <div className="flex flex-col items-center space-y-3">
                                <Users className="w-12 h-12 text-gray-400" />
                                <div>
                                  <p className="text-lg font-medium">No {userType} yet</p>
                                  <p className="text-sm">
                                    {activeUserTab === 'trainees'
                                      ? 'Invite team members to start training'
                                      : 'No other admins in your organization'
                                    }
                                  </p>
                                </div>
                                {activeUserTab === 'trainees' && (
                                  <button
                                    onClick={() => setShowInviteModal(true)}
                                    className={`${theme.button.primary} px-4 py-2 rounded-md font-medium flex items-center space-x-2`}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Invite First Trainee</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return currentUsers.map((entry) => {
                        // Check if this is a user or an invitation
                        const isInvitation = !entry.auth0_id && entry.status === 'pending'
                        const displayName = isInvitation ? entry.email : (entry.full_name || entry.email)
                        const status = isInvitation ? entry.status : entry.user_status

                        return (
                          <tr key={isInvitation ? `inv-${entry.id}` : `user-${entry.id}`} className={theme.hover.card}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme.text.primary} flex items-center space-x-3`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInvitation
                                ? 'bg-gradient-to-r from-orange-400 to-yellow-500'
                                : theme.isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                }`}>
                                <span className="text-white text-sm font-bold">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span>{displayName}</span>
                                {isInvitation && (
                                  <div className="text-xs text-orange-600 dark:text-orange-400">
                                    Invitation pending
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                              {entry.email}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${entry.role === 'org_admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}>
                                {entry.role === 'org_admin' ? 'Admin' : entry.role === 'org_member' ? 'Member' : entry.role}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : status === 'pending'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                {status}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.text.secondary}`}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                {!isInvitation && (
                                  <button
                                    onClick={() => handleViewTraineeProgress(entry)}
                                    className={`${theme.text.accent} ${theme.hover.link} flex items-center space-x-1`}
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View Progress</span>
                                  </button>
                                )}
                                {entry.role !== 'org_admin' && (
                                  <button className="text-red-600 hover:text-red-900 flex items-center space-x-1">
                                    <Trash2 className="w-4 h-4" />
                                    <span>{isInvitation ? 'Cancel' : 'Remove'}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Playbook Modal */}
      {showEditModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.isDark ? 'bg-black/60' : 'bg-gray-900/50'} backdrop-blur-sm`}>
          <div className={`${theme.bg.card} rounded-xl p-6 w-full max-w-md mx-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Edit Playbook</h3>
              <button
                onClick={handleCancelEdit}
                className={`${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Playbook Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter playbook name (leave unchanged if empty)"
                  className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                    ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                    ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Playbook Type
                </label>
                <select
                  value={editFormData.playbook_type}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, playbook_type: e.target.value }))
                    setShowCustomEditType(e.target.value === 'CUSTOM')
                  }}
                  className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                    ? 'bg-gray-800 border-white/20 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  {PREDEFINED_PLAYBOOK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom Type...</option>
                </select>

                {showCustomEditType && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customEditType}
                      onChange={(e) => setCustomEditType(e.target.value)}
                      placeholder="Enter custom playbook type (e.g., 'Customer Success Guide')"
                      className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                        ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <p className={`text-xs ${theme.text.secondary} mt-1`}>
                      Custom types are automatically normalized (spaces become underscores, lowercase)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className={`px-4 py-2 rounded-md border ${theme.isDark ? 'border-white/20' : 'border-gray-300'} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`${theme.button.primary} px-4 py-2 rounded-md font-semibold transition-all duration-200`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playbook Details Modal */}
      {showDetailsModal && selectedPlaybook && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${theme.isDark ? 'bg-black/60' : 'bg-gray-900/50'} backdrop-blur-sm`}
          onClick={handleCloseDetailsModal}
        >
          <div
            className={`${theme.bg.card} rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden ${theme.isDark ? 'border border-white/10' : 'border border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${theme.isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                    <FileText className={`w-5 h-5 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-xl font-semibold ${theme.text.primary}`}>Playbook Details</h3>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className={`p-2 rounded-lg ${theme.text.secondary} hover:${theme.text.primary} ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-all duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(85vh-140px)]">

              <div className="space-y-8">
                {/* Playbook Title */}
                <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>{selectedPlaybook.name}</h2>
                  <div className="flex items-center justify-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${theme.isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {formatPlaybookTypeLabel(selectedPlaybook.type)}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedPlaybook.status === 'Active'
                      ? theme.isDark ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'
                      : selectedPlaybook.status === 'Processing'
                        ? theme.isDark ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : selectedPlaybook.status === 'Error'
                          ? theme.isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
                          : theme.isDark ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                      {selectedPlaybook.status}
                    </span>
                  </div>
                </div>

                {/* Basic Info */}
                <div>
                  <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center`}>
                    <div className={`w-1 h-6 ${theme.isDark ? 'bg-blue-400' : 'bg-blue-600'} rounded-full mr-3`}></div>
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded-lg ${theme.isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                      <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Upload Date</label>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        {selectedPlaybook.uploadDate}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${theme.isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                      <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>File Size</label>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        {selectedPlaybook.size}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center`}>
                    <div className={`w-1 h-6 ${theme.isDark ? 'bg-green-400' : 'bg-green-600'} rounded-full mr-3`}></div>
                    Description
                  </h4>
                  <div className={`p-6 rounded-lg ${theme.isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'} min-h-[120px]`}>
                    {selectedPlaybook.description ? (
                      <div className="space-y-3">
                        <p className={`text-base ${theme.text.primary} leading-relaxed whitespace-pre-wrap`}>
                          {selectedPlaybook.description}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <FileText className={`w-12 h-12 ${theme.text.muted} mx-auto mb-3 opacity-50`} />
                          <p className={`text-sm ${theme.text.secondary} italic`}>
                            No description provided for this playbook.
                          </p>
                          <p className={`text-xs ${theme.text.muted} mt-1`}>
                            You can add a description by editing this playbook.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className={`px-6 py-4 border-t ${theme.isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Click outside or press ESC to close
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleCloseDetailsModal()
                      handleEditPlaybook(selectedPlaybook)
                    }}
                    className={`${theme.button.secondary} px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105`}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Playbook</span>
                  </button>
                  {selectedPlaybook.rawStatus === 'active' && (
                    <button
                      onClick={() => {
                        handleCloseDetailsModal()
                        handleDownloadPlaybook(selectedPlaybook.id, selectedPlaybook.name)
                      }}
                      className={`${theme.button.primary} px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {
        showUploadModal && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.isDark ? 'bg-black/60' : 'bg-gray-900/50'} backdrop-blur-sm`}>
            <div className={`${theme.bg.card} rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-semibold ${theme.text.primary}`}>Upload Playbooks</h3>
                <button
                  onClick={resetUploadState}
                  className={`${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Upload Form Fields */}
              {uploadFiles.length > 0 && uploadProgress.size === 0 && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Playbook Name *
                    </label>
                    <input
                      type="text"
                      value={uploadFormData.name}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter a descriptive name for your playbook"
                      className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                        ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Description
                    </label>
                    <textarea
                      value={uploadFormData.description}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this playbook contains and how it should be used"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                        ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                      Playbook Type
                    </label>
                    <select
                      value={uploadFormData.playbook_type}
                      onChange={(e) => {
                        setUploadFormData(prev => ({ ...prev, playbook_type: e.target.value }))
                        setShowCustomUploadType(e.target.value === 'CUSTOM')
                      }}
                      className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                        ? 'bg-gray-800 border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      disabled={isUploading}
                    >
                      {PREDEFINED_PLAYBOOK_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Type...</option>
                    </select>
                  </div>

                  {showCustomUploadType && (
                    <div className="mt-3">
                      <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                        Custom Playbook Type
                      </label>
                      <input
                        type="text"
                        value={customUploadType}
                        onChange={(e) => setCustomUploadType(e.target.value)}
                        placeholder="Enter custom playbook type (e.g., 'Customer Success Guide')"
                        className={`w-full px-3 py-2 border rounded-md ${theme.isDark
                          ? 'bg-gray-800 border-white/20 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        disabled={isUploading}
                      />
                      <p className={`text-xs ${theme.text.secondary} mt-1`}>
                        Custom types are automatically normalized (spaces become underscores, lowercase)
                      </p>
                    </div>
                  )}

                  {/* Document Formatting Info Tip */}
                  <div className={`p-4 rounded-lg border-l-4 ${theme.isDark
                    ? 'bg-blue-500/10 border-blue-400 border-l-blue-400'
                    : 'bg-blue-50 border-blue-200 border-l-blue-500'
                    }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${theme.isDark
                        ? 'bg-blue-400/20 text-blue-300'
                        : 'bg-blue-100 text-blue-600'
                        }`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className={`text-sm font-medium ${theme.text.primary} mb-1`}>
                          Document Formatting Tip
                        </h5>
                        <p className={`text-xs ${theme.text.secondary} leading-relaxed`}>
                          For optimal processing, structure your document with clear sections using headers like
                          <code className={`mx-1 px-1.5 py-0.5 rounded text-xs font-mono ${theme.isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                            }`}>
                            SECTION 1
                          </code>,
                          <code className={`mx-1 px-1.5 py-0.5 rounded text-xs font-mono ${theme.isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                            }`}>
                            SECTION 2
                          </code>, etc. This helps our AI better understand and process your content.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Selected Files:</h4>
                    <div className="space-y-2">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${theme.isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className={`text-sm ${theme.text.primary}`}>{file.name}</span>
                            <span className={`text-xs ${theme.text.secondary}`}>
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {Array.from(uploadProgress.entries()).map(([fileId, progressData]) => {
                  const isError = progressData.status === 'error'
                  const isComplete = progressData.status === 'completed'
                  const isUploading = progressData.status === 'uploading'

                  return (
                    <div key={fileId} className={`border rounded-lg p-4 ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className={`font-medium ${theme.text.primary}`}>{progressData.fileName}</p>
                            <p className={`text-sm ${theme.text.secondary}`}>
                              {progressData.status === 'uploading' && `${progressData.progress}%`}
                              {progressData.status === 'completed' && '✅ Complete'}
                              {progressData.status === 'error' && `❌ ${progressData.error}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isComplete && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {isUploading && (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </div>

                      {(isUploading || isComplete || isError) && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                            style={{ width: `${Math.max(0, progressData.progress || 0)}%` }}
                          />
                        </div>
                      )}

                      {isError && (
                        <p className="text-red-500 text-sm mt-2">{progressData.error}</p>
                      )}
                      {isComplete && (
                        <p className="text-green-500 text-sm mt-2">Upload successful</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetUploadState}
                  disabled={isUploading}
                  className={`px-4 py-2 rounded-md border ${theme.isDark ? 'border-white/20' : 'border-gray-300'} ${theme.text.secondary} hover:${theme.text.primary} transition-colors disabled:opacity-50`}
                >
                  Cancel
                </button>

                {uploadFiles.length > 0 && uploadProgress.size === 0 && (
                  <button
                    onClick={() => handleUploadFiles(uploadFiles)}
                    disabled={isUploading || !uploadFormData.name.trim()}
                    className={`${theme.button.primary} px-6 py-2 rounded-md font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}</span>
                  </button>
                )}

                {uploadProgress.size > 0 && !isUploading && (
                  <button
                    onClick={resetUploadState}
                    className={`${theme.button.primary} px-6 py-2 rounded-md font-semibold transition-all duration-200`}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Invite Trainee Modal */}
      <InviteTraineeModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={handleInviteSuccess}
      />

      {/* Trainee Detail Modal */}
      {showTraineeDetailModal && selectedTrainee && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeTraineeDetailModal}>
          <div
            className={`${theme.bg.card} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div>
                <h2 className={`text-2xl font-semibold ${theme.text.primary}`}>
                  {selectedTrainee.full_name || selectedTrainee.email}
                </h2>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>{selectedTrainee.email}</p>
              </div>
              <button
                onClick={closeTraineeDetailModal}
                className={`p-2 rounded-lg ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-5 h-5 ${theme.text.secondary}`} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {selectedTrainee.performance ? (
                <>
                  {/* Performance Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                      <p className={`text-sm ${theme.text.secondary}`}>Total Sessions</p>
                      <p className={`text-2xl font-bold ${theme.text.primary} mt-1`}>
                        {selectedTrainee.performance.total_sessions}
                      </p>
                    </div>
                    <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                      <p className={`text-sm ${theme.text.secondary}`}>Completed</p>
                      <p className={`text-2xl font-bold ${theme.text.primary} mt-1`}>
                        {selectedTrainee.performance.completed_sessions}
                      </p>
                    </div>
                    <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                      <p className={`text-sm ${theme.text.secondary}`}>Average Score</p>
                      <p className={`text-2xl font-bold ${theme.text.primary} mt-1`}>
                        {selectedTrainee.performance.average_score?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                      <p className={`text-sm ${theme.text.secondary}`}>Best Score</p>
                      <p className={`text-2xl font-bold ${theme.text.primary} mt-1`}>
                        {selectedTrainee.performance.best_score || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Performance Trend */}
                  <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${theme.text.secondary}`}>Performance Trend</p>
                        <div className="flex items-center mt-2">
                          {selectedTrainee.performance.trend_direction === 'improving' && (
                            <>
                              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-500 font-semibold">Improving</span>
                            </>
                          )}
                          {selectedTrainee.performance.trend_direction === 'declining' && (
                            <>
                              <TrendingUp className="w-5 h-5 text-red-500 mr-2 transform rotate-180" />
                              <span className="text-red-500 font-semibold">Declining</span>
                            </>
                          )}
                          {selectedTrainee.performance.trend_direction === 'stable' && (
                            <>
                              <Activity className="w-5 h-5 text-blue-500 mr-2" />
                              <span className="text-blue-500 font-semibold">Stable</span>
                            </>
                          )}
                          {selectedTrainee.performance.trend_direction === 'insufficient_data' && (
                            <span className={`${theme.text.secondary}`}>Insufficient data</span>
                          )}
                          {selectedTrainee.performance.improvement_rate !== null && selectedTrainee.performance.improvement_rate !== undefined && (
                            <span className={`ml-2 ${theme.text.secondary}`}>
                              ({selectedTrainee.performance.improvement_rate > 0 ? '+' : ''}{selectedTrainee.performance.improvement_rate.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedTrainee.performance.last_session_date && (
                        <div className="text-right">
                          <p className={`text-sm ${theme.text.secondary}`}>Last Session</p>
                          <p className={`text-sm font-medium ${theme.text.primary} mt-1`}>
                            {new Date(selectedTrainee.performance.last_session_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Chart */}
                  {selectedTrainee.performance.performance_trends &&
                    selectedTrainee.performance.performance_trends.score_progression &&
                    selectedTrainee.performance.performance_trends.score_progression.length > 0 && (
                      <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Score Progression</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedTrainee.performance.performance_trends.score_progression}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme.isDark ? '#374151' : '#e5e7eb'} />
                              <XAxis
                                dataKey="date"
                                stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                                fontSize={12}
                              />
                              <YAxis
                                stroke={theme.isDark ? '#9ca3af' : '#6b7280'}
                                fontSize={12}
                                domain={[0, 100]}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                                  border: `1px solid ${theme.isDark ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px',
                                  color: theme.isDark ? '#f9fafb' : '#111827'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="average_score"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Average Score"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {/* Performance by Scenario */}
                  {selectedTrainee.performance.performance_trends &&
                    selectedTrainee.performance.performance_trends.by_scenario &&
                    selectedTrainee.performance.performance_trends.by_scenario.length > 0 && (
                      <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Performance by Scenario</h3>
                        <div className="space-y-3">
                          {selectedTrainee.performance.performance_trends.by_scenario.map((scenario, index) => (
                            <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-white'} p-3 rounded-lg`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className={`font-medium ${theme.text.primary}`}>{scenario.scenario_name}</p>
                                  <p className={`text-sm ${theme.text.secondary}`}>
                                    {scenario.session_count} session{scenario.session_count !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${theme.text.primary}`}>
                                    {scenario.average_score.toFixed(1)}
                                  </p>
                                  <div className="flex items-center justify-end mt-1">
                                    {scenario.trend === 'improving' && (
                                      <span className="text-xs text-green-500 flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Improving
                                      </span>
                                    )}
                                    {scenario.trend === 'declining' && (
                                      <span className="text-xs text-red-500 flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
                                        Declining
                                      </span>
                                    )}
                                    {scenario.trend === 'stable' && (
                                      <span className="text-xs text-blue-500">Stable</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Activity className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
                  <p className={`text-lg ${theme.text.primary}`}>No training data yet</p>
                  <p className={`text-sm ${theme.text.secondary} mt-2`}>
                    This trainee hasn't completed any training sessions yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div >
  )
}

export default AdminDashboard
