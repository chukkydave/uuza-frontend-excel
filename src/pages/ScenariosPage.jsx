import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../utils/api';
import {
  Play,
  Search,
  Building2,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Clock,
  User,
  Target,
  Star,
  BookOpen
} from 'lucide-react';

const ScenariosPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace } = useWorkspace();

  // Determine if we're in org context based on URL path
  const isOrgContext = location.pathname.startsWith('/org');
  const isPersonalWorkspace = currentWorkspace?.workspace_type === 'personal';

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  // For personal workspace, only show 'all' and 'default'. For org, show 'all', 'default', 'company'
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    loadScenarios();
  }, [currentPage, selectedFilter]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showModal]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);

      let allScenarios = [];
      let totalCount = 0;

      // For personal workspace or when filter is 'default' or 'all', fetch default scenarios
      if (isPersonalWorkspace || selectedFilter === 'default' || selectedFilter === 'all') {
        try {
          const defaultResponse = await api.getDefaultScenarios(currentPage, itemsPerPage);
          if (selectedFilter === 'default' || (isPersonalWorkspace && selectedFilter === 'all')) {
            // Only default scenarios
            allScenarios = defaultResponse.scenarios || [];
            totalCount = defaultResponse.total || 0;
          } else {
            // Mix with company scenarios
            allScenarios = [...(defaultResponse.scenarios || [])];
          }
        } catch (err) {
          console.error('Failed to load default scenarios:', err);
          // Continue - default scenarios might not be available
        }
      }

      // For org workspace, also fetch company scenarios when filter is 'company' or 'all'
      if (!isPersonalWorkspace && currentWorkspace?.id && (selectedFilter === 'company' || selectedFilter === 'all')) {
        try {
          const companyResponse = await api.getScenarios(currentWorkspace.id, currentPage, itemsPerPage);
          if (selectedFilter === 'company') {
            allScenarios = companyResponse.scenarios || [];
            totalCount = companyResponse.total || 0;
          } else {
            // Merge with default scenarios, avoiding duplicates
            const existingIds = new Set(allScenarios.map(s => s.id));
            const newScenarios = (companyResponse.scenarios || []).filter(s => !existingIds.has(s.id));
            allScenarios = [...allScenarios, ...newScenarios];
            totalCount = allScenarios.length;
          }
        } catch (err) {
          console.error('Failed to load company scenarios:', err);
          // Continue with default scenarios if available
        }
      }

      setScenarios(allScenarios);
      setTotalPages(Math.ceil(totalCount / itemsPerPage) || 1);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError('Failed to load scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewScenario = (scenario) => {
    setSelectedScenario(scenario);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedScenario(null);
  };

  const handleStartTraining = (scenario) => {
    const scenarioId = typeof scenario === 'string' ? scenario : scenario.id;
    const basePath = isOrgContext ? '/org' : '';
    navigate(`${basePath}/training/${scenarioId}`);
  };

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (scenario.description || scenario.generated_scenario_description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(isOrgContext ? '/org/dashboard' : '/dashboard')}
            className={`flex items-center space-x-2 ${theme.text.secondary} hover:${theme.text.primary} mb-4 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className={`text-3xl font-bold ${theme.text.primary} mb-2`}>
            Training Scenarios
          </h1>
          <p className={theme.text.secondary}>
            Choose a scenario to start your training session
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.text.muted}`} />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Filter Buttons - Hide Company filter for personal workspace */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedFilter === 'all'
                ? 'bg-blue-500 text-white'
                : `${theme.isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:${theme.isDark ? 'bg-white/10' : 'bg-gray-200'}`
                }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('default')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${selectedFilter === 'default'
                ? 'bg-blue-500 text-white'
                : `${theme.isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:${theme.isDark ? 'bg-white/10' : 'bg-gray-200'}`
                }`}
            >
              <Globe className="w-4 h-4" />
              <span>Default</span>
            </button>
            {/* Only show Company filter for organization workspaces */}
            {!isPersonalWorkspace && (
              <button
                onClick={() => setSelectedFilter('company')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${selectedFilter === 'company'
                  ? 'bg-blue-500 text-white'
                  : `${theme.isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:${theme.isDark ? 'bg-white/10' : 'bg-gray-200'}`
                  }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Company</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className={`w-8 h-8 ${theme.text.muted} animate-spin`} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-red-500/20' : 'border-red-200'}`}>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className={theme.text.primary}>{error}</p>
            </div>
          </div>
        )}

        {/* Scenarios Grid */}
        {!loading && !error && (
          <>
            {filteredScenarios.length === 0 ? (
              <div className={`${theme.bg.card} p-12 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} text-center`}>
                <BookOpen className={`w-16 h-16 ${theme.text.muted} mx-auto mb-4`} />
                <h3 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>No Scenarios Available</h3>
                <p className={`${theme.text.secondary} mb-4 max-w-md mx-auto`}>
                  {isPersonalWorkspace
                    ? 'Default training scenarios will appear here. Check back soon!'
                    : 'No scenarios found. Try adjusting your filters or create a new scenario from your playbooks.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => handleViewScenario(scenario)}
                    className={`${theme.bg.card} p-6 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'
                      } hover:border-blue-500 transition-all cursor-pointer group`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2 group-hover:text-blue-500 transition-colors`}>
                          {scenario.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          {scenario.generation_type === 'default' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Globe className="w-3 h-3 mr-1" />
                              Default
                            </span>
                          ) : (
                            /* Only show Company badge in org workspace */
                            !isPersonalWorkspace && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Building2 className="w-3 h-3 mr-1" />
                                Company
                              </span>
                            )
                          )}
                          {scenario.difficulty_level && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty_level)}`}>
                              {scenario.difficulty_level.charAt(0).toUpperCase() + scenario.difficulty_level.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className={`${theme.text.secondary} text-sm mb-4 line-clamp-3`}>
                      {scenario.description || scenario.generated_scenario_description || 'No description available'}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTraining(scenario);
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Training</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1
                    ? `${theme.text.muted} cursor-not-allowed`
                    : `${theme.text.primary} hover:${theme.isDark ? 'bg-white/5' : 'bg-gray-100'}`
                    }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className={theme.text.secondary}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages
                    ? `${theme.text.muted} cursor-not-allowed`
                    : `${theme.text.primary} hover:${theme.isDark ? 'bg-white/5' : 'bg-gray-100'}`
                    }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scenario Detail Modal */}
      {showModal && selectedScenario && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bg.card} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <h2 className={`text-xl font-semibold ${theme.text.primary}`}>
                  {selectedScenario.name}
                </h2>
                {selectedScenario.created_by_user_id && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                    <Star className="w-3 h-3 mr-1" />
                    Custom
                  </span>
                )}
              </div>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className={`w-5 h-5 ${theme.text.secondary}`} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Scenario Types */}
              {selectedScenario.scenario_type && selectedScenario.scenario_type.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Scenario Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.scenario_type.map((type, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Level */}
              {selectedScenario.difficulty_level && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Difficulty Level</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(selectedScenario.difficulty_level)}`}>
                    {selectedScenario.difficulty_level?.charAt(0).toUpperCase() + selectedScenario.difficulty_level?.slice(1)}
                  </span>
                </div>
              )}

              {/* Description */}
              {(selectedScenario.description || selectedScenario.generated_scenario_description) && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Description</h3>
                  <p className={`text-sm ${theme.text.secondary}`}>
                    {selectedScenario.description || selectedScenario.generated_scenario_description}
                  </p>
                </div>
              )}

              {/* Persona Information */}
              {selectedScenario.persona_name && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Persona</h3>
                  <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <p className={`text-sm font-medium ${theme.text.primary} mb-1`}>
                      {selectedScenario.persona_name}
                    </p>
                    {selectedScenario.persona_description && (
                      <p className={`text-sm ${theme.text.secondary}`}>
                        {selectedScenario.persona_description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Objectives */}
              {selectedScenario.objectives && selectedScenario.objectives.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Objectives</h3>
                  <ul className="space-y-1">
                    {selectedScenario.objectives.map((objective, index) => (
                      <li key={index} className={`text-sm ${theme.text.secondary} flex items-start`}>
                        <span className="mr-2">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Targeted */}
              {selectedScenario.skills_targeted && selectedScenario.skills_targeted.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Skills Targeted</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.skills_targeted.map((skill, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${theme.isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Criteria */}
              {selectedScenario.success_criteria && selectedScenario.success_criteria.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Success Criteria</h3>
                  <ul className="space-y-1">
                    {selectedScenario.success_criteria.map((criteria, index) => (
                      <li key={index} className={`text-sm ${theme.text.secondary} flex items-start`}>
                        <span className="mr-2">✓</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conversation Starters */}
              {selectedScenario.conversation_starters && selectedScenario.conversation_starters.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium ${theme.text.primary} mb-2`}>Conversation Starters</h3>
                  <div className="space-y-2">
                    {selectedScenario.conversation_starters.map((starter, index) => (
                      <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-3 rounded-lg`}>
                        <p className={`text-sm ${theme.text.secondary}`}>"{starter}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer with metadata and action button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center space-x-4">
                  {selectedScenario.estimated_duration_minutes && (
                    <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
                      <Clock className="w-3 h-3" />
                      <span>{selectedScenario.estimated_duration_minutes}min</span>
                    </span>
                  )}
                  {selectedScenario.skills_targeted && selectedScenario.skills_targeted.length > 0 && (
                    <span className={`text-xs ${theme.text.muted} flex items-center space-x-1`}>
                      <User className="w-3 h-3" />
                      <span>{selectedScenario.skills_targeted.length} skill(s)</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleStartTraining(selectedScenario)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Training</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenariosPage;

