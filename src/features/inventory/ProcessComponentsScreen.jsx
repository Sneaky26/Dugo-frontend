import { useState } from 'react'
import data, { buildProcessOutputs, wholeBloodBatches } from './inventory-data.js'

const { NOW, batchKey } = data

export default function ProcessComponentsScreen({ batches, onBack, onComplete }) {
  const available = wholeBloodBatches(batches)
  const [batchId, setBatchId] = useState(available.length > 0 ? available[0].batch : null)
  const [result, setResult] = useState(null)

  const parent = batches.find((batch) => batch.batch === batchId) ?? null
  const outputs = batchId ? buildProcessOutputs(batchId, batches) : []

  return (
    <div id="process-components-screen">
      <header className="row row-between">
        <h2 id="process-components-title">Process components</h2>
        <button id="process-components-back" className="btn" type="button" onClick={onBack}>
          Back to inventory
        </button>
      </header>

      <div id="process-components-unit-picker" className="field">
        <label>
          <span>Whole blood unit</span>
          <select
            id="process-components-batch"
            value={batchId ?? ''}
            onChange={(event) => {
              setBatchId(event.target.value)
              setResult(null)
            }}
          >
            {available.length === 0 ? <option value="">No whole blood units available</option> : null}
            {available.map((batch) => (
              <option key={batch.batch} value={batch.batch}>
                {batch.batch} — {batch.bloodType} · {batch.units}u · expires {batch.expiry}
              </option>
            ))}
          </select>
        </label>
      </div>

      {parent ? (
        <table id="process-components-outputs" className="table">
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Quantity</th>
              <th scope="col">Shelf life</th>
              <th scope="col">New expiry</th>
            </tr>
          </thead>
          <tbody>
            {outputs.map((output) => (
              <tr key={output.id} id={output.id} data-component={output.component}>
                <td>{output.label}</td>
                <td>{output.quantity}</td>
                <td>{output.shelfDays} days</td>
                <td data-expiry={output.expiry < NOW.slice(0, 10) ? 'expired' : 'ok'}>{output.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div id="process-components-empty" className="card" data-state="empty">
          <span>No whole blood unit selected</span>
        </div>
      )}

      <p id="process-components-note">
        Splitting a unit is recorded against the parent batch. New batches land in Quarantine until screening.
      </p>

      {result ? (
        <div id="process-components-result" className="card" data-state="done">
          <h3>Created</h3>
          <ul>
            {result.map((batch) => (
              <li key={batch.batch} id={`process-components-result-${batchKey(batch.batch)}`}>
                {batch.componentLabel} {batch.units}u · expires {batch.expiry}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="row">
        <button id="process-components-cancel" className="btn" type="button" onClick={onBack}>
          Cancel
        </button>
        <button
          id="process-components-confirm"
          className="btn"
          type="button"
          disabled={!parent}
          onClick={() => setResult(onComplete(parent.batch))}
        >
          Process unit
        </button>
      </div>
    </div>
  )
}