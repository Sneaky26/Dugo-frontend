import { CURRENT_USER, LAST_EDITED } from './settings-data.js'

/* Every section shares this shell so the four things a section must always carry
   cannot drift apart between ten sections:

     #{section}-form        the form itself
     #{section}-reset-btn   "Reset to default" link
     #{section}-last-edited who changed it last, and when
     #settings-save-bar     the sticky save bar (save + discard)

   Only one section renders at a time, so the shared save-bar id is unique in the
   document even though every section owns a copy of it. */
export default function SettingsSection({
  id,
  title,
  description,
  edited,
  dirty,
  onReset,
  onSave,
  onDiscard,
  children,
}) {
  const stamp = edited ?? LAST_EDITED[id] ?? { by: CURRENT_USER, at: '—' }

  return (
    <form
      id={`settings-${id}-form`}
      className="card"
      data-section={id}
      data-dirty={dirty ? 'true' : 'false'}
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <header className="row row-between">
        <div>
          <h2 id={`settings-${id}-title`}>{title}</h2>
          {description ? <p id={`settings-${id}-description`} className="muted">{description}</p> : null}
        </div>

        <div className="row">
          <p id={`settings-${id}-last-edited`} data-edited-by={stamp.by} data-edited-at={stamp.at}>
            Last edited by {stamp.by} on {stamp.at}
          </p>
          <a
            id={`settings-${id}-reset-btn`}
            href="#settings-content"
            data-action="reset"
            onClick={(event) => {
              event.preventDefault()
              onReset()
            }}
          >
            Reset to default
          </a>
        </div>
      </header>

      {children}

      {/* The save bar belongs at the end of the section so it reads as the last
          thing a user reaches. The screen ships unstyled, so stickiness is marked
          with data-sticky and left to the stylesheet rather than inline styles. */}
      <div
        id="settings-save-bar"
        data-section={id}
        data-dirty={dirty ? 'true' : 'false'}
        data-sticky="true"
      >
        <button
          id="settings-save-btn"
          className="btn"
          type="submit"
          disabled={!dirty}
          data-dirty={dirty ? 'true' : 'false'}
        >
          Save changes
        </button>
        <button id="settings-discard-btn" className="btn" type="button" disabled={!dirty} onClick={onDiscard}>
          Discard changes
        </button>
        <p id="settings-save-status" data-dirty={dirty ? 'true' : 'false'}>
          {dirty ? 'Unsaved changes in this section.' : 'Saved. No changes to write.'}
        </p>
      </div>
    </form>
  )
}

/* Number, text and textarea fields all follow the same label/field pairing the rest
   of the app uses, so a section reads like the forms already on the other screens. */
export function TextField({ id, label, value, onChange, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        <input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...rest} />
      </label>
    </div>
  )
}

export function NumberField({ id, label, value, onChange, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          {...rest}
        />
      </label>
    </div>
  )
}

export function AreaField({ id, label, value, onChange, rows = 4, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        <textarea id={id} value={value} rows={rows} onChange={(event) => onChange(event.target.value)} {...rest} />
      </label>
    </div>
  )
}

export function ToggleField({ id, label, checked, onChange, hint }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      </label>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  )
}

export function SelectField({ id, label, value, options, onChange, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}