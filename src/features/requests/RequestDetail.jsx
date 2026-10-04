import { useState } from 'react'
import { buildDetail } from './request-detail-data.js'

function RequestDetail({ requestId, cancelledRequestId, onClose, onOpenCancel, onOpenMatching }) {
  const [status, setStatus] = useState(cancelledRequestId === requestId ? 'cancelled' : null)
  const detail = buildDetail(requestId, status)
  if (!detail) return null

  const { request, batches, donors, plan, steps, log } = detail
  const isClosed = detail.status === 'cancelled' || detail.status === 'fulfilled'

  return (
    <div id="reqdetail" data-request-id={request.requestId}>
      <header id="reqdetail-header" className="card">
        <div id="reqdetail-header-top" className="row row-between">
          <span id="reqdetail-header-id" className="pill">
            {request.requestId}
          </span>
          <span
            id="reqdetail-priority-badge"
            className="badge"
            data-priority={request.priority}
          >
            {request.priority}
          </span>
          <span id="reqdetail-status-pill" className="pill" data-status={detail.status}>
            {detail.status}
          </span>
        </div>

        <div className="row row-between">
          <span id="reqdetail-patient" className="chip">
            {request.patient}
          </span>
          <span id="reqdetail-blood-type" className="badge" data-blood-type={request.bloodType}>
            {request.bloodType}
          </span>
          <span id="reqdetail-component" className="chip" data-component={request.component}>
            {request.componentLabel}
          </span>
          <span id="reqdetail-qty" className="pill">
            {request.quantity} {request.component === 'platelets' ? 'doses' : 'units'}
          </span>
        </div>

        <div className="row row-between">
          <span id="reqdetail-ward">{request.ward}</span>
          <span id="reqdetail-required-by" className="chip">
            Required by {request.requiredBy}
          </span>
          <span id="reqdetail-contact" className="chip">
            {request.contact}
          </span>
        </div>

        <div id="reqdetail-header-actions" className="row">
          <button id="reqdetail-edit-btn" className="btn" type="button">
            Edit
          </button>
          <button
            id="reqdetail-cancel-btn"
            className="btn"
            type="button"
            data-status="critical"
            onClick={onOpenCancel}
          >
            Cancel request
          </button>
          {(detail.status === 'cancelled' || detail.status === 'fulfilled') && (
            <button
              id="reqdetail-reopen-btn"
              className="btn"
              type="button"
              onClick={() => setStatus('urgent')}
            >
              Reopen
            </button>
          )}
          <button id="reqdetail-close-btn" className="btn" type="button" onClick={onClose}>
            Back to requests
          </button>
        </div>
      </header>

      <nav id="reqdetail-stepper" className="row" aria-label="Request progress">
        {steps.map((step) => (
          <span
            key={step.step}
            id={`reqdetail-step-${step.step}`}
            className="chip"
            data-step={step.step}
            data-step-state={step.state}
          >
            {step.step.replace('-', ' ')}
          </span>
        ))}
      </nav>

      <section id="reqdetail-plan" className="card" data-plan={plan.plan} data-state={plan.met ? 'met' : 'outstanding'}>
        <header id="reqdetail-plan-title">Fulfillment plan</header>
        <div id="reqdetail-plan-summary" className="row">
          <span id="reqdetail-plan-from-inventory" className="pill">
            from inventory {plan.inventoryUnits}
          </span>
          <span id="reqdetail-plan-from-donors" className="pill">
            from donors {plan.donorUnits}
          </span>
          <span
            id="reqdetail-plan-still-needed"
            className="pill"
            data-state={plan.met ? 'met' : 'needed'}
          >
            still needed {plan.stillNeeded}
          </span>
        </div>
      </section>

      <section
        id="reqdetail-reserved-batches"
        className="card"
        data-state={batches.length === 0 ? 'empty' : 'held'}
      >
        <header id="reqdetail-reserved-batches-title">
          {batches.length === 0 ? 'No units held' : 'Reserved batches'}
        </header>

        {batches.length === 0 ? (
          <span id="reqdetail-reserved-batches-empty" className="chip">
            {isClosed ? 'Holds released — request is closed' : 'No compatible stock held'}
          </span>
        ) : (
          <table id="reqdetail-reserved-batches-table" className="table">
            <thead>
              <tr>
                <th scope="col">Batch</th>
                <th scope="col">Component</th>
                <th scope="col">Expiry</th>
                <th scope="col">Hold</th>
                <th scope="col">Units</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} id={batch.id} data-blood-type={batch.bloodType}>
                  <td id={`${batch.id}-batch`}>{batch.batch}</td>
                  <td id={`${batch.id}-component`} data-component={batch.component}>
                    {batch.componentLabel}
                  </td>
                  <td id={`${batch.id}-expiry`}>{batch.expiry}</td>
                  <td id={`${batch.id}-hold`} className="badge" data-state={batch.hold.state}>
                    {batch.hold.text}
                  </td>
                  <td>{batch.units}</td>
                  <td id={`${batch.id}-actions`} className="row">
                    <button className="btn" type="button">
                      Release
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section
        id="reqdetail-donor-responses"
        className="card"
        data-state={donors.length === 0 ? 'empty' : 'active'}
      >
        <header id="reqdetail-donor-responses-title">
          {donors.length === 0 ? 'No donors contacted' : `Donor responses (${donors.length})`}
        </header>

        {donors.length === 0 ? (
          <span id="reqdetail-donor-responses-empty" className="chip">
            {isClosed ? 'All invites withdrawn' : 'Nobody notified yet'}
          </span>
        ) : (
          <table id="reqdetail-donor-responses-table" className="table">
            <thead>
              <tr>
                <th scope="col">Donor</th>
                <th scope="col">Blood type</th>
                <th scope="col">Distance</th>
                <th scope="col">Response</th>
                <th scope="col">Notified at</th>
                <th scope="col">Channel</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((donor) => (
                <tr key={donor.id} id={`reqdetail-donor-row-${donor.id}`} data-response={donor.response}>
                  <td id={`reqdetail-donor-row-${donor.id}-name`}>{donor.masked}</td>
                  <td
                    id={`reqdetail-donor-row-${donor.id}-blood-type`}
                    className="badge"
                    data-blood-type={donor.bloodType}
                  >
                    {donor.bloodType}
                  </td>
                  <td id={`reqdetail-donor-row-${donor.id}-distance`}>{donor.distance}</td>
                  <td id={`reqdetail-donor-row-${donor.id}-response`} data-response={donor.response}>
                    {donor.response}
                  </td>
                  <td id={`reqdetail-donor-row-${donor.id}-notified-at`}>{donor.notifiedAt}</td>
                  <td
                    id={`reqdetail-donor-row-${donor.id}-channel`}
                    className="chip"
                    data-channel={donor.channel}
                    data-channel-status={donor.channelStatus}
                  >
                    {donor.channel} · {donor.channelStatus}
                  </td>
                  <td id={`reqdetail-donor-row-${donor.id}-actions`} className="row">
                    <button className="btn" type="button">
                      Remind
                    </button>
                    <button className="btn" type="button">
                      Call
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <button id="reqdetail-open-matching-btn" className="btn" type="button" onClick={onOpenMatching}>
        <span>[icon]</span>
        <span>Find more donors</span>
      </button>

      <section id="reqdetail-activity-log" className="card">
        <header id="reqdetail-activity-log-title">Activity</header>
        <div id="reqdetail-activity-log-list">
          {log.map((entry) => (
            <div key={entry.id} id={entry.id} className="row row-between" data-event={entry.event}>
              <span className="chip">{entry.event}</span>
              <span>{entry.text}</span>
              <span className="chip">{entry.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default RequestDetail