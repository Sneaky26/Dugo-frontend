import { useState } from 'react'
import data, {
  buildAlerts,
  buildRows,
  buildStockSummary,
  expiryState,
  matchesTab,
} from './inventory-data.js'
import { paginate } from '@/shared/utils/paginate.js'

const { BLOOD_TYPES, TABS, STATUSES, EXPIRY_WINDOWS, PAGINATION, DEFAULT_FILTERS, batchKey } = data

function ExpiryCell({ batch }) {
  const state = expiryState(batch)

  return (
    <span className="badge" data-expiry={state} data-days={batch.daysToExpiry}>
      {batch.expiry} ({batch.daysToExpiry}d)
    </span>
  )
}

function BatchRow({ batch, selected, onSelect, onOpenBatch, onProcess, onIssue, onDiscard }) {
  const canProcess = batch.component === 'whole-blood' && batch.status === 'Available'
  const canIssue = batch.status === 'Available'

  return (
    <tr
      id={batch.id}
      data-batch={batch.batch}
      data-blood-type={batch.bloodType}
      data-component={batch.component}
      data-status={batch.status}
      data-expiry={batch.expiryState}
      data-selected={selected}
    >
      <td>
        <label className="row">
          <input
            type="radio"
            name="inventory-selected-batch"
            checked={selected}
            onChange={() => onSelect(batch.batch)}
          />
          <span>{batch.batch}</span>
        </label>
      </td>
      <td data-blood-type={batch.bloodType}>{batch.bloodType}</td>
      <td>{batch.componentLabel}</td>
      <td>{batch.units}</td>
      <td>{batch.collected}</td>
      <td>
        <ExpiryCell batch={batch} />
      </td>
      <td data-status={batch.status}>{batch.status}</td>
      <td>{batch.reservedForLabel ?? '—'}</td>
      <td id={`${batch.id}-actions`} className="row">
        <button
          id={`${batch.id}-view-btn`}
          className="btn"
          type="button"
          onClick={() => onOpenBatch(batch.batch)}
        >
          View
        </button>
        <button
          id={`${batch.id}-process-btn`}
          className="btn"
          type="button"
          disabled={!canProcess}
          onClick={() => onProcess(batch.batch)}
        >
          Process
        </button>
        <button
          id={`${batch.id}-issue-btn`}
          className="btn"
          type="button"
          disabled={!canIssue}
          onClick={() => onIssue(batch.batch)}
        >
          Issue
        </button>
        <button
          id={`${batch.id}-discard-btn`}
          className="btn"
          type="button"
          onClick={() => onDiscard(batch.batch)}
        >
          Discard
        </button>
      </td>
    </tr>
  )
}

function InventoryAlerts({ alerts }) {
  const { lowStock, expiring, totals } = alerts

  return (
    <section id="inventory-alerts" aria-label="Stock alerts">
      <div id="inventory-alerts-low-stock" className="card" data-level={lowStock.length > 0 ? 'warn' : 'ok'}>
        <h2>Low stock</h2>
        {lowStock.length > 0 ? (
          <ul id="inventory-alerts-low-stock-list">
            {lowStock.map((row) => (
              <li key={row.bloodType} id={`inventory-alerts-low-stock-${row.bloodType}`} data-level={row.level}>
                <strong>{row.bloodType}</strong> {row.units} unit(s) on hand
              </li>
            ))}
          </ul>
        ) : (
          <p>Every blood type is adequately stocked</p>
        )}
        <button id="inventory-alerts-broadcast-btn" className="btn" type="button">
          <span>[icon]</span>
          <span>Broadcast campaign</span>
        </button>
      </div>

      <div id="inventory-alerts-expiring" className="card">
        <h2>Expiring in 7 days</h2>
        <ul id="inventory-alerts-expiring-list">
          {expiring.map((batch) => (
            <li key={batch.batch} id={`inventory-alerts-expiring-row-${batchKey(batch.batch)}`} data-days={batch.daysToExpiry}>
              <span className="pill" data-blood-type={batch.bloodType}>
                {batch.bloodType}
              </span>
              <span>{batch.componentLabel}</span>
              <span>{batch.batch}</span>
              <span>{batch.daysToExpiry}d left</span>
            </li>
          ))}
        </ul>
      </div>

      <p id="inventory-alerts-totals">
        {totals.available} unit(s) available · {totals.units} unit(s) tracked across {totals.batches} batches
      </p>
    </section>
  )
}

function StockSummary({ summary }) {
  return (
    <section id="inventory-stock-summary" aria-label="Stock summary">
      <div id="inventory-stock-summary-rows" className="row">
        {summary.map((row) => (
          <div key={row.bloodType} id={row.id} className="card" data-blood-type={row.bloodType} data-level={row.level}>
            <span className="pill">{row.bloodType}</span>
            <span id={`${row.id}-count`}>{row.units}u</span>
            <span id={`${row.id}-level`} data-level={row.level}>
              {row.level}
            </span>
          </div>
        ))}
      </div>

      <div id="inventory-stock-chart" className="card" data-chart="bar">
        <span>[chart]</span>
        <span>Units on hand by blood type</span>
      </div>

      <p id="inventory-stock-summary-note">
        Counts cover Available units only. Reserved, quarantined, issued and expired stock is excluded from
        availability.
      </p>
    </section>
  )
}

export default function InventoryScreen({
  batches,
  selectedBatchId,
  onSelectBatch,
  onOpenAdd,
  onOpenProcess,
  onOpenIssue,
  onOpenDiscard,
  onOpenBatch,
}) {
  const [tab, setTab] = useState('whole-blood')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const alerts = buildAlerts(batches)
  const summary = buildStockSummary(batches)
  const rows = buildRows(batches, tab, filters)
  const { pageSize } = PAGINATION
  const { rows: pageRows, pageCount, currentPage, firstRow, lastRow, total } = paginate(rows, page, pageSize)
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)
  const selected = batches.find((batch) => batch.batch === selectedBatchId) ?? null
  const selectedOnHand = selected ? selected.status === 'Available' : false

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  return (
    <div id="inventory-screen">
      <nav id="inventory-tabs" aria-label="Component tabs">
        {TABS.map((entry) => {
          const count = batches.filter((batch) => matchesTab(batch, entry.value)).length
          const active = entry.value === tab

          return (
            <button
              key={entry.value}
              id={entry.id}
              className="tab"
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active}
              onClick={() => {
                setTab(entry.value)
                setPage(1)
              }}
            >
              <span>{entry.label}</span>
              <span id={`inventory-tab-${entry.value}-count`}>{count}</span>
            </button>
          )
        })}
      </nav>

      <InventoryAlerts alerts={alerts} />
      <StockSummary summary={summary} />

      <div id="inventory-toolbar" className="row row-between">
        <div className="row">
          <button id="inventory-add-btn" className="btn" type="button" onClick={onOpenAdd}>
            <span>[icon]</span>
            <span>Add units</span>
          </button>
          <button
            id="inventory-issue-btn"
            className="btn"
            type="button"
            disabled={!selectedOnHand}
            onClick={() => onOpenIssue(selected.batch)}
          >
            <span>[icon]</span>
            <span>Issue to request</span>
          </button>
          <button
            id="inventory-discard-btn"
            className="btn"
            type="button"
            disabled={!selected}
            onClick={() => onOpenDiscard(selected.batch)}
          >
            <span>[icon]</span>
            <span>Discard</span>
          </button>
        </div>

        <div id="inventory-selected-batch" className="row" data-selected={selected ? 'yes' : 'no'}>
          {selected ? (
            <>
              <span id="inventory-selected-batch-label">
                {selected.batch} · {selected.bloodType} {selected.componentLabel} · {selected.units}u
              </span>
              <button id="inventory-selected-batch-clear" className="btn" type="button" onClick={() => onSelectBatch(null)}>
                Clear
              </button>
            </>
          ) : (
            <span id="inventory-selected-batch-empty">Select one batch to issue or discard</span>
          )}
        </div>
      </div>

      <div id="inventory-filters">
        <div className="field">
          <label>
            <span>Status</span>
            <select
              id="inventory-filter-status"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>Blood type</span>
            <select
              id="inventory-filter-blood-type"
              value={filters.bloodType}
              onChange={(event) => updateFilter('bloodType', event.target.value)}
            >
              <option value="all">All types</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>Expiry</span>
            <select
              id="inventory-filter-expiry"
              value={filters.expiry}
              onChange={(event) => updateFilter('expiry', event.target.value)}
            >
              <option value="all">Any expiry</option>
              {EXPIRY_WINDOWS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button id="inventory-filter-clear" className="btn" type="button" disabled={!isFiltered} onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {pageRows.length > 0 ? (
        <table id="inventory-table" className="table">
          <thead>
            <tr>
              <th scope="col">Batch</th>
              <th scope="col">Blood type</th>
              <th scope="col">Component</th>
              <th scope="col">Units</th>
              <th scope="col">Collected</th>
              <th scope="col">Expiry</th>
              <th scope="col">Status</th>
              <th scope="col">Reserved for</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((batch) => (
              <BatchRow
                key={batch.batch}
                batch={batch}
                selected={batch.batch === selectedBatchId}
                onSelect={onSelectBatch}
                onOpenBatch={onOpenBatch}
                onProcess={onOpenProcess}
                onIssue={onOpenIssue}
                onDiscard={onOpenDiscard}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div id="inventory-empty" className="card" data-state="empty">
          <span>No batches match these filters</span>
          <button id="inventory-empty-clear-btn" className="btn" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <div id="inventory-pagination" className="row row-between">
        <span id="inventory-pagination-info">
          {firstRow}–{lastRow} of {total}
        </span>
        <div className="row">
          <button
            id="inventory-pagination-prev"
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
              id={`inventory-pagination-page-${pageNumber}`}
              className="btn"
              type="button"
              data-active={pageNumber === currentPage}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            id="inventory-pagination-next"
            className="btn"
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}