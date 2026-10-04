import data from './inventory-data.js'

const { STATUSES, SOURCES } = data

export default function BatchDetailDrawer({ open, detail, onClose, onProcess, onIssue, onDiscard }) {
  if (!detail) return null

  const sourceLabel = SOURCES.find((entry) => entry.value === detail.source)?.label ?? detail.source
  const statusLabel = STATUSES.find((entry) => entry.value === detail.status)?.label ?? detail.status

  return (
    <>
      <div id="batch-detail-backdrop" data-state={open ? 'open' : 'closed'} onClick={onClose} />
      <section
        id="batch-detail-drawer"
        data-state={open ? 'open' : 'closed'}
        role="dialog"
        aria-labelledby="batch-detail-title"
      >
        <header className="row row-between">
          <h2 id="batch-detail-title">{detail.batch}</h2>
          <button id="batch-detail-close" className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <dl id="batch-detail-fields">
          <div id="batch-detail-field-blood-type">
            <dt>Blood type</dt>
            <dd data-blood-type={detail.bloodType}>{detail.bloodType}</dd>
          </div>
          <div id="batch-detail-field-component">
            <dt>Component</dt>
            <dd data-component={detail.component}>{detail.componentLabel}</dd>
          </div>
          <div id="batch-detail-field-units">
            <dt>Units</dt>
            <dd>{detail.units}</dd>
          </div>
          <div id="batch-detail-field-collected">
            <dt>Collected</dt>
            <dd>{detail.collected}</dd>
          </div>
          <div id="batch-detail-field-expiry">
            <dt>Expires</dt>
            <dd data-expiry={detail.expiryState}>
              {detail.expiry} ({detail.daysToExpiry}d)
            </dd>
          </div>
          <div id="batch-detail-field-status">
            <dt>Status</dt>
            <dd data-status={detail.status}>{statusLabel}</dd>
          </div>
          <div id="batch-detail-field-source">
            <dt>Source</dt>
            <dd>{sourceLabel}</dd>
          </div>
          <div id="batch-detail-field-compatibility">
            <dt>Compatibility</dt>
            <dd data-role={detail.compatibleAs}>{detail.compatibleAs === 'recipient' ? 'Matched to patient' : 'Matched to donor'}</dd>
          </div>
          {detail.reservedFor ? (
            <div id="batch-detail-field-reserved-for">
              <dt>Reserved for</dt>
              <dd>
                {detail.reservedFor} — {detail.reservedForLabel}
              </dd>
            </div>
          ) : null}
          {detail.discardReason ? (
            <div id="batch-detail-field-discard-reason">
              <dt>Discarded because</dt>
              <dd>{detail.discardReason}</dd>
            </div>
          ) : null}
        </dl>

        <h3 id="batch-detail-history-title">Batch history</h3>
        <ol id="batch-detail-history">
          {detail.history.map((entry) => (
            <li key={entry.id} id={entry.id} data-event={entry.event}>
              <span>{entry.time}</span>
              <span>{entry.text}</span>
              <span>{entry.actor}</span>
            </li>
          ))}
        </ol>

        <div className="row">
          <button
            id="batch-detail-process-btn"
            className="btn"
            type="button"
            disabled={detail.component !== 'whole-blood' || detail.status !== 'Available'}
            onClick={() => onProcess(detail.batch)}
          >
            Process components
          </button>
          <button
            id="batch-detail-issue-btn"
            className="btn"
            type="button"
            disabled={detail.status !== 'Available'}
            onClick={() => onIssue(detail.batch)}
          >
            Issue
          </button>
          <button id="batch-detail-discard-btn" className="btn" type="button" onClick={() => onDiscard(detail.batch)}>
            Discard
          </button>
        </div>
      </section>
    </>
  )
}