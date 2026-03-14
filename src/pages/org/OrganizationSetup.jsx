import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { Building2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../../utils/api'

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'healthcare', label: 'Healthcare & Life Sciences' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'consulting', label: 'Professional Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'hospitality', label: 'Hospitality & Travel' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'energy', label: 'Energy & Utilities' }
]

// Backend CompanySize enum values: STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE
const COMPANY_SIZES = [
  { value: 'STARTUP', label: 'STARTUP (1-10 employees)' },
  { value: 'SMALL', label: 'SMALL (11-50 employees)' },
  { value: 'MEDIUM', label: 'MEDIUM (51-200 employees)' },
  { value: 'LARGE', label: 'LARGE (201-1000 employees)' },
  { value: 'ENTERPRISE', label: 'ENTERPRISE (1000+ employees)' }
]

const OrganizationSetup = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { switchWorkspace } = useWorkspace()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: ''
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    if (!formData.industry) {
      newErrors.industry = 'Please select an industry'
    }
    if (!formData.companySize) {
      newErrors.companySize = 'Please select a company size'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
    if (apiError) {
      setApiError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setApiError('')

    try {
      // Map form data to backend schema
      // company_email is optional and not collected in this form
      const payload = {
        name: formData.companyName.trim(),
        industry: formData.industry,
        size: formData.companySize
      }

      console.log('Creating organization workspace:', payload)
      await api.registerCompany(payload)

      // Fetch workspace data to get the newly created workspace
      const workspaceData = await api.getWorkspaceSwitcherData()

      // Find and switch to the newly created organization workspace
      const orgWorkspaces = workspaceData.organization_workspaces || []
      if (orgWorkspaces.length > 0) {
        // Switch to the first (newest) organization workspace
        await switchWorkspace(orgWorkspaces[0].id)
      }

      // Redirect to setup wizard for onboarding
      navigate('/org/onboarding/wizard')
    } catch (error) {
      console.error('Failed to create organization:', error)
      setApiError('Failed to create organization. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl ${theme.isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center mx-auto mb-4`}>
              <Building2 className={`w-8 h-8 ${theme.isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold ${theme.text.primary} mb-2`}>
              Create your Company Workspace
            </h1>
            <p className={`text-base ${theme.text.secondary}`}>
              Manage training for your entire team in one place.
            </p>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className={`mb-6 p-4 rounded-lg border ${theme.isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} flex items-start space-x-3`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={`${theme.bg.card} rounded-xl p-6 border ${theme.isDark ? 'border-white/10' : 'border-gray-200'}`}>
            {/* Company Name */}
            <div className="mb-5">
              <label htmlFor="companyName" className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Corporation"
                className={`w-full px-4 py-3 rounded-lg border ${errors.companyName
                  ? 'border-red-500 focus:ring-red-500'
                  : theme.isDark ? 'border-white/10 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'
                  } ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 transition-colors`}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* Industry */}
            <div className="mb-5">
              <label htmlFor="industry" className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.industry
                  ? 'border-red-500 focus:ring-red-500'
                  : theme.isDark ? 'border-white/10 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'
                  } ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 transition-colors`}
              >
                <option value="">Select an industry...</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry.value} value={industry.value}>{industry.label}</option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-500">{errors.industry}</p>
              )}
            </div>

            {/* Company Size */}
            <div className="mb-6">
              <label htmlFor="companySize" className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                Company Size <span className="text-red-500">*</span>
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.companySize
                  ? 'border-red-500 focus:ring-red-500'
                  : theme.isDark ? 'border-white/10 focus:ring-cyan-400' : 'border-gray-300 focus:ring-blue-500'
                  } ${theme.bg.secondary} ${theme.text.primary} focus:outline-none focus:ring-2 transition-colors`}
              >
                <option value="">Select company size...</option>
                {COMPANY_SIZES.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
              {errors.companySize && (
                <p className="mt-1 text-sm text-red-500">{errors.companySize}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${theme.button.primary} py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </form>

          {/* Cancel Link */}
          <button
            onClick={() => navigate('/onboarding/workspace-select')}
            className={`mt-6 w-full flex items-center justify-center space-x-2 ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrganizationSetup

