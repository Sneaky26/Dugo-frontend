/* ============================================================================
 * CONFIRM DONATION FLOW — ID MAP
 * ----------------------------------------------------------------------------
 * #confirm-donation-flow         overlay, data-state="open" | "closed"
 *   #confirm-donation-header     donor name + blood type
 *   #confirm-donation-steps      #cd-step-1..4, data-active / data-done
 *   step 1  #cd-step-donor
 *            #cd-type-whole-blood | #cd-type-platelets | #cd-type-plasma
 *            #cd-donor-list       #cd-donor-D-0042, data-state selectable|deferred
 *            #cd-donor-summary    last donation, interval, balance
 *            #cd-linked-request   open compatible requests for this donor
 *   step 2  #cd-step-screening
 *            #cd-hemoglobin #cd-systolic #cd-diastolic
 *            #cd-screening-summary #cd-check-hemoglobin #cd-check-systolic
 *            #deferral-form        shown only when the readings do not pass
 *              #cd-deferral-reason #cd-deferral-period #cd-deferral-summary
 *            #cd-defer-btn
 *   step 3  #cd-step-donation
 *            #cd-donation-units #cd-donation-site #cd-donation-staff
 *            #cd-points-preview  -base -bonus -total -balance -projected
 *   step 4  #cd-step-confirm
 *            #cd-batch-preview    -batch -blood-type -component -units
 *                                 -collected -expiry -shelf-days -status
 *            #cd-confirm-linked-request
 *   #confirm-donation-footer     #cd-back-btn #cd-next-btn #cd-cancel-btn
 * ==========================================================================*/

import data, { buildRequestOptions, FLOW_STEPS, NOW_DAY, unitsFor } from './donations-rewards-data.js'

const { DEFERRAL_PERIODS, DEFERRAL_REASONS, DONATION_FLOW_TYPES, DONATION_SITES, DONATION_STAFF } = data

function StepStrip({ step }) {
  return (
    <ol id="confirm-donation-steps">
      {FLOW_STEPS.map((entry, index) => {
        const number = index + 1
        const state = number === step ? 'active' : number < step ? 'done' : 'pending'

        return (
          <li key={entry.value} id={entry.id} data-active={state === 'active'} data-done={state === 'done'} data-step-state={state}>
            <span className="muted">Step {number}</span>
            <span>{entry.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function DonorStep({ state }) {
  const { form, donorOptions, selectedDonor, updateForm } = state
  const requests = form.donorId === '' ? [] : buildRequestOptions(form.donorId, form.type)

  return (
    <div id="cd-step-donor">
      <fieldset id="cd-type-picker">
        <legend>Donation type</legend>
        {DONATION_FLOW_TYPES.map((entry) => (
          <label key={entry.value} id={`cd-type-${entry.value}`} data-selected={form.type === entry.value}>
            <input
              type="radio"
              name="cd-type"
              value={entry.value}
              checked={form.type === entry.value}
              onChange={() => updateForm({ type: entry.value, linkedRequest: '' })}
            />
            <span>{entry.flowLabel}</span>
          </label>
        ))}
      </fieldset>

      <div id="cd-donor-list" className="card" data-count={donorOptions.length}>
        {donorOptions.length === 0 ? <span id="cd-donor-list-empty">No donors on the registry</span> : null}
        {donorOptions.map((option) => (
          <button
            key={option.id}
            id={option.id}
            type="button"
            className="row row-between"
            data-state={option.selectable ? 'selectable' : 'deferred'}
            data-blood-type={option.bloodType}
            disabled={!option.selectable}
            onClick={() => updateForm({ donorId: option.donorId, linkedRequest: '' })}
          >
            <span>
              {option.name} · {option.donorId} · {option.bloodType}
            </span>
            <span className="muted">{option.selectable ? `${option.daysSince} days since last` : option.reason}</span>
          </button>
        ))}
      </div>

      {selectedDonor ? (
        <div id="cd-donor-summary" className="card" data-blood-type={selectedDonor.bloodType}>
          <span id="cd-donor-summary-name">{selectedDonor.name}</span>
          <span id="cd-donor-summary-record">
            {selectedDonor.totalDonations} donations · last {selectedDonor.lastDonation} · {selectedDonor.points} pts
          </span>
          <span id="cd-donor-summary-next">Next eligible {selectedDonor.nextEligible}</span>
        </div>
      ) : (
        <div id="cd-donor-summary" className="card" data-state="empty">
          <span>Pick a donor to continue</span>
        </div>
      )}

      <div className="field">
        <label>
          <span>Link to request</span>
          <select
            id="cd-linked-request"
            value={form.linkedRequest}
            disabled={requests.length === 0}
            onChange={(event) => updateForm({ linkedRequest: event.target.value })}
          >
            <option value="">Not linked to a request</option>
            {requests.map((request) => (
              <option key={request.requestId} value={request.requestId}>
                {request.label} · {request.bloodType} {request.componentLabel}
              </option>
            ))}
          </select>
        </label>
        <p id="cd-linked-request-note" className="muted">
          {requests.length === 0
            ? 'No open request matches this donor and type'
            : `${requests.length} open request${requests.length === 1 ? '' : 's'} this donation can fill`}
        </p>
      </div>
    </div>
  )
}

function ScreeningStep({ state, onDefer }) {
  const { form, screening, deferral, updateForm } = state
  const canProceed = screening.eligible

  return (
    <div id="cd-step-screening">
      <div id="cd-readings" className="row">
        <div className="field">
          <label>
            <span>Hemoglobin (g/dL)</span>
            <input
              id="cd-hemoglobin"
              type="number"
              step="0.1"
              value={form.hemoglobin}
              onChange={(event) => updateForm({ hemoglobin: event.target.value })}
            />
          </label>
        </div>
        <div className="field">
          <label>
            <span>Systolic (mmHg)</span>
            <input
              id="cd-systolic"
              type="number"
              value={form.systolic}
              onChange={(event) => updateForm({ systolic: event.target.value })}
            />
          </label>
        </div>
        <div className="field">
          <label>
            <span>Diastolic (mmHg)</span>
            <input
              id="cd-diastolic"
              type="number"
              value={form.diastolic}
              onChange={(event) => updateForm({ diastolic: event.target.value })}
            />
          </label>
        </div>
      </div>

      <div id="cd-screening-checks">
        {screening.checks.map((check) => (
          <span key={check.id} id={check.id} data-state={check.state}>
            {check.label} {check.reading}
          </span>
        ))}
      </div>

      <p id="cd-screening-summary" data-outcome={screening.outcome}>
        {screening.summary}
      </p>

      {!canProceed ? (
        <div id="deferral-form" className="card" data-outcome={screening.outcome}>
          <h3>Record a deferral</h3>
          <div className="field">
            <label>
              <span>Reason</span>
              <select
                id="cd-deferral-reason"
                value={form.deferralReason}
                onChange={(event) => updateForm({ deferralReason: event.target.value })}
              >
                {DEFERRAL_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field">
            <label>
              <span>Period</span>
              <select
                id="cd-deferral-period"
                value={form.deferralPeriod}
                onChange={(event) => updateForm({ deferralPeriod: event.target.value })}
              >
                {DEFERRAL_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p id="cd-deferral-summary">
            {deferral.reasonLabel} · {deferral.periodLabel} · next eligible {deferral.nextEligible}
          </p>
          <button id="cd-defer-btn" className="btn" type="button" disabled={screening.outcome === 'unknown'} onClick={onDefer}>
            Record deferral and close
          </button>
        </div>
      ) : null}
    </div>
  )
}

function DonationStep({ state }) {
  const { form, points, updateForm } = state
  const units = unitsFor(form.type)

  return (
    <div id="cd-step-donation">
      <p id="cd-donation-units">
        {units} unit{units === 1 ? '' : 's'} collected
      </p>

      <div className="field">
        <label>
          <span>Site</span>
          <select id="cd-donation-site" value={form.site} onChange={(event) => updateForm({ site: event.target.value })}>
            {DONATION_SITES.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field">
        <label>
          <span>Recorded by</span>
          <select
            id="cd-donation-staff"
            value={form.recordedBy}
            onChange={(event) => updateForm({ recordedBy: event.target.value })}
          >
            {DONATION_STAFF.map((staff) => (
              <option key={staff} value={staff}>
                {staff}
              </option>
            ))}
          </select>
        </label>
      </div>

      {points ? (
        <div id="cd-points-preview" className="card" data-total={points.total}>
          <span id="cd-points-base">{points.base} pts for this donation type</span>
          {points.bonus > 0 ? <span id="cd-points-bonus">+{points.bonus} {points.bonusLabel}</span> : null}
          <span id="cd-points-total">{points.total} pts awarded</span>
          <span id="cd-points-balance">Balance {points.balance} → {points.projected}</span>
          <span id="cd-points-reason" className="muted">
            {points.reason}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function ConfirmStep({ state }) {
  const { form, batchPreview, points } = state
  const linked = form.linkedRequest === '' ? null : buildRequestOptions(form.donorId, form.type).find((r) => r.requestId === form.linkedRequest)

  return (
    <div id="cd-step-confirm">
      <dl id="cd-confirm-summary">
        <dt>Donor</dt>
        <dd id="cd-confirm-donor">{form.donorId}</dd>
        <dt>Type</dt>
        <dd id="cd-confirm-type">{DONATION_FLOW_TYPES.find((entry) => entry.value === form.type)?.flowLabel}</dd>
        <dt>Site</dt>
        <dd id="cd-confirm-site">{form.site}</dd>
        <dt>Recorded by</dt>
        <dd id="cd-confirm-staff">{form.recordedBy}</dd>
        <dt>Points</dt>
        <dd id="cd-confirm-points">{points ? points.total : 0}</dd>
      </dl>

      <p id="cd-confirm-linked-request" data-linked={linked ? 'yes' : 'no'}>
        {linked ? `Reserved for ${linked.label}` : 'Not linked to a request'}
      </p>

      {batchPreview ? (
        <div id="cd-batch-preview" className="card" data-batch={batchPreview.batch}>
          <span id="cd-batch-preview-batch">{batchPreview.batch}</span>
          <span id="cd-batch-preview-blood-type" data-blood-type={batchPreview.bloodType}>
            {batchPreview.bloodType}
          </span>
          <span id="cd-batch-preview-component" data-component={batchPreview.component}>
            {batchPreview.componentLabel}
          </span>
          <span id="cd-batch-preview-units">{batchPreview.units}u</span>
          <span id="cd-batch-preview-collected">Collected {batchPreview.collected}</span>
          <span id="cd-batch-preview-expiry">Expires {batchPreview.expiry}</span>
          <span id="cd-batch-preview-shelf-days">{batchPreview.shelfDays} day shelf</span>
          <span id="cd-batch-preview-status" data-status={batchPreview.status}>
            {batchPreview.status}
          </span>
        </div>
      ) : null}

      <p id="cd-confirm-note" className="muted">
        Confirming files the collection against {NOW_DAY} and creates the inventory batch above in{' '}
        {batchPreview ? batchPreview.status : 'Quarantine'}.
      </p>
    </div>
  )
}

export default function ConfirmDonationFlow({ state, onConfirm, onClose, onDefer }) {
  const { confirmOpen, step, screening, selectedDonor, batchPreview, goToStep } = state
  const isLast = step === FLOW_STEPS.length
  const canAdvance = step === 1 ? selectedDonor !== null : step === 2 ? screening.eligible : step === 3 ? batchPreview !== null : true

  return (
    <div id="confirm-donation-flow" data-state={confirmOpen ? 'open' : 'closed'} role="dialog" aria-modal="true">
      <div className="overlay-panel">
        <header id="confirm-donation-header" className="row row-between">
          <h2>Confirm donation</h2>
          <span id="confirm-donation-header-donor">
            {selectedDonor ? `${selectedDonor.name} · ${selectedDonor.bloodType}` : 'No donor selected'}
          </span>
        </header>

        <StepStrip step={step} />

        {step === 1 ? <DonorStep state={state} /> : null}
        {step === 2 ? <ScreeningStep state={state} onDefer={onDefer} /> : null}
        {step === 3 ? <DonationStep state={state} /> : null}
        {step === 4 ? <ConfirmStep state={state} /> : null}

        <footer id="confirm-donation-footer" className="row row-between">
          <button id="cd-cancel-btn" className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <div className="row">
            <button
              id="cd-back-btn"
              className="btn"
              type="button"
              disabled={step === 1}
              onClick={() => goToStep(step - 1)}
            >
              Back
            </button>
            {isLast ? (
              <button id="cd-confirm-btn" className="btn" type="button" disabled={!canAdvance} onClick={onConfirm}>
                Confirm donation
              </button>
            ) : (
              <button
                id="cd-next-btn"
                className="btn"
                type="button"
                disabled={!canAdvance}
                onClick={() => goToStep(step + 1)}
              >
                Next
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}