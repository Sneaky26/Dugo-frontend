import { useCallback, useEffect, useMemo, useState } from 'react'
import { IMPORT_FIELDS, IMPORT_SAMPLE_HEADERS, IMPORT_SAMPLE_ROWS } from './donors-data.js'

/* Headers are matched case-insensitively, so "CP Number" and "cp number" both
   land on the mobile field. */
function detectMapping() {
  const mapping = {}
  for (const field of IMPORT_FIELDS) {
    const hit = IMPORT_SAMPLE_HEADERS.find((header) =>
      field.matches.some((match) => match.toLowerCase() === header.toLowerCase()),
    )
    mapping[field.value] = hit ?? ''
  }
  return mapping
}

function DonorImportModal({ open, onClose, onConfirm }) {
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState(detectMapping)

  const loadedFor = open ? 'open' : null
  const [loadedState, setLoadedState] = useState(null)

  if (loadedFor !== loadedState) {
    setLoadedState(loadedFor)
    setFileName('')
    setMapping(detectMapping())
  }

  /* A required field with no column mapped blocks the import. */
  const unmapped = useMemo(
    () => IMPORT_FIELDS.filter((field) => field.required && !mapping[field.value]),
    [mapping],
  )

  const rowErrors = useMemo(
    () => IMPORT_SAMPLE_ROWS.flatMap((row) => row.errors.map((error) => ({ ...error, row: row.row }))),
    [],
  )

  function updateMapping(field, header) {
    setMapping((current) => ({ ...current, [field]: header }))
  }

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
    if (unmapped.length > 0) return
    onConfirm({ fileName, mapping, rows: IMPORT_SAMPLE_ROWS.length })
    closeModal()
  }

  return (
    <>
      <div
        id="donor-import-backdrop"
        aria-hidden="true"
        data-state={open ? 'open' : 'closed'}
        onClick={closeModal}
      />

      <div
        id="donor-import-modal"
        data-state={open ? 'open' : 'closed'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donor-import-title"
      >
        <header id="donor-import-header" className="row row-between">
          <span id="donor-import-title">Import donors from CSV</span>
          <button id="donor-import-close-btn" className="btn" type="button" onClick={closeModal}>
            Close
          </button>
        </header>

        <section id="donor-import-upload" className="card">
          <header id="donor-import-upload-title">1 — Upload</header>

          <div className="field">
            <label htmlFor="donor-import-file">
              <span>CSV file</span>
              <input
                id="donor-import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
              />
            </label>
          </div>

          <span id="donor-import-file-name" className="pill" data-state={fileName ? 'loaded' : 'empty'}>
            {fileName || 'No file selected'}
          </span>
        </section>

        <section id="donor-import-mapping" className="card">
          <header id="donor-import-mapping-title">2 — Column mapping</header>

          <table className="table">
            <thead>
              <tr>
                <th scope="col">Donor field</th>
                <th scope="col">Required</th>
                <th scope="col">CSV column</th>
              </tr>
            </thead>
            <tbody>
              {IMPORT_FIELDS.map((field) => (
                <tr key={field.id} id={field.id} data-mapped={Boolean(mapping[field.value])}>
                  <td>{field.label}</td>
                  <td data-required={field.required}>{field.required ? 'yes' : 'no'}</td>
                  <td>
                    <div className="field">
                      <label className="sr-only" htmlFor={`donor-import-map-${field.value}`}>
                        CSV column for {field.label}
                      </label>
                      <select
                        id={`donor-import-map-${field.value}`}
                        value={mapping[field.value]}
                        onChange={(event) => updateMapping(field.value, event.target.value)}
                      >
                        <option value="">Not mapped</option>
                        {IMPORT_SAMPLE_HEADERS.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="donor-import-preview" className="card">
          <header id="donor-import-preview-title" className="row row-between">
            <span>3 — Preview</span>
            <span id="donor-import-preview-count" className="badge">
              {IMPORT_SAMPLE_ROWS.length} rows
            </span>
          </header>

          <table className="table">
            <thead>
              <tr>
                <th scope="col">Row</th>
                <th scope="col">Name</th>
                <th scope="col">Birthdate</th>
                <th scope="col">Sex</th>
                <th scope="col">Blood type</th>
                <th scope="col">Mobile</th>
                <th scope="col">Consent</th>
              </tr>
            </thead>
            <tbody>
              {IMPORT_SAMPLE_ROWS.map((row) => (
                <tr
                  key={row.row}
                  id={`donor-import-row-${row.row}`}
                  data-state={row.errors.length > 0 ? 'error' : 'ok'}
                >
                  <td>{row.row}</td>
                  <td>{row.name}</td>
                  <td>{row.birthdate || '—'}</td>
                  <td>{row.sex}</td>
                  <td data-blood-type={row.bloodType}>{row.bloodType}</td>
                  <td>{row.contact}</td>
                  <td data-consent={row.consent}>{row.consent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="donor-import-errors" className="card" data-state="error" data-count={rowErrors.length + unmapped.length}>
          <header id="donor-import-errors-title">4 — Errors</header>

          {unmapped.map((field) => (
            <span key={`unmapped-${field.id}`} id={`donor-import-error-unmapped-${field.value}`} className="badge" data-field={field.value}>
              {field.label} is not mapped to a column
            </span>
          ))}

          {rowErrors.map((error) => (
            <span key={`row-${error.row}-${error.field}`} id={`donor-import-error-row-${error.row}-${error.field}`} className="badge" data-field={error.field}>
              Row {error.row}: {error.message}
            </span>
          ))}

          {unmapped.length === 0 && rowErrors.length === 0 && (
            <span id="donor-import-errors-empty" className="pill" data-state="ok">
              No errors — ready to import
            </span>
          )}
        </section>

        <div id="donor-import-actions" className="row">
          <button
            id="donor-import-confirm-btn"
            className="btn"
            type="button"
            disabled={unmapped.length > 0}
            onClick={confirm}
          >
            Import {IMPORT_SAMPLE_ROWS.length} donors
          </button>
          <button id="donor-import-cancel-btn" className="btn" type="button" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

export default DonorImportModal