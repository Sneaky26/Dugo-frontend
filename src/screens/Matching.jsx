import { useState } from 'react'
import {
  COMPAT_TIERS,
  COMPONENT_OPTIONS,
  DEFAULT_RADIUS_KM,
  ELIGIBILITY_OPTIONS,
  MAX_RADIUS_KM,
  MIN_RADIUS_KM,
  RESPONSE_STATUSES,
  buildMatching,
  responseLabel,
} from './matching-data.js'
import DonorSelectionToolbar from './DonorSelectionToolbar.jsx'

function DonorCard({ donor, donationType, selected, onToggle, onNotify }) {
  const cardId = `donor-card-${donor.id}`
  const { state, reason } = donor.eligibilityState

  function handleCardClick(event) {
    const target = event.target
    if (target.closest('button')) return
    if (target.closest('input')) return
    if (target.closest('select')) return
    if (target.closest('textarea')) return
    if (target.closest('[data-tooltip]')) return
    onToggle()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardClick(event)
    }
  }

  return (
    <article
      id={cardId}
      className="card"
      data-selectable="true"
      data-selected={selected}
      data-tier={donor.tier}
      data-response={donor.response}
      data-eligibility={state}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="row row-between">
        <label className="row">
          <input
            id={`${cardId}-select`}
            type="checkbox"
            checked={selected}
            onChange={onToggle}
          />
          <span id={`${cardId}-name`}>{donor.masked}</span>
        </label>
        <span id={`${cardId}-blood-type`} className="badge" data-blood-type={donor.bloodType}>
          {donor.bloodType}
        </span>
      </div>

      <div className="row">
        <span id={`${cardId}-distance`}>{donor.distance}</span>
        <span
          id={`${cardId}-eligibility`}
          className="chip"
          data-state={state}
          data-donation-type={donationType}
        >
          {state === 'eligible' ? `Eligible: ${donationType}` : `Deferred: ${donationType}`}
        </span>
        <span id={`${cardId}-apheresis`} className="chip" data-eligible={donor.apheresisEligible}>
          {donor.apheresisEligible ? 'Apheresis eligible' : 'Whole blood only'}
        </span>
      </div>

      <div className="row">
        <span id={`${cardId}-last-donation`}>Last donation: {donor.lastDonation ?? '—'}</span>
        <span id={`${cardId}-response-status`} className="badge" data-response={donor.response}>
          {responseLabel(donor.response)}
        </span>
      </div>

      <div id={`${cardId}-deliveries`} className="row">
        <span id={`${cardId}-delivery-app`} className="chip" data-channel="app" data-state={donor.deliveries.app}>
          In-app notification: {donor.deliveries.app}
        </span>
      </div>

      <span
        id={`${cardId}-why-deferred`}
        className="chip"
        data-state={state}
        data-tooltip={reason}
        title={reason}
      >
        {state === 'deferred' ? '[tooltip] why deferred' : '[tooltip] no deferral'}
      </span>

      <div className="row">
        <button id={`${cardId}-notify-btn`} className="btn" type="button" onClick={onNotify}>
          Notify
        </button>
        <button id={`${cardId}-call-btn`} className="btn" type="button">
          Call
        </button>
      </div>
    </article>
  )
}

function Matching({ requestId, onNotify, onFallback }) {
  const [component, setComponent] = useState(null)
  const [tier, setTier] = useState('all')
  const [eligibility, setEligibility] = useState('all')
  const [response, setResponse] = useState('all')
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [paused, setPaused] = useState(false)
  const [selected, setSelected] = useState([])

  const match = buildMatching(requestId, { radiusKm, tier, eligibility, response, component })

  if (!match) {
    return (
      <div id="matching">
        <div id="matching-empty" className="card" data-state="empty">
          <span>Request not found</span>
        </div>
      </div>
    )
  }

  const { summary, wave, donors, tierCounts, donationType, activeComponent } = match
  const selectedVisible = donors.filter((donor) => selected.includes(donor.id))
  const visibleIdsAll = donors.map((donor) => donor.id)
  if (selected.some((id) => !visibleIdsAll.includes(id))) {
    setSelected((current) => current.filter((id) => visibleIdsAll.includes(id)))
  }
  const allSelected = donors.length > 0 && selectedVisible.length === donors.length

  function toggleDonor(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
  }

  function toggleSelectAll() {
    const visibleIds = donors.map((donor) => donor.id)
    setSelected((current) => {
      if (allSelected) return current.filter((id) => !visibleIds.includes(id))
      return [...new Set([...current, ...visibleIds])]
    })
  }

  function notifyAll() {
    onNotify(selectedVisible.map((donor) => donor.id))
  }

  function expandRadius() {
    setRadiusKm((current) => Math.min(MAX_RADIUS_KM, current + 5))
  }
  function selectAllVisible() {
    const visibleIds = donors.map((donor) => donor.id)
    setSelected((current) => [...new Set([...current, ...visibleIds])])
  }

  function deselectAllVisible() {
    const visibleIds = new Set(donors.map((donor) => donor.id))
    setSelected((current) => current.filter((id) => !visibleIds.has(id)))
  }

  function selectEligibleInView() {
    const eligibleIds = donors
      .filter((donor) => donor.eligibilityState?.state === 'eligible')
      .map((donor) => donor.id)
    setSelected((current) => [...new Set([...current, ...eligibleIds])])
  }

  function invertSelectionInView() {
    const visibleIds = donors.map((donor) => donor.id)
    setSelected((current) => {
      const currentSet = new Set(current)
      const next = []
      for (const id of visibleIds) {
        if (currentSet.has(id)) {
          currentSet.delete(id)
        } else {
          next.push(id)
        }
      }
      return [...next, ...currentSet]
    })
  }

  function clearSelection() {
    setSelected([])
  }

  return (
    <div id="matching">
      <section id="matching-request-summary" className="card" data-request-id={summary.requestId}>
        <header className="row row-between">
          <span>Matching for</span>
          <span id="matching-request-id">{summary.requestId}</span>
        </header>
        <div className="row">
          <span id="matching-request-patient">Patient {summary.patient}</span>
          <span id="matching-request-blood-type" className="badge" data-blood-type={summary.bloodType}>
            {summary.bloodType}
          </span>
          <span id="matching-request-component" data-component={summary.component}>
            {summary.componentLabel}
          </span>
        </div>
        <div className="row">
          <span id="matching-request-units-needed">{summary.unitsNeeded} units needed</span>
          <span id="matching-request-inventory-covered">{summary.inventoryCovered} covered by inventory</span>
          <span id="matching-request-shortfall" data-state={summary.shortfall > 0 ? 'needed' : 'met'}>
            {summary.shortfall} shortfall
          </span>
        </div>
      </section>

      <section id="matching-filters" className="card">
        <div className="field">
          <label htmlFor="matching-filter-component">Component</label>
          <select
            id="matching-filter-component"
            value={component ?? activeComponent}
            onChange={(event) => setComponent(event.target.value)}
          >
            {COMPONENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="matching-filter-compat-tier">Compatibility tier</label>
          <select
            id="matching-filter-compat-tier"
            value={tier}
            onChange={(event) => setTier(event.target.value)}
          >
            <option value="all">All tiers</option>
            {COMPAT_TIERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="matching-filter-eligibility">Eligibility</label>
          <select
            id="matching-filter-eligibility"
            value={eligibility}
            onChange={(event) => setEligibility(event.target.value)}
          >
            <option value="all">Any eligibility</option>
            {ELIGIBILITY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="matching-filter-response-status">Response</label>
          <select
            id="matching-filter-response-status"
            value={response}
            onChange={(event) => setResponse(event.target.value)}
          >
            <option value="all">Any response</option>
            {RESPONSE_STATUSES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="matching-radius-slider">Radius</label>
          <input
            id="matching-radius-slider"
            type="range"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step="1"
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
          />
          <span id="matching-radius-value">{radiusKm} km</span>
        </div>
      </section>

      <section id="matching-wave-status" className="card" data-state={paused ? 'paused' : 'running'}>
        <span id="matching-wave-number">
          Wave {wave.wave} of {wave.totalWaves}
        </span>
        <span id="matching-wave-notified">{wave.notified} donors notified</span>
        <span id="matching-wave-accepted">{wave.accepted} accepted</span>
        <span id="matching-wave-countdown" data-next-wave-at={wave.nextWaveAt}>
          next wave in {wave.countdown}
        </span>
        <button id="matching-pause-btn" className="btn" type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? 'Resume matching' : 'Pause matching'}
        </button>
        <button id="matching-expand-radius-btn" className="btn" type="button" onClick={expandRadius}>
          Expand radius
        </button>
      </section>

      <DonorSelectionToolbar
        donorsInView={donors}
        selected={selected}
        allSelectedInView={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onSelectAllVisible={selectAllVisible}
        onDeselectAll={deselectAllVisible}
        onSelectEligible={selectEligibleInView}
        onInvertSelection={invertSelectionInView}
        onClearSelection={clearSelection}
        onNotifySelected={notifyAll}
      />

      <nav id="matching-tier-tabs" className="row" role="tablist" aria-label="Compatibility tier">
        {COMPAT_TIERS.map((option) => (
          <button
            key={option.id}
            id={`tab-${option.id}`}
            className="tab"
            type="button"
            role="tab"
            aria-selected={tier === option.id}
            data-active={tier === option.id}
            onClick={() => setTier(option.id)}
          >
            {option.label} ({tierCounts[option.id]})
          </button>
        ))}
      </nav>

      <button
        id="matching-fallback-action-btn"
        className="btn"
        type="button"
        data-status="critical"
        disabled={tier !== 'fallback'}
        onClick={onFallback}
      >
        Use fallback donors
      </button>

      <section id="matching-map" className="card">
        <div data-map>[map] donors within {radiusKm} km</div>
        <div
          id="matching-map-radius-circle"
          data-radius-km={radiusKm}
          data-state={paused ? 'paused' : 'active'}
        >
          radius circle {radiusKm} km
        </div>
      </section>

      {donors.length === 0 ? (
        <div id="matching-empty" className="card" data-state="empty">
          <span>No donors found, expand radius</span>
          <button id="matching-empty-expand-btn" className="btn" type="button" onClick={expandRadius}>
            Expand radius
          </button>
        </div>
      ) : (
        <div id="matching-donor-list">
          {donors.map((donor) => (
            <DonorCard
              key={donor.id}
              donor={donor}
              donationType={donationType}
              selected={selected.includes(donor.id)}
              onToggle={() => toggleDonor(donor.id)}
              onNotify={() => onNotify([donor.id])}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Matching
