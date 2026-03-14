import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import CompanyRegistration from './components/CompanyRegistration'
import Login from './components/Login'
import AuthCallback from './components/AuthCallback'
import AcceptInvitation from './pages/AcceptInvitation'

import AdminDashboard from './components/AdminDashboard'
import VapiSessionInterface from './components/VapiSessionInterface'
import ScenarioManagement from './components/ScenarioManagement'
import SessionFeedbackPage from './pages/SessionFeedbackPage'

// Onboarding
import WorkspaceDiscovery from './pages/onboarding/WorkspaceDiscovery'
import PersonalSetupWizard from './pages/onboarding/PersonalSetupWizard'
import SkillCalibration from './pages/onboarding/SkillCalibration'

// Dashboards
import PersonalDashboard from './pages/PersonalDashboard'
import OrgDashboard from './pages/org/OrgDashboard'

// Training & Results
import TrainingHub from './pages/TrainingHub'
import Results from './pages/Results'

// Playbooks (unified for personal and org)
import Playbooks from './pages/Playbooks'

// Organization
import OrganizationSetup from './pages/org/OrganizationSetup'
import OrgSetupWizard from './pages/org/OrgSetupWizard'
import OrgLayout from './components/OrgLayout'

// Personal Workspace Layout
import PersonalLayout from './components/PersonalLayout'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WorkspaceProvider>
          <Router>
            <div className="min-h-screen transition-colors duration-300">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<CompanyRegistration />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="/accept-invite" element={<AcceptInvitation />} />

                {/* Protected: Onboarding Routes */}
                <Route path="/onboarding/workspace-select" element={
                  <ProtectedRoute><WorkspaceDiscovery /></ProtectedRoute>
                } />
                <Route path="/onboarding/personal-wizard" element={
                  <ProtectedRoute><PersonalSetupWizard /></ProtectedRoute>
                } />
                <Route path="/calibration" element={
                  <ProtectedRoute><SkillCalibration /></ProtectedRoute>
                } />

                {/* Personal Workspace Routes with Layout */}
                <Route path="/" element={<ProtectedRoute><PersonalLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<PersonalDashboard />} />
                  <Route path="playbooks" element={<Playbooks />} />
                  <Route path="scenarios" element={<ScenarioManagement />} />
                  <Route path="training" element={<TrainingHub />} />
                  <Route path="training/:scenarioId" element={<VapiSessionInterface />} />
                  <Route path="results" element={<Results />} />
                  <Route path="session/:sessionId/feedback" element={<SessionFeedbackPage />} />
                </Route>

                {/* Protected: Organization Setup Routes */}
                <Route path="/org/setup" element={
                  <ProtectedRoute><OrganizationSetup /></ProtectedRoute>
                } />
                <Route path="/org/onboarding/wizard" element={
                  <ProtectedRoute><OrgSetupWizard /></ProtectedRoute>
                } />

                {/* Organization Workspace Routes with Layout */}
                <Route path="/org" element={<ProtectedRoute><OrgLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<OrgDashboard />} />
                  <Route path="playbooks" element={<Playbooks />} />
                  <Route path="scenarios" element={<ScenarioManagement />} />
                  <Route path="training/:scenarioId" element={<VapiSessionInterface />} />
                  <Route path="session/:sessionId/feedback" element={<SessionFeedbackPage />} />
                  {/* Future org routes */}
                  {/* <Route path="team" element={<TeamPage />} /> */}
                  {/* <Route path="analytics" element={<AnalyticsPage />} /> */}
                  {/* <Route path="settings" element={<SettingsPage />} /> */}
                </Route>

                {/* Protected: Admin Routes */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute><AdminDashboard /></ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </WorkspaceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
