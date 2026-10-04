/* ============================================================================
 * DONATIONS & REWARDS SCREEN — ID MAP
 * ----------------------------------------------------------------------------
 * #donations-rewards-screen      the nav-donations screen
 *   #dr-tabs                     role=tablist
 *     #dr-tab-donations           data-count=<ledger rows>
 *     #dr-tab-rewards             data-count=<pending redemptions>
 *   #donations-panel              the donations tab, see DonationsTab.jsx
 *   #rewards-panel                the rewards tab, see RewardsTab.jsx
 *   #confirm-donation-flow        mounted here, see ConfirmDonationFlow.jsx
 *
 * The screen owns the session hook and hands the shell one callback:
 * onCreateBatch, which files the collection as an inventory batch. Everything else
 * written here is local to the session, in the same way the inventory ledger's
 * add-units write is.
 * ==========================================================================*/

import { useState } from 'react'
import data, { buildRedemptions } from './donations-rewards-data.js'
import { useDonationsRewards } from './hooks/useDonationsRewards.js'
import ConfirmDonationFlow from './ConfirmDonationFlow.jsx'
import DonationsTab from './DonationsTab.jsx'
import RewardsTab from './RewardsTab.jsx'

const TABS = [
  { id: 'dr-tab-donations', value: 'donations', label: 'Donations' },
  { id: 'dr-tab-rewards', value: 'rewards', label: 'Rewards' },
]

export default function DonationsRewardsScreen({ onCreateBatch }) {
  const [tab, setTab] = useState('donations')
  const state = useDonationsRewards()

  const pendingRedemptions = Object.entries(state.redemptionStatus).reduce(
    (count, [redemptionId, status]) => {
      const row = data.REDEMPTIONS.find((entry) => entry.id === redemptionId)
      const effective = status ?? row?.status
      return count + (effective === 'pending' ? 1 : 0)
    },
    buildRedemptions(data.REDEMPTIONS).filter((row) => row.status === 'pending').length,
  )

  /* Confirming writes the ledger row here and the batch through the shell, so
     the inventory table gains the units and the donations table gains the row in
     the same action. */
  function confirmDonation() {
    if (!state.batchPreview) return
    const row = state.recordDonation()
    const batch = onCreateBatch
      ? onCreateBatch({
          bloodType: state.batchPreview.bloodType,
          component: state.batchPreview.component,
          units: state.batchPreview.units,
          collected: state.batchPreview.collected,
          source: row.id,
          reservedFor: row.linkedRequest,
        })
      : null
    state.attachBatch(row.id, batch ? batch.batch : null)
    state.closeConfirm()
  }

  function deferDonor() {
    state.recordDeferral()
    state.closeConfirm()
  }

  return (
    <div id="donations-rewards-screen">
      <nav id="dr-tabs" aria-label="Donations and rewards tabs">
        {TABS.map((entry) => {
          const active = entry.value === tab

          return (
            <button
              key={entry.value}
              id={entry.id}
              className="tab"
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active}
              onClick={() => setTab(entry.value)}
            >
              <span>{entry.label}</span>
              <span id={`${entry.id}-count`} data-count={entry.value === 'donations' ? state.donations.length : pendingRedemptions}>
                {entry.value === 'donations' ? state.donations.length : pendingRedemptions}
              </span>
            </button>
          )
        })}
      </nav>

      {tab === 'donations' ? <DonationsTab donations={state.donations} onOpenConfirm={state.openConfirm} /> : <RewardsTab state={state} />}

      <ConfirmDonationFlow
        state={state}
        onConfirm={confirmDonation}
        onClose={state.closeConfirm}
        onDefer={deferDonor}
      />
    </div>
  )
}