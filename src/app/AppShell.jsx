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
* #page-body            hosts the active screen (see app/routes.jsx),
 *                         e.g. #dashboard on nav-dashboard, #requests or #reqdetail
 *                         on nav-requests, #donors-list-screen or #donor-profile-screen
 *                         on nav-donors, #donations-rewards-screen on
 *                         nav-donations, #inventory-screen or
 *                         #process-components-screen / #issue-to-request-screen
 *                         on nav-inventory, #reports-screen on nav-reports,
 *                         #audit-screen on nav-audit, #settings-screen on
 *                         nav-settings (sub-nav #settings-nav, #settings-content)
 * #overlay-root           hosts the active screen's overlay (see app/overlays.js):
 *                           nav-requests  #new-request-modal, or
 *                                         #reqdetail-cancel-modal while a request is open
 *                           nav-matching  #notify-preview-modal and
 *                                         #fallback-confirm-modal
 *                           nav-donors    #donor-form-drawer, #donor-import-modal
 *                                         and #reveal-reason-modal
*                           nav-inventory #add-units-drawer, #batch-detail-drawer
 *                                         and #discard-dialog
 *                           nav-donations #confirm-donation-flow, mounted by
 *                                         the screen rather than here because it
 *                                         writes the inventory batch above
 *                           nav-audit     #audit-detail-drawer, mounted by the
 *                                         screen because it reads that screen's
 *                                         own selected entry
 *                           nav-settings  #confirm-high-impact-modal, mounted by
 *                                         the settings screen because it guards
 *                                         that screen's own save action
 * #toast-root             empty — toasts mount here
 *
 * Conventions: ids are kebab-case {screen}-{section}-{element}; repeated items
 * get a suffix (request-row-REQ-0001, donor-card-D-0042); state lives in data
 * attributes (data-status, data-blood-type, data-component, data-state);
 * icons are literal "[icon]" text; charts and maps are labelled boxes.
 * ==========================================================================*/

import { useState } from 'react'
import { DonorFormDrawer, DonorImportModal, RevealReasonModal } from '@/features/donors'
import { useDonorsOverlays } from '@/features/donors/hooks/useDonorsOverlays.js'
import {
  AddUnitsDrawer,
  BatchDetailDrawer,
  DiscardDialog,
  useInventoryOverlays,
} from '@/features/inventory'
import { NotifyPreviewModal, FallbackConfirmModal } from '@/features/matching'
import { NewRequestModal } from '@/features/requests'
import NAV_ITEMS from './nav-items.js'
import SCREENS, {
  DonorProfile,
  IssueToRequestScreen,
  ProcessComponentsScreen,
  RequestDetail,
} from './routes.jsx'
import SCREEN_OVERLAYS from './overlays.js'
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
  /* Donor Profile lives under #nav-donors but is its own view. */
  const [selectedDonorId, setSelectedDonorId] = useState(null)
  /* Drawer, import and reveal-modal state stays in the donors feature hook so the
     shell does not grow a useState per overlay. */
  const donors = useDonorsOverlays()
  const isDonorProfile = activeNav === 'nav-donors' && selectedDonorId !== null

  /* Inventory overlay and ledger state lives in its own feature hook. Unlike
     donor forms, units added or issued here survive navigation — the stock
     writes stay on screen until a reload — but leaving the section closes the
     drawer, the batch view and the sub-screen. */
  const inventory = useInventoryOverlays()
  const [inventoryView, setInventoryView] = useState(null)
  const isInventorySubView = activeNav === 'nav-inventory' && inventoryView !== null

  function closeInventoryOverlays() {
    setInventoryView(null)
    inventory.closeAdd()
    inventory.closeBatch()
    inventory.closeDiscard()
  }

  /* Changing screen leaves no modal hanging open. */
  function selectNav(id) {
    setActiveNav(id)
    setNewRequestOpen(false)
    setSelectedRequestId(null)
    setCancelOpen(false)
    setNotifyOpen(false)
    setFallbackOpen(false)
    setSelectedDonorId(null)
    donors.reset()
    closeInventoryOverlays()
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
    setSelectedDonorId(null)
    donors.reset()
    closeInventoryOverlays()
    setMatchingRequestId(requestId)
  }

  /* Dashboard and requests-table entry points both land on the detail view. */
  function openDetail(requestId) {
    setActiveNav('nav-requests')
    setNewRequestOpen(false)
    setSelectedRequestId(requestId)
    setCancelOpen(false)
    setSelectedDonorId(null)
    donors.reset()
    closeInventoryOverlays()
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
    ...(activeNav === 'nav-donors'
      ? {
          onOpenProfile: (donorId) => setSelectedDonorId(donorId),
          onOpenAdd: () => donors.openDrawer(null),
          onOpenImport: () => donors.openImport(),
          onEditDonor: (donorId) => donors.openDrawer(donorId),
          onNotifyDonor: (donorId) => donors.openReveal(donorId),
        }
      : {}),
    ...(activeNav === 'nav-donations'
      ? {
          /* A confirmed collection files an inventory batch, so the two ledgers
             move together: the donations table gains the row and the inventory
             table gains the quarantined units. */
          onCreateBatch: inventory.addUnits,
        }
      : {}),
    ...(activeNav === 'nav-inventory' && !isInventorySubView
      ? {
          batches: inventory.batches,
          selectedBatchId: inventory.selectedBatchId,
          onSelectBatch: inventory.selectBatch,
          onOpenAdd: inventory.openAdd,
          onOpenBatch: inventory.openBatch,
          onOpenProcess: (batchId) => {
            if (batchId) inventory.selectBatch(batchId)
            setInventoryView('process')
          },
          onOpenIssue: (batchId) => {
            if (batchId) inventory.selectBatch(batchId)
            setInventoryView('issue')
          },
          onOpenDiscard: (batchId) => {
            if (batchId) inventory.selectBatch(batchId)
            inventory.openDiscard(batchId)
          },
        }
      : {}),
  }
  const Screen = isDonorProfile
    ? DonorProfile
    : isDetail
      ? RequestDetail
      : inventoryView === 'process'
        ? ProcessComponentsScreen
        : inventoryView === 'issue'
          ? IssueToRequestScreen
          : SCREENS[activeNav]
  const CancelModal = SCREEN_OVERLAYS[activeNav]
  const revealReasonLabel = donors.revealReason
    ? donors.revealReason.replace('-', ' ')
    : ''
  const inventorySubProps =
    inventoryView === 'process'
      ? {
          batches: inventory.batches,
          onBack: () => setInventoryView(null),
          onComplete: (batchId) => inventory.processUnit(batchId),
        }
      : {
          batches: inventory.batches,
          selectedBatchId: inventory.selectedBatchId,
          onBack: () => setInventoryView(null),
          onComplete: (payload) => inventory.issueUnits(payload),
        }

  return (
    <div id="app-shell">
      <Sidebar items={NAV_ITEMS} activeNav={activeNav} onSelect={selectNav} />

      <Topbar />

      <PageContent
        title={
          isDonorProfile
            ? 'Donor Profile'
            : isDetail
              ? 'Request Detail'
              : inventoryView === 'process'
                ? 'Process Components'
                : inventoryView === 'issue'
                  ? 'Issue to Request'
                  : activeItem.pageTitle
        }
        screen={Screen}
        screenKey={
          isDonorProfile
            ? selectedDonorId
            : isDetail
              ? selectedRequestId
              : activeNav === 'nav-matching'
                ? matchingRequestId
                : activeNav === 'nav-inventory'
                  ? inventoryView ?? 'table'
                  : activeNav
        }
        {...(isDonorProfile
          ? {
              donorId: selectedDonorId,
              revealed: donors.revealedReason !== '',
              revealReason: revealReasonLabel,
              onBack: () => setSelectedDonorId(null),
              onEdit: (donorId) => donors.openDrawer(donorId),
              onOpenDeactivate: (donorId) => donors.openDrawer(donorId),
              onOpenReveal: () => donors.openReveal(selectedDonorId),
            }
          : isDetail
            ? {
                requestId: selectedRequestId,
                cancelledRequestId,
                onClose: () => setSelectedRequestId(null),
                onOpenCancel: () => setCancelOpen(true),
                onOpenMatching: () => openMatching(selectedRequestId),
              }
            : isInventorySubView
              ? inventorySubProps
              : screenProps)}
      />

      <div id="overlay-root">
        {isDonorProfile ? null : isDetail ? (
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
        ) : activeNav === 'nav-donors' ? (
          <>
            <DonorFormDrawer
              key="donor-form-drawer"
              open={donors.drawerOpen}
              donorId={donors.drawerDonorId}
              onClose={donors.closeDrawer}
              onSave={donors.closeDrawer}
            />
            <DonorImportModal key="donor-import-modal" open={donors.importOpen} onClose={donors.closeImport} />
            <RevealReasonModal
              key="reveal-reason-modal"
              open={donors.revealOpen}
              donorId={donors.revealDonorId}
              onClose={donors.closeReveal}
              onConfirm={donors.confirmReveal}
            />
          </>
        ) : activeNav === 'nav-inventory' && !isInventorySubView ? (
          <>
            <AddUnitsDrawer
              key="add-units-drawer"
              open={inventory.addOpen}
              batches={inventory.batches}
              onClose={inventory.closeAdd}
              onSave={inventory.addUnits}
            />
            <BatchDetailDrawer
              key="batch-detail-drawer"
              open={inventory.batchDetailId !== null}
              detail={inventory.detail}
              onClose={inventory.closeBatch}
              onProcess={(batchId) => {
                inventory.closeBatch()
                inventory.selectBatch(batchId)
                setInventoryView('process')
              }}
              onIssue={(batchId) => {
                inventory.closeBatch()
                inventory.selectBatch(batchId)
                setInventoryView('issue')
              }}
              onDiscard={(batchId) => {
                inventory.closeBatch()
                inventory.openDiscard(batchId)
              }}
            />
            <DiscardDialog
              key="discard-dialog"
              open={inventory.discardId !== null}
              batch={inventory.batches.find((batch) => batch.batch === inventory.discardId) ?? null}
              onClose={inventory.closeDiscard}
              onConfirm={inventory.discardBatch}
            />
          </>
        ) : null}
      </div>
      <div id="toast-root" />
    </div>
  )
}

export default AppShell