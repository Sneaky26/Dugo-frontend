import { useState } from 'react'
import { CANCEL_REASONS, buildDetail } from './request-detail-data.js'

function RequestCancelModal({ open, requestId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState([])

  const detail = buildDetail(requestId)
  if (!detail) return null

  const { request, batches, donors } = detail

  function confirm() {
    if (!reason) {
      setErrors([{ field: 'reason', label: 'Reason' }])
      return
    }
    setErrors([])
    onConfirm({ reason, notes })
    setReason('')
    setNotes('')
  }

  return (
    <div
      id="reqdetail-cancel-modal"
      className="card"
      data-state={open ? 'open' : 'closed'}
      data-request-id={request.requestId}
    >
      <header id="reqdetail-cancel-modal-title">Cancel {request.requestId}?</header>

      <div id="reqdetail-cancel-impact" className="card" data-state="warning">
        <header>Cancelling will</header>
        <ul>
          <li id="reqdetail-cancel-impact-batches">
            release {batches.length} held {batches.length === 1 ? 'batch' : 'batches'}
          </li>
          <li id="reqdetail-cancel-impact-donors">
            withdraw {donors.length} donor {donors.length === 1 ? 'invite' : 'invites'}
          </li>
          <li id="reqdetail-cancel-impact-ward">
            notify {request.ward} ({request.contact})
          </li>
        </ul>
      </div>

      <div className="field">
        <label>
          <span>Reason</span>
          <select
            id="reqdetail-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            <option value="">Select reason</option>
            {CANCEL_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field">
        <label>
          <span>Notes (optional)</span>
          <textarea
            id="reqdetail-cancel-notes"
            rows="2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div id="reqdetail-cancel-errors" className="card" data-state="error" data-count={errors.length}>
          {errors.map(({ field, label }) => (
            <span key={field} id={`reqdetail-cancel-error-${field}`} className="badge" data-field={field}>
              {label} is required
            </span>
          ))}
        </div>
      )}

      <div className="row">
        <button
          id="reqdetail-cancel-confirm-btn"
          className="btn"
          type="button"
          data-status="critical"
          onClick={confirm}
        >
          Cancel request
        </button>
        <button id="reqdetail-cancel-dismiss-btn" className="btn" type="button" onClick={onClose}>
          Keep request
        </button>
      </div>
    </div>
  )
}

export default RequestCancelModal