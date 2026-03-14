import { LayoutGrid, BookOpen, Target, Users, BarChart3, Building2 } from 'lucide-react'
import AppShell from './AppShell'

/**
 * OrgLayout
 *
 * Layout for organization workspace users.
 * Uses the shared AppShell with org-specific navigation.
 */
const OrgLayout = () => {
  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/org/dashboard' },
    { icon: BookOpen, label: 'Playbooks', path: '/org/playbooks' },
    { icon: Target, label: 'Scenarios', path: '/org/scenarios' },
    { icon: Users, label: 'Team', path: '/org/team' },
    { icon: BarChart3, label: 'Analytics', path: '/org/analytics' }
  ]

  return (
    <AppShell
      navItems={navItems}
      logoIcon={Building2}
      sectionLabel="Management"
    />
  )
}

export default OrgLayout

