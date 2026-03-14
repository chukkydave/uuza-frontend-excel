import { LayoutDashboard, BookOpen, Target, Play, BarChart3, User } from 'lucide-react'
import AppShell from './AppShell'

/**
 * PersonalLayout
 *
 * Layout for personal workspace users (B2C).
 * Uses the shared AppShell with personal workspace-specific navigation.
 *
 * Personal workspace users have full control over their own resources:
 * - Playbooks: Upload, manage, delete their own playbooks
 * - Scenarios: Create, manage scenarios from their playbooks
 * - Training: Practice with their scenarios
 * - Results: View their training history and performance
 */
const PersonalLayout = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Playbooks', path: '/playbooks' },
    { icon: Target, label: 'Scenarios', path: '/scenarios' },
    { icon: Play, label: 'Training', path: '/training' },
    { icon: BarChart3, label: 'Results', path: '/results' }
  ]

  return (
    <AppShell
      navItems={navItems}
      logoIcon={User}
      sectionLabel="Personal"
    />
  )
}

export default PersonalLayout

