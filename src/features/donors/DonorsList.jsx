import { useState } from 'react'
import data, { matchesFilters, rowIdFor, buildDonorProfile } from './donors-data.js'
import { paginate } from '@/shared/utils/paginate.js'

const { BLOOD_TYPES, CITIES, DONOR_STATUSES, ELIGIBILITY_STATES, PAGINATION, DEFAULT_FILTERS } = data

function DonorRow({ donor, onOpenProfile, onEdit, onNotify }) {
  const rowId = rowIdFor(donor.donorId)
  const profile = buildDonorProfile(donor.donorId)

  return (
    <tr
      id={rowId}
      data-donor-id={donor.donorId}
      data-blood-type={donor.bloodType}
      data-eligibility={profile.overallEligibility}
      data-status={donor.status}
    >
      <td>{donor.donorId}</td>
      <td>{donor.name}</td>
      <td data-blood-type={donor.bloodType}>{donor.bloodType}</td>
      <td>{donor.address}</td>
      <td>{donor.masked}</td>
      <td>{donor.totalDonations}</td>
      <td>{donor.lastDonation}</td>
      <td data-eligibility={profile.overallEligibility}>{profile.overallEligibility}</td>
      <td>{donor.points}</td>
      <td data-status={donor.status}>{donor.status}</td>
      <td id={`${rowId}-actions`} className="row">
        <button
          id={`${rowId}-view-btn`}
          className="btn"
          type="button"
          onClick={() => onOpenProfile(donor.donorId)}
        >
          View
        </button>
        <button id={`${rowId}-edit-btn`} className="btn" type="button" onClick={() => onEdit(donor.donorId)}>
          Edit
        </button>
        <button id={`${rowId}-notify-btn`} className="btn" type="button" onClick={() => onNotify(donor.donorId)}>
          Notify
        </button>
      </td>
    </tr>
  )
}

function DonorsList({ onOpenProfile, onOpenAdd, onOpenImport, onEditDonor, onNotifyDonor }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const filtered = data.DONORS.filter((donor) => matchesFilters(donor, filters))
  const { pageSize } = PAGINATION
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
    <div id="donors-list-screen">
      <div id="donors-toolbar" className="row row-between">
        <div id="donors-search" className="field">
          <label>
            <span>Search</span>
            <input
              type="search"
              name="donors-search"
              placeholder="Donor ID, name, address"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </label>
        </div>

        <div className="row">
          <button id="donors-add-btn" className="btn" type="button" onClick={onOpenAdd}>
            <span>[icon]</span>
            <span>Add donor</span>
          </button>
          <button id="donors-import-btn" className="btn" type="button" onClick={onOpenImport}>
            <span>[icon]</span>
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      <div id="donors-filters">
        <div className="field">
          <label>
            <span>Blood type</span>
            <select
              id="donors-filter-blood-type"
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
            <span>Eligibility</span>
            <select
              id="donors-filter-eligibility"
              value={filters.eligibility}
              onChange={(event) => updateFilter('eligibility', event.target.value)}
            >
              <option value="all">All states</option>
              {ELIGIBILITY_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>Status</span>
            <select
              id="donors-filter-status"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="all">All statuses</option>
              {DONOR_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label>
            <span>City</span>
            <select
              id="donors-filter-city"
              value={filters.city}
              onChange={(event) => updateFilter('city', event.target.value)}
            >
              <option value="all">All cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button id="donors-filter-clear" className="btn" type="button" disabled={!isFiltered} onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {rows.length > 0 ? (
        <table id="donors-table" className="table">
          <thead>
            <tr>
              <th scope="col">Donor ID</th>
              <th scope="col">Name</th>
              <th scope="col">Blood type</th>
              <th scope="col">Barangay</th>
              <th scope="col">Contact</th>
              <th scope="col">Donations</th>
              <th scope="col">Last donation</th>
              <th scope="col">Eligibility</th>
              <th scope="col">Points</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((donor) => (
              <DonorRow
                key={donor.donorId}
                donor={donor}
                onOpenProfile={onOpenProfile}
                onEdit={onEditDonor}
                onNotify={onNotifyDonor}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div id="donors-empty" className="card" data-state="empty">
          <span>No donors match these filters</span>
          <button id="donors-empty-clear-btn" className="btn" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <div id="donors-pagination" className="row row-between">
        <span id="donors-pagination-info">
          {firstRow}–{lastRow} of {total}
        </span>
        <div className="row">
          <button
            id="donors-pagination-prev"
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
              id={`donors-pagination-page-${pageNumber}`}
              className="btn"
              type="button"
              data-active={pageNumber === currentPage}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            id="donors-pagination-next"
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

export default DonorsList