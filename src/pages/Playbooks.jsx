import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { api } from '../utils/api'
import {
  Upload, BookOpen, Loader2, RefreshCw
} from 'lucide-react'
import {
  PlaybookCard,
  PlaybookListItem,
  PlaybookFilters,
  PlaybookUploadModal
} from '../components/playbooks'

/**
 * Playbooks Page
 *
 * Unified playbook management for both personal and organization workspaces.
 * Features:
 * - Grid/List view toggle with persistence
 * - Search and filter functionality
 * - Role-based permissions (upload, edit, delete)
 * - Drag-drop upload modal
 * - Processing status indicators
 */
const Playbooks = () => {
  const theme = useTheme()
  const { currentWorkspace, isAdminOrOwner } = useWorkspace()

  // View state
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('playbooks_view_mode') || 'grid'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState(null)

  // Data state
  const [playbooks, setPlaybooks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Notification state
  const [notification, setNotification] = useState(null)

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    playbook_type: 'sales_methodology'
  })

  // Determine workspace type and permissions
  const isOrganization = currentWorkspace?.workspace_type === 'organization'
  const canUpload = isOrganization ? isAdminOrOwner : true // Personal workspace owners can always upload
  const canEdit = isOrganization ? isAdminOrOwner : true
  const canDelete = isOrganization ? isAdminOrOwner : true

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('playbooks_view_mode', viewMode)
  }, [viewMode])

  // Load playbooks when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadPlaybooks()
    }
  }, [currentWorkspace?.id])

  // Poll for status updates when playbooks are processing
  useEffect(() => {
    // Check if any playbooks are still processing
    const processingPlaybooks = playbooks.filter(p => {
      const status = p.rawStatus?.toUpperCase()
      return status === 'UPLOADED' || status === 'PROCESSING'
    })

    // No processing playbooks, no need to poll
    if (processingPlaybooks.length === 0) return

    // Poll every 3 seconds while there are processing playbooks
    const pollInterval = setInterval(() => {
      console.log(`Polling for ${processingPlaybooks.length} processing playbook(s)...`)
      loadPlaybooks(true)
    }, 3000)

    // Cleanup interval on unmount or when processing completes
    return () => clearInterval(pollInterval)
  }, [playbooks, currentWorkspace?.id])

  const loadPlaybooks = async (showRefreshIndicator = false) => {
    if (!currentWorkspace?.id) {
      setIsLoading(false)
      return
    }

    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await api.getPlaybooks(currentWorkspace.id)

      // Transform playbooks for display
      const transformedPlaybooks = (response.playbooks || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: formatStatus(p.playbook_status),
        rawStatus: p.playbook_status,
        uploadDate: new Date(p.created_at).toLocaleDateString(),
        created_at: p.created_at,
        file_size: p.file_size,
        size: p.file_size ? `${(p.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
        type: p.playbook_type || 'sales_methodology',
        file_type: p.file_type,
        file_name: p.file_name,
        uploadedBy: p.uploaded_by_name || null, // Would come from API if available
        linkedScenarios: p.scenario_count || 0 // Would come from API if available
      }))

      setPlaybooks(transformedPlaybooks)
    } catch (error) {
      console.error('Failed to load playbooks:', error)
      showNotification('Failed to load playbooks', 'error')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const formatStatus = (status) => {
    const statusMap = {
      'uploaded': 'Uploaded',
      'processing': 'Processing',
      'active': 'Active',
      'error': 'Failed',
      'failed': 'Failed',
      'archived': 'Archived'
    }
    return statusMap[status] || status
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Filter playbooks
  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(p => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!p.name.toLowerCase().includes(query) &&
          !p.description?.toLowerCase().includes(query)) {
          return false
        }
      }

      // Status filter
      if (statusFilter && p.rawStatus !== statusFilter) {
        return false
      }

      // Type filter
      if (typeFilter && p.type !== typeFilter) {
        return false
      }

      return true
    })
  }, [playbooks, searchQuery, statusFilter, typeFilter])

  // Handlers
  const handleUpload = async (formData) => {
    if (!currentWorkspace?.id) {
      showNotification('No workspace selected', 'error')
      return
    }
    const response = await api.uploadPlaybook(currentWorkspace.id, formData)
    showNotification('Playbook uploaded successfully! Processing will begin shortly.', 'success')
    // Reload after a short delay to show new playbook
    setTimeout(() => loadPlaybooks(true), 1500)
    return response
  }

  const handleEdit = (playbook) => {
    setEditingPlaybook(playbook)
    setEditFormData({
      name: playbook.name || '',
      description: playbook.description || '',
      playbook_type: playbook.type || 'sales_methodology'
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editFormData.name.trim()) {
      showNotification('Please enter a playbook name', 'error')
      return
    }

    if (!currentWorkspace?.id) {
      showNotification('No workspace selected', 'error')
      return
    }

    try {
      await api.updatePlaybook(currentWorkspace.id, editingPlaybook.id, editFormData)
      showNotification('Playbook updated successfully', 'success')
      setShowEditModal(false)
      setEditingPlaybook(null)
      loadPlaybooks(true)
    } catch (error) {
      console.error('Failed to update playbook:', error)
      showNotification(error.message || 'Failed to update playbook', 'error')
    }
  }

  const handleDownload = async (playbook) => {
    if (!currentWorkspace?.id) {
      showNotification('No workspace selected', 'error')
      return
    }

    try {
      const response = await api.getPlaybookDownloadUrl(currentWorkspace.id, playbook.id)
      const link = document.createElement('a')
      link.href = response.download_url
      link.download = playbook.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showNotification('Download started', 'success')
    } catch (error) {
      console.error('Failed to download playbook:', error)
      showNotification(error.message || 'Failed to download playbook', 'error')
    }
  }

  const handleDelete = async (playbook) => {
    if (!window.confirm(`Are you sure you want to delete "${playbook.name}"? This action cannot be undone.`)) {
      return
    }

    if (!currentWorkspace?.id) {
      showNotification('No workspace selected', 'error')
      return
    }

    try {
      await api.deletePlaybook(currentWorkspace.id, playbook.id)
      showNotification('Playbook deleted successfully', 'success')
      setPlaybooks(prev => prev.filter(p => p.id !== playbook.id))
    } catch (error) {
      console.error('Failed to delete playbook:', error)
      showNotification(error.message || 'Failed to delete playbook', 'error')
    }
  }

  // Playbook type options for edit modal
  const PLAYBOOK_TYPES = [
    { value: 'sales_methodology', label: 'Sales Methodology' },
    { value: 'product_knowledge', label: 'Product Knowledge' },
    { value: 'objection_handling', label: 'Objection Handling' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'compliance', label: 'Compliance' }
  ]

  return (
    <div className={`p-6 min-h-screen ${theme.bg.primary}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${theme.text.primary}`}>Playbooks</h1>
            <p className={`${theme.text.secondary} mt-1`}>
              Manage your training playbooks and knowledge base documents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={() => loadPlaybooks(true)}
              disabled={isRefreshing}
              className={`p-2.5 rounded-lg border ${theme.isDark
                ? 'border-white/10 hover:bg-white/5'
                : 'border-gray-200 hover:bg-gray-50'
                } transition-colors disabled:opacity-50`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''} ${theme.text.secondary}`} />
            </button>

            {/* Upload Button */}
            {canUpload && (
              <button
                onClick={() => setShowUploadModal(true)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium ${theme.isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
              >
                <Upload className="w-5 h-5" />
                <span>Upload Playbook</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${notification.type === 'success'
            ? theme.isDark
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-green-50 text-green-700 border border-green-200'
            : theme.isDark
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {notification.message}
          </div>
        )}

        {/* Filters */}
        <PlaybookFilters
          theme={theme}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className={`w-8 h-8 animate-spin ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        ) : filteredPlaybooks.length === 0 ? (
          <EmptyState
            theme={theme}
            hasPlaybooks={playbooks.length > 0}
            canUpload={canUpload}
            onUpload={() => setShowUploadModal(true)}
            onClearFilters={() => {
              setSearchQuery('')
              setStatusFilter('')
              setTypeFilter('')
            }}
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlaybooks.map(playbook => (
              <PlaybookCard
                key={playbook.id}
                playbook={playbook}
                theme={theme}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={handleEdit}
                onDownload={handleDownload}
                onDelete={handleDelete}
                formatRelativeTime={formatRelativeTime}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Name</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Type</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Uploaded By</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Size</th>
                    <th className={`px-6 py-3 text-right text-xs font-semibold ${theme.text.secondary} uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                  {filteredPlaybooks.map(playbook => (
                    <PlaybookListItem
                      key={playbook.id}
                      playbook={playbook}
                      theme={theme}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={handleEdit}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      formatRelativeTime={formatRelativeTime}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <PlaybookUploadModal
        theme={theme}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        isOrganization={isOrganization}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.isDark ? 'bg-black/60' : 'bg-gray-900/50'} backdrop-blur-sm`}>
          <div className={`${theme.bg.card} rounded-xl p-6 w-full max-w-md mx-4 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Edit Playbook</h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-1.5`}>Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.isDark
                    ? 'bg-slate-800 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-1.5`}>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.isDark
                    ? 'bg-slate-800 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 resize-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-1.5`}>Type</label>
                <select
                  value={editFormData.playbook_type}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, playbook_type: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-lg border ${theme.isDark
                    ? 'bg-slate-800 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500`}
                >
                  {PLAYBOOK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingPlaybook(null) }}
                className={`px-4 py-2 rounded-lg font-medium ${theme.isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editFormData.name.trim()}
                className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Empty State Component
 */
const EmptyState = ({ theme, hasPlaybooks, canUpload, onUpload, onClearFilters }) => {
  if (hasPlaybooks) {
    // No results from filters
    return (
      <div className={`${theme.bg.card} rounded-xl p-12 text-center border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <BookOpen className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
        <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>No Matching Playbooks</h3>
        <p className={`${theme.text.secondary} mb-4`}>
          Try adjusting your search or filters
        </p>
        <button
          onClick={onClearFilters}
          className={`${theme.isDark ? 'text-blue-400' : 'text-blue-600'} font-medium hover:underline`}
        >
          Clear all filters
        </button>
      </div>
    )
  }

  // No playbooks at all
  return (
    <div className={`${theme.bg.card} rounded-xl p-12 text-center border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <BookOpen className={`w-16 h-16 ${theme.text.muted} mx-auto mb-4`} />
      <h3 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>No Playbooks Yet</h3>
      <p className={`${theme.text.secondary} mb-6 max-w-md mx-auto`}>
        Upload your first playbook to start creating AI-powered training scenarios
      </p>
      {canUpload && (
        <button
          onClick={onUpload}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Playbook</span>
        </button>
      )}
    </div>
  )
}

export default Playbooks
