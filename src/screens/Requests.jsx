import { useState } from 'react'
import data from './requests-data.js'
import { paginate } from './pagination.js'

const { COMPONENTS, STATUSES, PRIORITIES, BLOOD_TYPES, DEFAULT_FILTERS } = data

function matchesFilters(request, filters) {
  const search = filters.search.trim().toLowerCase()
  if (search) {
    const haystack = [
      request.requestId,
      request.patient,
      request.sourceLabel,
      request.componentLabel,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }
  if (filters.status !== 'all' && request.status !== filters.status) return false
  if (filters.bloodType !== 'all' && request.bloodType !== filters.bloodType) return false
  if (filters.component !== 'all' && request.component !== filters.component) return false
  if (filters.priority !== 'all' && request.priority !== filters.priority) return false
  return true
}

function Requests({ onNewRequest }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const filtered = data.REQUESTS.filter((request) => matchesFilters(request, filters))
  const { pageSize } = data.PAGINATION
  const { rows, pageCount, currentPage, firstRow, lastRow, total } = paginate(filtered, page, pageSize)
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
    <div id="requests">
      <div id="requests-toolbar" className="row row-between">
        <div id="requests-search" className="field">
          <label>
            <span>Search</span>
            <input
              type="search"
              name="requests-search"
              placeholder="Request ID, patient, ward, source"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </label>
        </div>

        <button id="requests-new-btn" className="btn" type="button" onClick={onNewRequest}>
          <span>[icon]</span>
          <span>New request</span>
        </button>
      </div>

      <div id="requests-filters">
        <div className="field">
          <label>
            <span>Status</span>
            <select
              id="requests-filter-status"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>Blood type</span>
            <select
              id="requests-filter-blood-type"
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
            <span>Component</span>
            <select
              id="requests-filter-component"
              value={filters.component}
              onChange={(event) => updateFilter('component', event.target.value)}
            >
              <option value="all">All components</option>
              {COMPONENTS.map((component) => (
                <option key={component.value} value={component.value}>
                  {component.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>Priority</span>
            <select
              id="requests-filter-priority"
              value={filters.priority}
              onChange={(event) => updateFilter('priority', event.target.value)}
            >
              <option value="all">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="requests-filter-date-range" className="field">
          <label>
            <span>Date range</span>
            <span className="row">
              <input
                type="date"
                name="requests-filter-date-from"
                value={filters.dateFrom}
                onChange={(event) => updateFilter('dateFrom', event.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                name="requests-filter-date-to"
                value={filters.dateTo}
                onChange={(event) => updateFilter('dateTo', event.target.value)}
              />
            </span>
          </label>
        </div>

        <button
          id="requests-filter-clear"
          className="btn"
          type="button"
          disabled={!isFiltered}
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>

      {rows.length > 0 ? (
        <table id="requests-table" className="table">
          <thead>
            <tr>
              <th scope="col">Request ID</th>
              <th scope="col">Patient</th>
              <th scope="col">Blood type</th>
              <th scope="col">Component</th>
              <th scope="col">Qty</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Requested</th>
              <th scope="col">Required by</th>
              <th scope="col">Source</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((request) => (
              <tr
                key={request.id}
                id={request.id}
                data-status={request.status}
                data-priority={request.priority}
                data-blood-type={request.bloodType}
                data-component={request.component}
                data-source={request.source}
              >
                <td>{request.requestId}</td>
                <td>{request.patient}</td>
                <td data-blood-type={request.bloodType}>{request.bloodType}</td>
                <td data-component={request.component}>{request.componentLabel}</td>
                <td>{request.quantity}</td>
                <td data-priority={request.priority}>{request.priority}</td>
                <td data-status={request.status}>{request.status}</td>
                <td>{request.requestedAt}</td>
                <td>{request.requiredBy}</td>
                <td>{request.sourceLabel}</td>
                <td id={`${request.id}-actions`} className="row">
                  <button className="btn" type="button">
                    View
                  </button>
                  <button className="btn" type="button">
                    Match
                  </button>
                  <button className="btn" type="button">
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div id="requests-empty" className="card" data-state="empty">
          <span>No requests match these filters</span>
          <button
            id="requests-empty-clear-btn"
            className="btn"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      <div id="requests-pagination" className="row row-between">
        <span id="requests-pagination-info">
          {firstRow}–{lastRow} of {total}
        </span>
        <div className="row">
          <button
            id="requests-pagination-prev"
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
              id={`requests-pagination-page-${pageNumber}`}
              className="btn"
              type="button"
              data-active={pageNumber === currentPage}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            id="requests-pagination-next"
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

export default Requests