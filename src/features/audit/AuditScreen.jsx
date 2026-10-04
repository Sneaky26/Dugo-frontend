/* ============================================================================
 * AUDIT TRAIL SCREEN — ID MAP
 * ----------------------------------------------------------------------------
 * #audit-screen                   the nav-audit screen
 *   #audit-filters
 *     #audit-filter-user           staff name | all
 *     #audit-filter-action         view | override | issue | edit | discard | all
 *     #audit-filter-record         donor | request | inventory | donation | all
 *     #audit-filter-date           24-hours | 7-days | 30-days | all
 *     #audit-filter-clear
 *   #audit-table                   timestamp | staff | role | action | record |
 *                                 details | IP/device
 *     #audit-row-AUD-1041          one row per entry, newest first
 *       #audit-row-AUD-1041-action    data-action-type, data-record-type
 *       #audit-row-AUD-1041-record    data-record-id, data-sensitive on reveals
 *       #audit-row-AUD-1041-view-btn  opens #audit-detail-drawer
 *     #audit-empty
 *     #audit-pagination            -info, -prev, -next, -page-N
 *   #audit-detail-drawer           before/after for the selected entry
 *     #audit-detail-drawer-header   title, -id and -close-btn
 *     #audit-detail-meta           staff, role, timestamp, IP and device
 *     #audit-detail-before         the field values before the action
 *     #audit-detail-after          the field values after it
 *     #audit-detail-change-N       one row per field, data-created on new fields
 *   #audit-export-btn
 *   #audit-privacy-note            RA 10173 note
 *
 * The drawer is mounted by the screen rather than by the shell's #overlay-root: it
 * reads one entry out of this screen's own state, the same way the confirmation
 * flow is mounted by the donations screen. It stays in the markup with
 * data-state="closed" when no entry is selected, so the id is always present.
 * ==========================================================================*/

import { useState } from 'react'
import { paginate } from '@/shared/utils/paginate.js'
import data, { buildEntries, buildEntryDetail, buildFilters } from './audit-data.js'

const { ACTION_TYPES, DATE_RANGES, DEFAULT_FILTERS, PAGINATION, PRIVACY_NOTE, RECORD_TYPES } = data

const FILTERS = buildFilters()

function AuditRow({ entry, onOpenDetail }) {
  return (
    <tr
      id={entry.rowId}
      data-entry={entry.id}
      data-action-type={entry.actionType}
      data-record-type={entry.recordType}
      data-sensitive={entry.sensitive}
    >
      <td data-timestamp={entry.at}>
        {entry.day} {entry.time}
      </td>
      <td data-user={entry.user}>{entry.user}</td>
      <td data-role={entry.role}>{entry.role}</td>
      <td id={`${entry.rowId}-action`} data-action-type={entry.actionType}>
        {entry.action}
      </td>
      <td id={`${entry.rowId}-record`} data-record-id={entry.recordId} data-record-type={entry.recordType}>
        {entry.recordLabel}
      </td>
      <td>{entry.details}</td>
      <td data-ip={entry.ip}>
        <span>{entry.ip}</span>
        <span className="muted"> {entry.device}</span>
      </td>
      <td>
        <button
          id={`${entry.rowId}-view-btn`}
          className="btn"
          type="button"
          onClick={() => onOpenDetail(entry.id)}
        >
          View
        </button>
      </td>
    </tr>
  )
}

export function AuditDetailDrawer({ detail, onClose }) {
  return (
    <>
      <div id="audit-detail-backdrop" data-state={detail ? 'open' : 'closed'} onClick={onClose} />

      <section
        id="audit-detail-drawer"
        data-state={detail ? 'open' : 'closed'}
        data-entry={detail?.id ?? 'none'}
        role="dialog"
        aria-labelledby="audit-detail-title"
      >
        <header id="audit-detail-drawer-header" className="row row-between">
          <span id="audit-detail-title">{detail ? detail.action : 'Audit entry'}</span>
          <span id="audit-detail-id" className="pill">
            {detail?.id ?? '—'}
          </span>
          <button id="audit-detail-close-btn" className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        {detail ? (
          <>
            <dl id="audit-detail-meta">
              <div id="audit-detail-field-staff">
                <dt>Staff</dt>
                <dd data-user={detail.user}>{detail.user}</dd>
              </div>
              <div id="audit-detail-field-role">
                <dt>Role</dt>
                <dd data-role={detail.role}>{detail.role}</dd>
              </div>
              <div id="audit-detail-field-at">
                <dt>Timestamp</dt>
                <dd data-timestamp={detail.at}>{detail.day} {detail.time}</dd>
              </div>
              <div id="audit-detail-field-record">
                <dt>Record</dt>
                <dd data-record-id={detail.recordId} data-record-type={detail.recordType}>
                  {detail.recordLabel}
                </dd>
              </div>
              <div id="audit-detail-field-origin">
                <dt>Origin</dt>
                <dd data-ip={detail.ip}>
                  {detail.ip} · {detail.device}
                </dd>
              </div>
            </dl>

            <div id="audit-detail-fields" className="card">
              <div id="audit-detail-before">
                <h3>Before</h3>
                {detail.changes
                  .filter((change) => change.before !== null)
                  .map((change) => (
                    <div key={change.id} id={`${change.id}-before`} data-field={change.field}>
                      <span className="chip">{change.field}</span>
                      <span>{change.before}</span>
                    </div>
                  ))}
              </div>

              <div id="audit-detail-after">
                <h3>After</h3>
                {detail.changes.map((change) => (
                  <div
                    key={change.id}
                    id={`${change.id}-after`}
                    data-field={change.field}
                    data-created={change.created}
                  >
                    <span className="chip">{change.field}</span>
                    <span>{change.after}</span>
                  </div>
                ))}
              </div>
            </div>

            {detail.sensitive ? (
              <p id="audit-detail-sensitive" data-sensitive="true">
                This entry records a contact reveal. Under RA 10173 the values below are visible to the
                medical director and administrators only.
              </p>
            ) : null}

            <p id="audit-detail-note" className="muted">
              {detail.details}
            </p>
          </>
        ) : (
          <p id="audit-detail-empty">Select an entry to see the values before and after the action.</p>
        )}
      </section>
    </>
  )
}

export default function AuditScreen() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [exported, setExported] = useState(false)

  const rows = buildEntries(filters)
  const { rows: pageRows, pageCount, currentPage, firstRow, lastRow, total } = paginate(rows, page, PAGINATION.pageSize)
  const detail = selectedId ? buildEntryDetail(selectedId) : null
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)
  const sensitiveCount = rows.filter((entry) => entry.sensitive).length

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  return (
    <div id="audit-screen">
      <div id="audit-filters" className="row">
        <div className="field">
          <label htmlFor="audit-filter-user">
            <span>User</span>
            <select
              id="audit-filter-user"
              value={filters.user}
              onChange={(event) => updateFilter('user', event.target.value)}
            >
              <option value="all">All users</option>
              {FILTERS.staff.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label htmlFor="audit-filter-action">
            <span>Action type</span>
            <select
              id="audit-filter-action"
              value={filters.action}
              onChange={(event) => updateFilter('action', event.target.value)}
            >
              <option value="all">All actions</option>
              {ACTION_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label htmlFor="audit-filter-record">
            <span>Record type</span>
            <select
              id="audit-filter-record"
              value={filters.record}
              onChange={(event) => updateFilter('record', event.target.value)}
            >
              <option value="all">All records</option>
              {RECORD_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label htmlFor="audit-filter-date">
            <span>Date range</span>
            <select
              id="audit-filter-date"
              value={filters.range}
              onChange={(event) => updateFilter('range', event.target.value)}
            >
              {DATE_RANGES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button id="audit-filter-clear" className="btn" type="button" disabled={!isFiltered} onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {pageRows.length > 0 ? (
        <table id="audit-table" className="table" data-count={total}>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Staff</th>
              <th scope="col">Role</th>
              <th scope="col">Action</th>
              <th scope="col">Record</th>
              <th scope="col">Details</th>
              <th scope="col">IP / device</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((entry) => (
              <AuditRow key={entry.id} entry={entry} onOpenDetail={setSelectedId} />
            ))}
          </tbody>
        </table>
      ) : (
        <div id="audit-empty" className="card" data-state="empty">
          <span>No log entries match these filters</span>
          <button id="audit-empty-clear-btn" className="btn" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <div id="audit-pagination" className="row row-between">
        <span id="audit-pagination-info">
          {firstRow}–{lastRow} of {total}
        </span>
        <div className="row">
          <button
            id="audit-pagination-prev"
            className="btn"
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              id={`audit-pagination-page-${pageNumber}`}
              className="btn"
              type="button"
              data-active={pageNumber === currentPage}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            id="audit-pagination-next"
            className="btn"
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <div id="audit-toolbar" className="row row-between">
        <button id="audit-export-btn" className="btn" type="button" disabled={total === 0} onClick={() => setExported(true)}>
          <span>[icon]</span>
          <span>Export log</span>
        </button>
        <span id="audit-export-status" className="muted" data-exported={exported}>
          {exported
            ? `Exported ${total} entries — masked contact values only.`
            : `${total} entries${sensitiveCount > 0 ? ` · ${sensitiveCount} marked sensitive` : ''}`}
        </span>
      </div>

      <div id="audit-privacy-note" className="card">
        <h2>{PRIVACY_NOTE.title}</h2>
        {PRIVACY_NOTE.lines.map((line, index) => (
          <p key={line} id={`audit-privacy-note-${index + 1}`}>
            {line}
          </p>
        ))}
      </div>

      <AuditDetailDrawer detail={detail} onClose={() => setSelectedId(null)} />
    </div>
  )
}