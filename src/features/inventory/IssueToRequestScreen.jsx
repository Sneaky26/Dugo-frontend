import { useState } from 'react'
import data, { buildCompatibleBatches, buildIssueSlip, openRequests, stockUnitsFor } from './inventory-data.js'
import { donorTypesFor } from '@/shared/domain'

const { NOW, batchKey } = data

function planText(request, units) {
  if (units === 0) return `No compatible ${data.componentLabel(request.component).toLowerCase()} on hand — broadcast a donor campaign for ${donorTypesFor(request.component, request.bloodType).join(', ')}`
  if (units < request.quantity) return `Only ${units} of ${request.quantity} unit(s) on hand — issue the partial and search donors for ${request.quantity - units} more`
  return 'Full quantity available'
}

export default function IssueToRequestScreen({ batches, selectedBatchId, onBack, onComplete }) {
  const requests = openRequests()
  const [requestId, setRequestId] = useState(requests.length > 0 ? requests[0].requestId : null)
  const [selections, setSelections] = useState({})
  const [issued, setIssued] = useState(null)

  const request = requests.find((entry) => entry.requestId === requestId) ?? null
  const compatible = request ? buildCompatibleBatches(request, batches) : []
  const units = request ? stockUnitsFor(request, batches) : 0
  const chosen = Object.entries(selections).filter(([, count]) => count > 0)
  const slip = request && chosen.length > 0 ? buildIssueSlip(request, chosen.map(([batch, count]) => ({ batch, units: count })), batches) : null
  const compatibleTypes = request ? donorTypesFor(request.component, request.bloodType).join(', ') : ''

  function setCount(batch, value) {
    const row = batches.find((entry) => entry.batch === batch)
    const capped = Math.max(0, Math.min(Number(value) || 0, row ? row.units : 0))
    setSelections((current) => ({ ...current, [batch]: capped }))
  }

  function preset() {
    if (!request) return
    const next = {}
    let remaining = request.quantity
    for (const batch of compatible) {
      if (remaining <= 0) break
      const take = Math.min(batch.units, remaining)
      next[batch.batch] = take
      remaining -= take
    }
    setSelections(next)
  }

  return (
    <div id="issue-to-request-screen">
      <header className="row row-between">
        <h2 id="issue-to-request-title">Issue units to request</h2>
        <button id="issue-to-request-back" className="btn" type="button" onClick={onBack}>
          Back to inventory
        </button>
      </header>

      <div id="issue-to-request-picker" className="field">
        <label>
          <span>Open request</span>
          <select
            id="issue-to-request-request"
            value={requestId ?? ''}
            onChange={(event) => {
              setRequestId(event.target.value)
              setSelections({})
              setIssued(null)
            }}
          >
            {requests.map((entry) => (
              <option key={entry.requestId} value={entry.requestId}>
                {entry.requestId} — {entry.componentLabel} {entry.bloodType} · {entry.quantity}u · {entry.ward}
              </option>
            ))}
          </select>
        </label>
      </div>

      {request ? (
        <div id="issue-to-request-summary" className="card" data-blood-type={request.bloodType}>
          <p id="issue-to-request-patient">{request.patient}</p>
          <p id="issue-to-request-detail">
            {request.componentLabel} {request.bloodType} · needs {request.quantity} unit(s) · {request.ward} ·
            required by {request.requiredBy}
          </p>
          <p id="issue-to-request-compatible-types">Compatible donor types: {compatibleTypes}</p>
          <p id="issue-to-request-stock" data-state={units === 0 ? 'none' : units < request.quantity ? 'partial' : 'full'}>
            {units} compatible unit(s) on hand — {planText(request, units)}
          </p>
        </div>
      ) : null}

      {compatible.length > 0 ? (
        <table id="issue-to-request-batches" className="table">
          <thead>
            <tr>
              <th scope="col">Batch</th>
              <th scope="col">Blood type</th>
              <th scope="col">Available</th>
              <th scope="col">Expiry</th>
              <th scope="col">Issue</th>
            </tr>
          </thead>
          <tbody>
            {compatible.map((batch) => (
              <tr
                key={batch.batch}
                id={`issue-to-request-row-${batchKey(batch.batch)}`}
                data-batch={batch.batch}
                data-preselected={batch.batch === selectedBatchId}
              >
                <td>{batch.batch}</td>
                <td data-blood-type={batch.bloodType}>{batch.bloodType}</td>
                <td>{batch.units}</td>
                <td data-expiry={batch.expiryState}>{batch.expiry}</td>
                <td>
                  <input
                    id={`issue-to-request-units-${batchKey(batch.batch)}`}
                    type="number"
                    min="0"
                    max={batch.units}
                    value={selections[batch.batch] ?? 0}
                    onChange={(event) => setCount(batch.batch, event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div id="issue-to-request-empty" className="card" data-state="empty">
          <span>No compatible available stock for this request</span>
        </div>
      )}

      {issued ? (
        <div id="issue-slip-preview" className="card" data-state="issued">
          <h3>Issue slip</h3>
          <p id="issue-slip-preview-request">
            {issued.requestId} · {issued.patient} · {issued.componentLabel} {issued.bloodType}
          </p>
          <p id="issue-slip-preview-total">{issued.totalUnits} unit(s) issued</p>
          <ul>
            {issued.rows.map((row) => (
              <li key={row.id} id={row.id}>
                {row.batch} · {row.units}u · expires {row.expiry}
              </li>
            ))}
          </ul>
          <p id="issue-slip-preview-footer">
            {issued.issuedBy} · {issued.issuedAt} · ward {issued.ward}
          </p>
          <button id="issue-slip-print-btn" className="btn" type="button">
            <span>[icon]</span>
            <span>Print slip</span>
          </button>
        </div>
      ) : null}

      <div className="row">
        <button id="issue-to-request-cancel" className="btn" type="button" onClick={onBack}>
          Cancel
        </button>
        <button id="issue-to-request-preset" className="btn" type="button" disabled={!request} onClick={preset}>
          Fill from oldest stock
        </button>
        <button
          id="issue-to-request-confirm"
          className="btn"
          type="button"
          disabled={!slip}
          onClick={() => setIssued(onComplete({ requestId, selections: chosen.map(([batch, count]) => ({ batch, units: count })) }))}
        >
          Confirm issue
        </button>
      </div>

      <p id="issue-to-request-note">Slips are timestamped with {NOW} for the wireframe.</p>
    </div>
  )
}