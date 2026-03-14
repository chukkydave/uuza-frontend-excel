import {
  FileText, FileType, File, Edit, Download, Trash2,
  CheckCircle2, Clock, AlertCircle, Upload, Link2
} from 'lucide-react'

/**
 * PlaybookListItem Component
 *
 * List/table view row for displaying playbook information.
 */
const PlaybookListItem = ({
  playbook,
  theme,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDownload,
  onDelete,
  formatRelativeTime
}) => {
  // Get file type icon
  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case '.pdf':
        return <FileText className="w-5 h-5 text-red-500" />
      case '.docx':
      case '.doc':
        return <FileType className="w-5 h-5 text-blue-500" />
      case '.txt':
      case '.md':
        return <File className="w-5 h-5 text-gray-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
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
    <tr className={`${theme.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}>
      {/* Name Column */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          {getFileIcon(playbook.file_type)}
          <div className="min-w-0">
            <p className={`font-medium ${theme.text.primary} truncate`}>{playbook.name}</p>
            {playbook.description && (
              <p className={`text-sm ${theme.text.muted} line-clamp-1`}>{playbook.description}</p>
            )}
          </div>
        </div>
      </td>

      {/* Type Column */}
      <td className="px-6 py-4">
        <span className={`text-sm ${theme.text.secondary}`}>
          {getTypeLabel(playbook.type)}
        </span>
      </td>

      {/* Status Column */}
      <td className="px-6 py-4">
        {getStatusBadge(playbook.rawStatus)}
      </td>

      {/* Uploader Column */}
      <td className="px-6 py-4">
        {playbook.uploadedBy ? (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${theme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              {playbook.uploadedBy.charAt(0).toUpperCase()}
            </div>
            <span className={`text-sm ${theme.text.secondary} truncate max-w-[120px]`}>{playbook.uploadedBy}</span>
          </div>
        ) : (
          <span className={`text-sm ${theme.text.muted}`}>—</span>
        )}
      </td>

      {/* Date Column */}
      <td className="px-6 py-4">
        <span className={`text-sm ${theme.text.secondary}`}>
          {formatRelativeTime ? formatRelativeTime(playbook.created_at) : playbook.uploadDate}
        </span>
      </td>

      {/* Size Column */}
      <td className="px-6 py-4">
        <span className={`text-sm ${theme.text.secondary}`}>{formatFileSize(playbook.file_size)}</span>
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end space-x-2">
          {canEdit && (
            <button
              onClick={() => onEdit?.(playbook)}
              className={`p-1.5 rounded-lg ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              title="Edit"
            >
              <Edit className={`w-4 h-4 ${theme.text.secondary}`} />
            </button>
          )}
          {playbook.rawStatus === 'active' && (
            <button
              onClick={() => onDownload?.(playbook)}
              className={`p-1.5 rounded-lg ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              title="Download"
            >
              <Download className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </button>
          )}
          {canDelete && playbook.rawStatus === 'active' && (
            <button
              onClick={() => onDelete?.(playbook)}
              className={`p-1.5 rounded-lg ${theme.isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} transition-colors`}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default PlaybookListItem

