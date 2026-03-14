const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000'

class ApiClient {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/v1`
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      ...options.headers,
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const config = {
      credentials: 'include', // for session cookies
      headers,
      ...options,
    }

    console.log('API Request:', {
      method: options.method || 'GET',
      url,
      headers,
      body: options.body
    });

    try {
      const response = await fetch(url, config)
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      // Handle redirects (307 from auth dependencies)
      if (response.status === 307) {
        const location = response.headers.get('Location')
        if (location && location.includes('/auth/login')) {
          window.location.href = `${API_BASE_URL}${location}`
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = `HTTP ${response.status}`

        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Handle Pydantic validation errors - but sanitize them
            errorMessage = errorData.detail.map(err => {
              // 🚨 SECURITY: Don't expose internal field names or technical details
              const field = err.loc?.slice(-1)[0] || 'field'
              const msg = err.msg || 'is invalid'

              // Sanitize common field names to user-friendly terms
              const friendlyField = {
                'name': 'playbook name',
                'description': 'description',
                'playbook_type': 'playbook type',
                'file': 'file'
              }[field] || 'input'

              return `${friendlyField}: ${msg}`
            }).join(', ')
          } else {
            // 🚨 SECURITY: Sanitize backend error messages
            errorMessage = this.sanitizeErrorMessage(errorData.detail)
          }
        }

        throw new Error(errorMessage)
      }

      // Handle 204 No Content responses (successful DELETE operations)
      if (response.status === 204) {
        return { success: true }
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      return response
    } catch (error) {
      // 🚨 SECURITY: Log full error for debugging but don't expose to user
      console.error(`API request failed: ${endpoint}`, {
        error: error.message,
        endpoint,
        url
      })
      throw error
    }
  }

  // 🚨 SECURITY: Sanitize error messages to prevent information disclosure
  sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') {
      return 'An error occurred'
    }

    // Remove sensitive information patterns
    const sensitivePatterns = [
      /\/[A-Za-z0-9\/\-_\.]+/g, // File paths
      /[A-Za-z0-9\-]{36}/g, // UUIDs
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
      /psycopg\.[A-Za-z\.]+/g, // Database error types
      /SQL.*?(?=\n|$)/gi, // SQL statements
      /\[SQL:.*?\]/gi, // SQL blocks
      /\[parameters:.*?\]/gi, // SQL parameters
      /CONTEXT:.*?(?=\n|$)/gi, // Database context
      /DETAIL:.*?(?=\n|$)/gi, // Database details
      /Traceback.*?(?=\n|$)/gi, // Python tracebacks
    ]

    let sanitized = message
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })

    // If message contains database/SQL terms, return generic message
    if (sanitized.toLowerCase().includes('database') ||
      sanitized.toLowerCase().includes('sql') ||
      sanitized.toLowerCase().includes('psycopg') ||
      sanitized.toLowerCase().includes('constraint') ||
      sanitized.toLowerCase().includes('relation')) {
      return 'A server error occurred. Please try again.'
    }

    // Limit message length
    return sanitized.length > 200 ? sanitized.substring(0, 200) + '...' : sanitized
  }

  // Authentication endpoints
  async getCurrentUser() {
    return this.request('/users/me')
  }

  async login() {
    // Redirect to backend login endpoint
    const isAuthenticated = await this.checkAuthAndRedirect()
    if (!isAuthenticated) {
      window.location.href = `${API_BASE_URL}/api/v1/auth/login`
    }
  }

  async signup() {
    // Redirect to backend login endpoint with screen_hint for signup
    // Auth0 Universal Login handles both login and signup
    window.location.href = `${API_BASE_URL}/api/v1/auth/login?screen_hint=signup`
  }

  async logout() {
    // Redirect to backend logout endpoint
    window.location.href = `${API_BASE_URL}/api/v1/auth/logout`
  }

  async validateSession() {
    return this.request("/auth/validate")
  }

  async checkAuthAndRedirect() {
    try {
      const sessionInfo = await this.validateSession()
      if (sessionInfo.authenticated) {
        window.location.href = `https://localhost:5173${sessionInfo.redirect_url}`
        return true
      }
      return false
    } catch (error) {
      console.error('Session validation failed:', error)
      return false
    }
  }

  // =========================================================================
  // Workspace Endpoints (Workspace-Centric Architecture)
  // =========================================================================

  /**
   * Get workspace switcher data with context-aware suggestions.
   * Returns personal/org workspaces and UI hints for the switcher.
   */
  async getWorkspaceSwitcherData() {
    return this.request('/workspaces/me/suggestions')
  }

  /**
   * Get list of all workspaces user has access to.
   */
  async getMyWorkspaces() {
    return this.request('/workspaces')
  }

  /**
   * Get detailed workspace information including quotas and permissions.
   */
  async getWorkspace(workspaceId) {
    return this.request(`/workspaces/${workspaceId}`)
  }

  /**
   * Get current workspace context (permissions, quotas, role).
   */
  async getWorkspaceContext(workspaceId) {
    return this.request(`/workspaces/${workspaceId}/current`)
  }

  /**
   * Initialize first workspace for new user (workspace wizard).
   * Use this for users with NO existing workspaces.
   *
   * @param {string} type - 'personal' or 'organization'
   * @param {string|null} name - Optional workspace name
   * @param {Object|null} companyData - Required for organization type: { name, website?, industry?, size? }
   */
  async initializeWorkspace(type, name = null, companyData = null) {
    const payload = { type }
    if (name) payload.name = name
    if (companyData) payload.company_data = companyData

    return this.request('/workspaces/initialize', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  /**
   * Create a personal workspace for the current user.
   * Used when B2B users want to add a personal workspace ("Add Personal Account" flow).
   * Uses the generic workspace creation endpoint with type: "personal".
   */
  async createPersonalWorkspace(name = null) {
    const defaultName = name || 'My Personal Workspace'
    return this.request('/workspaces/', {
      method: 'POST',
      body: JSON.stringify({
        name: defaultName,
        type: 'personal',
        company_id: null
      })
    })
  }

  /**
   * Create additional organization workspace (requires company admin).
   * Used by company admins to create additional team workspaces.
   *
   * @param {string} companyId - The company ID to create workspace under
   * @param {string} name - Workspace name
   */
  async createOrganizationWorkspace(companyId, name) {
    return this.request('/workspaces/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        type: 'organization',
        company_id: companyId
      })
    })
  }

  /**
   * Update workspace settings.
   */
  async updateWorkspace(workspaceId, updateData) {
    return this.request(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })
  }

  /**
   * Get workspace members list.
   */
  async getWorkspaceMembers(workspaceId) {
    return this.request(`/workspaces/${workspaceId}/members`)
  }

  /**
   * Invite a user to a workspace.
   */
  async inviteToWorkspace(workspaceId, email, role = 'member') {
    return this.request(`/workspaces/${workspaceId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    })
  }

  /**
   * Accept a workspace invitation using token.
   */
  async acceptWorkspaceInvitation(token) {
    return this.request('/workspaces/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }

  /**
   * Get pending invitations for a workspace.
   */
  async getWorkspaceInvitations(workspaceId) {
    return this.request(`/workspaces/${workspaceId}/invitations`)
  }

  /**
   * Leave a workspace.
   */
  async leaveWorkspace(workspaceId) {
    return this.request(`/workspaces/${workspaceId}/leave`, {
      method: 'POST'
    })
  }

  // =========================================================================
  // User management endpoints
  // =========================================================================

  async inviteUser(inviteData) {
    return this.request('/auth/invite', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    })
  }

  async getCompanyUsers() {
    return this.request('/users')
  }

  async getPendingInvitations() {
    return this.request('/users/pending-invitations')
  }

  // Playbook endpoints
  // Note: All workspace-scoped endpoints require workspace_id query parameter
  async getPlaybooks(workspaceId, page = 1, offset = 10, statusFilter = null) {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      page: page.toString(),
      offset: offset.toString()
    })

    if (statusFilter) {
      params.append('status_filter', statusFilter)
    }

    return this.request(`/playbooks?${params.toString()}`)
  }

  async getPlaybook(workspaceId, playbookId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/playbooks/${playbookId}?${params.toString()}`)
  }

  async uploadPlaybook(workspaceId, formData) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/playbooks/upload?${params.toString()}`, {
      method: 'POST',
      headers: {}, // let browser set Content-Type for FormData
      body: formData,
    })
  }

  async updatePlaybook(workspaceId, playbookId, updateData) {
    // Convert to FormData to match backend expectations
    const formData = new FormData()

    // Only append fields that are actually being updated
    if (updateData.name !== undefined) {
      formData.append('name', updateData.name)
    }
    if (updateData.description !== undefined) {
      formData.append('description', updateData.description || '')
    }
    if (updateData.playbook_type !== undefined) {
      formData.append('playbook_type', updateData.playbook_type)
    }

    // Debug log to see what's being sent
    console.log('Updating playbook with data:', Object.fromEntries(formData.entries()))

    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/playbooks/${playbookId}?${params.toString()}`, {
      method: 'PATCH',
      headers: {}, // let browser set Content-Type for FormData
      body: formData
    })
  }

  async deletePlaybook(workspaceId, playbookId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/playbooks/${playbookId}?${params.toString()}`, {
      method: 'DELETE',
    })
  }

  async getPlaybookDownloadUrl(workspaceId, playbookId, expiresIn = 3600) {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      expires_in: expiresIn.toString()
    })

    return this.request(`/playbooks/${playbookId}/download-url?${params.toString()}`)
  }

  // Scenario Endpoints
  async getScenarios(workspaceId, page = 1, offset = 10, scenarioType = null, difficulty = null, statusFilter = null) {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      page: page.toString(),
      offset: offset.toString()
    })

    if (scenarioType && scenarioType.length > 0) {
      scenarioType.forEach(type => params.append('scenario_type', type))
    }
    if (difficulty) {
      params.append('difficulty', difficulty)
    }
    if (statusFilter) {
      params.append('status_filter', statusFilter)
    }

    return this.request(`/scenarios?${params.toString()}`)
  }

  async getDefaultScenarios(page = 1, offset = 10, scenarioType = null, difficulty = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      offset: offset.toString()
    })

    if (scenarioType && scenarioType.length > 0) {
      scenarioType.forEach(type => params.append('scenario_type', type))
    }
    if (difficulty) {
      params.append('difficulty', difficulty)
    }

    return this.request(`/scenarios/default?${params.toString()}`)
  }

  async generateScenarios(workspaceId, generationRequest) {
    const params = new URLSearchParams({
      workspace_id: workspaceId
    })
    return this.request(`/scenarios/generate?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(generationRequest),
    })
  }

  async createScenario(scenarioData) {
    return this.request('/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenarioData),
    })
  }

  async updateScenario(workspaceId, scenarioId, scenarioData) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/scenarios/${scenarioId}?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(scenarioData)
    })
  }

  async deleteScenario(workspaceId, scenarioId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/scenarios/${scenarioId}?${params.toString()}`, {
      method: 'DELETE',
    })
  }

  async getScenarioStatistics() {
    return this.request('/scenarios/statistics')
  }

  // Training session endpoints
  async startTrainingSession(workspaceId, scenarioId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/sessions/start-training?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    })
  }

  async getSessions(workspaceId, page = 1, offset = 10, filters = {}) {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      page: page.toString(),
      offset: offset.toString(),
      ...filters
    })
    return this.request(`/sessions?${params}`)
  }

  async getSession(workspaceId, sessionId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/sessions/${sessionId}?${params}`)
  }

  async updateSession(workspaceId, sessionId, sessionData) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/sessions/${sessionId}?${params}`, {
      method: 'PATCH',
      body: JSON.stringify(sessionData),
    })
  }

  async getSessionFeedback(workspaceId, sessionId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/sessions/${sessionId}/feedback?${params}`)
  }

  async getSessionStatus(workspaceId, sessionId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/sessions/${sessionId}/status?${params}`)
  }

  // Analytics endpoints
  async getAnalytics() {
    return this.request('/analytics')
  }

  async getCompanyAnalytics() {
    return this.request('/analytics/company')
  }

  // Add missing methods to the ApiClient class
  async getScenario(scenarioId, workspaceId = null) {
    if (workspaceId) {
      const params = new URLSearchParams({ workspace_id: workspaceId })
      return this.request(`/scenarios/${scenarioId}?${params.toString()}`)
    }
    return this.request(`/scenarios/${scenarioId}`)
  }

  async getGenerationStatus(workspaceId, jobId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/scenarios/generation/status/${jobId}?${params.toString()}`)
  }

  async getSessionStatistics(workspaceId) {
    const params = new URLSearchParams({ workspace_id: workspaceId })
    return this.request(`/sessions/statistics?${params}`)
  }

  // Admin analytics endpoints
  async getAdminAnalytics(workspaceId, months = 6) {
    const params = new URLSearchParams({ workspace_id: workspaceId, months: months.toString() })
    return this.request(`/sessions/admin/analytics?${params}`)
  }

  async getCompanyStats() {
    return this.request('/companies/stats')
  }

  async getCompanyUserStats() {
    return this.request('/users/stats/company')
  }

  // Company registration method
  async registerCompany(companyData) {
    return this.request('/companies/register', {
      method: 'POST',
      body: JSON.stringify(companyData)
    })
  }
}

export const api = new ApiClient()

// Export ApiError class for error handling
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}
