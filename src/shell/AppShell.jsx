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
 *                         e.g. #dashboard on nav-dashboard, #requests or #reqdetail
 *                         on nav-requests
 * #overlay-root           hosts the active screen's overlay (see shell/overlays.js):
 *                           nav-requests  #new-request-modal, or
 *                                         #reqdetail-cancel-modal while a request is open
 *                           nav-matching  #notify-preview-modal and
 *                                         #fallback-confirm-modal
 * #toast-root             empty — toasts mount here
 *
 * Conventions: ids are kebab-case {screen}-{section}-{element}; repeated items
 * get a suffix (request-row-REQ-0001, donor-card-D-0042); state lives in data
 * attributes (data-status, data-blood-type, data-component, data-state);
 * icons are literal "[icon]" text; charts and maps are labelled boxes.
 * ==========================================================================*/

import { useState } from 'react'
import NAV_ITEMS from './nav-items.js'
import SCREENS, { RequestDetail } from './screens.js'
import SCREEN_OVERLAYS from './overlays.js'
import NewRequestModal from '../screens/NewRequestModal.jsx'
import NotifyPreviewModal from '../screens/NotifyPreviewModal.jsx'
import FallbackConfirmModal from '../screens/FallbackConfirmModal.jsx'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import PageContent from './PageContent.jsx'

function AppShell() {
  const [activeNav, setActiveNav] = useState('nav-dashboard')
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  /* Request Detail lives under #nav-requests but is its own view. */
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  /* Donor Matching follows navigation: the requests table and Request Detail
     pass their id, direct sidebar nav falls back to the flagship request. */
  const [matchingRequestId, setMatchingRequestId] = useState('REQ-0001')
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyRecipientIds, setNotifyRecipientIds] = useState([])
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const activeItem = NAV_ITEMS.find((item) => item.id === activeNav)

  /* Cancelling is local to the detail view — the list and dashboard keep the
     original status until a reload. */
  const [cancelledRequestId, setCancelledRequestId] = useState(null)
  const isDetail = activeNav === 'nav-requests' && selectedRequestId !== null

  /* Changing screen leaves no modal hanging open. */
  function selectNav(id) {
    setActiveNav(id)
    setNewRequestOpen(false)
    setSelectedRequestId(null)
    setCancelOpen(false)
    setNotifyOpen(false)
    setFallbackOpen(false)
    if (id === 'nav-matching') setMatchingRequestId('REQ-0001')
  }

  /* The requests table and Request Detail open matching for a specific id. */
  function openMatching(requestId) {
    setActiveNav('nav-matching')
    setNewRequestOpen(false)
    setSelectedRequestId(null)
    setCancelOpen(false)
    setNotifyOpen(false)
    setFallbackOpen(false)
    setMatchingRequestId(requestId)
  }

  /* Dashboard and requests-table entry points both land on the detail view. */
  function openDetail(requestId) {
    setActiveNav('nav-requests')
    setNewRequestOpen(false)
    setSelectedRequestId(requestId)
    setCancelOpen(false)
  }

  const screenProps = {
    onOpenDetail: openDetail,
    onNewRequest: () => setNewRequestOpen(true),
    onOpenMatching: openMatching,
    ...(activeNav === 'nav-matching'
      ? {
          requestId: matchingRequestId,
          onNotify: (recipientIds) => {
            setNotifyRecipientIds(recipientIds)
            setNotifyOpen(true)
          },
          onFallback: () => setFallbackOpen(true),
        }
      : {}),
  }
  const Screen = isDetail ? RequestDetail : SCREENS[activeNav]
  const CancelModal = SCREEN_OVERLAYS[activeNav]

  return (
    <div id="app-shell">
      <Sidebar items={NAV_ITEMS} activeNav={activeNav} onSelect={selectNav} />

      <Topbar />

      <PageContent
        title={isDetail ? 'Request Detail' : activeItem.pageTitle}
        screen={Screen}
        screenKey={isDetail ? selectedRequestId : activeNav === 'nav-matching' ? matchingRequestId : activeNav}
        {...(isDetail
          ? {
              requestId: selectedRequestId,
              cancelledRequestId,
              onClose: () => setSelectedRequestId(null),
              onOpenCancel: () => setCancelOpen(true),
              onOpenMatching: () => openMatching(selectedRequestId),
            }
          : screenProps)}
      />

      <div id="overlay-root">
        {isDetail ? (
          <CancelModal
            key="reqdetail-cancel-modal"
            open={cancelOpen}
            requestId={selectedRequestId}
            onClose={() => setCancelOpen(false)}
            onConfirm={() => {
              setCancelledRequestId(selectedRequestId)
              setCancelOpen(false)
            }}
          />
        ) : activeNav === 'nav-requests' ? (
          <NewRequestModal key="modal" open={newRequestOpen} onClose={() => setNewRequestOpen(false)} />
        ) : activeNav === 'nav-matching' ? (
          <>
            <NotifyPreviewModal
              key="notify-preview-modal"
              open={notifyOpen}
              requestId={matchingRequestId}
              recipientIds={notifyRecipientIds}
              onClose={() => setNotifyOpen(false)}
              onConfirm={() => setNotifyOpen(false)}
            />
            <FallbackConfirmModal
              key="fallback-confirm-modal"
              open={fallbackOpen}
              requestId={matchingRequestId}
              onClose={() => setFallbackOpen(false)}
              onConfirm={() => setFallbackOpen(false)}
            />
          </>
        ) : null}
      </div>
      <div id="toast-root" />
    </div>
  )
}

export default AppShell