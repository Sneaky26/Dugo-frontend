/* Blood inventory data. The batch registry below is the single ledger every
   inventory screen reads: the table, the per-type stock summary, the low-stock
   and expiring alerts, the processing outputs and the batch history drawer.

   NOW is the same fixed instant as donors-data.js and request-detail-data.js, so
   countdowns and expiry maths are reproducible between server and client.

   The first 11 batches are the same units requests-data.js already exposes as
   STOCK_BATCHES — same batch id, blood type, component, expiry and unit count, so
   the batches Request Detail reserves against are the batches Inventory shows.
   Only the collection date, source, status and reservation are added here.
   Nothing in requests-data.js is modified.

   Expiry is always collection date + SHELF_LIFE, and the add-units drawer and the
   processing screen both compute new expiries through expiryFromCollection() so
   there is one rule. The single exception is the three platelet batches below:
   REUSED_EXPIRY_BATCHES carry expiries that Request Detail already counts down
   against (B2410-A+, B2416-O-, B2417-B+), and those expiries run 1–4 days past
   the nominal 5-day platelet shelf, so their collection dates are recorded as the
   apheresis run that produced them rather than back-calculated. They are listed
   by name so the exemption is explicit instead of hidden in a rounding rule. */

import { donorTypesFor } from '@/shared/domain'
import requests from '@/features/requests/requests-data.js'

const { REQUESTS } = requests

export const NOW = '2024-05-14T09:30'

const NOW_DAY = '2024-05-14'
const OPERATOR = 'Maria Santos'

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

/* Component values are the keys blood-compat.js already switches on, so a batch
   here is directly compatible-checkable. */
const COMPONENTS = [
  { id: 'iv-component-whole-blood', value: 'whole-blood', label: 'Whole blood', short: 'WB' },
  { id: 'iv-component-rbc', value: 'rbc', label: 'Red cells (RBC)', short: 'RBC' },
  { id: 'iv-component-platelets', value: 'platelets', label: 'Platelets', short: 'PLT' },
  { id: 'iv-component-plasma', value: 'plasma', label: 'Plasma', short: 'FFP' },
  { id: 'iv-component-cryoprecipitate', value: 'cryoprecipitate', label: 'Cryoprecipitate', short: 'CRYO' },
]

/* Tab id per component — 'cryo' is the short name the tab strip uses. */
const TABS = [
  { id: 'inventory-tab-whole-blood', value: 'whole-blood', label: 'Whole blood' },
  { id: 'inventory-tab-rbc', value: 'rbc', label: 'Red cells' },
  { id: 'inventory-tab-platelets', value: 'platelets', label: 'Platelets' },
  { id: 'inventory-tab-plasma', value: 'plasma', label: 'Plasma' },
  { id: 'inventory-tab-cryo', value: 'cryoprecipitate', label: 'Cryo' },
]

/* Nominal shelf life in days, used for the add-units auto-calc and for the
   expiry of each component produced by processing. */
const SHELF_LIFE = {
  'whole-blood': 35,
  rbc: 35,
  platelets: 5,
  plasma: 365,
  cryoprecipitate: 365,
}

const STATUSES = [
  { value: 'Quarantine', label: 'Quarantine' },
  { value: 'Available', label: 'Available' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Issued', label: 'Issued' },
  { value: 'Expired', label: 'Expired' },
]

const EXPIRY_WINDOWS = [
  { value: 'all', label: 'Any expiry' },
  { value: 'expired', label: 'Already expired' },
  { value: '0-7', label: '0–7 days' },
  { value: '8-14', label: '8–14 days' },
  { value: '15-30', label: '15–30 days' },
  { value: '30-plus', label: '30+ days' },
]

const DISCARD_REASONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged — bag, seal or label' },
  { value: 'contaminated', label: 'Contaminated' },
]

/* Levels match the bands the dashboard tiles already use: critical at 4 units
   and below, low up to 8. */
const LEVEL_BANDS = [
  { level: 'critical', max: 4 },
  { level: 'low', max: 8 },
]

const REVERSED_COMPONENTS = ['plasma', 'cryoprecipitate']

/* Where units came from. DON-1187 and DON-1188 are the two donations the
   dashboard activity feed already reports. */
const SOURCES = [
  { value: 'DON-1187', label: 'DON-1187 — plasma apheresis' },
  { value: 'DON-1188', label: 'DON-1188 — whole blood' },
  { value: 'DON-1191', label: 'DON-1191 — whole blood' },
  { value: 'DON-1192', label: 'DON-1192 — whole blood' },
  { value: 'DON-1193', label: 'DON-1193 — platelet apheresis' },
  { value: 'DON-1194', label: 'DON-1194 — platelet apheresis' },
  { value: 'DON-1195', label: 'DON-1195 — whole blood' },
  { value: 'DON-1196', label: 'DON-1196 — whole blood' },
  { value: 'DRV-TAG', label: 'Tagaytay Red Cross drive' },
  { value: 'DRV-ALFONS', label: 'Alfonso Red Cross drive' },
  { value: 'TAG-MED', label: 'Tagaytay City Medical Center' },
  { value: 'STM-MARY', label: "St. Mary's Hospital" },
]

/* Requests in these states are closed; everything else can still be issued to. */
const CLOSED_REQUEST_STATUSES = ['fulfilled', 'cancelled']

/* Processing one whole-blood unit yields these three fractions. Cryoprecipitate
   is pooled in real life; a wireframe keeps one unit per output row. */
const PROCESS_OUTPUTS = [
  { id: 'rbc', component: 'rbc', label: 'Red cells (RBC)', unitsPer: 1 },
  { id: 'plasma', component: 'plasma', label: 'Plasma', unitsPer: 1 },
  { id: 'cryoprecipitate', component: 'cryoprecipitate', label: 'Cryoprecipitate', unitsPer: 1 },
]

/* The eleven batches requests-data.js already publishes. */
const REUSED_EXPIRY_BATCHES = ['B2410-A+', 'B2416-O-', 'B2417-B+']

const BATCHES = [
  { batch: 'B2409-O-', bloodType: 'O-', component: 'rbc', units: 2, collected: '2024-04-23', expiry: '2024-05-28', source: 'DON-1191', status: 'Available', reservedFor: null },
  { batch: 'B2411-O+', bloodType: 'O+', component: 'rbc', units: 5, collected: '2024-04-25', expiry: '2024-05-30', source: 'DON-1191', status: 'Available', reservedFor: null },
  { batch: 'B2412-O+', bloodType: 'O+', component: 'rbc', units: 3, collected: '2024-05-08', expiry: '2024-06-12', source: 'DRV-ALFONS', status: 'Available', reservedFor: null },
  { batch: 'B2414-A+', bloodType: 'A+', component: 'rbc', units: 8, collected: '2024-04-30', expiry: '2024-06-04', source: 'TAG-MED', status: 'Reserved', reservedFor: 'REQ-0004' },
  { batch: 'B2415-A-', bloodType: 'A-', component: 'rbc', units: 1, collected: '2024-04-21', expiry: '2024-05-26', source: 'DON-1192', status: 'Available', reservedFor: null },
  { batch: 'B2410-A+', bloodType: 'A+', component: 'platelets', units: 4, collected: '2024-05-13', expiry: '2024-05-20', source: 'DON-1193', status: 'Available', reservedFor: null },
  { batch: 'B2416-O-', bloodType: 'O-', component: 'platelets', units: 2, collected: '2024-05-13', expiry: '2024-05-21', source: 'DON-1194', status: 'Available', reservedFor: null },
  { batch: 'B2417-B+', bloodType: 'B+', component: 'platelets', units: 6, collected: '2024-05-13', expiry: '2024-05-23', source: 'DRV-ALFONS', status: 'Reserved', reservedFor: 'REQ-0002' },
  { batch: 'B2418-A-', bloodType: 'A-', component: 'plasma', units: 6, collected: '2023-06-16', expiry: '2024-06-15', source: 'DON-1187', status: 'Available', reservedFor: null },
  { batch: 'B2419-AB+', bloodType: 'AB+', component: 'plasma', units: 6, collected: '2023-07-02', expiry: '2024-07-01', source: 'TAG-MED', status: 'Available', reservedFor: null },
  { batch: 'B2420-AB-', bloodType: 'AB-', component: 'cryoprecipitate', units: 6, collected: '2023-07-11', expiry: '2024-07-10', source: 'TAG-MED', status: 'Available', reservedFor: null },
  { batch: 'B2421-O-', bloodType: 'O-', component: 'whole-blood', units: 3, collected: '2024-05-14', expiry: '2024-06-18', source: 'DON-1195', status: 'Quarantine', reservedFor: null },
  { batch: 'B2422-O+', bloodType: 'O+', component: 'whole-blood', units: 4, collected: '2024-05-14', expiry: '2024-06-18', source: 'DON-1195', status: 'Quarantine', reservedFor: null },
  { batch: 'B2423-A+', bloodType: 'A+', component: 'whole-blood', units: 6, collected: '2024-05-14', expiry: '2024-06-18', source: 'DRV-TAG', status: 'Quarantine', reservedFor: null },
  { batch: 'B2424-B+', bloodType: 'B+', component: 'rbc', units: 7, collected: '2024-04-20', expiry: '2024-05-25', source: 'TAG-MED', status: 'Available', reservedFor: null },
  { batch: 'B2425-B-', bloodType: 'B-', component: 'rbc', units: 5, collected: '2024-04-16', expiry: '2024-05-21', source: 'DRV-ALFONS', status: 'Available', reservedFor: null },
  { batch: 'B2426-AB-', bloodType: 'AB-', component: 'rbc', units: 1, collected: '2024-04-22', expiry: '2024-05-27', source: 'DON-1192', status: 'Available', reservedFor: null },
  { batch: 'B2427-O-', bloodType: 'O-', component: 'cryoprecipitate', units: 2, collected: '2024-05-10', expiry: '2025-05-10', source: 'TAG-MED', status: 'Available', reservedFor: null },
  { batch: 'B2428-B+', bloodType: 'B+', component: 'cryoprecipitate', units: 4, collected: '2024-05-08', expiry: '2025-05-08', source: 'TAG-MED', status: 'Available', reservedFor: null },
  { batch: 'B2429-O+', bloodType: 'O+', component: 'platelets', units: 6, collected: '2024-05-08', expiry: '2024-05-13', source: 'DON-1194', status: 'Expired', reservedFor: null },
  { batch: 'B2430-A-', bloodType: 'A-', component: 'rbc', units: 2, collected: '2024-03-20', expiry: '2024-04-24', source: 'TAG-MED', status: 'Expired', reservedFor: null },
  { batch: 'B2431-O-', bloodType: 'O-', component: 'whole-blood', units: 1, collected: '2024-05-13', expiry: '2024-06-17', source: 'DON-1188', status: 'Issued', reservedFor: 'REQ-0010' },
  { batch: 'B2432-A+', bloodType: 'A+', component: 'plasma', units: 4, collected: '2024-05-02', expiry: '2025-05-02', source: 'TAG-MED', status: 'Available', reservedFor: null },
  { batch: 'B2433-O+', bloodType: 'O+', component: 'plasma', units: 5, collected: '2024-05-01', expiry: '2025-05-01', source: 'DON-1187', status: 'Available', reservedFor: null },
  { batch: 'B2434-AB+', bloodType: 'AB+', component: 'platelets', units: 2, collected: '2024-05-14', expiry: '2024-05-19', source: 'DON-1194', status: 'Available', reservedFor: null },
  { batch: 'B2435-O+', bloodType: 'O+', component: 'rbc', units: 6, collected: '2024-05-02', expiry: '2024-06-06', source: 'DON-1191', status: 'Available', reservedFor: null },
  { batch: 'B2436-A-', bloodType: 'A-', component: 'platelets', units: 4, collected: '2024-05-11', expiry: '2024-05-16', source: 'DRV-ALFONS', status: 'Available', reservedFor: null },
  { batch: 'B2437-O-', bloodType: 'O-', component: 'whole-blood', units: 2, collected: '2024-05-09', expiry: '2024-06-13', source: 'DON-1196', status: 'Available', reservedFor: null },
]

const PAGINATION = { pageSize: 5 }

const DEFAULT_FILTERS = { status: 'all', bloodType: 'all', expiry: 'all' }

function parseDay(day) {
  return new Date(`${day}T00:00:00Z`)
}

function addDays(day, count) {
  const date = parseDay(day)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

function daysBetween(from, to) {
  return Math.round((parseDay(to) - parseDay(from)) / 864e5)
}

/* The one place expiry is calculated. Everything that needs an expiry date goes
   through here, so the drawer, the processing screen and the fixtures cannot
   drift apart. */
function expiryFromCollection(collected, component) {
  return addDays(collected, SHELF_LIFE[component])
}

function shelfDays(component) {
  return SHELF_LIFE[component]
}

/* Batch ids end in the blood type, so a negative type leaves a trailing dash.
   Ids that carry the batch drop it, otherwise every suffixed id would end in
   "--view-btn" and friends. */
function batchKey(batchId) {
  return batchId.replace(/-+$/, '')
}

function rowIdFor(batchId) {
  return `inventory-row-${batchKey(batchId)}`
}

function componentLabel(component) {
  return COMPONENTS.find((entry) => entry.value === component)?.label ?? component
}

function sourceLabel(source) {
  return SOURCES.find((entry) => entry.value === source)?.label ?? source
}

function requestById(requestId) {
  return REQUESTS.find((entry) => entry.requestId === requestId) ?? null
}

function levelFor(units) {
  return LEVEL_BANDS.find((band) => units <= band.max)?.level ?? 'adequate'
}

/* Days until expiry, negative once the date has passed. */
export function daysToExpiry(batch) {
  return daysBetween(NOW_DAY, batch.expiry)
}

/* Chip state for the days-to-expiry column. */
export function expiryState(batch) {
  const days = daysToExpiry(batch)
  if (days < 0) return 'expired'
  if (days <= 7) return 'expiring'
  return 'ok'
}

function expiryWindow(batch) {
  const days = daysToExpiry(batch)
  if (days < 0) return 'expired'
  if (days <= 7) return '0-7'
  if (days <= 14) return '8-14'
  if (days <= 30) return '15-30'
  return '30-plus'
}

/* A batch row plus everything derived from it, in one shape the table, the
   summary and the detail drawer all share. */
function decorate(batch) {
  return {
    ...batch,
    id: rowIdFor(batch.batch),
    componentLabel: componentLabel(batch.component),
    sourceLabel: sourceLabel(batch.source),
    daysToExpiry: daysToExpiry(batch),
    expiryState: expiryState(batch),
    expiryWindow: expiryWindow(batch),
    reservedForLabel: batch.reservedFor ? requestById(batch.reservedFor)?.patient ?? batch.reservedFor : null,
    compatibleAs: REVERSED_COMPONENTS.includes(batch.component) ? 'recipient' : 'donor',
  }
}

/* Session-local writes layered over the fixture ledger: statuses the operator
   changed and units added through the drawer. Nothing here touches BATCHES, so
   the other features keep reading the published stock list. */
export function resolveBatches(overrides = {}, added = []) {
  const withOverrides = (batch) => (overrides[batch.batch] ? { ...batch, ...overrides[batch.batch] } : batch)
  return [...added.map(withOverrides), ...BATCHES.map(withOverrides)]
}

export function matchesTab(batch, tab) {
  if (!tab || tab === 'all') return true
  return batch.component === tab
}

export function matchesFilters(batch, filters) {
  if (filters.status !== 'all' && batch.status !== filters.status) return false
  if (filters.bloodType !== 'all' && batch.bloodType !== filters.bloodType) return false
  if (filters.expiry !== 'all' && expiryWindow(batch) !== filters.expiry) return false
  return true
}

/* Counts by blood type across Available units only — reserved, quarantined,
   issued and expired stock is not on hand. */
export function buildStockSummary(batches = BATCHES) {
  return BLOOD_TYPES.map((bloodType) => {
    const forType = batches.filter((batch) => batch.bloodType === bloodType)
    const available = forType.filter((batch) => batch.status === 'Available')

    return {
      id: `inventory-stock-summary-${bloodType}`,
      bloodType,
      units: available.reduce((total, batch) => total + batch.units, 0),
      batches: available.length,
      onHand: forType.reduce((total, batch) => total + batch.units, 0),
      level: levelFor(available.reduce((total, batch) => total + batch.units, 0)),
    }
  })
}

export function buildAlerts(batches = BATCHES) {
  const lowStock = buildStockSummary(batches).filter((row) => row.level !== 'adequate')
  const expiring = batches
    .filter((batch) => batch.status === 'Available')
    .map(decorate)
    .filter((batch) => batch.daysToExpiry >= 0 && batch.daysToExpiry <= 7)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry || a.expiry.localeCompare(b.expiry))

  return {
    lowStock,
    expiring,
    expired: batches.filter((batch) => batch.status === 'Expired').map(decorate),
    totals: {
      batches: batches.length,
      units: batches.reduce((total, batch) => total + batch.units, 0),
      available: batches
        .filter((batch) => batch.status === 'Available')
        .reduce((total, batch) => total + batch.units, 0),
    },
  }
}

export function openRequests() {
  return REQUESTS.filter((entry) => !CLOSED_REQUEST_STATUSES.includes(entry.status))
}

/* Compatible available stock for a request, earliest expiry first. This repeats
   what blood-compat.js compatibleStock() does minus its three-row display cap,
   because here the operator has to see the whole pool to pick from. */
export function buildCompatibleBatches(request, batches = BATCHES) {
  if (!request) return []
  const types = donorTypesFor(request.component, request.bloodType)

  return batches
    .filter((batch) => batch.component === request.component && batch.status === 'Available')
    .filter((batch) => types.includes(batch.bloodType))
    .map(decorate)
    .sort((a, b) => a.expiry.localeCompare(b.expiry))
}

/* Units on hand for a request, for the reserve-or-find-donors hint. */
export function stockUnitsFor(request, batches = BATCHES) {
  return buildCompatibleBatches(request, batches).reduce((total, batch) => total + batch.units, 0)
}

/* The issue slip the operator prints after confirming. */
export function buildIssueSlip(request, selections, batches = BATCHES) {
  if (!request) return null

  const rows = selections.map((selection) => {
    const batch = batches.find((entry) => entry.batch === selection.batch)
    return {
      id: `issue-slip-row-${batchKey(selection.batch)}`,
      batch: selection.batch,
      units: selection.units,
      bloodType: batch?.bloodType ?? '',
      componentLabel: batch ? componentLabel(batch.component) : '',
      expiry: batch?.expiry ?? '',
    }
  })

  return {
    requestId: request.requestId,
    patient: request.patient,
    bloodType: request.bloodType,
    componentLabel: request.componentLabel,
    requiredBy: request.requiredBy,
    quantity: request.quantity,
    ward: request.ward,
    rows,
    totalUnits: rows.reduce((total, row) => total + row.units, 0),
    issuedBy: OPERATOR,
    issuedAt: NOW,
  }
}

/* Fractions produced by processing one whole-blood batch. */
export function buildProcessOutputs(batchId, batches = BATCHES) {
  const parent = batches.find((batch) => batch.batch === batchId)
  if (!parent) return []

  return PROCESS_OUTPUTS.map((output) => ({
    id: `process-components-row-${output.id}`,
    component: output.component,
    label: output.label,
    bloodType: parent.bloodType,
    quantity: parent.units * output.unitsPer,
    expiry: expiryFromCollection(parent.collected, output.component),
    shelfDays: shelfDays(output.component),
  }))
}

export function wholeBloodBatches(batches = BATCHES) {
  return batches
    .filter((batch) => batch.component === 'whole-blood' && batch.status === 'Available')
    .map(decorate)
    .sort((a, b) => a.expiry.localeCompare(b.expiry))
}

/* Status-change log for one batch. Derived from the batch facts, so the drawer
   never has a history that contradicts the row it was opened from. */
export function buildBatchHistory(batchId, batches = BATCHES) {
  const batch = batches.find((entry) => entry.batch === batchId)
  if (!batch) return []

  const entries = [
    {
      event: 'collected',
      time: `${batch.collected} 07:30`,
      text: `${batch.units} unit(s) ${componentLabel(batch.component)} collected from ${sourceLabel(batch.source)}`,
      actor: 'Collection team',
    },
    {
      event: 'quarantined',
      time: `${batch.collected} 08:05`,
      text: 'Moved to quarantine pending screening',
      actor: 'Cold Chain 2',
    },
  ]

  if (batch.status !== 'Quarantine') {
    entries.push({
      event: 'screening-passed',
      time: `${addDays(batch.collected, 1)} 09:10`,
      text: 'Donor screening and serology passed — released to Available',
      actor: OPERATOR,
    })
  }

  if (batch.reservedFor) {
    entries.push({
      event: 'reserved',
      time: `${addDays(batch.collected, 1)} 10:22`,
      text: `Reserved ${batch.units} unit(s) for ${batch.reservedFor}`,
      actor: OPERATOR,
    })
  }

  if (batch.status === 'Issued') {
    entries.push({
      event: 'issued',
      time: `${NOW_DAY} 08:45`,
      text: `Issued ${batch.units} unit(s) against ${batch.reservedFor ?? 'walk-in'}`,
      actor: OPERATOR,
    })
  }

  if (batch.status === 'Expired') {
    entries.push({
      event: 'expired',
      time: `${addDays(batch.expiry, 1)} 07:00`,
      text: `Past expiry on ${batch.expiry} — pulled from the cold chain`,
      actor: 'Cold Chain 2',
    })
  }

  return entries.map((entry, slot) => ({ ...entry, id: `batch-detail-history-${batch.batch}-${slot + 1}` }))
}

export function buildBatchDetail(batchId, batches = BATCHES) {
  const batch = batches.find((entry) => entry.batch === batchId)
  if (!batch) return null

  return {
    ...decorate(batch),
    history: buildBatchHistory(batchId, batches),
  }
}

/* Table rows for one tab with the filters applied. */
export function buildRows(batches, tab, filters) {
  return batches
    .filter((batch) => matchesTab(batch, tab))
    .filter((batch) => matchesFilters(batch, filters))
    .map(decorate)
}

export function nextBatchId(added = []) {
  const highest = [...BATCHES, ...added].reduce((max, batch) => Math.max(max, Number(batch.batch.slice(1, 5))), 2436)
  return `B${highest + 1}`
}

export default {
  NOW,
  BLOOD_TYPES,
  COMPONENTS,
  TABS,
  SHELF_LIFE,
  STATUSES,
  EXPIRY_WINDOWS,
  DISCARD_REASONS,
  SOURCES,
  PAGINATION,
  DEFAULT_FILTERS,
  BATCHES,
  REQUESTS,
  REUSED_EXPIRY_BATCHES,
  PROCESS_OUTPUTS,
  expiryFromCollection,
  shelfDays,
  rowIdFor,
  batchKey,
  componentLabel,
  sourceLabel,
  requestById,
  levelFor,
}