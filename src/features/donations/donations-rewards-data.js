/* Donations and rewards data.

   Two tabs share one ledger. DONATIONS is the donation history the Donations tab
   renders and the Confirm Donation flow appends to. REWARDS and REDEMPTIONS back
   the Rewards tab.

   The donation types, the point values and the intervals are NOT redefined here:
   they come from donors-data.js, because the Donor Profile points ledger already
   promises "Whole blood 100 / Platelets 150 / Plasma 60" and a 90 / 14 / 28 day
   gap between donations of the same type. This module only adds the display
   labels the donations screen shows and derives everything else from that source.

   Donation types map one-to-one onto the inventory component values, so a
   confirmed donation can create a batch without a lookup table: whole blood ->
   whole-blood, platelet apheresis -> platelets, plasma apheresis -> plasma.

   Eight of these ids (DON-1187, DON-1188, DON-1191 through DON-1196) are the
   source labels inventory-data.js already prints on its batches, so both screens
   talk about the same collection days. The reconciliation between them is
   deliberately thin: a source label attaches to several batches, batches carry no
   donor id, and the label names the batch rather than the session. What is kept
   true is that each of those eight rows shares a collection date with a batch
   carrying its own label, and that every donor, type, interval and points value
   in this ledger is checkable against donors-data.js. Nothing here is derived by
   reading a donor back out of an inventory batch.

   Units per donation follow what one session yields: one bag of whole blood, one
   apheresis platelet unit, two plasma units. donors-data.js writes units: 1 in
   its generated profile history for all three types, which is a simplification of
   that generated fixture rather than a rule this screen has to match.

   The collection dates below are the ones the app already implies: the
   inventory-sourced rows share a date with the batch that carries their label,
   and the four historical rows are the registry's own last-donation dates.
   donors-data.js `lastDonation` is the registry snapshot, so several rows here
   are later than that field; the donations tab is the operational ledger and the
   registry is not rewritten from here. */

import donorData, { NOW, addDays, buildDonorProfile } from '@/features/donors/donors-data.js'
import requestData from '@/features/requests/requests-data.js'
import inventoryData, { nextBatchId } from '@/features/inventory/inventory-data.js'
import { donorTypesFor } from '@/shared/domain'

const { DONORS, DONATION_TYPES } = donorData
const { REQUESTS } = requestData
const { expiryFromCollection, shelfDays } = inventoryData

export const NOW_DAY = NOW.slice(0, 10)

/* Sites and staff mirror the lists behind the Donor Profile history rows. They are
   module-private there, so they are restated here rather than exported from a
   finished feature; the strings are identical so the two screens agree. */
const DONATION_SITES = [
  'Tagaytay City Blood Bank',
  'De La Salle Medical Center, Dasmariñas',
  'Taal Clinical Center',
  'Batangas Medical Center',
]

const DONATION_STAFF = ['M. Santos', 'R. Alona', 'J. Buenaventura', 'C. Dimaculang']

/* The three types the donations screen offers, in the order the selector shows
   them. `value` is the donors-data.js value and the inventory component value;
   `flowLabel` is what the operator reads on the confirmation step. */
const DONATION_FLOW_TYPES = [
  { value: 'whole-blood', flowLabel: 'Whole Blood', units: 1 },
  { value: 'platelets', flowLabel: 'Platelet Apheresis', units: 1 },
  { value: 'plasma', flowLabel: 'Plasma Apheresis', units: 2 },
]

function typeEntry(value) {
  return DONATION_TYPES.find((entry) => entry.value === value) ?? null
}

export function flowLabel(value) {
  return DONATION_FLOW_TYPES.find((entry) => entry.value === value)?.flowLabel ?? value
}

export function unitsFor(value) {
  return DONATION_FLOW_TYPES.find((entry) => entry.value === value)?.units ?? 1
}

/* The four steps of the confirmation flow, in order. They live here because the
   flow hook clamps navigation to this list and the overlay renders it. */
export const FLOW_STEPS = [
  { id: 'cd-step-1', value: 'donor', label: 'Donor' },
  { id: 'cd-step-2', value: 'screening', label: 'Screening' },
  { id: 'cd-step-3', value: 'donation', label: 'Donation' },
  { id: 'cd-step-4', value: 'confirm', label: 'Confirm' },
]

function donorById(donorId) {
  return DONORS.find((entry) => entry.donorId === donorId) ?? null
}

function requestById(requestId) {
  return REQUESTS.find((entry) => entry.requestId === requestId) ?? null
}

/* Requests in these states are closed and cannot take a fresh donation. Same two
   states inventory-data.js treats as closed when it offers stock to issue. */
const CLOSED_REQUEST_STATUSES = ['fulfilled', 'cancelled']

/* A whole-blood collection can be earmarked for a request asking for whole blood
   or for red cells, because red cells are what a whole-blood unit becomes. */
const REQUEST_COMPONENTS = {
  'whole-blood': ['whole-blood', 'rbc'],
  platelets: ['platelets'],
  plasma: ['plasma'],
}

/* ---------------------------------------------------------------- screening --
 * Nothing numeric existed before: the donor checklist only had a "Blood pressure
 * within range" label, and the only clinical figures anywhere in the app were the
 * 11.2 and 11.8 g/dL hemoglobin deferrals already on D-0451 and D-0910. These
 * bands keep both of those on the defer side, so a donor deferred for low
 * hemoglobin cannot be screened back in as a pass. */
const SCREENING_LIMITS = {
  hemoglobin: { pass: 12, defer: 11, unit: 'g/dL' },
  systolic: { min: 100, max: 140, unit: 'mmHg' },
  diastolic: { min: 60, max: 90, unit: 'mmHg' },
}

/* The one place a deferral end date is calculated. Month periods are counted in
   30-day blocks because addDays() from donors-data.js is the only date helper in
   the app, so the screen states a day-accurate date next to the labelled period. */
const DEFERRAL_PERIODS = [
  { value: '1-month', label: '1 month', days: 30 },
  { value: '3-months', label: '3 months', days: 90 },
  { value: '6-months', label: '6 months', days: 180 },
  { value: 'until-cleared', label: 'Until cleared', days: null },
]

const DEFERRAL_REASONS = [
  { value: 'low-hemoglobin', label: 'Low hemoglobin' },
  { value: 'blood-pressure', label: 'Blood pressure out of range' },
  { value: 'recent-donation', label: 'Donated inside the interval' },
  { value: 'illness', label: 'Recent illness or antibiotic course' },
  { value: 'donor-declined', label: 'Donor declined' },
]

/* ----------------------------------------------------------------- ledger ---
 * Twelve donations. Every row satisfies three rules that the data checks re-prove:
 * the donor is eligible for that type, an apheresis donation needs an apheresis
 * donor, and two donations of the same type to the same donor respect the interval
 * from donors-data.js. */
const DONATIONS = [
  { id: 'DON-1187', donorId: 'D-1556', type: 'plasma', units: 2, date: '2023-06-16', linkedRequest: 'REQ-0003', recordedBy: 'C. Dimaculang', site: 'De La Salle Medical Center, Dasmariñas' },
  { id: 'DON-1188', donorId: 'D-1471', type: 'whole-blood', units: 1, date: '2024-05-13', linkedRequest: null, recordedBy: 'R. Alona', site: 'Tagaytay City Blood Bank' },
  { id: 'DON-1191', donorId: 'D-0308', type: 'whole-blood', units: 1, date: '2024-04-23', linkedRequest: null, recordedBy: 'R. Alona', site: 'De La Salle Medical Center, Dasmariñas' },
  { id: 'DON-1192', donorId: 'D-0042', type: 'whole-blood', units: 1, date: '2024-04-21', linkedRequest: null, recordedBy: 'M. Santos', site: 'Taal Clinical Center' },
  { id: 'DON-1193', donorId: 'D-1204', type: 'platelets', units: 1, date: '2024-05-13', linkedRequest: 'REQ-0002', recordedBy: 'J. Buenaventura', site: 'Tagaytay City Blood Bank' },
  { id: 'DON-1194', donorId: 'D-0042', type: 'platelets', units: 1, date: '2024-05-08', linkedRequest: null, recordedBy: 'J. Buenaventura', site: 'De La Salle Medical Center, Dasmariñas' },
  { id: 'DON-1195', donorId: 'D-0117', type: 'whole-blood', units: 1, date: '2024-05-14', linkedRequest: null, recordedBy: 'R. Alona', site: 'Tagaytay City Blood Bank' },
  { id: 'DON-1196', donorId: 'D-1101', type: 'plasma', units: 2, date: '2024-05-09', linkedRequest: null, recordedBy: 'M. Santos', site: 'Batangas Medical Center' },
  { id: 'DON-1179', donorId: 'D-0308', type: 'whole-blood', units: 1, date: '2023-12-08', linkedRequest: null, recordedBy: 'M. Santos', site: 'De La Salle Medical Center, Dasmariñas' },
  { id: 'DON-1180', donorId: 'D-1556', type: 'whole-blood', units: 1, date: '2023-11-19', linkedRequest: null, recordedBy: 'R. Alona', site: 'Batangas Medical Center' },
  { id: 'DON-1181', donorId: 'D-0117', type: 'whole-blood', units: 1, date: '2024-02-14', linkedRequest: null, recordedBy: 'J. Buenaventura', site: 'Tagaytay City Blood Bank' },
  { id: 'DON-1182', donorId: 'D-1471', type: 'whole-blood', units: 1, date: '2024-01-30', linkedRequest: null, recordedBy: 'C. Dimaculang', site: 'Taal Clinical Center' },
]

const DATE_FILTERS = [
  { value: 'all', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: '7-days', label: 'Last 7 days' },
  { value: '30-days', label: 'Last 30 days' },
  { value: '90-days', label: 'Last 90 days' },
]

const DEFAULT_FILTERS = { type: 'all', date: 'all' }
const PAGINATION = { pageSize: 5 }

/* ---------------------------------------------------------------- rewards ---
 * Points per donation type and the bonus rules. The referral bonus is the one
 * rule that already exists in donors-data.js (50 points, granted once a donor
 * passes six donations), so the rules panel reads it from here rather than
 * restating a number that could drift. */
const REFERRAL_BONUS = { value: 'referral', label: 'Referral bonus', points: 50, threshold: 6 }

const REWARD_RULES = {
  referralBonus: REFERRAL_BONUS,
  settingsTarget: 'nav-settings',
}

/* Six rewards. Costs sit either side of the balances donors actually hold
   (100 to 1310) so the affordability hint has both outcomes to show. */
const REWARDS = [
  { id: 'tote', name: 'Canvas tote bag', points: 200, stock: 18, active: true },
  { id: 't-shirt', name: 'Dugo+ T-shirt', points: 300, stock: 42, active: true },
  { id: 'umbrella', name: 'Foldable umbrella', points: 500, stock: 0, active: true },
  { id: 'voucher', name: 'P100 grocery voucher', points: 750, stock: 12, active: true },
  { id: 'certificate', name: 'Certificate of merit', points: 1000, stock: 25, active: true },
  { id: 'jacket', name: 'Dugo+ jacket', points: 1500, stock: 6, active: false },
]

const REDEMPTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

/* Eight requests. RDM-0003 is deliberately above D-0308's balance so the table
   has a shortfall case, and RDM-0005 is the umbrella while stock is 0. */
const REDEMPTIONS = [
  { id: 'RDM-0001', donorId: 'D-1556', rewardId: 'certificate', requested: '2024-05-13', status: 'pending', decision: null },
  { id: 'RDM-0002', donorId: 'D-0042', rewardId: 't-shirt', requested: '2024-05-12', status: 'pending', decision: null },
  { id: 'RDM-0003', donorId: 'D-0308', rewardId: 'jacket', requested: '2024-05-11', status: 'pending', decision: null },
  { id: 'RDM-0004', donorId: 'D-1683', rewardId: 'voucher', requested: '2024-05-10', status: 'approved', decision: '2024-05-10' },
  { id: 'RDM-0005', donorId: 'D-1471', rewardId: 'umbrella', requested: '2024-05-09', status: 'rejected', decision: '2024-05-09' },
  { id: 'RDM-0006', donorId: 'D-0895', rewardId: 't-shirt', requested: '2024-05-08', status: 'rejected', decision: '2024-05-08' },
  { id: 'RDM-0007', donorId: 'D-1204', rewardId: 'tote', requested: '2024-05-08', status: 'approved', decision: '2024-05-09' },
  { id: 'RDM-0008', donorId: 'D-1471', rewardId: 't-shirt', requested: '2024-05-07', status: 'pending', decision: null },
]

const LEADERBOARD_SIZE = 10

/* ---------------------------------------------------------------- helpers -- */

function parseDay(value) {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function daysBetween(from, to) {
  return Math.round((parseDay(to) - parseDay(from)) / 86400000)
}

export function donationRowId(donationId) {
  return `donations-row-${donationId}`
}

export function nextDonationId(added = []) {
  const highest = [...DONATIONS, ...added].reduce((max, entry) => {
    const digits = Number(String(entry.id).slice(4))
    return Number.isFinite(digits) ? Math.max(max, digits) : max
  }, 1186)
  return `DON-${highest + 1}`
}

/* ---------------------------------------------------------------- builders - */

/* One ledger row plus everything the table, the chart and the profile need. */
function decorate(entry) {
  const donor = donorById(entry.donorId)
  const type = typeEntry(entry.type)
  const request = entry.linkedRequest ? requestById(entry.linkedRequest) : null

  return {
    ...entry,
    id: entry.id,
    rowId: donationRowId(entry.id),
    donorId: entry.donorId,
    donorName: donor?.name ?? entry.donorId,
    bloodType: donor?.bloodType ?? '—',
    typeLabel: type?.label ?? entry.type,
    flowLabel: flowLabel(entry.type),
    component: entry.type,
    pointsAwarded: type?.points ?? 0,
    intervalDays: type?.intervalDays ?? 0,
    linkedRequestLabel: request ? `${request.requestId} — ${request.patient}` : null,
    site: entry.site,
    recordedBy: entry.recordedBy,
    isNew: false,
  }
}

export function buildDonationRows(donations = DONATIONS, filters = DEFAULT_FILTERS) {
  const window = daysBetween(addDays(NOW_DAY, -90), NOW_DAY)

  return donations
    .map(decorate)
    .filter((row) => (filters.type === 'all' ? true : row.component === filters.type))
    .filter((row) => {
      if (filters.date === 'all') return true
      if (filters.date === 'today') return row.date === NOW_DAY
      const span = daysBetween(row.date, NOW_DAY)
      if (filters.date === '7-days') return span <= 7
      if (filters.date === '30-days') return span <= 30
      return span <= window
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

/* Donation type mix for the chart box. Derived from the ledger rather than
   hardcoded, so the chart cannot disagree with the table above it. */
export function buildDonationsByType(donations = DONATIONS) {
  return DONATION_FLOW_TYPES.map((entry) => {
    const forType = donations.filter((row) => row.type === entry.value)

    return {
      id: `donations-by-type-${entry.value}`,
      type: entry.value,
      label: entry.flowLabel,
      donations: forType.length,
      units: forType.reduce((total, row) => total + row.units, 0),
    }
  })
}

/* The step-1 donor picker. It lists every donor who is still on the registry,
   each carrying why it can or cannot give this type today: the per-type
   eligibility string from donors-data.js, the apheresis flag for platelets and
   plasma, the interval measured from the newest donation of the same type, and
   the record status. Donors inside an interval stay in the list because the
   operator still needs to see them and the date they become eligible — they are
   simply not selectable. Inactive and deactivated records are left out: they are
   not candidates for a drive. */
export function buildDonorOptions(type, donations = DONATIONS) {
  const entry = typeEntry(type)
  if (!entry) return []

  const candidates = DONORS.filter((donor) => donor.status === 'active' || donor.status === 'deferred')

  return candidates
    .map((donor) => {
      const eligibility = donor.eligibility[type]
      const needsApheresis = type !== 'whole-blood'
      const lastOfType = donations
        .filter((row) => row.donorId === donor.donorId && row.type === type)
        .reduce((latest, row) => (row.date > latest ? row.date : latest), donor.lastDonation)
      const daysSince = daysBetween(lastOfType, NOW_DAY)
      const nextEligible = addDays(lastOfType, entry.intervalDays)

      let state = 'eligible'
      let reason = ''

      if (eligibility !== 'eligible') {
        state = eligibility.startsWith('Permanently') ? 'permanently-deferred' : 'deferred'
        reason = eligibility
      } else if (needsApheresis && !donor.apheresisEligible) {
        state = 'deferred'
        reason = `Not apheresis-eligible — ${type === 'platelets' ? 'apheresis access' : 'apheresis donor'} required`
      } else if (daysSince < entry.intervalDays) {
        state = 'deferred'
        reason = `Gave ${flowLabel(type).toLowerCase()} ${daysSince === 0 ? 'today' : `${daysSince} days ago`} — next eligible ${nextEligible}`
      } else if (donor.status === 'deferred') {
        state = 'deferred'
        reason = donor.deferrals?.[0]?.reason ?? 'Record deferred'
      }

      return {
        id: `cd-donor-${donor.donorId}`,
        donorId: donor.donorId,
        name: donor.name,
        bloodType: donor.bloodType,
        totalDonations: donor.totalDonations,
        lastDonation: donor.lastDonation,
        daysSince,
        nextEligible,
        points: donor.points,
        apheresisRequired: needsApheresis,
        state,
        reason,
        selectable: state === 'eligible',
      }
    })
    .sort(
      (a, b) =>
        Number(b.selectable) - Number(a.selectable) ||
        a.daysSince - b.daysSince ||
        a.donorId.localeCompare(b.donorId),
    )
}

/* Just the donors that can be picked right now. */
export function buildEligibleDonors(type, donations = DONATIONS) {
  return buildDonorOptions(type, donations).filter((option) => option.selectable)
}

/* A blank field is a missing reading, not a zero: the operator has not typed it
   yet, so the check reports unknown rather than failing the donor. */
function readingOf(value) {
  const text = typeof value === 'string' ? value.trim() : value
  if (text === '' || text === null || text === undefined) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

/* Open requests this donor could actually fill with this donation type, for the
   "link to request" picker in step 1. Compatibility comes from the shared
   blood-compat rules rather than a second copy of the ABO table. */
export function buildRequestOptions(donorId, type) {
  const donor = donorById(donorId)
  const components = REQUEST_COMPONENTS[type]
  if (!donor || !components) return []

  return REQUESTS.filter(
    (request) =>
      !CLOSED_REQUEST_STATUSES.includes(request.status) &&
      components.includes(request.component) &&
      donorTypesFor(request.component, request.bloodType).includes(donor.bloodType),
  ).map((request) => ({
    id: `cd-request-${request.requestId}`,
    requestId: request.requestId,
    patient: request.patient,
    label: `${request.requestId} — ${request.patient}`,
    bloodType: request.bloodType,
    component: request.component,
    componentLabel: request.componentLabel,
    status: request.status,
    quantity: request.quantity,
  }))
}

/* Screening verdict for one set of readings. */
export function evaluateScreening({ hemoglobin, systolic, diastolic }) {
  const hb = readingOf(hemoglobin)
  const sys = readingOf(systolic)
  const dia = readingOf(diastolic)
  const { hemoglobin: hbLimits, systolic: sysLimits, diastolic: diaLimits } = SCREENING_LIMITS

  const checks = [
    {
      id: 'cd-check-hemoglobin',
      label: 'Hemoglobin',
      reading: hb === null ? '—' : `${hb} ${hbLimits.unit}`,
      state: hb === null ? 'unknown' : hb >= hbLimits.pass ? 'pass' : hb >= hbLimits.defer ? 'warn' : 'fail',
    },
    {
      id: 'cd-check-systolic',
      label: 'Systolic',
      reading: sys === null ? '—' : `${sys}/${dia === null ? '—' : dia} ${sysLimits.unit}`,
      state: sys === null || dia === null
        ? 'unknown'
        : sys >= sysLimits.min && sys <= sysLimits.max && dia >= diaLimits.min && dia <= diaLimits.max
          ? 'pass'
          : 'warn',
    },
  ]

  const states = checks.map((check) => check.state)
  const outcome = states.includes('unknown')
    ? 'unknown'
    : states.includes('fail')
      ? 'permanently-deferred'
      : states.includes('warn')
        ? 'deferred'
        : 'eligible'

  return {
    outcome,
    checks,
    eligible: outcome === 'eligible',
    summary:
      outcome === 'eligible'
        ? 'Vitals within range — cleared to donate'
        : outcome === 'deferred'
          ? 'Outside the collection range — record a deferral'
          : outcome === 'permanently-deferred'
            ? 'Below the permanent cutoff — refer to a physician'
            : 'Record the readings to continue',
  }
}

export function deferralSummary(reason, period) {
  const entry = DEFERRAL_PERIODS.find((item) => item.value === period) ?? DEFERRAL_PERIODS[0]
  return {
    reason,
    reasonLabel: DEFERRAL_REASONS.find((item) => item.value === reason)?.label ?? reason,
    period: entry.value,
    periodLabel: entry.label,
    nextEligible: entry.days === null ? 'on medical clearance' : addDays(NOW_DAY, entry.days),
  }
}

/* Points the donor would earn, with the referral bonus called out separately so
   step 3 can show why the number is not simply the type value. */
export function buildPointsPreview(donorId, type) {
  const donor = donorById(donorId)
  const entry = typeEntry(type)
  const base = entry?.points ?? 0
  const earnsReferral = donor ? donor.totalDonations + 1 >= REFERRAL_BONUS.threshold && donor.totalDonations < REFERRAL_BONUS.threshold : false

  return {
    id: 'cd-points-preview',
    base,
    bonus: earnsReferral ? REFERRAL_BONUS.points : 0,
    bonusLabel: REFERRAL_BONUS.label,
    total: base + (earnsReferral ? REFERRAL_BONUS.points : 0),
    balance: donor?.points ?? 0,
    projected: (donor?.points ?? 0) + base + (earnsReferral ? REFERRAL_BONUS.points : 0),
    reason: earnsReferral
      ? `Donation ${donor.totalDonations + 1} crosses the ${REFERRAL_BONUS.threshold}-donation referral threshold`
      : `Base award for ${flowLabel(type)}`,
  }
}

/* What step 4 commits: the batch that will exist in inventory afterwards. */
export function buildBatchPreview(donationId, donorId, type, collected = NOW_DAY, added = []) {
  const donor = donorById(donorId)
  return {
    id: 'cd-batch-preview',
    batch: nextBatchId(added),
    donationId,
    source: donationId,
    bloodType: donor?.bloodType ?? '—',
    component: type,
    componentLabel: typeEntry(type)?.label ?? type,
    units: unitsFor(type),
    collected,
    expiry: expiryFromCollection(collected, type),
    shelfDays: shelfDays(type),
    status: 'Quarantine',
  }
}

export function buildRedemptions(redemptions = REDEMPTIONS) {
  return redemptions.map((entry) => {
    const donor = donorById(entry.donorId)
    const reward = REWARDS.find((item) => item.id === entry.rewardId)
    const balance = donor?.points ?? 0

    return {
      ...entry,
      rowId: `rewards-redemption-row-${entry.id}`,
      donorName: donor?.name ?? entry.donorId,
      bloodType: donor?.bloodType ?? '—',
      rewardName: reward?.name ?? entry.rewardId,
      points: reward?.points ?? 0,
      stock: reward?.stock ?? 0,
      rewardActive: reward?.active ?? false,
      balance,
      shortfall: balance - (reward?.points ?? 0),
      affordable: balance >= (reward?.points ?? 0),
    }
  })
}

export function setRedemptionStatus(redemptions, redemptionId, status) {
  return redemptions.map((entry) =>
    entry.id === redemptionId ? { ...entry, status, decision: status === 'pending' ? null : NOW_DAY } : entry,
  )
}

/* Top ten by balance. Ties break on name then id so the order is stable between
   the server and the client. */
export function buildLeaderboard(donors = DONORS) {
  return [...donors]
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name) || a.donorId.localeCompare(b.donorId))
    .slice(0, LEADERBOARD_SIZE)
    .map((donor, index) => ({
      id: `rewards-leaderboard-row-${donor.donorId}`,
      rank: index + 1,
      donorId: donor.donorId,
      name: donor.name,
      bloodType: donor.bloodType,
      points: donor.points,
      totalDonations: donor.totalDonations,
      city: donor.city,
      pending: (donor.points % 100) + 50,
    }))
}

export function buildRewards(rewards = REWARDS) {
  return rewards.map((reward) => ({
    ...reward,
    cardId: `rewards-card-${reward.id}`,
    available: reward.active && reward.stock > 0,
  }))
}

export function buildRules() {
  return DONATION_FLOW_TYPES.map((entry) => {
    const source = typeEntry(entry.value)
    return {
      id: `rewards-rules-type-${entry.value}`,
      type: entry.value,
      label: entry.flowLabel,
      points: source?.points ?? 0,
      intervalDays: source?.intervalDays ?? 0,
    }
  })
}

export default {
  NOW,
  NOW_DAY,
  FLOW_STEPS,
  DONATION_FLOW_TYPES,
  DATE_FILTERS,
  DEFAULT_FILTERS,
  PAGINATION,
  SCREENING_LIMITS,
  DEFERRAL_PERIODS,
  DEFERRAL_REASONS,
  REWARD_RULES,
  REWARDS,
  REDEMPTION_STATUSES,
  REDEMPTIONS,
  DONATIONS,
  LEADERBOARD_SIZE,
  donationRowId,
  nextDonationId,
  unitsFor,
  flowLabel,
  daysBetween,
  buildDonationRows,
  buildDonationsByType,
  buildDonorOptions,
  buildEligibleDonors,
  buildRequestOptions,
  evaluateScreening,
  deferralSummary,
  buildPointsPreview,
  buildBatchPreview,
  buildRedemptions,
  setRedemptionStatus,
  buildLeaderboard,
  buildRewards,
  buildRules,
  buildDonorProfile,
  DONATION_SITES,
  DONATION_STAFF,
}