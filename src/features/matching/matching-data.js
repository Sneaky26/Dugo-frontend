/* Donor matching data. Everything the matching screen shows is derived from a
   request plus the shared blood-compat helpers, so opening matching for any of
   the 18 requests produces a coherent result. NOW is the fixed instant reused
   from request-detail-data — no Date.now() in render, so countdowns are
   reproducible between server and client.

   Donors are reached through the Dugo+ app only — no SMS or email. Eligibility
   is stored as a compact value per donation type: the string 'eligible', or a
   deferral reason string. buildMatching normalises both into { state, reason }. */

import { donorTypesFor } from '@/shared/domain'
import { buildDetail, NOW } from '@/features/requests/request-detail-data.js'
import requests from '@/features/requests/requests-data.js'

const { COMPONENTS } = requests

const DONATION_TYPE_BY_COMPONENT = {
  'whole-blood': 'whole-blood',
  rbc: 'whole-blood',
  platelets: 'platelets',
  plasma: 'plasma',
  cryoprecipitate: 'plasma',
}

const COMPONENT_OPTIONS = COMPONENTS.map(({ value, label }) => ({ value, label }))

const COMPAT_TIERS = [
  { id: 'exact', label: 'Exact match' },
  { id: 'compatible', label: 'Compatible' },
  { id: 'fallback', label: 'Fallback' },
]

const ELIGIBILITY_OPTIONS = [
  { id: 'eligible', label: 'Eligible' },
  { id: 'deferred', label: 'Deferred' },
]

const RESPONSE_STATUSES = [
  { id: 'accepted', label: 'Accepted' },
  { id: 'pending', label: 'Pending' },
  { id: 'no-reply', label: 'No reply' },
  { id: 'not-notified', label: 'Not notified' },
  { id: 'declined', label: 'Declined' },
]

/* Lower sorts first. Accepted donors rank above the rest. */
const RESPONSE_RANK = {
  accepted: 0,
  pending: 1,
  'no-reply': 2,
  'not-notified': 3,
  declined: 4,
}

const TIER_RANK = { exact: 0, compatible: 1, fallback: 2 }

const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 20
const DEFAULT_RADIUS_KM = 15

/* The shared donor ids from request-detail-data, plus a few extras so every
   compatibility tier has donors to show for the flagship O- request. */
const DONOR_ROSTER = [
  {
    id: 'D-0042',
    name: 'Josefina Dela Cruz',
    masked: 'J*** D. C.',
    bloodType: 'O+',
    distanceKm: 3.2,
    apheresisEligible: true,
    lastDonation: '2024-01-20',
    response: 'accepted',
    deliveries: { app: 'delivered' },
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    id: 'D-0117',
    name: 'Ramon Bautista',
    masked: 'R*** B.',
    bloodType: 'O-',
    distanceKm: 5.8,
    apheresisEligible: true,
    lastDonation: '2024-02-14',
    response: 'pending',
    deliveries: { app: 'pending' },
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'Platelet count 148k — below apheresis threshold',
      plasma: 'eligible',
    },
  },
  {
    id: 'D-0233',
    name: 'KC Manalo',
    masked: 'K*** M.',
    bloodType: 'O+',
    distanceKm: 8.1,
    apheresisEligible: false,
    lastDonation: '2024-05-01',
    response: 'no-reply',
    deliveries: { app: 'delivered' },
    eligibility: {
      'whole-blood': 'Donated 13 days ago — eligible again 2024-06-26',
      platelets: 'Recent whole blood donation',
      plasma: 'eligible',
    },
  },
  {
    id: 'D-0308',
    name: 'Angelo Perez',
    masked: 'A*** P.',
    bloodType: 'A+',
    distanceKm: 11.4,
    apheresisEligible: true,
    lastDonation: '2023-12-08',
    response: 'declined',
    deliveries: { app: 'delivered' },
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    id: 'D-0451',
    name: 'Divina Ramos',
    masked: 'D*** R.',
    bloodType: 'B+',
    distanceKm: 14.0,
    apheresisEligible: false,
    lastDonation: '2024-03-30',
    response: 'not-notified',
    deliveries: { app: 'not-sent' },
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'Not apheresis-eligible — poor venous access',
      plasma: 'eligible',
    },
  },
  {
    id: 'D-0562',
    name: 'Mark Villaflor',
    masked: 'M*** V.',
    bloodType: 'O-',
    distanceKm: 17.6,
    apheresisEligible: true,
    lastDonation: '2024-04-18',
    response: 'pending',
    deliveries: { app: 'opened' },
    eligibility: {
      'whole-blood': 'Donated 26 days ago — eligible again 2024-06-13',
      platelets: 'eligible',
      plasma: 'eligible',
    },
  },
  {
    id: 'D-0673',
    name: 'Liezl Mercado',
    masked: 'L*** M.',
    bloodType: 'A-',
    distanceKm: 21.3,
    apheresisEligible: false,
    lastDonation: '2024-05-10',
    response: 'not-notified',
    deliveries: { app: 'not-sent' },
    eligibility: {
      'whole-blood': 'Donated 4 days ago',
      platelets: 'Recent donation — apheresis deferral',
      plasma: 'Recent donation',
    },
  },
  {
    id: 'D-0784',
    name: 'Carlo Pimentel',
    masked: 'C*** P.',
    bloodType: 'O+',
    distanceKm: 24.9,
    apheresisEligible: true,
    lastDonation: '2024-03-02',
    response: 'no-reply',
    deliveries: { app: 'failed' },
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    id: 'D-0895',
    name: 'Nathaniel Ocampo',
    masked: 'N*** O.',
    bloodType: 'O-',
    distanceKm: 2.4,
    apheresisEligible: true,
    lastDonation: '2024-02-22',
    response: 'accepted',
    deliveries: { app: 'delivered' },
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    id: 'D-0910',
    name: 'Perla Gutierrez',
    masked: 'P*** G.',
    bloodType: 'O-',
    distanceKm: 9.3,
    apheresisEligible: false,
    lastDonation: '2024-01-05',
    response: 'pending',
    deliveries: { app: 'pending' },
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'Low hemoglobin 11.8 g/dL — recheck in 2 weeks',
      plasma: 'eligible',
    },
  },
  {
    id: 'D-1023',
    name: 'Rosario Enriquez',
    masked: 'R*** E.',
    bloodType: 'O-',
    distanceKm: 12.9,
    apheresisEligible: true,
    lastDonation: '2024-04-25',
    response: 'no-reply',
    deliveries: { app: 'delivered' },
    eligibility: {
      'whole-blood': 'Antibiotic course — defer until 2024-05-20',
      platelets: 'eligible',
      plasma: 'eligible',
    },
  },
  {
    id: 'D-1101',
    name: 'Emmanuel Soriano',
    masked: 'E*** S.',
    bloodType: 'A+',
    distanceKm: 6.7,
    apheresisEligible: true,
    lastDonation: '2024-03-15',
    response: 'accepted',
    deliveries: { app: 'opened' },
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
]

/* Wave plans are hand-written for the flagship request and defaulted for the
   rest, so the status strip always has values. */
const WAVE_PLANS = {
  'REQ-0001': { wave: 2, totalWaves: 3, notified: 12, accepted: 1, nextWaveAt: '2024-05-14T09:34', waveSize: 8 },
}

const DEFAULT_WAVE = { wave: 1, totalWaves: 3, notified: 8, accepted: 0, nextWaveAt: '2024-05-14T09:35', waveSize: 8 }

const FALLBACK_REASONS = [
  'No compatible donors within radius',
  'Emergency release authorised by physician',
  'Inventory critically low for this component',
  'Patient clinically unstable — proceed now',
]

function countdownText(target, now = NOW) {
  const ms = new Date(target) - new Date(now)
  if (ms <= 0) return 'due now'
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

/* exact = identical type; compatible = clinically acceptable per blood-compat;
   fallback = only usable under emergency override. */
export function tierFor(donor, component, bloodType) {
  if (donor.bloodType === bloodType) return 'exact'
  if (donorTypesFor(component, bloodType).includes(donor.bloodType)) return 'compatible'
  return 'fallback'
}

export function responseLabel(id) {
  return RESPONSE_STATUSES.find((status) => status.id === id)?.label ?? id
}

function normaliseEligibility(value) {
  return value === 'eligible' ? { state: 'eligible', reason: '' } : { state: 'deferred', reason: value }
}

function buildWave(request) {
  const plan = WAVE_PLANS[request.requestId] ?? DEFAULT_WAVE
  return {
    ...plan,
    countdown: countdownText(plan.nextWaveAt),
  }
}

/* The donor list, summary, wave strip and tab counts for one request. Filters
   (eligibility, response) apply before tier counts so the tabs stay honest. */
export function buildMatching(requestId, options = {}) {
  const detail = buildDetail(requestId)
  if (!detail) return null

  const { request } = detail
  const activeComponent = options.component ?? request.component
  const donationType = DONATION_TYPE_BY_COMPONENT[activeComponent] ?? 'whole-blood'
  const radiusKm = options.radiusKm ?? DEFAULT_RADIUS_KM
  const tier = options.tier ?? 'all'
  const eligibility = options.eligibility ?? 'all'
  const response = options.response ?? 'all'

  const base = DONOR_ROSTER.map((donor) => ({
    ...donor,
    tier: tierFor(donor, activeComponent, request.bloodType),
    eligibilityState: normaliseEligibility(donor.eligibility[donationType] ?? 'eligible'),
  }))
    .filter((donor) => donor.distanceKm <= radiusKm)
    .filter((donor) => eligibility === 'all' || donor.eligibilityState.state === eligibility)
    .filter((donor) => response === 'all' || donor.response === response)

  const tierCounts = { exact: 0, compatible: 0, fallback: 0 }
  for (const donor of base) tierCounts[donor.tier] += 1

  const donors = base
    .filter((donor) => tier === 'all' || donor.tier === tier)
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
        RESPONSE_RANK[a.response] - RESPONSE_RANK[b.response] ||
        a.distanceKm - b.distanceKm,
    )

  return {
    request,
    donationType,
    activeComponent,
    summary: {
      requestId: request.requestId,
      patient: request.patient,
      bloodType: request.bloodType,
      component: request.component,
      componentLabel: request.componentLabel,
      unitsNeeded: request.quantity,
      inventoryCovered: detail.plan.inventoryUnits,
      shortfall: detail.plan.stillNeeded,
    },
    wave: buildWave(request),
    donors,
    tierCounts,
    total: donors.length,
  }
}

/* Preview of the in-app notification sent to the selected donors. */
export function buildNotification(requestId, recipientIds = []) {
  const match = buildMatching(requestId)
  if (!match) return null

  const { request } = match
  const count = recipientIds.length

  return {
    count,
    appTitle: `Urgent: ${request.bloodType} ${request.componentLabel} needed`,
    appBody: `${request.ward} needs ${request.quantity} unit(s) of ${request.bloodType} ${request.componentLabel.toLowerCase()}. You are 1 of ${count} matching donor(s) invited. Open Dugo+ to confirm your slot.`,
  }
}

export {
  COMPAT_TIERS,
  COMPONENT_OPTIONS,
  DEFAULT_RADIUS_KM,
  DONATION_TYPE_BY_COMPONENT,
  DONOR_ROSTER,
  ELIGIBILITY_OPTIONS,
  FALLBACK_REASONS,
  MAX_RADIUS_KM,
  MIN_RADIUS_KM,
  RESPONSE_STATUSES,
}
