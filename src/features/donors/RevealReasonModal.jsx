import { useCallback, useEffect, useState } from 'react'
import { REVEAL_REASONS, buildDonorProfile } from './donors-data.js'

function RevealReasonModal({ open, donorId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const loadedFor = open ? (donorId ?? 'none') : null
  const [loadedState, setLoadedState] = useState(null)

  if (loadedFor !== loadedState) {
    setLoadedState(loadedFor)
    setReason('')
    setNotes('')
  }

  const profile = donorId ? buildDonorProfile(donorId) : null

  const closeModal = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') closeModal()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, closeModal])

  function confirm() {
    if (!reason) return
    onConfirm({ donorId, reason, notes })
    closeModal()
  }

  return (
    <>
      <div
        id="reveal-reason-backdrop"
        aria-hidden="true"
        data-state={open ? 'open' : 'closed'}
        onClick={closeModal}
      />

      <div
        id="reveal-reason-modal"
        data-state={open ? 'open' : 'closed'}
        data-donor-id={donorId ?? 'none'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reveal-reason-title"
      >
        <header id="reveal-reason-header" className="row row-between">
          <span id="reveal-reason-title">Reveal contact</span>
          <button id="reveal-reason-close-btn" className="btn" type="button" onClick={closeModal}>
            Close
          </button>
        </header>

        <div id="reveal-reason-target" className="card">
          <span id="reveal-reason-donor-id" className="pill">
            {donorId ?? '—'}
          </span>
          <span id="reveal-reason-donor-name">{profile?.donor.name ?? '—'}</span>
          <span id="reveal-reason-masked" className="badge">
            {profile?.donor.masked ?? '—'}
          </span>
        </div>

        <div id="reveal-reason-field" className="field">
          <label htmlFor="reveal-reason-select">
            <span>Reason</span>
            <select
              id="reveal-reason-select"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              <option value="">Select a reason</option>
              {REVEAL_REASONS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="reveal-reason-notes" className="field">
          <label htmlFor="reveal-reason-notes-input">
            <span>Notes (optional)</span>
            <input
              id="reveal-reason-notes-input"
              type="text"
              placeholder="Reference, requester, or case number"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div id="reveal-reason-warning" className="card" data-logged="true">
          This action is logged with your name, the reason, and the timestamp.
        </div>

        <div id="reveal-reason-actions" className="row">
          <button
            id="reveal-reason-confirm-btn"
            className="btn"
            type="button"
            disabled={!reason}
            onClick={confirm}
          >
            Reveal contact
          </button>
          <button id="reveal-reason-cancel-btn" className="btn" type="button" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

export default RevealReasonModal