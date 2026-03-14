import { Search, Grid3X3, List, Filter, X } from 'lucide-react'

/**
 * PlaybookFilters Component
 *
 * Filter and search controls for playbook list.
 * Includes view toggle (Grid/List), search bar, and filter dropdowns.
 */
const PlaybookFilters = ({
  theme,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  showFilters,
  setShowFilters
}) => {
  // Status options
  const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'processing', label: 'Processing' },
    { value: 'uploaded', label: 'Uploaded' },
    { value: 'error', label: 'Failed' }
  ]

  // Type options
  const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'sales_methodology', label: 'Sales Methodology' },
    { value: 'product_knowledge', label: 'Product Knowledge' },
    { value: 'objection_handling', label: 'Objection Handling' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'compliance', label: 'Compliance' }
  ]

  const hasActiveFilters = statusFilter || typeFilter

  const clearFilters = () => {
    setStatusFilter('')
    setTypeFilter('')
  }

  return (
    <div className="space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.text.muted}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playbooks..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${theme.isDark
              ? 'bg-slate-800 border-white/10 text-white placeholder-gray-400'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-4 h-4 ${theme.text.muted}`} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-colors ${showFilters || hasActiveFilters
            ? theme.isDark
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              : 'bg-blue-50 border-blue-200 text-blue-600'
            : theme.isDark
              ? 'bg-slate-800 border-white/10 text-gray-300 hover:bg-slate-700'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className={`w-2 h-2 rounded-full ${theme.isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />
          )}
        </button>

        {/* View Toggle */}
        <div className={`flex rounded-lg border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid'
              ? theme.isDark
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-50 text-blue-600'
              : theme.isDark
                ? 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            title="Grid View"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list'
              ? theme.isDark
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-50 text-blue-600'
              : theme.isDark
                ? 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Dropdowns (Collapsible) */}
      {showFilters && (
        <div className={`flex flex-wrap gap-3 p-4 rounded-lg ${theme.isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${theme.isDark
              ? 'bg-slate-800 border-white/10 text-white'
              : 'bg-white border-gray-200 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${theme.isDark
              ? 'bg-slate-800 border-white/10 text-white'
              : 'bg-white border-gray-200 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium ${theme.isDark
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-red-600 hover:bg-red-50'
                } transition-colors`}
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PlaybookFilters

