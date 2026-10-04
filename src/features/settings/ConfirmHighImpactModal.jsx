/* The gate in front of the two high-impact sections. Compatibility and eligibility
   change who may give blood to whom and who may be asked to give at all, so a save
   on either one names the fields that changed and asks before writing. */

import { changedFields } from './settings-data.js'

export default function ConfirmHighImpactModal({ sectionId, label, before, after, onConfirm, onCancel }) {
  const changes = changedFields(before, after)

  return (
    <div id="confirm-high-impact-modal" className="card" role="dialog" aria-modal="true" data-section={sectionId} data-change-count={changes.length}>
      <h3 id="confirm-high-impact-title">Confirm high-impact change</h3>
      <p id="confirm-high-impact-lead">
        You are about to save <strong>{label}</strong>. This affects matching and donor screening for every
        user, and the change is written to the audit log.
      </p>

      <div id="confirm-high-impact-changes" data-count={changes.length}>
        <h4>Fields changing</h4>
        <ul>
          {changes.map((key) => (
            <li key={key} id={`confirm-high-impact-change-${key}`}>
              {key}
            </li>
          ))}
        </ul>
      </div>

      <p id="confirm-high-impact-warning">
        Confirming saves {changes.length} field{changes.length === 1 ? '' : 's'} to {label}. Cancelling leaves the
        section as it was.
      </p>

      <button id="confirm-high-impact-btn" className="btn" type="button" onClick={onConfirm}>
        Confirm and save
      </button>
      <button id="confirm-high-impact-cancel-btn" className="btn" type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}