import { useCallback, useEffect, useState } from 'react'
import { buildDonorProfile, BLOOD_TYPES, SEXES } from './donors-data.js'

const VALIDATION_FIELDS = [
  { field: 'name', label: 'Full name' },
  { field: 'birthdate', label: 'Birthdate' },
  { field: 'sex', label: 'Sex' },
  { field: 'bloodType', label: 'Blood type' },
  { field: 'contact', label: 'Mobile number' },
  { field: 'consent', label: 'Consent' },
]

function emptyForm() {
  return {
    name: '',
    birthdate: '',
    sex: '',
    bloodType: '',
    contact: '',
    email: '',
    address: '',
    consent: false,
  }
}

function validate(form) {
  return VALIDATION_FIELDS.filter(({ field }) => {
    const value = form[field]
    if (field === 'consent') return !value
    return !value || !String(value).trim()
  })
}

function DonorFormDrawer({ open, donorId, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState([])

  /* Edit opens on the donor's record; add opens blank. Editing the donor that is
     already loaded is a no-op so reopening does not discard staff input. */
  const loadedId = open ? donorId ?? 'new' : null
  const [loadedFor, setLoadedFor] = useState(null)

  if (loadedId !== loadedFor) {
    const profile = donorId ? buildDonorProfile(donorId) : null
    setLoadedFor(loadedId)
    setErrors([])
    setForm(
      profile
        ? {
            name: profile.donor.name,
            birthdate: profile.donor.birthdate,
            sex: profile.donor.sex,
            bloodType: profile.donor.bloodType,
            contact: profile.donor.contact,
            email: profile.donor.email,
            address: `${profile.donor.address}, ${profile.donor.city}`,
            consent: true,
          }
        : emptyForm(),
    )
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const closeDrawer = useCallback(() => {
    setErrors([])
    onClose()
  }, [onClose])

  /* Escape closes the drawer and the page behind it cannot scroll while open. */
  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') closeDrawer()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, closeDrawer])

  function handleSubmit() {
    const found = validate(form)
    setErrors(found)
    if (found.length > 0) return
    onSave({ ...form, donorId: donorId ?? null })
    closeDrawer()
  }

  return (
    <>
      <div
        id="donor-form-backdrop"
        aria-hidden="true"
        data-state={open ? 'open' : 'closed'}
        onClick={closeDrawer}
      />

      <div
        id="donor-form-drawer"
        data-state={open ? 'open' : 'closed'}
        data-mode={donorId ? 'edit' : 'add'}
        data-donor-id={donorId ?? 'new'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donor-form-title"
      >
        <header id="donor-form-header" className="row row-between">
          <span id="donor-form-title">{donorId ? `Edit ${donorId}` : 'Add donor'}</span>
          <button id="donor-form-close-btn" className="btn" type="button" onClick={closeDrawer}>
            Close
          </button>
        </header>

        <div id="donor-form-fields" className="field">
          <label htmlFor="donor-form-name">
            <span>Full name</span>
            <input
              id="donor-form-name"
              type="text"
              placeholder="e.g. Josefina Dela Cruz"
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
            />
          </label>
        </div>

        <div id="donor-form-grid">
          <div className="field">
            <label htmlFor="donor-form-birthdate">
              <span>Birthdate</span>
              <input
                id="donor-form-birthdate"
                type="date"
                value={form.birthdate}
                onChange={(event) => updateForm('birthdate', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label htmlFor="donor-form-sex">
              <span>Sex</span>
              <select
                id="donor-form-sex"
                value={form.sex}
                onChange={(event) => updateForm('sex', event.target.value)}
              >
                <option value="">Select sex</option>
                {SEXES.map((sex) => (
                  <option key={sex} value={sex}>
                    {sex}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field">
            <label htmlFor="donor-form-blood-type">
              <span>Blood type</span>
              <select
                id="donor-form-blood-type"
                value={form.bloodType}
                onChange={(event) => updateForm('bloodType', event.target.value)}
              >
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field">
            <label htmlFor="donor-form-contact">
              <span>Mobile number</span>
              <input
                id="donor-form-contact"
                type="tel"
                placeholder="+63 917 555 0142"
                value={form.contact}
                onChange={(event) => updateForm('contact', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label htmlFor="donor-form-email">
              <span>Email (optional)</span>
              <input
                id="donor-form-email"
                type="email"
                placeholder="name@example.ph"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label htmlFor="donor-form-address">
              <span>Address (optional)</span>
              <input
                id="donor-form-address"
                type="text"
                placeholder="Barangay, City"
                value={form.address}
                onChange={(event) => updateForm('address', event.target.value)}
              />
            </label>
          </div>
        </div>

        <label id="donor-form-consent" className="row" data-state={form.consent ? 'on' : 'off'}>
          <input
            id="donor-form-consent-input"
            type="checkbox"
            checked={form.consent}
            onChange={(event) => updateForm('consent', event.target.checked)}
          />
          <span>Signed consent on file</span>
        </label>

        {errors.length > 0 && (
          <div id="donor-form-errors" className="card" data-state="error" data-count={errors.length}>
            {errors.map(({ field, label }) => (
              <span key={field} id={`donor-form-error-${field}`} className="badge" data-field={field}>
                {label} is required
              </span>
            ))}
          </div>
        )}

        <div id="donor-form-actions" className="row">
          <button id="donor-form-save-btn" className="btn" type="button" onClick={handleSubmit}>
            {donorId ? 'Save changes' : 'Add donor'}
          </button>
          <button id="donor-form-cancel-btn" className="btn" type="button" onClick={closeDrawer}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

export default DonorFormDrawer