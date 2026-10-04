/* ============================================================================
 * Dugo+ admin shell — ID MAP
 * ----------------------------------------------------------------------------
 * #app-shell              grid: [ 240px sidebar | 1fr content column ]
 * #sidebar                row 1/-1, border-right
 *   #sidebar-logo         wordmark "Dugo+" + facility line
 *     #sidebar-logo-name
 *     #sidebar-logo-facility
 *   #sidebar-nav          nav, column of 9 items
 *     #nav-dashboard      #nav-requests      #nav-matching
 *     #nav-donors         #nav-inventory     #nav-donations
 *     #nav-reports        #nav-audit         #nav-settings
 *     #nav-urgent-count   .badge data-status="urgent", nested in #nav-requests
 * #topbar                 row: search | emergency | notifications | profile
 *   #topbar-search        form.field > label.sr-only + input[type=search]
 *   #topbar-emergency-btn button.btn data-status="emergency"
 *   #topbar-notifications button.btn > [icon] + .badge unread count
 *   #topbar-profile       button.btn > [icon] + name/role + [icon]
 *     #topbar-profile-text
 * #page-content           row 2, column
 *   #page-title           h1, follows the active nav item
 *   #page-actions         empty placeholder — screen action buttons mount here
 *   #page-body            hosts the active screen (see shell/screens.js),
 *                         e.g. #dashboard on nav-dashboard
 * #overlay-root           empty — drawers and modals mount here
 * #toast-root             empty — toasts mount here
 *
 * Conventions: ids are kebab-case {screen}-{section}-{element}; repeated items
 * get a suffix (request-row-REQ-0001, donor-card-D-0042); state lives in data
 * attributes (data-status, data-blood-type, data-component, data-state);
 * icons are literal "[icon]" text; charts and maps are labelled boxes.
 * ==========================================================================*/

import { useState } from 'react'
import NAV_ITEMS from './nav-items.js'
import SCREENS from './screens.js'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import PageContent from './PageContent.jsx'

function AppShell() {
  const [activeNav, setActiveNav] = useState('nav-dashboard')
  const activeItem = NAV_ITEMS.find((item) => item.id === activeNav)

  return (
    <div id="app-shell">
      <Sidebar items={NAV_ITEMS} activeNav={activeNav} onSelect={setActiveNav} />

      <Topbar />

      <PageContent title={activeItem.pageTitle} screen={SCREENS[activeNav]} />

      <div id="overlay-root" />
      <div id="toast-root" />
    </div>
  )
}

export default AppShell