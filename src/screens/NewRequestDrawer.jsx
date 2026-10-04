import { useState } from 'react'
import data from './requests-data.js'
import {
  compatibleStock,
  donorPreference,
  planText,
  sortedDonorTypes,
  suggestPriority,
} from './blood-compat.js'

const { COMPONENTS, BLOOD_TYPES, SOURCES, STOCK_BATCHES } = data

const VALIDATION_FIELDS = [
  { field: 'patient-name', label: 'Patient name' },
  { field: 'ward', label: 'Ward' },
  { field: 'required-by', label: 'Required by' },
  { field: 'quantity', label: 'Quantity' },
]

function validate(form) {
  return VALIDATION_FIELDS.filter(({ field }) => {
    const value = form[field]
    if (field === 'quantity') return !value || Number(value) < 1
    return !value || !String(value).trim()
  })
}

function NewRequestDrawer({ open, onClose }) {
  const [component, setComponent] = useState('rbc')
  const [bloodType, setBloodType] = useState('')
  const [form, setForm] = useState({
    quantity: '',
    'patient-name': '',
    ward: '',
    contact: '',
    'required-by': '',
    notes: '',
  })
  const [source, setSource] = useState('both')
  const [priorityOverride, setPriorityOverride] = useState('')
  const [emergency, setEmergency] = useState(false)
  const [rbcEmergency, setRbcEmergency] = useState(false)
  const [rbcReason, setRbcReason] = useState('')
  const [rhNegative, setRhNegative] = useState(false)
  const [thawRequired, setThawRequired] = useState(false)
  const [errors, setErrors] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const quantity = Number(form.quantity) || 0
  const donorTypes = sortedDonorTypes(component, bloodType)
  const stockRows = compatibleStock(component, bloodType, STOCK_BATCHES)
  const stockUnits = stockRows.reduce((total, batch) => total + batch.units, 0)
  const plan = planText(stockUnits, quantity, source)
  const suggested = suggestPriority(component, form['required-by'])
  const priority = priorityOverride || suggested
  const isFrozen = component === 'plasma' || component === 'cryoprecipitate'
  const isRbc = component === 'rbc' || component === 'whole-blood'

  const stockState =
    donorTypes.length === 0 ? 'empty' : stockUnits === 0 ? 'empty' : stockUnits >= quantity ? 'adequate' : 'partial'

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function closeDrawer() {
    setErrors([])
    onClose()
  }

  function handleSubmit() {
    const found = validate(form)
    setErrors(found)
    if (found.length > 0) return
    if (emergency) {
      setConfirmOpen(true)
      return
    }
    closeDrawer()
  }

  return (
    <>
      <div id="new-request-drawer" className="card" data-state={open ? 'open' : 'closed'}>
        <header id="new-request-drawer-header" className="row row-between">
          <span>New blood request</span>
          <button id="new-request-drawer-close-btn" className="btn" type="button" onClick={closeDrawer}>
            Close
          </button>
        </header>

        <section id="nr-component-cards">
          {COMPONENTS.map((option) => (
            <button
              key={option.value}
              id={option.id}
              className="tab"
              type="button"
              data-component={option.value}
              data-selected={option.value === component}
              onClick={() => setComponent(option.value)}
            >
              {option.label}
            </button>
          ))}
        </section>

        <div className="field">
          <label>
            <span>Blood type</span>
            <select
              id="nr-blood-type"
              value={bloodType}
              onChange={(event) => setBloodType(event.target.value)}
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="nr-compat-chips" className="row" data-rh-preference={donorPreference(component)}>
          {donorTypes.map((type) => (
            <span key={type} className="chip" data-blood-type={type} data-compatible="donor-type">
              {type}
            </span>
          ))}
        </div>

        <section id="nr-stock-panel" className="card" data-state={stockState}>
          <header id="nr-stock-panel-title">
            {stockState === 'empty' ? 'No compatible stock' : 'Compatible stock (FEFO)'}
          </header>

          <div id="nr-stock-list">
            {stockRows.map((batch) => (
              <div key={batch.batch} id={`nr-stock-row-${batch.batch}`} className="row row-between">
                <span className="pill">{batch.batch}</span>
                <span className="chip" data-blood-type={batch.bloodType}>
                  {batch.bloodType}
                </span>
                <span>Expires {batch.expiry}</span>
                <span className="badge">{batch.units} units</span>
              </div>
            ))}
          </div>

          <span id="nr-plan-text" className="pill" data-plan={plan.plan}>
            {plan.text}
          </span>
        </section>

        <div id="nr-details-grid">
          <div className="field">
            <label>
              <span>{component === 'platelets' ? 'Doses' : 'Units'}</span>
              <input
                id="nr-quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => updateForm('quantity', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label>
              <span>Patient name</span>
              <input
                id="nr-patient-name"
                type="text"
                placeholder="e.g. R.M."
                value={form['patient-name']}
                onChange={(event) => updateForm('patient-name', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label>
              <span>Ward</span>
              <input
                id="nr-ward"
                type="text"
                placeholder="ICU – 3rd Floor"
                value={form.ward}
                onChange={(event) => updateForm('ward', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label>
              <span>Contact</span>
              <input
                id="nr-contact"
                type="tel"
                placeholder="+63 917 555 0142"
                value={form.contact}
                onChange={(event) => updateForm('contact', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label>
              <span>Required by</span>
              <input
                id="nr-required-by"
                type="datetime-local"
                value={form['required-by']}
                onChange={(event) => updateForm('required-by', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label>
              <span>Notes</span>
              <textarea
                id="nr-notes"
                rows="2"
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
              />
            </label>
          </div>
        </div>

        <fieldset id="nr-source" className="row">
          <legend>Source</legend>
          {SOURCES.map((option) => (
            <label key={option.value} className="row" data-source={option.value}>
              <input
                id={option.id}
                type="radio"
                name="nr-source"
                checked={source === option.value}
                onChange={() => setSource(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        {component === 'platelets' && (
          <section id="nr-platelet-options" className="card" data-component="platelets">
            <label className="row">
              <input
                id="nr-platelet-rh-negative"
                type="checkbox"
                checked={rhNegative}
                onChange={(event) => setRhNegative(event.target.checked)}
              />
              <span>Prefer Rh-negative donors</span>
            </label>
          </section>
        )}

        {isFrozen && (
          <section id="nr-frozen-options" className="card" data-component={component}>
            <label className="row">
              <input
                id="nr-frozen-thaw-required"
                type="checkbox"
                checked={thawRequired}
                onChange={(event) => setThawRequired(event.target.checked)}
              />
              <span>Thawing required — 30–40 min lead time</span>
            </label>
          </section>
        )}

        {isRbc && (
          <section id="nr-rbc-emergency" className="card" data-component={component}>
            <label className="row">
              <input
                id="nr-rbc-emergency-toggle"
                type="checkbox"
                checked={rbcEmergency}
                onChange={(event) => setRbcEmergency(event.target.checked)}
              />
              <span>Emergency release (uncrossmatched)</span>
            </label>
            <div className="field">
              <label>
                <span>Emergency reason</span>
                <textarea
                  id="nr-rbc-emergency-reason"
                  rows="2"
                  value={rbcReason}
                  onChange={(event) => setRbcReason(event.target.value)}
                />
              </label>
            </div>
          </section>
        )}

        <section id="nr-priority" className="row">
          <span
            id="nr-priority-suggested"
            className="chip"
            data-suggested={suggested}
            data-priority={priority}
          >
            Suggested: {suggested}
          </span>
          <div className="field">
            <label>
              <span>Override</span>
              <select
                id="nr-priority-override"
                value={priorityOverride}
                onChange={(event) => setPriorityOverride(event.target.value)}
              >
                <option value="">Use suggested</option>
                <option value="routine">routine</option>
                <option value="stat">stat</option>
                <option value="urgent">urgent</option>
              </select>
            </label>
          </div>
        </section>

        <label id="nr-emergency-toggle" className="row" data-state={emergency ? 'on' : 'off'}>
          <input type="checkbox" checked={emergency} onChange={(event) => setEmergency(event.target.checked)} />
          <span>Emergency request</span>
        </label>

        <section id="nr-summary" className="card" data-state={errors.length === 0 && quantity > 0 ? 'ready' : 'incomplete'}>
          <header>Review</header>
          <div id="nr-summary-grid" className="row">
            <span className="chip" data-component={component}>
              {COMPONENTS.find((option) => option.value === component)?.label}
            </span>
            <span className="badge" data-blood-type={bloodType || 'unset'}>
              {bloodType || 'no blood type'}
            </span>
            <span className="pill">
              {quantity} {component === 'platelets' ? 'doses' : 'units'}
            </span>
            <span className="chip" data-priority={priority}>
              {priority}
            </span>
            <span className="chip" data-plan={plan.plan}>
              {plan.text}
            </span>
            <span className="chip" data-state={emergency ? 'emergency' : 'routine'}>
              {emergency ? 'emergency' : 'routine'}
            </span>
          </div>
        </section>

        {errors.length > 0 && (
          <div id="nr-validation-errors" className="card" data-state="error" data-count={errors.length}>
            {errors.map(({ field, label }) => (
              <span key={field} id={`nr-validation-error-${field}`} className="badge" data-field={field}>
                {label} is required
              </span>
            ))}
          </div>
        )}

        <div className="row">
          <button id="nr-submit-btn" className="btn" type="button" onClick={handleSubmit}>
            Submit request
          </button>
          <button id="nr-cancel-btn" className="btn" type="button" onClick={closeDrawer}>
            Cancel
          </button>
        </div>
      </div>

      <div
        id="emergency-confirm-modal"
        className="card"
        data-state={confirmOpen ? 'open' : 'closed'}
      >
        <header id="emergency-confirm-modal-title">
          Release emergency units without crossmatch?
        </header>
        <span id="nr-rbc-emergency-reason-summary" className="card" data-state="empty">
          {rbcReason || 'No reason recorded'}
        </span>
        <div className="row">
          <button
            id="emergency-confirm-btn"
            className="btn"
            type="button"
            data-status="critical"
            onClick={() => {
              setConfirmOpen(false)
              closeDrawer()
            }}
          >
            Confirm emergency release
          </button>
          <button id="emergency-cancel-btn" className="btn" type="button" onClick={() => setConfirmOpen(false)}>
            Go back
          </button>
        </div>
      </div>
    </>
  )
}

export default NewRequestDrawer