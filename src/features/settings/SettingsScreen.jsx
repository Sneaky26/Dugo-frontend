/* Settings screen: a left sub-nav of ten sections and one section rendered at a
   time in #settings-content.

   State is a pair per section - the saved value and the draft being edited - so
   switching sections never carries an unsaved edit into the next one. Saving a
   high-impact section (compatibility, eligibility) opens
   #confirm-high-impact-modal first and only writes on confirm. */

import { useState } from 'react'
import ConfirmHighImpactModal from './ConfirmHighImpactModal.jsx'
import { SECTION_COMPONENTS } from './settings-sections.jsx'
import data, { CURRENT_USER, NOW, clone, defaultFor, isDirty, isHighImpact, navIdFor } from './settings-data.js'

const { LAST_EDITED, SECTIONS } = data

function initialValues() {
  return Object.fromEntries(SECTIONS.map((section) => [section.id, defaultFor(section.id)]))
}

function initialDrafts() {
  return Object.fromEntries(SECTIONS.map((section) => [section.id, defaultFor(section.id)]))
}

export default function SettingsScreen() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const [values, setValues] = useState(initialValues)
  const [drafts, setDrafts] = useState(initialDrafts)
  const [edited, setEdited] = useState(() => ({ ...LAST_EDITED }))
  const [pending, setPending] = useState(null)

  const Section = SECTION_COMPONENTS[activeId]
  const label = SECTIONS.find((section) => section.id === activeId)?.label ?? activeId
  const draft = drafts[activeId]
  const saved = values[activeId]
  const dirty = isDirty(activeId, draft, saved)

  function change(patch) {
    setDrafts((current) => ({ ...current, [activeId]: patch }))
    setPending(null)
  }

  function save() {
    setValues((current) => ({ ...current, [activeId]: draft }))
    setEdited((current) => ({ ...current, [activeId]: { by: CURRENT_USER, at: NOW } }))
    setPending(null)
  }

  function requestSave() {
    if (!dirty) return

    if (isHighImpact(activeId)) {
      setPending({ sectionId: activeId, label, before: saved, after: draft })
      return
    }

    save()
  }

  function reset() {
    setDrafts((current) => ({ ...current, [activeId]: defaultFor(activeId) }))
    setPending(null)
  }

  function discard() {
    setDrafts((current) => ({ ...current, [activeId]: clone(values[activeId]) }))
    setPending(null)
  }

  return (
    <div id="settings-screen" data-active-section={activeId} data-dirty={dirty ? 'true' : 'false'}>
      <header className="row row-between">
        <h2 id="settings-title">Settings</h2>
        <p id="settings-signed-in" className="muted">
          Signed in as {CURRENT_USER}
        </p>
      </header>

      <div id="settings-layout" className="row">
        <nav id="settings-nav" aria-label="Settings sections" data-count={SECTIONS.length}>
          <ul>
            {SECTIONS.map((section) => {
              const sectionDirty = isDirty(section.id, drafts[section.id], values[section.id])

              return (
                <li key={section.id}>
                  <a
                    id={navIdFor(section.id)}
                    href="#settings-content"
                    aria-current={activeId === section.id ? 'page' : undefined}
                    data-active={activeId === section.id ? 'true' : 'false'}
                    data-dirty={sectionDirty ? 'true' : 'false'}
                    data-high-impact={isHighImpact(section.id) ? 'true' : 'false'}
                    onClick={(event) => {
                      event.preventDefault()
                      setActiveId(section.id)
                      setPending(null)
                    }}
                  >
                    {section.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <main id="settings-content" aria-live="polite">
          <Section
            draft={draft}
            saved={saved}
            dirty={dirty}
            edited={edited[activeId]}
            onChange={change}
            onReset={reset}
            onSave={requestSave}
            onDiscard={discard}
          />

          {pending ? (
            <ConfirmHighImpactModal
              sectionId={pending.sectionId}
              label={pending.label}
              before={pending.before}
              after={pending.after}
              onConfirm={save}
              onCancel={() => setPending(null)}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}