import { buildDonorProfile, DONATION_TYPES } from './donors-data.js'

function DonorProfile({ donorId, revealed, revealReason, onBack, onEdit, onOpenDeactivate, onOpenReveal }) {
  const profile = buildDonorProfile(donorId)
  if (!profile) return null

  const { donor, age, overallEligibility, eligibility, checklist, history, points, comms, deferrals, notes } = profile

  return (
    <div id="donor-profile-screen" data-donor-id={donor.donorId}>
      <section id="donor-profile-header" className="card">
        <div className="row row-between">
          <div className="row">
            <span id="donor-profile-name">{donor.name}</span>
            <span id="donor-profile-blood-type" className="badge" data-blood-type={donor.bloodType}>
              {donor.bloodType}
            </span>
            <span id="donor-profile-status" className="chip" data-status={donor.status}>
              {donor.status}
            </span>
            <span id="donor-profile-eligibility" className="chip" data-eligibility={overallEligibility}>
              {overallEligibility}
            </span>
          </div>

          <div id="donor-profile-header-actions" className="row">
            <button id="donor-profile-back-btn" className="btn" type="button" onClick={onBack}>
              Back to registry
            </button>
            <button id="donor-profile-edit-btn" className="btn" type="button" onClick={() => onEdit(donor.donorId)}>
              Edit
            </button>
            <button
              id="donor-profile-deactivate-btn"
              className="btn"
              type="button"
              data-status="critical"
              disabled={donor.status === 'deactivated'}
              onClick={() => onOpenDeactivate(donor.donorId)}
            >
              Deactivate
            </button>
          </div>
        </div>

        <div id="donor-profile-meta" className="row">
          <span id="donor-profile-id" className="pill">
            {donor.donorId}
          </span>
          <span id="donor-profile-total-donations" className="chip">
            {donor.totalDonations} donations
          </span>
          <span id="donor-profile-last-donation" className="chip">
            Last {donor.lastDonation}
          </span>
          <span id="donor-profile-points-balance" className="chip">
            {points.balance} pts
          </span>
        </div>
      </section>

      <section id="donor-profile-personal" className="card">
        <header id="donor-profile-personal-title">Personal details</header>

        <div id="donor-profile-personal-grid">
          <span id="donor-profile-age" className="row row-between">
            <span className="chip">Age</span>
            <span>{age}</span>
          </span>
          <span id="donor-profile-sex" className="row row-between">
            <span className="chip">Sex</span>
            <span>{donor.sex}</span>
          </span>
          <span id="donor-profile-address" className="row row-between">
            <span className="chip">Address</span>
            <span>
              {donor.address}, {donor.city}
            </span>
          </span>
          <span id="donor-profile-email" className="row row-between">
            <span className="chip">Email</span>
            <span>{donor.email || '—'}</span>
          </span>
        </div>

        <div id="donor-profile-contact-row" className="row row-between" data-revealed={revealed}>
          <span id="donor-profile-contact-label" className="chip">
            Contact
          </span>
          <span id="donor-profile-contact">{revealed ? donor.contact : donor.masked}</span>

          {revealed ? (
            <span id="donor-reveal-reason" className="badge" data-reason-logged="true">
              Revealed — {revealReason}
            </span>
          ) : (
            <button id="donor-reveal-btn" className="btn" type="button" onClick={onOpenReveal}>
              Reveal contact
            </button>
          )}
        </div>
      </section>

      <section id="donor-profile-eligibility" className="card">
        <header id="donor-profile-eligibility-title">Eligibility</header>

        <div id="donor-profile-eligibility-checklist">
          {checklist.map((item) => (
            <div key={item.id} id={`donor-profile-check-${item.id}`} className="row row-between" data-state={item.state}>
              <span className="row">
                <span>[icon]</span>
                <span>{item.label}</span>
              </span>
              <span className="badge" data-state={item.state}>
                {item.state}
              </span>
              <span className="pill">{item.note}</span>
            </div>
          ))}
        </div>

        <div id="donor-profile-eligibility-timeline">
          <header id="donor-profile-eligibility-timeline-title">Next eligible by donation type</header>

          {eligibility.map((row) => (
            <div
              key={row.id}
              id={row.id}
              className="card row row-between"
              data-type={row.type}
              data-state={row.state}
            >
              <span className="row">
                <span className="chip" data-type={row.type}>
                  {row.typeLabel}
                </span>
                <span id={`${row.id}-interval`} className="pill">
                  every {row.intervalDays}d
                </span>
              </span>

              <span className="row">
                <span id={`${row.id}-last-donation`} className="chip">
                  last {row.lastDonation}
                </span>
                <span id={`${row.id}-next-eligible`} className="chip" data-state={row.state}>
                  next {row.nextEligible}
                </span>
                <span id={`${row.id}-days-until`} className="badge" data-state={row.state}>
                  {row.daysUntil <= 0 ? 'eligible now' : `in ${row.daysUntil}d`}
                </span>
              </span>

              <span id={`${row.id}-reason`} className="pill">
                {row.reason || 'no deferral'}
              </span>
            </div>
          ))}
        </div>

        <div id="donor-profile-eligibility-types" className="row">
          {DONATION_TYPES.map((type) => (
            <span key={type.id} id={type.id} className="chip" data-type={type.value}>
              {type.label}
            </span>
          ))}
        </div>
      </section>

      <section id="donor-profile-history" className="card">
        <header id="donor-profile-history-title">Donation history</header>

        {history.length > 0 ? (
          <div id="donor-history-list">
            {history.map((entry) => (
              <div key={entry.id} id={entry.id} className="row row-between" data-type={entry.type}>
                <span className="row">
                  <span className="chip">{entry.date}</span>
                  <span className="chip" data-type={entry.type}>
                    {entry.typeLabel}
                  </span>
                </span>
                <span>{entry.site}</span>
                <span className="pill">{entry.staff}</span>
                <span className="badge">+{entry.points} pts</span>
              </div>
            ))}
          </div>
        ) : (
          <div id="donor-history-empty" className="card" data-state="empty">
            No donations recorded
          </div>
        )}
      </section>

      <section id="donor-profile-points" className="card">
        <header id="donor-profile-points-title">Points</header>

        <div id="donor-profile-points-summary" className="row">
          <span id="donor-points-balance" className="badge">
            Balance {points.balance}
          </span>
          <span id="donor-points-earned" className="chip">
            Earned {points.earned}
          </span>
          <span id="donor-points-redeemed" className="chip">
            Redeemed {points.redeemed}
          </span>
        </div>

        {points.ledger.length > 0 ? (
          <div id="donor-points-list">
            {points.ledger.map((entry) => (
              <div key={entry.id} id={entry.id} className="row row-between">
                <span className="chip">{entry.date}</span>
                <span>{entry.label}</span>
                <span className="badge" data-delta={entry.delta >= 0 ? 'positive' : 'negative'}>
                  {entry.delta >= 0 ? '+' : ''}
                  {entry.delta}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div id="donor-points-empty" className="card" data-state="empty">
            No points activity
          </div>
        )}
      </section>

      <section id="donor-profile-comms" className="card">
        <header id="donor-profile-comms-title">Notifications and responses</header>

        {comms.length > 0 ? (
          <div id="donor-comms-list">
            {comms.map((entry) => (
              <div
                key={entry.id}
                id={entry.id}
                className="row row-between"
                data-channel={entry.channel}
                data-delivery={entry.status}
                data-response={entry.response}
              >
                <span className="chip">{entry.date}</span>
                <span>{entry.subject}</span>
                <span className="badge" data-delivery={entry.status}>
                  {entry.status}
                </span>
                <span className="chip" data-response={entry.response}>
                  {entry.response}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div id="donor-comms-empty" className="card" data-state="empty">
            No notifications sent
          </div>
        )}
      </section>

      <section id="donor-profile-notes" className="card">
        <header id="donor-profile-notes-title">Staff notes and deferral flags</header>

        <div id="donor-notes-flags" className="row">
          {deferrals.length > 0 ? (
            deferrals.map((flag) => (
              <span key={flag.id} id={flag.id} className="badge" data-status="deferred">
                {flag.reason} — {flag.since} to {flag.until}
              </span>
            ))
          ) : (
            <span id="donor-notes-flags-empty" className="pill" data-state="empty">
              No deferral flags
            </span>
          )}
        </div>

        <div id="donor-notes-list">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} id={note.id} className="row row-between">
                <span className="chip">{note.time}</span>
                <span>{note.text}</span>
                <span className="pill">{note.author}</span>
              </div>
            ))
          ) : (
            <div id="donor-notes-empty" className="card" data-state="empty">
              No staff notes
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default DonorProfile