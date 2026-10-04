import { useState } from 'react'
import { FALLBACK_REASONS } from './matching-data.js'

function FallbackConfirmModal({ open, requestId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)

  function confirm() {
    if (!reason) {
      setError(true)
      return
    }
    setError(false)
    onConfirm({ reason })
    setReason('')
  }

  return (
    <>
      <div
        id="fallback-confirm-backdrop"
        aria-hidden="true"
        data-state={open ? 'open' : 'closed'}
        onClick={onClose}
      />
      <div
        id="fallback-confirm-modal"
        className="card"
        data-state={open ? 'open' : 'closed'}
        data-request-id={requestId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fallback-confirm-title"
      >
        <header id="fallback-confirm-title">Use fallback donors?</header>

        <p>
          Fallback donors are not clinically compatible and are only used under an emergency
          release. This overrides the compatibility check for {requestId}.
        </p>

        <div className="field">
          <label htmlFor="fallback-confirm-reason">
            <span>Reason</span>
            <select
              id="fallback-confirm-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setError(false)
              }}
            >
              <option value="">Select reason</option>
              {FALLBACK_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <span id="fallback-confirm-error" className="badge" data-state="error">
            Reason is required
          </span>
        )}

        <div className="row">
          <button
            id="fallback-confirm-confirm-btn"
            className="btn"
            type="button"
            data-status="critical"
            onClick={confirm}
          >
            Confirm fallback
          </button>
          <button id="fallback-confirm-cancel-btn" className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

export default FallbackConfirmModal
