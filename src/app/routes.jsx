import { AuditScreen } from '@/features/audit'
import { Dashboard } from '@/features/dashboard'
import { DonationsRewardsScreen } from '@/features/donations'
import { DonorProfile, DonorsList } from '@/features/donors'
import { InventoryScreen, IssueToRequestScreen, ProcessComponentsScreen } from '@/features/inventory'
import { Matching } from '@/features/matching'
import { ReportsScreen } from '@/features/reports'
import { RequestDetail, Requests } from '@/features/requests'
import { SettingsScreen } from '@/features/settings'

const SCREENS = {
  'nav-dashboard': Dashboard,
  'nav-requests': Requests,
  'nav-matching': Matching,
  'nav-donors': DonorsList,
  'nav-inventory': InventoryScreen,
  'nav-donations': DonationsRewardsScreen,
  'nav-reports': ReportsScreen,
  'nav-audit': AuditScreen,
  'nav-settings': SettingsScreen,
}

export { RequestDetail, DonorProfile, ProcessComponentsScreen, IssueToRequestScreen }
export default SCREENS