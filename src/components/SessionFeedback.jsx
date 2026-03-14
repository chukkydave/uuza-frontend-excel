import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Zap,
  Clock,
  MessageSquare,
  BarChart3,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Star,
  Activity,
  Users,
  Shield,
  AlertTriangle
} from 'lucide-react';

const SessionFeedback = ({ feedback, session, transcript, duration }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('summary');

  if (!feedback) {
    return (
      <div className={`${theme.bg.card} p-8 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 ${theme.text.muted} mx-auto mb-4`} />
          <p className={`${theme.text.secondary}`}>
            Feedback not yet available. Please wait for analysis to complete.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Award },
    { id: 'keypoints', label: 'Key Points', icon: Star },
    { id: 'scoring', label: 'Scoring', icon: BarChart3 },
    { id: 'details', label: 'Details', icon: Activity }
  ];

  // Helper functions
  const getPerformanceColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getPerformanceBadgeColor = (level) => {
    const levelLower = level?.toLowerCase() || '';
    if (levelLower.includes('excellent')) return 'bg-green-100 text-green-800';
    if (levelLower.includes('good')) return 'bg-blue-100 text-blue-800';
    if (levelLower.includes('fair')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render Summary Tab
  const renderSummaryTab = () => (
    <div className="p-6 space-y-6">
      {/* Call Summary */}
      {feedback.call_summary && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-3`}>Call Summary</h3>
          <p className={`${theme.text.secondary} leading-relaxed`}>{feedback.call_summary}</p>
        </div>
      )}

      {/* Overall Feedback */}
      {feedback.overall_feedback && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-6 rounded-lg`}>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <Award className="w-5 h-5 text-blue-500" />
            <span>Overall Assessment</span>
          </h3>
          <p className={`${theme.text.secondary} leading-relaxed whitespace-pre-wrap`}>
            {feedback.overall_feedback}
          </p>
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <ThumbsUp className="w-5 h-5 text-green-500" />
            <span>Key Strengths</span>
          </h3>
          <div className="space-y-2">
            {feedback.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className={`${theme.text.secondary}`}>{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Recommendations */}
      {feedback.improvement_recommendations && feedback.improvement_recommendations.length > 0 && (
        <div>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <Lightbulb className="w-5 h-5 text-orange-500" />
            <span>Areas for Improvement</span>
          </h3>
          <div className="space-y-3">
            {feedback.improvement_recommendations.map((rec, index) => (
              <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                <p className={`font-medium ${theme.text.primary} mb-1`}>{rec.area || rec.skill_name || 'Area'}</p>
                <p className={`text-sm ${theme.text.secondary}`}>{rec.recommendation || rec.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Key Points Tab
  const renderKeyPointsTab = () => (
    <div className="p-6 space-y-6">
      {/* Key Moments */}
      {feedback.key_moments && feedback.key_moments.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Key Moments</h3>
          <div className="space-y-4">
            {feedback.key_moments.map((moment, index) => (
              <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-medium ${theme.text.primary}`}>{moment.title || moment.moment || `Moment ${index + 1}`}</h4>
                  {moment.timestamp && (
                    <span className={`text-sm ${theme.text.muted}`}>{moment.timestamp}</span>
                  )}
                </div>
                <p className={`text-sm ${theme.text.secondary}`}>{moment.description || moment.analysis}</p>
                {moment.impact && (
                  <p className={`text-sm ${theme.text.muted} mt-2`}>
                    <span className="font-medium">Impact:</span> {moment.impact}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objections Encountered */}
      {feedback.objections_encountered && feedback.objections_encountered.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center space-x-2`}>
            <Shield className="w-5 h-5 text-purple-500" />
            <span>Objections Handled</span>
          </h3>
          <div className="space-y-3">
            {feedback.objections_encountered.map((objection, index) => (
              <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                <p className={`font-medium ${theme.text.primary} mb-2`}>{objection.objection || objection.type}</p>
                <p className={`text-sm ${theme.text.secondary} mb-2`}>
                  <span className="font-medium">Response:</span> {objection.response || objection.handling}
                </p>
                {objection.effectiveness && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getScoreColor(objection.effectiveness)}`}>
                      Effectiveness: {objection.effectiveness}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {(feedback.next_steps_secured?.length > 0 || feedback.next_steps_proposed?.length > 0) && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Next Steps</h3>
          {feedback.next_steps_secured && feedback.next_steps_secured.length > 0 && (
            <div className="mb-4">
              <h4 className={`text-sm font-medium ${theme.text.secondary} mb-2`}>Secured</h4>
              <div className="space-y-2">
                {feedback.next_steps_secured.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className={`text-sm ${theme.text.secondary}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {feedback.next_steps_proposed && feedback.next_steps_proposed.length > 0 && (
            <div>
              <h4 className={`text-sm font-medium ${theme.text.secondary} mb-2`}>Proposed</h4>
              <div className="space-y-2">
                {feedback.next_steps_proposed.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className={`text-sm ${theme.text.secondary}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Scoring Tab
  const renderScoringTab = () => (
    <div className="p-6 space-y-6">
      {/* Objectives Assessment */}
      {feedback.objectives_assessment && feedback.objectives_assessment.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center space-x-2`}>
            <Target className="w-5 h-5 text-blue-500" />
            <span>Objectives Assessment</span>
          </h3>
          <div className="space-y-3">
            {feedback.objectives_assessment.map((obj, index) => (
              <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                <div className="flex items-start justify-between mb-2">
                  <p className={`font-medium ${theme.text.primary}`}>{obj.objective}</p>
                  <div className="flex items-center space-x-2">
                    {obj.met ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {obj.score !== undefined && (
                      <span className={`text-sm font-bold ${getScoreColor(obj.score)}`}>
                        {obj.score}%
                      </span>
                    )}
                  </div>
                </div>
                {obj.evidence && (
                  <p className={`text-sm ${theme.text.secondary} mb-2`}>
                    <span className="font-medium">Evidence:</span> {obj.evidence}
                  </p>
                )}
                {obj.feedback && (
                  <p className={`text-sm ${theme.text.secondary}`}>{obj.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Criteria Assessment */}
      {feedback.success_criteria_assessment && feedback.success_criteria_assessment.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4`}>Success Criteria</h3>
          <div className="space-y-3">
            {feedback.success_criteria_assessment.map((criteria, index) => (
              <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                <div className="flex items-start justify-between mb-2">
                  <p className={`font-medium ${theme.text.primary}`}>{criteria.criterion || criteria.criteria}</p>
                  <div className="flex items-center space-x-2">
                    {criteria.met || criteria.achieved ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                {criteria.feedback && (
                  <p className={`text-sm ${theme.text.secondary}`}>{criteria.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Assessment */}
      {feedback.skills_assessment && feedback.skills_assessment.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center space-x-2`}>
            <Zap className="w-5 h-5 text-purple-500" />
            <span>Skills Assessment</span>
          </h3>
          <div className="space-y-3">
            {feedback.skills_assessment.map((skill, index) => (
              <div key={index} className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
                <div className="flex items-start justify-between mb-2">
                  <p className={`font-medium ${theme.text.primary}`}>{skill.skill_name || skill.skill}</p>
                  {skill.score !== undefined && (
                    <span className={`text-lg font-bold ${getScoreColor(skill.score)}`}>
                      {skill.score}%
                    </span>
                  )}
                </div>
                {skill.feedback && (
                  <p className={`text-sm ${theme.text.secondary} mb-2`}>{skill.feedback}</p>
                )}
                {skill.evidence && (
                  <p className={`text-sm ${theme.text.muted}`}>
                    <span className="font-medium">Evidence:</span> {skill.evidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Details Tab
  const renderDetailsTab = () => (
    <div className="p-6 space-y-6">
      {/* Communication Effectiveness */}
      {feedback.communication_effectiveness && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span>Communication Effectiveness</span>
          </h3>
          {feedback.communication_effectiveness.score !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${theme.text.secondary}`}>Score</span>
                <span className={`font-bold ${getScoreColor(feedback.communication_effectiveness.score)}`}>
                  {feedback.communication_effectiveness.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${feedback.communication_effectiveness.score >= 80
                    ? 'bg-green-500'
                    : feedback.communication_effectiveness.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                  style={{ width: `${feedback.communication_effectiveness.score}%` }}
                />
              </div>
            </div>
          )}
          {feedback.communication_effectiveness.feedback && (
            <p className={`text-sm ${theme.text.secondary}`}>{feedback.communication_effectiveness.feedback}</p>
          )}
        </div>
      )}

      {/* Rapport Building */}
      {feedback.rapport_building && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <Users className="w-5 h-5 text-green-500" />
            <span>Rapport Building</span>
          </h3>
          {feedback.rapport_building.score !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${theme.text.secondary}`}>Score</span>
                <span className={`font-bold ${getScoreColor(feedback.rapport_building.score)}`}>
                  {feedback.rapport_building.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${feedback.rapport_building.score >= 80
                    ? 'bg-green-500'
                    : feedback.rapport_building.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                  style={{ width: `${feedback.rapport_building.score}%` }}
                />
              </div>
            </div>
          )}
          {feedback.rapport_building.feedback && (
            <p className={`text-sm ${theme.text.secondary}`}>{feedback.rapport_building.feedback}</p>
          )}
        </div>
      )}

      {/* Objection Handling */}
      {feedback.objection_handling && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <Shield className="w-5 h-5 text-purple-500" />
            <span>Objection Handling</span>
          </h3>
          {feedback.objection_handling.score !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${theme.text.secondary}`}>Score</span>
                <span className={`font-bold ${getScoreColor(feedback.objection_handling.score)}`}>
                  {feedback.objection_handling.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${feedback.objection_handling.score >= 80
                    ? 'bg-green-500'
                    : feedback.objection_handling.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                  style={{ width: `${feedback.objection_handling.score}%` }}
                />
              </div>
            </div>
          )}
          {feedback.objection_handling.feedback && (
            <p className={`text-sm ${theme.text.secondary}`}>{feedback.objection_handling.feedback}</p>
          )}
        </div>
      )}

      {/* Closing Techniques */}
      {feedback.closing_techniques && (
        <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
          <h3 className={`font-semibold ${theme.text.primary} mb-3 flex items-center space-x-2`}>
            <Target className="w-5 h-5 text-orange-500" />
            <span>Closing Techniques</span>
          </h3>
          {feedback.closing_techniques.score !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${theme.text.secondary}`}>Score</span>
                <span className={`font-bold ${getScoreColor(feedback.closing_techniques.score)}`}>
                  {feedback.closing_techniques.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${feedback.closing_techniques.score >= 80
                    ? 'bg-green-500'
                    : feedback.closing_techniques.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}
                  style={{ width: `${feedback.closing_techniques.score}%` }}
                />
              </div>
            </div>
          )}
          {feedback.closing_techniques.feedback && (
            <p className={`text-sm ${theme.text.secondary}`}>{feedback.closing_techniques.feedback}</p>
          )}
        </div>
      )}

      {/* Call Details */}
      <div className={`${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} p-4 rounded-lg`}>
        <h3 className={`font-semibold ${theme.text.primary} mb-3`}>Call Details</h3>
        <div className="space-y-2 text-sm">
          {feedback.ended_reason && (
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Ended Reason:</span>
              <span className={theme.text.primary}>{feedback.ended_reason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <div className={`${theme.bg.card} p-8 rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Score Circle */}
          <div className="flex items-center space-x-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-r ${getPerformanceColor(feedback.overall_score)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{Math.round(feedback.overall_score)}</div>
                <div className="text-xs text-white/80">/ 100</div>
              </div>
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.text.primary} mb-1`}>
                {feedback.training_name || 'Training Session'}
              </h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPerformanceBadgeColor(feedback.performance_level)}`}>
                {feedback.performance_level}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Clock className={`w-5 h-5 ${theme.text.muted} mx-auto mb-1`} />
              <p className={`text-sm ${theme.text.secondary}`}>Duration</p>
              <p className={`text-lg font-bold ${theme.text.primary}`}>
                {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <MessageSquare className={`w-5 h-5 ${theme.text.muted} mx-auto mb-1`} />
              <p className={`text-sm ${theme.text.secondary}`}>Messages</p>
              <p className={`text-lg font-bold ${theme.text.primary}`}>
                {session?.total_messages || 0}
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className={`w-5 h-5 ${theme.text.muted} mx-auto mb-1`} />
              <p className={`text-sm ${theme.text.secondary}`}>Status</p>
              <p className={`text-lg font-bold ${theme.text.primary} capitalize`}>
                {feedback.feedback_status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`${theme.bg.card} rounded-xl border ${theme.isDark ? 'border-white/10' : 'border-gray-200'} overflow-hidden`}>
        <div className={`flex border-b ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center space-x-2 ${activeTab === tab.id
                  ? `${theme.text.primary} ${theme.isDark ? 'bg-white/5' : 'bg-gray-50'} border-b-2 border-blue-500`
                  : `${theme.text.secondary} hover:${theme.isDark ? 'bg-white/5' : 'bg-gray-50'}`
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'summary' && renderSummaryTab()}
          {activeTab === 'keypoints' && renderKeyPointsTab()}
          {activeTab === 'scoring' && renderScoringTab()}
          {activeTab === 'details' && renderDetailsTab()}
        </div>
      </div>
    </div>
  );
};

export default SessionFeedback;

