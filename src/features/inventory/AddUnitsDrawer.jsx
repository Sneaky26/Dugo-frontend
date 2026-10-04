import { useState } from 'react'
import data, { nextBatchId } from './inventory-data.js'

const { BLOOD_TYPES, COMPONENTS, SOURCES, NOW } = data
const { expiryFromCollection, shelfDays } = data

export default function AddUnitsDrawer({ open, batches, onClose, onSave }) {
  const [bloodType, setBloodType] = useState(BLOOD_TYPES[0])
  const [component, setComponent] = useState(COMPONENTS[0].value)
  const [units, setUnits] = useState(1)
  const [collected, setCollected] = useState(NOW.slice(0, 10))
  const [source, setSource] = useState(SOURCES[0].value)
  const [errors, setErrors] = useState({})

  const shelf = shelfDays(component)
  const expiry = expiryFromCollection(collected, component)
  const previewId = nextBatchId(batches)
  const canSave = units > 0 && Boolean(collected) && Boolean(source)

  function submit(event) {
    event.preventDefault()
    const next = {}
    if (units <= 0) next.units = 'Enter at least one unit'
    if (!collected) next.collected = 'Enter the collection date'
    if (collected > NOW.slice(0, 10)) next.collected = 'Collection date cannot be in the future'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave({ bloodType, component, units, collected, source })
  }

  return (
    <>
      <div
        id="add-units-backdrop"
        data-state={open ? 'open' : 'closed'}
        onClick={onClose}
      />
      <section
        id="add-units-drawer"
        data-state={open ? 'open' : 'closed'}
        role="dialog"
        aria-labelledby="add-units-title"
      >
        <header className="row row-between">
          <h2 id="add-units-title">Add received units</h2>
          <button id="add-units-close" className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <form id="add-units-form" onSubmit={submit}>
          <div id="add-units-field-blood-type" className="field">
            <label>
              <span>Blood type</span>
              <select
                id="add-units-blood-type"
                name="bloodType"
                value={bloodType}
                onChange={(event) => setBloodType(event.target.value)}
              >
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div id="add-units-field-component" className="field">
            <label>
              <span>Component</span>
              <select
                id="add-units-component"
                name="component"
                value={component}
                onChange={(event) => setComponent(event.target.value)}
              >
                {COMPONENTS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <span id="add-units-shelf-life">{shelf}-day shelf life</span>
          </div>

          <div id="add-units-field-units" className="field">
            <label>
              <span>Units</span>
              <input
                id="add-units-units"
                name="units"
                type="number"
                min="1"
                max="24"
                value={units}
                onChange={(event) => setUnits(Number(event.target.value))}
              />
            </label>
            {errors.units ? <span className="field-error">{errors.units}</span> : null}
          </div>

          <div id="add-units-field-collected" className="field">
            <label>
              <span>Collection date</span>
              <input
                id="add-units-collected"
                name="collected"
                type="date"
                value={collected}
                onChange={(event) => setCollected(event.target.value)}
              />
            </label>
            {errors.collected ? <span className="field-error">{errors.collected}</span> : null}
          </div>

          <div id="add-units-field-source" className="field">
            <label>
              <span>Source</span>
              <select
                id="add-units-source"
                name="source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                {SOURCES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div id="add-units-preview" className="card">
            <h3>Batch preview</h3>
            <p id="add-units-preview-batch">
              Batch <strong>{previewId}</strong>
            </p>
            <p id="add-units-preview-expiry">
              Expires <strong>{expiry}</strong>
            </p>
            <p id="add-units-preview-status">
              Lands in <strong>Quarantine</strong> until screening is signed off
            </p>
          </div>

          <div className="row">
            <button id="add-units-cancel" className="btn" type="button" onClick={onClose}>
              Cancel
            </button>
            <button id="add-units-save" className="btn" type="button" disabled={!canSave} onClick={submit}>
              Add to inventory
            </button>
          </div>
        </form>
      </section>
    </>
  )
}