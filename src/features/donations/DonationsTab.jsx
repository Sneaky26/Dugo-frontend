/* ============================================================================
 * DONATIONS TAB — ID MAP
 * ----------------------------------------------------------------------------
 * #donations-table                the ledger of recorded collections
 *   thead: Date | Donation | Donor | Blood type | Type | Units | Points |
 *          Linked request | Site | Recorded by
 *   tr#donations-row-DON-1195     one row per collection, newest first
 *     td#donations-row-DON-1195-type      data-component=whole-blood
 *     td#donations-row-DON-1195-points    data-points=100
 *     td#donations-row-DON-1195-request   data-linked=yes|no
 * #donations-filters
 *   #donations-filter-type       whole-blood | platelets | plasma | all
 *   #donations-filter-date       all | today | 7-days | 30-days | 90-days
 *   #donations-filter-clear
 * #donations-pagination          #donations-pagination-info, -prev, -next,
 *                                #donations-pagination-page-N
 * #donations-by-type-chart       labelled box: collections and units per type
 *   .donations-by-type-bar        one per type, data-type, data-donations,
 *                                 data-units
 * #donations-empty               shown when the filters match nothing
 * ==========================================================================*/

import { useState } from 'react'
import { paginate } from '@/shared/utils/paginate.js'
import data, {
  buildDonationRows,
  buildDonationsByType,
} from './donations-rewards-data.js'

const { DATE_FILTERS, DEFAULT_FILTERS, DONATION_FLOW_TYPES, PAGINATION } = data

function DonationRow({ row }) {
  return (
    <tr id={row.rowId} data-donation={row.id} data-component={row.component}>
      <td>{row.date}</td>
      <td>{row.id}</td>
      <td>
        <span id={`${row.rowId}-donor`}>{row.donorName}</span>
        <span className="muted"> {row.donorId}</span>
      </td>
      <td data-blood-type={row.bloodType}>{row.bloodType}</td>
      <td id={`${row.rowId}-type`} data-component={row.component}>
        {row.flowLabel}
      </td>
      <td>{row.units}</td>
      <td id={`${row.rowId}-points`} data-points={row.pointsAwarded}>
        {row.pointsAwarded}
      </td>
      <td id={`${row.rowId}-request`} data-linked={row.linkedRequest ? 'yes' : 'no'}>
        {row.linkedRequestLabel ?? '—'}
      </td>
      <td>{row.site}</td>
      <td>{row.recordedBy}</td>
    </tr>
  )
}

/* Collections and units per donation type. Derived from the same ledger the table
   renders, so the chart cannot disagree with the rows above it. */
function ByTypeChart({ donations }) {
  const bars = buildDonationsByType(donations)
  const peak = Math.max(...bars.map((bar) => bar.donations), 1)

  return (
    <div id="donations-by-type-chart" className="card">
      <h2>Collections by type</h2>
      <div className="chart-box">
        <span>[chart]</span>
        <span>Collections and units by donation type</span>
      </div>
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="donations-by-type-bar"
          data-type={bar.type}
          data-donations={bar.donations}
          data-units={bar.units}
          style={{ '--bar-width': `${Math.round((bar.donations / peak) * 100)}%` }}
        >
          <span id={`${bar.id}-label`}>{bar.label}</span>
          <span id={`${bar.id}-value`}>
            {bar.donations} collections · {bar.units}u
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DonationsTab({ donations, onOpenConfirm }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const rows = buildDonationRows(donations, filters)
  const { pageSize } = PAGINATION
  const { rows: pageRows, pageCount, currentPage, firstRow, lastRow, total } = paginate(rows, page, pageSize)
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  return (
    <section id="donations-panel">
      <div id="donations-toolbar" className="row row-between">
        <div className="row">
          <button id="donations-confirm-btn" className="btn" type="button" onClick={() => onOpenConfirm('whole-blood')}>
            <span>[icon]</span>
            <span>Confirm donation</span>
          </button>
        </div>
        <span id="donations-total" className="muted">
          {total} recorded collections
        </span>
      </div>

      <div id="donations-filters" className="row">
        <div className="field">
          <label>
            <span>Donation type</span>
            <select
              id="donations-filter-type"
              value={filters.type}
              onChange={(event) => updateFilter('type', event.target.value)}
            >
              <option value="all">All types</option>
              {DONATION_FLOW_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.flowLabel}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>Period</span>
            <select
              id="donations-filter-date"
              value={filters.date}
              onChange={(event) => updateFilter('date', event.target.value)}
            >
              {DATE_FILTERS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button id="donations-filter-clear" className="btn" type="button" disabled={!isFiltered} onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {pageRows.length > 0 ? (
        <table id="donations-table" className="table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Donation</th>
              <th scope="col">Donor</th>
              <th scope="col">Blood type</th>
              <th scope="col">Type</th>
              <th scope="col">Units</th>
              <th scope="col">Points</th>
              <th scope="col">Linked request</th>
              <th scope="col">Site</th>
              <th scope="col">Recorded by</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <DonationRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      ) : (
        <div id="donations-empty" className="card" data-state="empty">
          <span>No collections match these filters</span>
          <button id="donations-empty-clear-btn" className="btn" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <div id="donations-pagination" className="row row-between">
        <span id="donations-pagination-info">
          {firstRow}–{lastRow} of {total}
        </span>
        <div className="row">
          <button
            id="donations-pagination-prev"
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
              id={`donations-pagination-page-${pageNumber}`}
              className="btn"
              type="button"
              data-active={pageNumber === currentPage}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            id="donations-pagination-next"
            className="btn"
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <ByTypeChart donations={donations} />
    </section>
  )
}