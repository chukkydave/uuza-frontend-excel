import { useState } from 'react'
import {
  FileText, FileType, File, MoreVertical, Edit, Download, Trash2,
  CheckCircle2, Clock, AlertCircle, Upload, Link2
} from 'lucide-react'

/**
 * PlaybookCard Component
 *
 * Grid view card for displaying playbook information.
 * Shows thumbnail, title, uploader, date, status, and actions.
 */
const PlaybookCard = ({
  playbook,
  theme,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDownload,
  onDelete,
  formatRelativeTime
}) => {
  const [showMenu, setShowMenu] = useState(false)

  // Get file type icon based on extension
  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case '.pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case '.docx':
      case '.doc':
        return <FileType className="w-8 h-8 text-blue-500" />
      case '.txt':
      case '.md':
        return <File className="w-8 h-8 text-gray-500" />
      default:
        return <FileText className="w-8 h-8 text-gray-400" />
    }
  }

  // Get status indicator
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        bg: theme.isDark ? 'bg-green-500/20' : 'bg-green-100',
        text: theme.isDark ? 'text-green-400' : 'text-green-700',
        label: 'Active'
      },
      processing: {
        icon: <Clock className="w-3.5 h-3.5 animate-pulse" />,
        bg: theme.isDark ? 'bg-yellow-500/20' : 'bg-yellow-100',
        text: theme.isDark ? 'text-yellow-400' : 'text-yellow-700',
        label: 'Processing'
      },
      uploaded: {
        icon: <Upload className="w-3.5 h-3.5" />,
        bg: theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100',
        text: theme.isDark ? 'text-blue-400' : 'text-blue-700',
        label: 'Uploaded'
      },
      error: {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        bg: theme.isDark ? 'bg-red-500/20' : 'bg-red-100',
        text: theme.isDark ? 'text-red-400' : 'text-red-700',
        label: 'Failed'
      },
      failed: {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        bg: theme.isDark ? 'bg-red-500/20' : 'bg-red-100',
        text: theme.isDark ? 'text-red-400' : 'text-red-700',
        label: 'Failed'
      }
    }

    const config = statusConfig[status?.toLowerCase()] || statusConfig.uploaded
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    )
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Get playbook type label
  const getTypeLabel = (type) => {
    const typeMap = {
      'sales_methodology': 'Sales Methodology',
      'product_knowledge': 'Product Knowledge',
      'objection_handling': 'Objection Handling',
      'negotiation': 'Negotiation',
      'customer_service': 'Customer Service',
      'onboarding': 'Onboarding',
      'compliance': 'Compliance'
    }
    return typeMap[type] || type || 'General'
  }

  return (
    <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden hover:shadow-lg transition-all duration-200 group`}>
      {/* Thumbnail Area */}
      <div className={`h-32 flex items-center justify-center ${theme.isDark ? 'bg-gradient-to-br from-slate-800 to-slate-700' : 'bg-gradient-to-br from-gray-50 to-gray-100'} relative`}>
        {getFileIcon(playbook.file_type)}

        {/* Action Menu Button */}
        {(canEdit || canDelete) && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className={`p-1.5 rounded-lg ${theme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/80 hover:bg-white'} opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <MoreVertical className={`w-4 h-4 ${theme.text.secondary}`} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className={`absolute right-0 mt-1 w-40 rounded-lg shadow-lg ${theme.bg.card} border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} z-20 py-1`}>
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit?.(playbook) }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  {playbook.rawStatus === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDownload?.(playbook) }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  )}
                  {canDelete && playbook.rawStatus === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(playbook) }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-red-500 ${theme.isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-2 left-2">
          {getStatusBadge(playbook.rawStatus)}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* Title */}
        <h3 className={`font-semibold ${theme.text.primary} truncate mb-1`} title={playbook.name}>
          {playbook.name}
        </h3>

        {/* Type Badge */}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${theme.isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'} mb-3`}>
          {getTypeLabel(playbook.type)}
        </span>

        {/* Meta Info */}
        <div className="space-y-2">
          {/* Uploader */}
          {playbook.uploadedBy && (
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${theme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                {playbook.uploadedBy.charAt(0).toUpperCase()}
              </div>
              <span className={`text-xs ${theme.text.muted} truncate`}>{playbook.uploadedBy}</span>
            </div>
          )}

          {/* Date and Size */}
          <div className={`flex items-center justify-between text-xs ${theme.text.muted}`}>
            <span>{formatRelativeTime ? formatRelativeTime(playbook.created_at) : playbook.uploadDate}</span>
            <span>{formatFileSize(playbook.file_size)}</span>
          </div>

          {/* Linked Scenarios */}
          {playbook.linkedScenarios > 0 && (
            <div className={`flex items-center space-x-1 text-xs ${theme.isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              <Link2 className="w-3.5 h-3.5" />
              <span>{playbook.linkedScenarios} scenario{playbook.linkedScenarios !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaybookCard

