import { buildNotification } from './matching-data.js'

function NotifyPreviewModal({ open, requestId, recipientIds, onClose, onConfirm }) {
  const preview = buildNotification(requestId, recipientIds)
  if (!preview) return null

  return (
    <>
      <div
        id="notify-preview-backdrop"
        aria-hidden="true"
        data-state={open ? 'open' : 'closed'}
        onClick={onClose}
      />
      <div
        id="notify-preview-modal"
        className="card"
        data-state={open ? 'open' : 'closed'}
        data-request-id={requestId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-preview-title"
      >
        <header id="notify-preview-title">Send in-app notifications</header>

        <div id="notify-preview-count" className="row">
          <span>{preview.count} recipient(s)</span>
        </div>

        <div id="notify-preview-app" className="card">
          <span id="notify-preview-app-title">{preview.appTitle}</span>
          <span id="notify-preview-app-body">{preview.appBody}</span>
        </div>

        <div className="row">
          <button id="notify-preview-confirm-btn" className="btn" type="button" onClick={onConfirm}>
            Send notifications
          </button>
          <button id="notify-preview-cancel-btn" className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

export default NotifyPreviewModal
