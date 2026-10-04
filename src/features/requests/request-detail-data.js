/* Request detail data. Everything the detail screen shows is derived from the
   request row plus the shared blood-compat helpers, so all 18 requests open a
   working detail. NOW is a fixed instant — no Date.now() in render, which keeps
   hold countdowns reproducible between server and client. */

import { compatibleStock, donorTypesFor, planText } from '@/shared/domain'
import requests from './requests-data.js'

const { REQUESTS, STOCK_BATCHES } = requests

export const NOW = '2024-05-14T09:30'

const STEP_ORDER = [
  'submitted',
  'matching',
  'notified',
  'donor-confirmed',
  'donated',
  'fulfilled',
]

const CANCEL_REASONS = [
  'Patient transferred',
  'Patient discharged',
  'Duplicate request',
  'Wrong component ordered',
  'Units found elsewhere',
  'No longer needed',
]

const DONOR_POOL = [
  { id: 'D-0042', name: 'Josefina Dela Cruz', masked: 'J*** D. C.', bloodType: 'O+', distance: '3.2 km' },
  { id: 'D-0117', name: 'Ramon Bautista', masked: 'R*** B.', bloodType: 'O-', distance: '5.8 km' },
  { id: 'D-0233', name: 'KC Manalo', masked: 'K*** M.', bloodType: 'O+', distance: '8.1 km' },
  { id: 'D-0308', name: 'Angelo Perez', masked: 'A*** P.', bloodType: 'A+', distance: '11.4 km' },
  { id: 'D-0451', name: 'Divina Ramos', masked: 'D*** R.', bloodType: 'B+', distance: '14.0 km' },
  { id: 'D-0562', name: 'Mark Villaflor', masked: 'M*** V.', bloodType: 'O-', distance: '17.6 km' },
  { id: 'D-0673', name: 'Liezl Mercado', masked: 'L*** M.', bloodType: 'A-', distance: '21.3 km' },
  { id: 'D-0784', name: 'Carlo Pimentel', masked: 'C*** P.', bloodType: 'O+', distance: '24.9 km' },
]

const CHANNELS = ['app']
const CHANNEL_STATUS = ['delivered', 'delivered', 'pending', 'failed']

/* Deterministic mix so renders are stable — index into the request order. */
const RESPONSE_MIX = ['accepted', 'accepted', 'pending', 'declined', 'no-reply']

const NOTIFIED_TIMES = ['08:31', '08:29', '08:24', '08:20', '07:58', '07:52', '07:45', '07:40']

function holdCountdown(expiry, now = NOW) {
  const ms = new Date(`${expiry}T23:59`) - new Date(now)
  if (ms <= 0) return { text: 'expired', state: 'expired', ms: 0 }

  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value) => String(value).padStart(2, '0')
  const text =
    hours >= 24 ? `${Math.floor(hours / 24)}d ${pad(hours % 24)}:${pad(minutes)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return { text, state: total <= 24 * 3600 ? 'expiring' : 'running', ms }
}

/* One place decides how far a request has progressed. */
export function buildSteps(status, counts = {}) {
  const state = (value) => STEP_ORDER.map((step) => ({ step, state: value }))

  if (status === 'fulfilled') return state('done')
  if (status === 'cancelled') {
    return STEP_ORDER.map((step, index) => ({ step, state: index === 0 ? 'done' : 'todo' }))
  }

  /* Submitted and matching are always behind us. Donors having been reached
     (notified) completes the third step; the current step is whatever the
     request is now waiting on. */
  const donorsReached =
    (status === 'collecting' || status === 'matched') && (counts.notified ?? 0) > 0
  const doneCount = status === 'matched' ? 4 : donorsReached ? 3 : 1
  const currentIndex = status === 'matched' ? 4 : status === 'collecting' && donorsReached ? 3 : 1

  return STEP_ORDER.map((step, index) => ({
    step,
    state: index < doneCount ? 'done' : index === currentIndex ? 'current' : 'todo',
  }))
}

function buildDonors(request, index, capacity) {
  const compatible = donorTypesFor(request.component, request.bloodType)
  const pool = DONOR_POOL.filter(
    (donor) => compatible.length === 0 || compatible.includes(donor.bloodType),
  )
  const count = request.status === 'cancelled' || request.status === 'fulfilled' ? 0 : 4
  /* Only as many donors as the outstanding need actually pledge a unit. */
  let pledgeSlots = Math.max(0, capacity)

  return pool.slice(0, count).map((donor, slot) => {
    const response = RESPONSE_MIX[(index + slot) % RESPONSE_MIX.length]
    const pledged = response === 'accepted' && pledgeSlots > 0 ? 1 : 0
    pledgeSlots -= pledged

    return {
      ...donor,
      response,
      notifiedAt: NOTIFIED_TIMES[(index + slot) % NOTIFIED_TIMES.length],
      channel: CHANNELS[(index + slot) % CHANNELS.length],
      channelStatus: CHANNEL_STATUS[(index + slot) % CHANNEL_STATUS.length],
      pledged,
    }
  })
}

/* Reserve only what the request needs, earliest expiry first. */
function buildBatches(request) {
  let remaining = request.quantity
  const rows = []

  for (const batch of compatibleStock(request.component, request.bloodType, STOCK_BATCHES)) {
    if (remaining <= 0) break
    const units = Math.min(batch.units, remaining)
    remaining -= units
    rows.push({
      id: `reqdetail-batch-row-${batch.batch}`,
      batch: batch.batch,
      bloodType: batch.bloodType,
      component: batch.component,
      componentLabel: request.componentLabel,
      expiry: batch.expiry,
      hold: holdCountdown(batch.expiry),
      units,
      availableUnits: batch.units,
    })
  }

  return rows
}

/* Hand-written so the flagship request reads like a real case. */
const OVERRIDES = {
  'REQ-0001': {
    batches: [
      {
        id: 'reqdetail-batch-row-B2409-O-',
        batch: 'B2409-O-',
        bloodType: 'O-',
        component: 'rbc',
        componentLabel: 'Red cells',
        expiry: '2024-05-28',
        hold: holdCountdown('2024-05-28'),
        units: 2,
      },
      {
        id: 'reqdetail-batch-row-B2411-O+',
        batch: 'B2411-O+',
        bloodType: 'O+',
        component: 'rbc',
        componentLabel: 'Red cells',
        expiry: '2024-05-30',
        hold: holdCountdown('2024-05-30'),
        units: 2,
      },
    ],
    donors: [
      { id: 'D-0042', name: 'Josefina Dela Cruz', masked: 'J*** D. C.', bloodType: 'O+', distance: '3.2 km', response: 'accepted', notifiedAt: '08:31', channel: 'app', channelStatus: 'delivered', pledged: 1 },
      { id: 'D-0117', name: 'Ramon Bautista', masked: 'R*** B.', bloodType: 'O-', distance: '5.8 km', response: 'pending', notifiedAt: '08:29', channel: 'app', channelStatus: 'delivered', pledged: 0 },
      { id: 'D-0233', name: 'KC Manalo', masked: 'K*** M.', bloodType: 'O+', distance: '8.1 km', response: 'no-reply', notifiedAt: '08:24', channel: 'app', channelStatus: 'pending', pledged: 0 },
      { id: 'D-0308', name: 'Angelo Perez', masked: 'A*** P.', bloodType: 'A+', distance: '11.4 km', response: 'declined', notifiedAt: '08:20', channel: 'app', channelStatus: 'failed', pledged: 0 },
    ],
    log: [
      { id: 'reqdetail-log-request-created', event: 'request-created', time: '08:12', text: 'REQ-0001 created by Dr. Alona — R.M., O- red cells' },
      { id: 'reqdetail-log-matching-started', event: 'matching-started', time: '08:13', text: 'Auto-matching started for O- red cells' },
      { id: 'reqdetail-log-batch-reserved-B2409-O-', event: 'batch-reserved', time: '08:14', text: 'Batch B2409-O- reserved — 2 units' },
      { id: 'reqdetail-log-app-notification-sent-12-donors', event: 'app-notification-sent', time: '08:20', text: 'In-app notification sent to 12 donors within 15 km' },
      { id: 'reqdetail-log-donor-accepted-D-0042', event: 'donor-accepted', time: '08:31', text: 'D-0042 Josefina Dela Cruz accepted' },
      { id: 'reqdetail-log-hold-placed-B2411-O+', event: 'hold-placed', time: '08:36', text: 'Hold placed on batch B2411-O+ — 2 units' },
    ],
  },
}

function buildLog(request, batches, donors, override) {
  if (override?.log) return override.log

  const entries = [
    { id: 'reqdetail-log-request-created', event: 'request-created', time: request.requestedAt, text: `${request.requestId} created — ${request.patient}, ${request.bloodType} ${request.componentLabel}` },
  ]
  if (request.status !== 'cancelled') {
    entries.push({ id: 'reqdetail-log-matching-started', event: 'matching-started', time: request.requestedAt, text: `Auto-matching started for ${request.bloodType} ${request.componentLabel}` })
  }
  for (const batch of batches.slice(0, 2)) {
    entries.push({ id: `reqdetail-log-batch-reserved-${batch.batch}`, event: 'batch-reserved', time: request.requestedAt, text: `Batch ${batch.batch} reserved — ${batch.units} units` })
  }
  if (donors.length > 0) {
    entries.push({ id: `reqdetail-log-app-notification-sent-${donors.length}-donors`, event: 'app-notification-sent', time: donors[0].notifiedAt, text: `In-app notification sent to ${donors.length} donors within 25 km` })
  }
  for (const donor of donors.filter((entry) => entry.response === 'accepted')) {
    entries.push({ id: `reqdetail-log-donor-accepted-${donor.id}`, event: 'donor-accepted', time: donor.notifiedAt, text: `${donor.id} ${donor.masked} accepted` })
  }
  return entries
}

export function buildDetail(requestId, statusOverride) {
  const request = REQUESTS.find((entry) => entry.requestId === requestId)
  if (!request) return null

  const override = OVERRIDES[requestId]
  const status = statusOverride || request.status
  const index = REQUESTS.indexOf(request)
  /* A closed request holds nothing and has nobody in flight. */
  const isClosed = status === 'cancelled' || status === 'fulfilled'

  const batches = isClosed ? [] : (override?.batches ?? buildBatches(request))
  const inventoryUnits = batches.reduce((total, batch) => total + batch.units, 0)
  const donors = isClosed
    ? []
    : (override?.donors ?? buildDonors(request, index, request.quantity - inventoryUnits))

  const donorUnits = donors.reduce((total, donor) => total + donor.pledged, 0)
  const stillNeeded = Math.max(0, request.quantity - inventoryUnits - donorUnits)
  /* Plan against what is still outstanding, so donor pledges already count. */
  const plan = planText(inventoryUnits, inventoryUnits + stillNeeded, 'both')

  const counts = {
    notified: donors.length,
    confirmed: donors.filter((donor) => donor.response === 'accepted').length,
  }

  return {
    request,
    status,
    batches,
    donors,
    plan: {
      ...plan,
      inventoryUnits,
      donorUnits,
      stillNeeded,
      met: stillNeeded === 0,
    },
    steps: buildSteps(status, counts),
    log: buildLog(request, batches, donors, override),
  }
}

export { CANCEL_REASONS, STEP_ORDER }