/* The ten settings sections. Each one owns its draft slice, renders the shared
   SettingsSection shell, and writes through `onChange(patch)`.

   Field ids are `settings-<section>-<name>`, and every row, cell, tab and toggle
   carries an id too, so a spec that names one element can be checked without
   counting elements. */

import { useState } from 'react'
import SettingsSection, {
  AreaField,
  NumberField,
  SelectField,
  TextField,
  ToggleField,
} from './SettingsSection.jsx'
import {
  ALERT_CHANNELS,
  BLOOD_TYPES,
  CHANNELS,
  COMPONENTS,
  DONATION_TYPES,
  PERMISSIONS,
  ROLES,
  TEMPLATE_EVENTS,
  TEMPLATE_VARIABLES,
  nextInviteId,
  renderTemplate,
  channelUsage,
} from './settings-data.js'

/* ------------------------------------------------------------- facility --- */
export function FacilitySection(props) {
  const { draft, onChange } = props

  return (
    <SettingsSection
      {...props}
      id="facility"
      title="Facility"
      description="The chapter name, address and hours printed on requests, messages and reports."
    >
      <div id="settings-facility-fields" className="row">
        <TextField
          id="settings-facility-name"
          label="Facility name"
          value={draft.name}
          onChange={(value) => onChange({ ...draft, name: value })}
        />
        <TextField
          id="settings-facility-chapter"
          label="Chapter"
          value={draft.chapter}
          onChange={(value) => onChange({ ...draft, chapter: value })}
        />
        <AreaField
          id="settings-facility-address"
          label="Address"
          rows={2}
          value={draft.address}
          onChange={(value) => onChange({ ...draft, address: value })}
        />
        <TextField
          id="settings-facility-hours"
          label="Service hours"
          value={draft.hours}
          onChange={(value) => onChange({ ...draft, hours: value })}
        />
        <TextField
          id="settings-facility-contact"
          label="Published contact"
          value={draft.contact}
          onChange={(value) => onChange({ ...draft, contact: value })}
        />
        <TextField
          id="settings-facility-licence"
          label="DOH licence number"
          value={draft.licence}
          onChange={(value) => onChange({ ...draft, licence: value })}
        />
      </div>

      <p id="settings-facility-summary">
        {draft.name} · {draft.chapter} · {draft.address} · {draft.hours}
      </p>
    </SettingsSection>
  )
}

/* ---------------------------------------------------------------- staff --- */
export function StaffSection(props) {
  const { draft, onChange } = props
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState({ email: '', role: ROLES[1].value })

  function setUser(userId, patch) {
    onChange({ ...draft, users: draft.users.map((user) => (user.id === userId ? { ...user, ...patch } : user)) })
  }

  function setPermission(permission, role, allowed) {
    onChange({
      ...draft,
      permissions: { ...draft.permissions, [role]: { ...draft.permissions[role], [permission]: allowed } },
    })
  }

  function revokeInvite(inviteId) {
    onChange({
      ...draft,
      invites: draft.invites.map((entry) => (entry.id === inviteId ? { ...entry, status: 'revoked' } : entry)),
    })
  }

  function sendInvite() {
    if (!invite.email) return

    onChange({
      ...draft,
      invites: [
        ...draft.invites,
        {
          id: nextInviteId(draft.invites),
          email: invite.email,
          role: invite.role,
          sent: '2024-05-14',
          status: 'pending',
        },
      ],
    })
    setInvite({ email: '', role: ROLES[1].value })
    setInviteOpen(false)
  }

  return (
    <SettingsSection {...props} id="staff" title="Staff & access" description="Who can sign in, and what each role may do.">
      <div className="card" id="settings-staff-table" data-count={draft.users.length}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Email</th>
              <th scope="col">Status</th>
              <th scope="col">Last active</th>
              <th scope="col">2FA</th>
            </tr>
          </thead>
          <tbody>
            {draft.users.map((user) => (
              <tr key={user.id} id={user.id} data-role={user.role} data-status={user.status}>
                <th scope="row">
                  {user.name}
                  <span className="muted"> {user.fullName}</span>
                </th>
                <td>
                  <select
                    id={`settings-staff-role-${user.id.replace('settings-staff-user-', '')}`}
                    value={user.role}
                    onChange={(event) => setUser(user.id, { role: event.target.value })}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className="badge">{user.status}</span>
                </td>
                <td>{user.lastActive.replace('T', ' ')}</td>
                <td>
                  <input
                    id={`settings-staff-2fa-${user.id.replace('settings-staff-user-', '')}`}
                    type="checkbox"
                    checked={user.twoFactor}
                    onChange={(event) => setUser(user.id, { twoFactor: event.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" id="settings-staff-permissions" data-roles={ROLES.length} data-permissions={PERMISSIONS.length}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Capability</th>
              {ROLES.map((role) => (
                <th key={role.value} scope="col" data-role={role.value}>
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((permission) => (
              <tr key={permission.value} id={`settings-staff-permission-row-${permission.value}`}>
                <th scope="row">{permission.label}</th>
                {ROLES.map((role) => (
                  <td key={role.value} data-allowed={draft.permissions[role.value][permission.value] ? 'true' : 'false'}>
                    <input
                      id={`settings-staff-permission-${permission.value}-${role.value}`}
                      type="checkbox"
                      checked={draft.permissions[role.value][permission.value]}
                      onChange={(event) => setPermission(permission.value, role.value, event.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="settings-staff-invites" className="card" data-count={draft.invites.length}>
        <h3>Pending invites</h3>
        {draft.invites.length === 0 ? (
          <p id="settings-staff-invites-empty" className="muted">
            No invites outstanding.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Sent</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draft.invites.map((entry) => (
                <tr key={entry.id} id={entry.id} data-status={entry.status}>
                  <th scope="row">{entry.email}</th>
                  <td>{ROLES.find((role) => role.value === entry.role)?.label ?? entry.role}</td>
                  <td>{entry.sent}</td>
                  <td>{entry.status}</td>
                  <td>
                    <button
                      id={`settings-staff-invite-revoke-${entry.id.replace('settings-staff-invite-', '')}`}
                      className="btn"
                      type="button"
                      disabled={entry.status !== 'pending'}
                      onClick={() => revokeInvite(entry.id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        id="settings-staff-invite-btn"
        className="btn"
        type="button"
        aria-expanded={inviteOpen}
        onClick={() => setInviteOpen((open) => !open)}
      >
        Invite a user
      </button>

      <div id="settings-staff-invite-drawer" className="card" data-state={inviteOpen ? 'open' : 'closed'}>
        <h3 id="settings-staff-invite-title">Invite a user</h3>
        {inviteOpen ? (
          <>
            <TextField
              id="settings-staff-invite-email"
              label="Email address"
              type="email"
              value={invite.email}
              onChange={(value) => setInvite((current) => ({ ...current, email: value }))}
            />
            <SelectField
              id="settings-staff-invite-role"
              label="Role"
              value={invite.role}
              options={ROLES.map((role) => ({ value: role.value, label: role.label }))}
              onChange={(value) => setInvite((current) => ({ ...current, role: value }))}
            />
            <button id="settings-staff-invite-send-btn" className="btn" type="button" onClick={sendInvite}>
              Send invite
            </button>
          </>
        ) : (
          <p id="settings-staff-invite-empty" className="muted">
            Closed. Use Invite a user to add a coordinator or a second operator.
          </p>
        )}
      </div>
    </SettingsSection>
  )
}

/* -------------------------------------------------------- compatibility --- */
export function CompatibilitySection(props) {
  const { draft, onChange } = props

  function setCell(component, donor, recipient, allowed) {
    onChange({
      ...draft,
      grid: {
        ...draft.grid,
        [component]: {
          ...draft.grid[component],
          [recipient]: { ...draft.grid[component][recipient], [donor]: allowed },
        },
      },
    })
  }

  return (
    <SettingsSection
      {...props}
      id="compatibility"
      title="Blood compatibility"
      description="Which donor type may give which component to which recipient type."
    >
      <p id="settings-compatibility-warning" data-high-impact="true">
        High impact. Saving this section changes which donors the matcher may invite. You will be asked to
        confirm before it is written.
      </p>

      {COMPONENTS.map((component) => (
        <div key={component.value} id={`settings-compatibility-grid-${component.value}`} className="card" data-component={component.value}>
          <h3>{component.label}</h3>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Donor \ Recipient</th>
                {BLOOD_TYPES.map((recipient) => (
                  <th key={recipient} scope="col">
                    {recipient}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_TYPES.map((donor) => {
                const allowed = BLOOD_TYPES.filter((recipient) => draft.grid[component.value][recipient][donor])

                return (
                  <tr key={donor} id={`settings-compatibility-row-${component.value}-${donor}`} data-allowed={allowed.join(' ')}>
                    <th scope="row">{donor}</th>
                    {BLOOD_TYPES.map((recipient) => (
                      <td key={recipient} data-allowed={draft.grid[component.value][recipient][donor] ? 'true' : 'false'}>
                        <input
                          id={`settings-compatibility-cell-${component.value}-${donor}-${recipient}`}
                          type="checkbox"
                          checked={draft.grid[component.value][recipient][donor]}
                          onChange={(event) => setCell(component.value, donor, recipient, event.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      <ToggleField
        id="settings-compatibility-fallback-toggle"
        label="Allow fallback tiers"
        checked={draft.fallbackEnabled}
        onChange={(value) => onChange({ ...draft, fallbackEnabled: value })}
        hint="Fallback tiers widen the search past exact compatibility. Each step is logged."
      />
      <ToggleField
        id="settings-compatibility-emergency-toggle"
        label="Allow emergency release"
        checked={draft.emergencyRelease}
        onChange={(value) => onChange({ ...draft, emergencyRelease: value })}
        hint="A physician may release an incompatible unit with a recorded reason."
      />
      <ToggleField
        id="settings-compatibility-negative-first-toggle"
        label="Prefer Rh-negative platelets"
        checked={draft.negativeFirst}
        onChange={(value) => onChange({ ...draft, negativeFirst: value })}
      />

      <div id="settings-compatibility-reasons" className="card">
        <h3>Emergency release reasons</h3>
        <ul>
          {draft.emergencyReasons.map((reason, index) => (
            <li key={reason} id={`settings-compatibility-reason-${index + 1}`}>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </SettingsSection>
  )
}

/* ---------------------------------------------------------- eligibility --- */
export function EligibilitySection(props) {
  const { draft, onChange } = props

  function setScreening(key, field, value) {
    onChange({ ...draft, screening: { ...draft.screening, [key]: { ...draft.screening[key], [field]: value } } })
  }

  function toggleReason(value, enabled) {
    onChange({ ...draft, reasons: draft.reasons.map((reason) => (reason.value === value ? { ...reason, enabled } : reason)) })
  }

  return (
    <SettingsSection
      {...props}
      id="eligibility"
      title="Donor eligibility"
      description="How often a donor may give, the age and weight limits, and the screening thresholds."
    >
      <p id="settings-eligibility-warning" data-high-impact="true">
        High impact. Saving this section changes who the donation screen will accept. You will be asked to
        confirm before it is written.
      </p>

      <div id="settings-eligibility-intervals" className="row">
        {DONATION_TYPES.map((type) => (
          <NumberField
            key={type.value}
            id={`settings-eligibility-interval-${type.value}`}
            label={`${type.label} interval (days)`}
            min={1}
            max={365}
            value={draft.intervals[type.value]}
            onChange={(value) => onChange({ ...draft, intervals: { ...draft.intervals, [type.value]: value } })}
          />
        ))}
      </div>

      <div id="settings-eligibility-limits" className="row">
        <NumberField
          id="settings-eligibility-min-age"
          label="Minimum age"
          min={16}
          max={25}
          value={draft.minAge}
          onChange={(value) => onChange({ ...draft, minAge: value })}
        />
        <NumberField
          id="settings-eligibility-max-age"
          label="Maximum age"
          min={50}
          max={75}
          value={draft.maxAge}
          onChange={(value) => onChange({ ...draft, maxAge: value })}
        />
        <NumberField
          id="settings-eligibility-min-weight"
          label="Minimum weight (kg)"
          min={40}
          max={70}
          value={draft.minWeight}
          onChange={(value) => onChange({ ...draft, minWeight: value })}
        />
        <NumberField
          id="settings-eligibility-max-units"
          label="Maximum units per day"
          min={1}
          max={4}
          value={draft.maxUnitsPerDay}
          onChange={(value) => onChange({ ...draft, maxUnitsPerDay: value })}
        />
      </div>

      <div id="settings-eligibility-screening" className="row">
        <NumberField
          id="settings-eligibility-hemoglobin-pass"
          label="Hemoglobin pass (g/dL)"
          min={10}
          max={14}
          step={0.1}
          value={draft.screening.hemoglobin.pass}
          onChange={(value) => setScreening('hemoglobin', 'pass', value)}
        />
        <NumberField
          id="settings-eligibility-hemoglobin-defer"
          label="Hemoglobin defer below (g/dL)"
          min={9}
          max={12}
          step={0.1}
          value={draft.screening.hemoglobin.defer}
          onChange={(value) => setScreening('hemoglobin', 'defer', value)}
        />
        <NumberField
          id="settings-eligibility-systolic-min"
          label="Systolic min (mmHg)"
          min={80}
          max={120}
          value={draft.screening.systolic.min}
          onChange={(value) => setScreening('systolic', 'min', value)}
        />
        <NumberField
          id="settings-eligibility-systolic-max"
          label="Systolic max (mmHg)"
          min={130}
          max={180}
          value={draft.screening.systolic.max}
          onChange={(value) => setScreening('systolic', 'max', value)}
        />
        <NumberField
          id="settings-eligibility-diastolic-min"
          label="Diastolic min (mmHg)"
          min={50}
          max={70}
          value={draft.screening.diastolic.min}
          onChange={(value) => setScreening('diastolic', 'min', value)}
        />
        <NumberField
          id="settings-eligibility-diastolic-max"
          label="Diastolic max (mmHg)"
          min={80}
          max={110}
          value={draft.screening.diastolic.max}
          onChange={(value) => setScreening('diastolic', 'max', value)}
        />
      </div>

      <div id="settings-eligibility-reasons" className="card">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Deferral reason</th>
              <th scope="col">Offered on the donation form</th>
            </tr>
          </thead>
          <tbody>
            {draft.reasons.map((reason) => (
              <tr key={reason.value} id={`settings-eligibility-reason-row-${reason.value}`} data-enabled={reason.enabled ? 'true' : 'false'}>
                <th scope="row">{reason.label}</th>
                <td>
                  <input
                    id={`settings-eligibility-reason-${reason.value}`}
                    type="checkbox"
                    checked={reason.enabled}
                    onChange={(event) => toggleReason(reason.value, event.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  )
}

/* ------------------------------------------------------ inventory rules --- */
export function InventoryRulesSection(props) {
  const { draft, onChange } = props

  function setThreshold(component, level, value) {
    onChange({
      ...draft,
      thresholds: {
        ...draft.thresholds,
        [component]: { ...draft.thresholds[component], [level]: value },
      },
    })
  }

  return (
    <SettingsSection
      {...props}
      id="inventory"
      title="Inventory rules"
      description="Shelf life, the expiry warning window, low-stock thresholds and how units are held."
    >
      <div id="settings-inventory-shelf-life" className="row">
        {COMPONENTS.map((component) => (
          <NumberField
            key={component.value}
            id={`settings-inventory-shelf-${component.value}`}
            label={`${component.label} shelf life (days)`}
            min={1}
            max={400}
            value={draft.shelfLife[component.value]}
            onChange={(value) => onChange({ ...draft, shelfLife: { ...draft.shelfLife, [component.value]: value } })}
          />
        ))}
      </div>

      <NumberField
        id="settings-inventory-expiring-days"
        label="Expiring-soon window (days)"
        min={1}
        max={30}
        value={draft.expiringSoonDays}
        onChange={(value) => onChange({ ...draft, expiringSoonDays: value })}
      />

      <div id="settings-inventory-thresholds" className="row">
        {COMPONENTS.map((component) => (
          <div key={component.value} className="row" id={`settings-inventory-threshold-${component.value}`}>
            <NumberField
              id={`settings-inventory-low-${component.value}`}
              label={`${component.label} low`}
              min={0}
              max={40}
              value={draft.thresholds[component.value].low}
              onChange={(value) => setThreshold(component.value, 'low', value)}
            />
            <NumberField
              id={`settings-inventory-critical-${component.value}`}
              label={`${component.label} critical`}
              min={0}
              max={20}
              value={draft.thresholds[component.value].critical}
              onChange={(value) => setThreshold(component.value, 'critical', value)}
            />
          </div>
        ))}
      </div>

      <NumberField
        id="settings-inventory-hold-minutes"
        label="Reservation hold time (minutes)"
        min={15}
        max={480}
        step={15}
        value={draft.holdMinutes}
        onChange={(value) => onChange({ ...draft, holdMinutes: value })}
      />

      <ToggleField
        id="settings-inventory-fefo-toggle"
        label="FEFO issuing"
        checked={draft.fefo}
        onChange={(value) => onChange({ ...draft, fefo: value })}
        hint="First expiry, first out: the issue drawer offers the earliest expiry first."
      />
      <ToggleField
        id="settings-inventory-quarantine-toggle"
        label="Quarantine new stock"
        checked={draft.quarantine}
        onChange={(value) => onChange({ ...draft, quarantine: value })}
        hint="Freshly collected units start in Quarantine until released."
      />
      <ToggleField
        id="settings-inventory-auto-discard-toggle"
        label="Auto-discard on expiry"
        checked={draft.autoDiscard}
        onChange={(value) => onChange({ ...draft, autoDiscard: value })}
        hint="Off by default: expired units are logged for discard rather than removed silently."
      />
    </SettingsSection>
  )
}

/* ------------------------------------------------------- matching rules --- */
export function MatchingSection(props) {
  const { draft, onChange } = props

  function setExpand(priority, value) {
    onChange({ ...draft, expandMinutes: { ...draft.expandMinutes, [priority]: value } })
  }

  return (
    <SettingsSection {...props} id="matching" title="Matching rules" description="How far a search reaches, how waves grow, and when it stops.">
      <div id="settings-matching-radius" className="row">
        <NumberField
          id="settings-matching-default-radius"
          label="Default radius (km)"
          min={1}
          max={50}
          value={draft.defaultRadiusKm}
          onChange={(value) => onChange({ ...draft, defaultRadiusKm: value })}
        />
        <NumberField
          id="settings-matching-max-radius"
          label="Maximum radius (km)"
          min={5}
          max={100}
          value={draft.maxRadiusKm}
          onChange={(value) => onChange({ ...draft, maxRadiusKm: value })}
        />
      </div>

      <NumberField
        id="settings-matching-wave-multiplier"
        label="Wave multiplier"
        min={1}
        max={4}
        value={draft.waveMultiplier}
        onChange={(value) => onChange({ ...draft, waveMultiplier: value })}
      />

      <div id="settings-matching-expand" className="row">
        {['urgent', 'stat', 'routine'].map((priority) => (
          <NumberField
            key={priority}
            id={`settings-matching-expand-${priority}`}
            label={`Minutes before auto-expand (${priority})`}
            min={1}
            max={60}
            value={draft.expandMinutes[priority]}
            onChange={(value) => setExpand(priority, value)}
          />
        ))}
      </div>

      <NumberField
        id="settings-matching-cooldown-minutes"
        label="Cooldown between waves (minutes)"
        min={0}
        max={60}
        value={draft.cooldownMinutes}
        onChange={(value) => onChange({ ...draft, cooldownMinutes: value })}
      />

      <ToggleField
        id="settings-matching-auto-stop-toggle"
        label="Auto-stop after the final wave"
        checked={draft.autoStop}
        onChange={(value) => onChange({ ...draft, autoStop: value })}
      />
      <NumberField
        id="settings-matching-auto-stop-waves"
        label="Waves before auto-stop"
        min={1}
        max={6}
        value={draft.autoStopAfterWaves}
        onChange={(value) => onChange({ ...draft, autoStopAfterWaves: value })}
      />

      <p id="settings-matching-summary">
        Search {draft.defaultRadiusKm}km, up to {draft.maxRadiusKm}km after {draft.expandMinutes.urgent}/
        {draft.expandMinutes.stat}/{draft.expandMinutes.routine} minutes by priority, waves x
        {draft.waveMultiplier}, {draft.cooldownMinutes} minute cooldown, auto-stop{' '}
        {draft.autoStop ? `after wave ${draft.autoStopAfterWaves}` : 'off'}.
      </p>
    </SettingsSection>
  )
}

/* ------------------------------------------------------------ templates --- */
export function TemplatesSection(props) {
  const { draft, onChange } = props
  const [channel, setChannel] = useState(draft.channel)
  const [component, setComponent] = useState(COMPONENTS[0].value)
  const [chipTarget, setChipTarget] = useState(TEMPLATE_EVENTS[0].value)
  const [sent, setSent] = useState(null)

  const activeChannel = CHANNELS.find((entry) => entry.value === channel) ?? CHANNELS[0]

  /* Bodies are stored event first, then channel, then component, the same order as
     MESSAGE_BODIES in the data module. */
  function bodyFor(eventId) {
    return draft.bodies[eventId]?.[channel]?.[component] ?? ''
  }

  function setBody(event, value) {
    onChange({
      ...draft,
      bodies: {
        ...draft.bodies,
        [event]: {
          ...draft.bodies[event],
          [channel]: { ...draft.bodies[event]?.[channel], [component]: value },
        },
      },
    })
  }

  function insertVariable(name) {
    setBody(chipTarget, `${bodyFor(chipTarget)}{{${name}}}`)
  }

  function sendTest() {
    const longest = TEMPLATE_EVENTS.reduce(
      (worst, event) => {
        const usage = channelUsage(bodyFor(event.value), channel)
        return usage.length > worst.usage.length ? { label: event.label, usage } : worst
      },
      { label: TEMPLATE_EVENTS[0].label, usage: channelUsage(bodyFor(TEMPLATE_EVENTS[0].value), channel) },
    )

    const failed = channel === 'sms' && longest.usage.over
    const delivered = failed && draft.fallbackToEmail ? 'email' : channel

    setSent({
      channel,
      fallback: failed && draft.fallbackToEmail,
      delivered,
      longest: longest.usage.length,
    })
  }

  return (
    <SettingsSection {...props} id="templates" title="Message templates" description="What each donor is told, per channel, per component.">
      <div id="settings-templates-channel-tabs" role="tablist" aria-label="Channel">
        {CHANNELS.map((entry) => (
          <button
            key={entry.value}
            id={entry.id}
            className="tab"
            type="button"
            role="tab"
            aria-selected={channel === entry.value}
            data-selected={channel === entry.value ? 'true' : 'false'}
            onClick={() => {
              setChannel(entry.value)
              setSent(null)
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div id="settings-templates-component-tabs" role="tablist" aria-label="Component">
        {COMPONENTS.map((entry) => (
          <button
            key={entry.value}
            id={`settings-templates-component-${entry.value}`}
            className="tab"
            type="button"
            role="tab"
            aria-selected={component === entry.value}
            data-selected={component === entry.value ? 'true' : 'false'}
            onClick={() => setComponent(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <p id="settings-templates-channel-note">
        Channel {activeChannel.label}
        {activeChannel.limit > 0 ? ` · ${activeChannel.limit} characters per segment` : ' · no length limit'} ·
        component {COMPONENTS.find((entry) => entry.value === component)?.label}
      </p>

      <div id="settings-templates-variables" className="row">
        <SelectField
          id="settings-templates-chip-target"
          label="Insert variables into"
          value={chipTarget}
          options={TEMPLATE_EVENTS.map((event) => ({ value: event.value, label: event.label }))}
          onChange={setChipTarget}
        />
        {TEMPLATE_VARIABLES.map((variable) => (
          <button
            key={variable.id}
            id={`settings-templates-variable-${variable.id}`}
            className="chip"
            type="button"
            title={variable.label}
            onClick={() => insertVariable(variable.id)}
          >
            {`{{${variable.id}}}`}
          </button>
        ))}
      </div>

      <div id="settings-templates-body-list">
        {TEMPLATE_EVENTS.map((event) => {
          const body = bodyFor(event.value)
          const usage = channelUsage(body, channel)

          return (
            <div key={event.value} id={`settings-templates-event-${event.value}`} className="card" data-event={event.value}>
              <h3>{event.label}</h3>
              <AreaField
                id={`settings-templates-body-${event.value}-${channel}`}
                label={`${activeChannel.label} body`}
                rows={channel === 'sms' ? 3 : 6}
                value={body}
                onChange={(value) => setBody(event.value, value)}
              />
              <p id={`settings-templates-char-count-${event.value}`} data-length={usage.length} data-limit={usage.limit} data-over={usage.over ? 'true' : 'false'}>
                {usage.length} / {usage.limit || '—'} characters
                {channel === 'sms' ? ` · ${usage.segments} segment${usage.segments === 1 ? '' : 's'}` : ''}
                {usage.over ? ' · over the single-segment limit' : ''}
              </p>
            </div>
          )
        })}
      </div>

      <div id="settings-templates-preview" className="card" data-channel={channel} data-component={component}>
        <h3>Live preview</h3>
        <p id="settings-templates-preview-to">To Ana Reyes · +63 917 ••• ••42 · a***@example.ph</p>
        {TEMPLATE_EVENTS.slice(0, 2).map((event) => (
          <div key={event.value} id={`settings-templates-preview-${event.value}`}>
            <h4>{event.label}</h4>
            <p>{renderTemplate(bodyFor(event.value))}</p>
          </div>
        ))}
      </div>

      <ToggleField
        id="settings-templates-fallback-toggle"
        label="Fall back to email when SMS fails"
        checked={draft.fallbackToEmail}
        onChange={(value) => onChange({ ...draft, fallbackToEmail: value })}
      />

      <button id="settings-templates-send-test-btn" className="btn" type="button" onClick={sendTest}>
        Send test
      </button>
      {sent ? (
        <p id="settings-templates-send-test-result" data-channel={sent.channel} data-fallback={sent.fallback ? 'true' : 'false'} data-delivered={sent.delivered}>
          {sent.fallback
            ? `Test sent by SMS, which failed on the longest body (${sent.longest} characters). Fell back to email.`
            : `Test sent by ${sent.channel}. Longest body ${sent.longest} characters.`}
        </p>
      ) : (
        <p id="settings-templates-send-test-empty" className="muted">
          No test sent yet.
        </p>
      )}
    </SettingsSection>
  )
}

/* -------------------------------------------------------------- rewards --- */
export function RewardsSection(props) {
  const { draft, onChange } = props

  function setCatalog(rewardId, patch) {
    onChange({ ...draft, catalog: draft.catalog.map((reward) => (reward.id === rewardId ? { ...reward, ...patch } : reward)) })
  }

  return (
    <SettingsSection {...props} id="rewards" title="Rewards" description="Points per donation type, bonus rules, expiry and the catalog.">
      <div id="settings-rewards-points" className="row">
        {DONATION_TYPES.map((type) => (
          <NumberField
            key={type.value}
            id={`settings-rewards-points-${type.value}`}
            label={`${type.label} points`}
            min={0}
            max={1000}
            step={10}
            value={draft.points[type.value]}
            onChange={(value) => onChange({ ...draft, points: { ...draft.points, [type.value]: value } })}
          />
        ))}
      </div>

      <div id="settings-rewards-bonuses" className="row">
        <NumberField
          id="settings-rewards-referral-bonus"
          label="Referral bonus (points)"
          min={0}
          max={500}
          step={10}
          value={draft.referralBonus}
          onChange={(value) => onChange({ ...draft, referralBonus: value })}
        />
        <NumberField
          id="settings-rewards-referral-threshold"
          label="Referral bonus after (donations)"
          min={1}
          max={12}
          value={draft.referralThreshold}
          onChange={(value) => onChange({ ...draft, referralThreshold: value })}
        />
        <NumberField
          id="settings-rewards-birthday-bonus"
          label="Birthday bonus (points)"
          min={0}
          max={500}
          step={5}
          value={draft.birthdayBonus}
          onChange={(value) => onChange({ ...draft, birthdayBonus: value })}
        />
      </div>

      <NumberField
        id="settings-rewards-expiry-months"
        label="Points expire after (months)"
        min={0}
        max={60}
        value={draft.expiryMonths}
        onChange={(value) => onChange({ ...draft, expiryMonths: value })}
      />

      <ToggleField
        id="settings-rewards-approval-toggle"
        label="Approve redemptions before pickup"
        checked={draft.requireApproval}
        onChange={(value) => onChange({ ...draft, requireApproval: value })}
      />

      <div id="settings-rewards-catalog" data-count={draft.catalog.length}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Reward</th>
              <th scope="col">Points</th>
              <th scope="col">Stock</th>
              <th scope="col">Available</th>
            </tr>
          </thead>
          <tbody>
            {draft.catalog.map((reward) => (
              <tr key={reward.id} id={`settings-rewards-catalog-row-${reward.id}`} data-active={reward.active ? 'true' : 'false'}>
                <th scope="row">
                  <input
                    id={`settings-rewards-catalog-name-${reward.id}`}
                    value={reward.name}
                    onChange={(event) => setCatalog(reward.id, { name: event.target.value })}
                  />
                </th>
                <td>
                  <input
                    id={`settings-rewards-catalog-points-${reward.id}`}
                    type="number"
                    min={0}
                    step={50}
                    value={reward.points}
                    onChange={(event) => setCatalog(reward.id, { points: Number(event.target.value) })}
                  />
                </td>
                <td>
                  <input
                    id={`settings-rewards-catalog-stock-${reward.id}`}
                    type="number"
                    min={0}
                    value={reward.stock}
                    onChange={(event) => setCatalog(reward.id, { stock: Number(event.target.value) })}
                  />
                </td>
                <td>
                  <input
                    id={`settings-rewards-catalog-active-${reward.id}`}
                    type="checkbox"
                    checked={reward.active}
                    onChange={(event) => setCatalog(reward.id, { active: event.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  )
}

/* -------------------------------------------------------------- privacy --- */
export function PrivacySection(props) {
  const { draft, onChange } = props

  function setRequest(requestId, status) {
    onChange({
      ...draft,
      requests: draft.requests.map((request) => (request.id === requestId ? { ...request, status } : request)),
    })
  }

  function toggleTwoFactorRole(role, enabled) {
    onChange({
      ...draft,
      twoFactorRoles: enabled ? [...draft.twoFactorRoles, role] : draft.twoFactorRoles.filter((entry) => entry !== role),
    })
  }

  return (
    <SettingsSection
      {...props}
      id="privacy"
      title="Privacy & access"
      description="Consent wording, retention, masking, session and two-factor rules, and data requests."
    >
      <AreaField
        id="settings-privacy-consent-text"
        label="Consent text"
        rows={5}
        value={draft.consentText}
        onChange={(value) => onChange({ ...draft, consentText: value })}
      />
      <p id="settings-privacy-consent-count">{draft.consentText.length} characters · shown on the donor registration form</p>

      <NumberField
        id="settings-privacy-retention-months"
        label="Retention period (months)"
        min={12}
        max={360}
        value={draft.retentionMonths}
        onChange={(value) => onChange({ ...draft, retentionMonths: value })}
      />

      <div id="settings-privacy-masking" className="row">
        <ToggleField
          id="settings-privacy-mask-contact"
          label="Mask contact numbers"
          checked={draft.maskContact}
          onChange={(value) => onChange({ ...draft, maskContact: value })}
        />
        <ToggleField
          id="settings-privacy-mask-email"
          label="Mask email addresses"
          checked={draft.maskEmail}
          onChange={(value) => onChange({ ...draft, maskEmail: value })}
        />
        <ToggleField
          id="settings-privacy-mask-address"
          label="Mask addresses"
          checked={draft.maskAddress}
          onChange={(value) => onChange({ ...draft, maskAddress: value })}
        />
        <ToggleField
          id="settings-privacy-mask-birthdate"
          label="Mask dates of birth"
          checked={draft.maskBirthdate}
          onChange={(value) => onChange({ ...draft, maskBirthdate: value })}
        />
      </div>

      <NumberField
        id="settings-privacy-session-timeout"
        label="Session timeout (minutes)"
        min={5}
        max={120}
        value={draft.sessionTimeoutMinutes}
        onChange={(value) => onChange({ ...draft, sessionTimeoutMinutes: value })}
      />

      <ToggleField
        id="settings-privacy-2fa-toggle"
        label="Require two-factor authentication"
        checked={draft.twoFactor}
        onChange={(value) => onChange({ ...draft, twoFactor: value })}
      />
      <div id="settings-privacy-2fa-roles" className="row">
        {ROLES.map((role) => (
          <div key={role.value} className="field">
            <label htmlFor={`settings-privacy-2fa-role-${role.value}`}>
              <span>{role.label}</span>
              <input
                id={`settings-privacy-2fa-role-${role.value}`}
                type="checkbox"
                checked={draft.twoFactorRoles.includes(role.value)}
                disabled={!draft.twoFactor}
                onChange={(event) => toggleTwoFactorRole(role.value, event.target.checked)}
              />
            </label>
          </div>
        ))}
      </div>

      <div id="settings-privacy-queue" className="card" data-count={draft.requests.length} data-open={draft.requests.filter((request) => request.status !== 'closed').length}>
        <h3>Data request queue</h3>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Kind</th>
              <th scope="col">Subject</th>
              <th scope="col">Requested</th>
              <th scope="col">Due</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {draft.requests.map((request) => (
              <tr key={request.id} id={`settings-privacy-queue-row-${request.id.replace('settings-privacy-request-', '')}`} data-status={request.status}>
                <th scope="row">{request.id.replace('settings-privacy-request-', 'PRIV-')}</th>
                <td>{request.kind}</td>
                <td>{request.subject}</td>
                <td>{request.requested}</td>
                <td>{request.due}</td>
                <td>
                  <span className="badge">{request.status}</span>
                </td>
                <td>
                  <button
                    id={`settings-privacy-queue-approve-${request.id.replace('settings-privacy-request-', '')}`}
                    className="btn"
                    type="button"
                    disabled={request.status === 'closed'}
                    onClick={() => setRequest(request.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    id={`settings-privacy-queue-deny-${request.id.replace('settings-privacy-request-', '')}`}
                    className="btn"
                    type="button"
                    disabled={request.status === 'closed'}
                    onClick={() => setRequest(request.id, 'denied')}
                  >
                    Deny
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  )
}

/* ---------------------------------------------------------- staff alerts --- */
export function StaffAlertsSection(props) {
  const { draft, onChange } = props

  function setChannel(eventId, channel, enabled) {
    onChange({
      ...draft,
      events: draft.events.map((event) =>
        event.id === eventId ? { ...event, channels: { ...event.channels, [channel]: enabled } } : event,
      ),
    })
  }

  return (
    <SettingsSection
      {...props}
      id="staff-alerts"
      title="Staff alerts"
      description="Which channel each operational event is announced on."
    >
      <div id="settings-staff-alerts-table" className="card" data-events={draft.events.length}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Event</th>
              {ALERT_CHANNELS.map((channel) => (
                <th key={channel.id} scope="col">
                  {channel.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.events.map((event) => {
              const on = ALERT_CHANNELS.filter((channel) => event.channels[channel.id])

              return (
                <tr key={event.id} id={`settings-staff-alerts-row-${event.id}`} data-channels={on.map((channel) => channel.id).join(' ')}>
                  <th scope="row">{event.label}</th>
                  {ALERT_CHANNELS.map((channel) => (
                    <td key={channel.id} data-on={event.channels[channel.id] ? 'true' : 'false'}>
                      <input
                        id={`settings-staff-alerts-${event.id}-${channel.id}`}
                        type="checkbox"
                        checked={event.channels[channel.id]}
                        onChange={(inputEvent) => setChannel(event.id, channel.id, inputEvent.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {draft.events.map((event) => (
        <p key={event.id} id={`settings-staff-alerts-summary-${event.id}`} data-count={ALERT_CHANNELS.filter((channel) => event.channels[channel.id]).length}>
          {event.label}: {ALERT_CHANNELS.filter((channel) => event.channels[channel.id]).map((channel) => channel.label).join(', ') || 'no channel'}
        </p>
      ))}
    </SettingsSection>
  )
}

/* The id -> component map the screen uses to pick a section. */
export const SECTION_COMPONENTS = {
  facility: FacilitySection,
  staff: StaffSection,
  compatibility: CompatibilitySection,
  eligibility: EligibilitySection,
  inventory: InventoryRulesSection,
  matching: MatchingSection,
  templates: TemplatesSection,
  rewards: RewardsSection,
  privacy: PrivacySection,
  'staff-alerts': StaffAlertsSection,
}