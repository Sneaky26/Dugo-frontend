import { useState } from 'react'
import data from './inventory-data.js'

const { DISCARD_REASONS, NOW } = data

export default function DiscardDialog({ open, batch, onClose, onConfirm }) {
  const [reason, setReason] = useState(DISCARD_REASONS[0].value)
  const [notes, setNotes] = useState('')

  if (!batch) return null

  return (
    <>
      <div id="discard-backdrop" data-state={open ? 'open' : 'closed'} onClick={onClose} />
      <section
        id="discard-dialog"
        data-state={open ? 'open' : 'closed'}
        role="alertdialog"
        aria-labelledby="discard-dialog-title"
      >
        <h2 id="discard-dialog-title">{batch ? `Discard ${batch.batch}` : 'Discard batch'}</h2>

        {batch ? (
          <p id="discard-dialog-batch">
            {batch.bloodType} {data.componentLabel(batch.component)} · {batch.units} unit(s) · expires{' '}
            {batch.expiry}
          </p>
        ) : null}

        <div id="discard-dialog-reason" className="field">
          <label>
            <span>Reason</span>
            <select id="discard-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
              {DISCARD_REASONS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="discard-dialog-notes" className="field">
          <label>
            <span>Notes</span>
            <textarea
              id="discard-notes"
              rows="2"
              value={notes}
              placeholder="Who authorised this and what happened"
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <p id="discard-dialog-warning">
          Discarded stock leaves the on-hand counts immediately and is filed under Expired with this reason. This
          cannot be undone.
        </p>

        <div className="row">
          <button id="discard-cancel" className="btn" type="button" onClick={onClose}>
            Keep batch
          </button>
          <button id="discard-confirm" className="btn" type="button" onClick={() => onConfirm(batch.batch, reason)}>
            Discard batch
          </button>
        </div>

        <p id="discard-dialog-timestamp">Logged at {NOW}</p>
      </section>
    </>
  )
}