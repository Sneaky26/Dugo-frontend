/* Reports data.

   Everything on the Reports screen is DERIVED from the four ledgers that already
   exist, so a report can never disagree with the screen that wrote the rows:

     donations  -> donations-rewards-data.js DONATIONS (the collection ledger)
     requests   -> requests-data.js REQUESTS plus CYCLE_EVENTS below
     inventory  -> inventory-data.js BATCHES (collection dates, statuses, units)
     facilities -> the donation sites in the ledger plus the batch source labels

   Two things did not exist before and are added here, both small and explicit:

   1. CYCLE_EVENTS. The request registry stores when a request arrived as prose
      ("08:12 today", "Yesterday 09:05", "Monday 15:04") because the requests
      table is a working list, not a ledger. Response-time metrics need arithmetic,
      so requestDay() resolves those strings against NOW_DAY — 2024-05-14, which is
      a Tuesday, so "Yesterday" and "Monday" both land on 2024-05-13 — and
      CYCLE_EVENTS supplies the match, issue and cancel stamps for the requests
      that have one. A request with no entry here is still open, which is exactly
      what the registry already says about it.

   2. FACILITIES. The ledger records a collection site and the batch registry
      records a source label, and the two sets do not overlap. FACILITIES maps both
      onto one picker: a batch collected from a donation is attributed to that
      donation's site, and a batch from a drive or a hospital is attributed to the
      facility its source label names.

   The registry is a current working set of 18 rows, so the closed cycles it holds
   are the ones the response-time metrics can report on: 6 reached a match, 3 were
   fulfilled, 2 were cancelled. The metric tiles state that sample size, because a
   rate without its denominator is not a report. */

import donationsData, { NOW_DAY } from '@/features/donations/donations-rewards-data.js'
import inventoryData from '@/features/inventory/inventory-data.js'
import requestData from '@/features/requests/requests-data.js'

const { DONATIONS } = donationsData
const { BATCHES, COMPONENTS } = inventoryData
const { REQUESTS } = requestData

export { NOW_DAY }

/* ------------------------------------------------------------------ builder -- */

/* The five report types the picker offers. `rows` names what the table below the
   charts lists for each type. */
const REPORT_TYPES = [
  { value: 'donations', label: 'Donations', rowLabel: 'Donation' },
  { value: 'requests-fulfilled', label: 'Requests fulfilled', rowLabel: 'Request' },
  { value: 'inventory', label: 'Inventory', rowLabel: 'Batch' },
  { value: 'response-time', label: 'Response time', rowLabel: 'Request' },
  { value: 'wastage', label: 'Wastage', rowLabel: 'Batch' },
]

const DATE_RANGES = [
  { value: '7-days', label: 'Last 7 days', days: 7 },
  { value: '30-days', label: 'Last 30 days', days: 30 },
  { value: '90-days', label: 'Last 90 days', days: 90 },
  { value: 'all', label: 'All time', days: null },
]

const DEFAULT_FORM = { type: 'donations', range: '30-days', component: 'all', facility: 'all' }

/* The donation sites the ledger records, plus the batch sources that are not
   donations. `sites` matches a ledger row's `site`; `sources` matches a batch's
   `source` label. A batch whose source is a donation is attributed through that
   donation's site instead, so no batch is left without a facility. */
const FACILITIES = [
  { value: 'tagaytay', label: 'Tagaytay City Blood Bank', sites: ['Tagaytay City Blood Bank'], sources: ['DRV-TAG'] },
  {
    value: 'lasalle',
    label: 'De La Salle Medical Center, Dasmariñas',
    sites: ['De La Salle Medical Center, Dasmariñas'],
    sources: [],
  },
  { value: 'taal', label: 'Taal Clinical Center', sites: ['Taal Clinical Center'], sources: [] },
  { value: 'batangas', label: 'Batangas Medical Center', sites: ['Batangas Medical Center'], sources: [] },
  { value: 'alfonso', label: 'Alfonso Red Cross drive', sites: [], sources: ['DRV-ALFONS'] },
  { value: 'tag-med', label: 'Tagaytay City Medical Center', sites: [], sources: ['TAG-MED'] },
  { value: 'stm-mary', label: "St. Mary's Hospital", sites: [], sources: ['STM-MARY'] },
]

/* Donations map onto batch components one-to-one, which is the same mapping the
   confirmation flow uses to file a collection. */
const DONATION_COMPONENTS = ['whole-blood', 'platelets', 'plasma']

const COMPONENT_OPTIONS = [{ value: 'all', label: 'All components' }, ...COMPONENTS.map((entry) => ({ value: entry.value, label: entry.label }))]

const PAGINATION = { pageSize: 10 }

/* ------------------------------------------------------------------ cycles -- */

/* Match, issue and cancel stamps for the requests that reached that state. The
   issue stamps sit before the requiredBy hour the registry already prints for
   each request, so no cycle reports fulfilling later than the promise on the row.
   Requests with no entry here are open, as their registry status says. */
const CYCLE_EVENTS = {
  'REQ-0004': { matchedAt: '2024-05-13T18:05' },
  'REQ-0005': { matchedAt: '2024-05-13T11:50', issuedAt: '2024-05-13T15:40' },
  'REQ-0009': { matchedAt: '2024-05-13T14:40' },
  'REQ-0012': { matchedAt: '2024-05-13T17:26', issuedAt: '2024-05-13T20:10' },
  'REQ-0014': { matchedAt: '2024-05-13T12:15', issuedAt: '2024-05-13T16:22' },
  'REQ-0016': { matchedAt: '2024-05-13T12:30' },
  'REQ-0013': { cancelledAt: '2024-05-13T14:02', cancelReason: 'Patient discharged before transfusion' },
  'REQ-0018': { cancelledAt: '2024-05-13T13:15', cancelReason: 'Duplicate of REQ-0017' },
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/* The registry prints arrival times as "08:12 today" / "Yesterday 09:05" /
   "Monday 15:04". Resolve the day word against NOW_DAY and keep the clock time. */
function requestDay(token) {
  if (token === 'today') return NOW_DAY
  if (token === 'Yesterday') return daysAgo(1)

  const index = WEEKDAYS.indexOf(token)
  if (index === -1) return NOW_DAY

  const todayIndex = new Date(`${NOW_DAY}T00:00:00Z`).getUTCDay()
  const back = (todayIndex - index + 7) % 7 || 7

  return daysAgo(back)
}

function daysAgo(count) {
  const date = new Date(`${NOW_DAY}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - count)
  return date.toISOString().slice(0, 10)
}

const DAYS = ['today', 'Yesterday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/* The registry prints arrival times as "08:12 today", "Yesterday 09:05" or
   "Monday 15:04" — the day word and the clock time, in either order. Pull both
   out and resolve the day against NOW_DAY. */
function requestedAt(request) {
  const time = /(\d{2}:\d{2})/.exec(request.requestedAt)
  const day = new RegExp(`\\b(${DAYS.join('|')})\\b`).exec(request.requestedAt)

  return time && day ? `${requestDay(day[1])}T${time[1]}` : null
}

function minutesBetween(from, to) {
  if (!from || !to) return null
  return Math.round((new Date(to) - new Date(from)) / 60000)
}

function durationText(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = Math.abs(minutes % 60)
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

/* ------------------------------------------------------------------ filters -- */

function rangeStart(range) {
  const entry = DATE_RANGES.find((item) => item.value === range)
  return entry?.days === null || entry === undefined ? null : daysAgo(entry.days)
}

function inWindow(day, start) {
  if (start === null) return true
  if (!day) return false
  return day >= start && day <= NOW_DAY
}

function facilityOfDonation(donationId) {
  const donation = DONATIONS.find((entry) => entry.id === donationId)
  return donation?.site ?? null
}

function facilityOfBatch(batch) {
  if (DONATIONS.some((entry) => entry.id === batch.source)) return facilityOfDonation(batch.source)

  const facility = FACILITIES.find((entry) => entry.sources.includes(batch.source))
  return facility ? facility.label : batch.source
}

function facilityLabel(value) {
  return FACILITIES.find((entry) => entry.value === value)?.label ?? value
}

function componentLabel(value) {
  return COMPONENTS.find((entry) => entry.value === value)?.label ?? value
}

/* ---------------------------------------------------------------- builders -- */

/* One row per request in the window, carrying the cycle arithmetic. */
export function buildCycles(filters = DEFAULT_FORM) {
  const start = rangeStart(filters.range)

  return REQUESTS.map((request) => {
    const events = CYCLE_EVENTS[request.requestId] ?? {}
    const arrived = requestedAt(request)
    const outcome = events.issuedAt ? 'fulfilled' : events.cancelledAt ? 'cancelled' : events.matchedAt ? 'matched' : 'open'

    return {
      id: `report-cycle-${request.requestId}`,
      requestId: request.requestId,
      patient: request.patient,
      bloodType: request.bloodType,
      component: request.component,
      componentLabel: request.componentLabel,
      priority: request.priority,
      quantity: request.quantity,
      requestedAt: arrived,
      requestedDay: arrived ? arrived.slice(0, 10) : null,
      requiredBy: request.requiredBy,
      sourceLabel: request.sourceLabel,
      matchedAt: events.matchedAt ?? null,
      issuedAt: events.issuedAt ?? null,
      cancelledAt: events.cancelledAt ?? null,
      cancelReason: events.cancelReason ?? null,
      outcome,
      timeToMatch: minutesBetween(arrived, events.matchedAt),
      timeToFulfill: minutesBetween(arrived, events.issuedAt),
    }
  })
    .filter((cycle) => inWindow(cycle.requestedDay, start))
    .filter((cycle) => (filters.component === 'all' ? true : cycle.component === filters.component))
    .sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt)))
}

/* Collections in the window. */
export function buildDonationRows(filters = DEFAULT_FORM) {
  const start = rangeStart(filters.range)

  return DONATIONS.filter((donation) => inWindow(donation.date, start))
    .filter((donation) => (filters.component === 'all' ? true : donation.type === filters.component))
    .filter((donation) =>
      filters.facility === 'all' ? true : facilityLabel(filters.facility) === donation.site,
    )
    .map((donation) => ({
      id: `report-row-${donation.id}`,
      date: donation.date,
      record: donation.id,
      recordLabel: donation.id,
      donorId: donation.donorId,
      detail: `${donation.type} · ${donation.units}u`,
      component: donation.type,
      units: donation.units,
      facility: donation.site,
      staff: donation.recordedBy,
      linkedRequest: donation.linkedRequest ?? '—',
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.record.localeCompare(a.record))
}

/* Batches in the window, collected inside it. */
export function buildBatchRows(filters = DEFAULT_FORM) {
  const start = rangeStart(filters.range)

  return BATCHES.filter((batch) => inWindow(batch.collected, start))
    .filter((batch) => (filters.component === 'all' ? true : batch.component === filters.component))
    .map((batch) => ({
      id: `report-row-${batch.batch.replace(/-+$/, '')}`,
      date: batch.collected,
      record: batch.batch,
      recordLabel: batch.batch,
      detail: `${batch.bloodType} · ${batch.component} · ${batch.units}u`,
      component: batch.component,
      componentLabel: componentLabel(batch.component),
      bloodType: batch.bloodType,
      units: batch.units,
      facility: facilityOfBatch(batch),
      expiry: batch.expiry,
      status: batch.status,
      source: batch.source,
    }))
    .filter((batch) => (filters.facility === 'all' ? true : facilityLabel(filters.facility) === batch.facility))
    .sort((a, b) => b.date.localeCompare(a.date) || a.record.localeCompare(b.record))
}

/* The four tiles. Every one of them states the sample it was calculated from,
   because a rate read without its denominator cannot be checked. */
export function buildMetrics(cycles, batches) {
  const closed = cycles.filter((cycle) => cycle.outcome === 'fulfilled' || cycle.outcome === 'cancelled')
  const fulfilled = cycles.filter((cycle) => cycle.outcome === 'fulfilled')
  const matched = cycles.filter((cycle) => cycle.matchedAt !== null)
  const matchMinutes = matched.map((cycle) => cycle.timeToMatch).filter((value) => value !== null)
  const fulfillMinutes = fulfilled.map((cycle) => cycle.timeToFulfill).filter((value) => value !== null)
  const collectedUnits = batches.reduce((total, batch) => total + batch.units, 0)
  const wastedUnits = batches
    .filter((batch) => batch.status === 'Expired')
    .reduce((total, batch) => total + batch.units, 0)
  const fulfillmentRate = closed.length === 0 ? null : Math.round((fulfilled.length / closed.length) * 100)
  const wastageRate = collectedUnits === 0 ? null : Math.round((wastedUnits / collectedUnits) * 1000) / 10

  return [
    {
      id: 'report-fulfillment-rate',
      label: 'Fulfillment rate',
      value: fulfillmentRate === null ? '—' : `${fulfillmentRate}%`,
      percent: fulfillmentRate,
      detail: `${fulfilled.length} of ${closed.length} closed requests fulfilled`,
    },
    {
      id: 'report-avg-time-to-match',
      label: 'Avg time to match',
      value: durationText(meanOf(matchMinutes)),
      minutes: meanOf(matchMinutes),
      detail: `${matchMinutes.length} matched request${matchMinutes.length === 1 ? '' : 's'}`,
    },
    {
      id: 'report-avg-time-to-fulfill',
      label: 'Avg time to fulfill',
      value: durationText(meanOf(fulfillMinutes)),
      minutes: meanOf(fulfillMinutes),
      detail: `${fulfillMinutes.length} fulfilled request${fulfillMinutes.length === 1 ? '' : 's'}`,
    },
    {
      id: 'report-wastage-rate',
      label: 'Wastage rate',
      value: wastageRate === null ? '—' : `${wastageRate}%`,
      percent: wastageRate,
      detail: `${wastedUnits} of ${collectedUnits} collected units past expiry`,
    },
  ]
}

function meanOf(values) {
  if (values.length === 0) return null
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total / values.length)
}

/* The three chart boxes. Each carries readable rows under the [chart] label, the
   same way the donations by-type chart does, so the numbers are on the page. */
export function buildCharts(cycles, donations, batches) {
  const receivedPerDay = countByDay(cycles.map((cycle) => cycle.requestedDay))
  const fulfilledPerDay = countByDay(
    cycles.filter((cycle) => cycle.outcome === 'fulfilled').map((cycle) => cycle.issuedAt?.slice(0, 10) ?? null),
  )
  const receivedRows = [...receivedPerDay.keys()]
    .sort()
    .map((day) => ({
      id: `report-chart-fulfillment-${day}`,
      label: day,
      primary: receivedPerDay.get(day),
      secondary: fulfilledPerDay.get(day) ?? 0,
      text: `${receivedPerDay.get(day)} received · ${fulfilledPerDay.get(day) ?? 0} fulfilled`,
      width: ratio(receivedPerDay.get(day), Math.max(...receivedPerDay.values(), 1)),
    }))

  const typeRows = DONATION_COMPONENTS.map((type) => {
    const forType = donations.filter((donation) => donation.component === type)
    const units = forType.reduce((total, donation) => total + donation.units, 0)
    return {
      id: `report-chart-collection-${type}`,
      label: componentLabel(type),
      primary: units,
      secondary: forType.length,
      text: `${units}u from ${forType.length} donation${forType.length === 1 ? '' : 's'}`,
      width: ratio(
        units,
        Math.max(
          ...DONATION_COMPONENTS.map(
            (value) =>
              donations
                .filter((donation) => donation.component === value)
                .reduce((total, donation) => total + donation.units, 0),
          ),
          1,
        ),
      ),
    }
  })

  const componentRows = COMPONENTS.map((entry) => {
    const forType = batches.filter((batch) => batch.component === entry.value)
    const collected = forType.reduce((total, batch) => total + batch.units, 0)
    const wasted = forType
      .filter((batch) => batch.status === 'Expired')
      .reduce((total, batch) => total + batch.units, 0)
    return {
      id: `report-chart-wastage-${entry.value}`,
      label: entry.label,
      primary: collected,
      secondary: wasted,
      text: `${collected}u collected · ${wasted}u wasted`,
      width: ratio(
        collected,
        Math.max(
          ...COMPONENTS.map((entry) =>
            batches
              .filter((batch) => batch.component === entry.value)
              .reduce((total, batch) => total + batch.units, 0),
          ),
          1,
        ),
      ),
    }
  })

  return [
    {
      id: 'report-chart-fulfillment',
      chart: 'bar',
      label: 'Requests received vs fulfilled per day',
      rows: receivedRows,
    },
    { id: 'report-chart-collection', chart: 'bar', label: 'Units collected by donation type', rows: typeRows },
    { id: 'report-chart-wastage', chart: 'stacked', label: 'Units collected vs wasted by component', rows: componentRows },
  ]
}

function countByDay(days) {
  const counts = new Map()
  for (const day of days) {
    if (!day) continue
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return counts
}

function ratio(value, peak) {
  return Math.round((value / peak) * 100)
}

/* The report table. Columns differ per type, so each type returns rows in its own
   shape and the screen reads the shared keys: id, date, record, detail, facility. */
export function buildReportRows(type, context) {
  if (type === 'donations') {
    return {
      label: 'Donation',
      columns: ['Date', 'Donation', 'Donor', 'Type', 'Units', 'Linked request', 'Site', 'Recorded by'],
      rows: context.donations.map((row) => ({
        id: row.id,
        cells: [
          { key: 'date', text: row.date },
          { key: 'record', text: row.recordLabel, record: true },
          { key: 'donor', text: row.donorId },
          { key: 'type', text: row.detail, component: row.component },
          { key: 'units', text: row.units, units: row.units },
          { key: 'request', text: row.linkedRequest },
          { key: 'facility', text: row.facility },
          { key: 'staff', text: row.staff },
        ],
      })),
    }
  }

  if (type === 'requests-fulfilled') {
    const closed = context.cycles.filter((cycle) => cycle.outcome === 'fulfilled' || cycle.outcome === 'cancelled')

    return {
      label: 'Request',
      columns: ['Requested', 'Request', 'Type', 'Units', 'Matched', 'Issued', 'Time to fulfill', 'Outcome'],
      rows: closed.map((cycle) => ({
        id: cycle.id,
        cells: [
          { key: 'date', text: cycle.requestedDay },
          { key: 'record', text: cycle.requestId, record: true },
          { key: 'type', text: `${cycle.bloodType} ${cycle.componentLabel}`, component: cycle.component },
          { key: 'units', text: cycle.quantity, units: cycle.quantity },
          { key: 'matched', text: cycle.matchedAt ? cycle.matchedAt.slice(11) : '—' },
          { key: 'issued', text: cycle.issuedAt ? cycle.issuedAt.slice(11) : '—' },
          { key: 'turnaround', text: durationText(cycle.timeToFulfill), minutes: cycle.timeToFulfill },
          { key: 'outcome', text: cycle.outcome, status: cycle.outcome },
        ],
      })),
    }
  }

  if (type === 'inventory') {
    return {
      label: 'Batch',
      columns: ['Collected', 'Batch', 'Type', 'Units', 'Expires', 'Status', 'Source', 'Facility'],
      rows: context.batches.map((row) => ({
        id: row.id,
        cells: [
          { key: 'date', text: row.date },
          { key: 'record', text: row.recordLabel, record: true },
          { key: 'type', text: row.detail, component: row.component },
          { key: 'units', text: row.units, units: row.units },
          { key: 'expiry', text: row.expiry },
          { key: 'status', text: row.status, status: row.status },
          { key: 'source', text: row.source },
          { key: 'facility', text: row.facility },
        ],
      })),
    }
  }

  if (type === 'response-time') {
    const groups = COMPONENTS.map((entry) => {
      const forType = context.cycles.filter((cycle) => cycle.component === entry.value)
      const matchMinutes = forType.map((cycle) => cycle.timeToMatch).filter((value) => value !== null)
      const fulfillMinutes = forType.map((cycle) => cycle.timeToFulfill).filter((value) => value !== null)
      return {
        id: `report-row-response-${entry.value}`,
        component: entry.value,
        label: entry.label,
        matched: matchMinutes.length,
        fulfilled: fulfillMinutes.length,
        timeToMatch: durationText(meanOf(matchMinutes)),
        timeToFulfill: durationText(meanOf(fulfillMinutes)),
      }
    }).filter((group) => group.matched > 0 || group.fulfilled > 0)

    return {
      label: 'Request',
      columns: ['Component', 'Matched', 'Fulfilled', 'Avg time to match', 'Avg time to fulfill', 'Open'],
      rows: groups.map((group) => ({
        id: group.id,
        cells: [
          { key: 'component', text: group.label, component: group.component },
          { key: 'matched', text: group.matched },
          { key: 'fulfilled', text: group.fulfilled },
          { key: 'time-to-match', text: group.timeToMatch },
          { key: 'time-to-fulfill', text: group.timeToFulfill },
          {
            key: 'open',
            text: context.cycles.filter((cycle) => cycle.component === group.component && cycle.outcome === 'open').length,
          },
        ],
      })),
    }
  }

  const wasted = context.batches
    .filter((row) => row.status === 'Expired')
    .map((row) => ({
      id: row.id,
      cells: [
        { key: 'date', text: row.date },
        { key: 'record', text: row.recordLabel, record: true },
        { key: 'type', text: row.detail, component: row.component },
        { key: 'units', text: row.units, units: row.units },
        { key: 'expiry', text: row.expiry },
        { key: 'status', text: 'Expired past shelf life', status: 'Expired' },
        { key: 'facility', text: row.facility },
      ],
    }))

  return {
    label: 'Batch',
    columns: ['Collected', 'Batch', 'Type', 'Units', 'Expired', 'Reason', 'Facility'],
    rows: wasted,
  }
}

/* Everything the screen renders for one set of builder values, derived once. */
export function buildReport(form = DEFAULT_FORM) {
  const cycles = buildCycles(form)
  const donations = buildDonationRows(form)
  const batches = buildBatchRows(form)
  const range = DATE_RANGES.find((entry) => entry.value === form.range)

  return {
    form,
    rangeLabel: range?.label ?? form.range,
    start: rangeStart(form.range),
    typeLabel: REPORT_TYPES.find((entry) => entry.value === form.type)?.label ?? form.type,
    cycles,
    donations,
    batches,
    metrics: buildMetrics(cycles, batches),
    charts: buildCharts(cycles, donations, batches),
    table: buildReportRows(form.type, { cycles, donations, batches }),
  }
}

/* The saved list is session-local, the way the inventory ledger's writes are. It
   records what was run and when, not a stored file. Row ids carry the report
   number rather than a list position, so removing an entry cannot make two rows
   share an id. */
export function reportEntryId(reportId) {
  return `report-saved-${String(reportId).replace('RPT-', '')}`
}

export function nextReportId(saved = []) {
  const highest = saved.reduce((max, entry) => Math.max(max, Number(String(entry.id).replace('RPT-', '')) || 0), 1042)
  return `RPT-${highest + 1}`
}

export default {
  NOW_DAY,
  REPORT_TYPES,
  DATE_RANGES,
  DEFAULT_FORM,
  FACILITIES,
  COMPONENT_OPTIONS,
  PAGINATION,
  CYCLE_EVENTS,
  durationText,
  meanOf,
  requestedAt,
  buildCycles,
  buildDonationRows,
  buildBatchRows,
  buildMetrics,
  buildCharts,
  buildReportRows,
  buildReport,
  reportEntryId,
  nextReportId,
}