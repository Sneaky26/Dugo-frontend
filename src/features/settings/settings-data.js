/* Settings data.

   Every default here is read from the module that already enforces the rule, so a
   number in this file cannot drift from the screen that uses it:

     - compatibility grid  <- donorTypesFor() in shared/domain/blood-compat.js
     - donation intervals, points, deferral reasons, screening limits
                           <- donors-data.js and donations-rewards-data.js
     - shelf life, statuses <- inventory-data.js
     - radius defaults      <- matching-data.js

   The store is session-local, the way the inventory ledger's writes are: saving a
   section stamps "last edited" and nothing else in the app changes until a reload
   picks up new defaults. Nothing is written to disk. */

import inventoryData from '@/features/inventory/inventory-data.js'
import donationsData from '@/features/donations/donations-rewards-data.js'
import { BLOOD_TYPES, DONATION_TYPES, NOW } from '@/features/donors/donors-data.js'
import requestData from '@/features/requests/requests-data.js'
import { DEFAULT_RADIUS_KM, FALLBACK_REASONS, MAX_RADIUS_KM } from '@/features/matching/matching-data.js'
import { donorTypesFor } from '@/shared/domain'

export { BLOOD_TYPES, DONATION_TYPES, NOW }

const { SHELF_LIFE, STATUSES } = inventoryData
const { DEFERRAL_REASONS, REWARDS, REWARD_RULES, SCREENING_LIMITS } = donationsData

export const COMPONENTS = inventoryData.COMPONENTS
export const DONATION_STAFF = donationsData.DONATION_STAFF

/* The signed-in operator. Nothing else in the app stores a session, so "last
   edited by" is this name until a real auth layer lands. */
export const CURRENT_USER = 'C. Dimaculang'

/* The left sub-nav, in the order the sections are shown. The nav id is
   `settings-nav-${id}`, which is also the prefix the content area uses. */
export const SECTIONS = [
  { id: 'facility', label: 'Facility' },
  { id: 'staff', label: 'Staff & access' },
  { id: 'compatibility', label: 'Blood compatibility' },
  { id: 'eligibility', label: 'Donor eligibility' },
  { id: 'inventory', label: 'Inventory rules' },
  { id: 'matching', label: 'Matching rules' },
  { id: 'templates', label: 'Message templates' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'privacy', label: 'Privacy & access' },
  { id: 'staff-alerts', label: 'Staff alerts' },
]

/* Compatibility and eligibility decide who may give blood to whom and who may be
   asked to give at all. Saving either one asks for confirmation first. */
export const HIGH_IMPACT_SECTIONS = ['compatibility', 'eligibility']

export const ROLES = [
  { id: 'role-admin', value: 'admin', label: 'Admin', seats: 1 },
  { id: 'role-blood-bank-staff', value: 'blood-bank-staff', label: 'Blood Bank Staff', seats: 4 },
  { id: 'role-hospital-coordinator', value: 'hospital-coordinator', label: 'Hospital Coordinator', seats: 2 },
]

/* The permission matrix. Rows are capabilities the app already gates somewhere:
   the reveal modal, the fallback override, discards, high-impact settings, and the
   two-factor and export controls from the privacy section. */
export const PERMISSIONS = [
  { id: 'permission-view-donors', value: 'view-donors', label: 'View donor records' },
  { id: 'permission-reveal-contact', value: 'reveal-contact', label: 'Reveal contact details' },
  { id: 'permission-edit-donors', value: 'edit-donors', label: 'Edit donor records' },
  { id: 'permission-record-donation', value: 'record-donation', label: 'Record donations' },
  { id: 'permission-approve-redemption', value: 'approve-redemption', label: 'Approve redemptions' },
  { id: 'permission-issue-units', value: 'issue-units', label: 'Issue units' },
  { id: 'permission-discard-units', value: 'discard-units', label: 'Discard units' },
  { id: 'permission-override-matching', value: 'override-matching', label: 'Override a match' },
  { id: 'permission-edit-high-impact', value: 'edit-high-impact', label: 'Edit compatibility & eligibility' },
  { id: 'permission-export-data', value: 'export-data', label: 'Export data' },
]

/* Baseline "last edited" per section, so a section that has never been touched
   still states who set it up and when. */
export const LAST_EDITED = {
  facility: { by: 'C. Dimaculang', at: '2024-05-02' },
  staff: { by: 'C. Dimaculang', at: '2024-05-06' },
  compatibility: { by: 'C. Dimaculang', at: '2024-04-28' },
  eligibility: { by: 'C. Dimaculang', at: '2024-04-28' },
  inventory: { by: 'M. Santos', at: '2024-05-09' },
  matching: { by: 'J. Buenaventura', at: '2024-05-11' },
  templates: { by: 'R. Alona', at: '2024-05-03' },
  rewards: { by: 'R. Alona', at: '2024-05-03' },
  privacy: { by: 'C. Dimaculang', at: '2024-05-13' },
  'staff-alerts': { by: 'J. Buenaventura', at: '2024-05-12' },
}

/* --------------------------------------------------------------- facility --- */
const facilityDefaults = {
  name: 'Tagaytay City Blood Bank',
  chapter: 'Dugo+ Cavite Chapter',
  address: '789 Rizal Street, Tagaytay City, Cavite 4220',
  hours: 'Mon-Sat 07:00-19:00 · On-call 19:00-07:00',
  contact: '+63 917 555 0100',
  licence: 'DOH-CAV-2019-0442',
}

/* ------------------------------------------------------------------ staff --- */
/* The four people the rest of the app already records work against: the names come
   from donations-rewards-data.js DONATION_STAFF, and the roles are the ones the
   audit log files them under. */
const staffDefaults = {
  users: [
    {
      id: 'settings-staff-user-M-Santos',
      name: 'M. Santos',
      fullName: 'Maria Santos',
      role: 'blood-bank-staff',
      email: 'm.santos@dugo.ph',
      status: 'active',
      lastActive: '2024-05-14T08:45',
      twoFactor: true,
    },
    {
      id: 'settings-staff-user-R-Alona',
      name: 'R. Alona',
      fullName: 'Rhea Alona',
      role: 'blood-bank-staff',
      email: 'r.alona@dugo.ph',
      status: 'active',
      lastActive: '2024-05-14T08:12',
      twoFactor: false,
    },
    {
      id: 'settings-staff-user-J-Buenaventura',
      name: 'J. Buenaventura',
      fullName: 'Joel Buenaventura',
      role: 'blood-bank-staff',
      email: 'j.buenaventura@dugo.ph',
      status: 'active',
      lastActive: '2024-05-13T17:22',
      twoFactor: true,
    },
    {
      id: 'settings-staff-user-C-Dimaculang',
      name: 'C. Dimaculang',
      fullName: 'Celina Dimaculang',
      role: 'admin',
      email: 'c.dimaculang@dugo.ph',
      status: 'active',
      lastActive: '2024-05-14T07:58',
      twoFactor: true,
    },
  ],
  invites: [
    {
      id: 'settings-staff-invite-1',
      email: 'coord@tagmed.ph',
      role: 'hospital-coordinator',
      sent: '2024-05-13',
      status: 'pending',
    },
  ],
  permissions: {
    admin: Object.fromEntries(PERMISSIONS.map((permission) => [permission.value, true])),
    'blood-bank-staff': {
      'view-donors': true,
      'reveal-contact': true,
      'edit-donors': true,
      'record-donation': true,
      'approve-redemption': true,
      'issue-units': true,
      'discard-units': true,
      'override-matching': true,
      'edit-high-impact': false,
      'export-data': false,
    },
    'hospital-coordinator': {
      'view-donors': true,
      'reveal-contact': false,
      'edit-donors': false,
      'record-donation': false,
      'approve-redemption': false,
      'issue-units': false,
      'discard-units': false,
      'override-matching': false,
      'edit-high-impact': false,
      'export-data': false,
    },
  },
}

/* ---------------------------------------------------------- compatibility --- */
/* Only the clinical reasons are emergency-release reasons. "No compatible donors
   within radius" belongs to the fallback tiers, so it is filtered out of the list
   rather than copied, and the reasons come from matching-data.js itself. */
const RADIUS_SHORTFALL = 'No compatible donors within radius'

/* One row per recipient type, one column per donor type, per component. The cells
   are generated from blood-compat.js so the default grid is exactly what the
   matcher enforces today. */
function compatibilityDefaults() {
  const grid = {}

  for (const component of COMPONENTS) {
    const cells = {}

    for (const recipient of BLOOD_TYPES) {
      const allowed = donorTypesFor(component.value, recipient)
      cells[recipient] = Object.fromEntries(BLOOD_TYPES.map((donor) => [donor, allowed.includes(donor)]))
    }

    grid[component.value] = cells
  }

  return {
    grid,
    fallbackEnabled: true,
    emergencyRelease: true,
    negativeFirst: true,
    emergencyReasons: FALLBACK_REASONS.filter((reason) => reason !== RADIUS_SHORTFALL),
  }
}

/* ------------------------------------------------------------- eligibility --- */
function eligibilityDefaults() {
  return {
    intervals: Object.fromEntries(DONATION_TYPES.map((type) => [type.value, type.intervalDays])),
    minAge: 18,
    maxAge: 65,
    minWeight: 50,
    maxUnitsPerDay: 2,
    screening: {
      hemoglobin: { ...SCREENING_LIMITS.hemoglobin },
      systolic: { ...SCREENING_LIMITS.systolic },
      diastolic: { ...SCREENING_LIMITS.diastolic },
    },
    reasons: DEFERRAL_REASONS.map((reason) => ({ ...reason, enabled: true })),
  }
}

/* --------------------------------------------------------- inventory rules --- */
function inventoryDefaults() {
  const thresholds = {}

  for (const component of COMPONENTS) {
    thresholds[component.value] = { low: 10, critical: 4 }
  }

  return {
    shelfLife: { ...SHELF_LIFE },
    expiringSoonDays: 7,
    thresholds,
    holdMinutes: 120,
    fefo: true,
    quarantine: true,
    autoDiscard: false,
    statuses: STATUSES.map((status) => status.value),
  }
}

/* --------------------------------------------------------- matching rules --- */
function matchingDefaults() {
  return {
    defaultRadiusKm: DEFAULT_RADIUS_KM,
    maxRadiusKm: MAX_RADIUS_KM,
    waveMultiplier: 1,
    expandMinutes: { urgent: 5, stat: 10, routine: 20 },
    cooldownMinutes: 15,
    autoStop: true,
    autoStopAfterWaves: 3,
  }
}

/* -------------------------------------------------------------- templates --- */
export const CHANNELS = [
  { id: 'settings-templates-channel-sms', value: 'sms', label: 'SMS', limit: 160 },
  { id: 'settings-templates-channel-email', value: 'email', label: 'Email', limit: 0 },
]

export const TEMPLATE_EVENTS = [
  { id: 'request-matched', value: 'request-matched', label: 'Donor matched to a request' },
  { id: 'request-cancelled', value: 'request-cancelled', label: 'Request cancelled or filled' },
  { id: 'donation-thanks', value: 'donation-thanks', label: 'Donation recorded' },
  { id: 'redemption-update', value: 'redemption-update', label: 'Reward redemption update' },
  { id: 'low-stock', value: 'low-stock', label: 'Stock dropped below threshold' },
  { id: 'expiring-units', value: 'expiring-units', label: 'Units nearing expiry' },
]

/* One body per event and channel. The component label is filled in per component
   tab when the defaults are built, so the twelve texts stay in step instead of
   being copied five times over. */
const MESSAGE_BODIES = {
  'request-matched': {
    sms: 'Hi {{donorFirst}}, {{facility}} needs {{component}} {{bloodType}} for {{requestId}}. Open {{link}} to confirm your slot.',
    email: 'Hi {{donorFirst}},\n\n{{facility}} needs {{units}} unit(s) of {{component}} {{bloodType}} for {{requestId}} ({{ward}}), needed by {{requiredBy}}.\n\nOpen {{link}} to confirm your slot. Every donation counts.',
  },
  'request-cancelled': {
    sms: 'Hi {{donorFirst}}, {{requestId}} for {{component}} was closed. Thank you for offering - we will keep your details on file.',
    email: 'Hi {{donorFirst}},\n\n{{requestId}} for {{component}} {{bloodType}} has been closed. Nothing further is needed from you. Thank you for offering.',
  },
  'donation-thanks': {
    sms: 'Thank you {{donorFirst}}! Your {{component}} donation on {{date}} earned {{points}} points.',
    email: 'Thank you {{donorFirst}},\n\nYour {{component}} donation on {{date}} has been recorded and earned {{points}} points. Your next {{component}} slot opens after the interval shown on your donor record.',
  },
  'redemption-update': {
    sms: '{{donorFirst}}, your reward request was {{redemptionStatus}}. {{reward}} is ready at {{facility}}.',
    email: 'Hi {{donorFirst}},\n\nYour reward request for {{reward}} was {{redemptionStatus}}. Bring a valid ID to {{facility}} to claim it.',
  },
  'low-stock': {
    sms: 'Dugo+ {{facility}}: {{component}} is low ({{units}}u on hand). Please review the priority list.',
    email: 'Dugo+ {{facility}} inventory alert\n\n{{component}} has {{units}} unit(s) on hand and has dropped below its low-stock threshold. Review the priority list before the next wave.',
  },
  'expiring-units': {
    sms: 'Dugo+ {{facility}}: {{units}} {{component}} unit(s) expire on {{date}}. Issue them first (FEFO).',
    email: 'Dugo+ {{facility}} expiry alert\n\n{{units}} unit(s) of {{component}} expire on {{date}}. Issue them first under the FEFO rule, or move them to quarantine if the cold chain was broken.',
  },
}

export const TEMPLATE_VARIABLES = [
  { id: 'donorFirst', label: 'Donor first name' },
  { id: 'donorName', label: 'Donor name' },
  { id: 'requestId', label: 'Request id' },
  { id: 'component', label: 'Component' },
  { id: 'bloodType', label: 'Blood type' },
  { id: 'units', label: 'Units' },
  { id: 'ward', label: 'Ward' },
  { id: 'facility', label: 'Facility' },
  { id: 'requiredBy', label: 'Required by' },
  { id: 'date', label: 'Date' },
  { id: 'link', label: 'App link' },
  { id: 'points', label: 'Points earned' },
  { id: 'reward', label: 'Reward' },
  { id: 'redemptionStatus', label: 'Redemption status' },
]

/* The preview renders against REQ-0001, the same request the matching screen opens
   on, so the sample text is the text an operator would really send. */
const SAMPLE_REQUEST = requestData.REQUESTS.find((request) => request.requestId === 'REQ-0001')

const SAMPLE_VARIABLES = {
  donorFirst: 'Ana',
  donorName: 'Ana Reyes',
  requestId: SAMPLE_REQUEST.requestId,
  component: SAMPLE_REQUEST.componentLabel,
  bloodType: SAMPLE_REQUEST.bloodType,
  units: SAMPLE_REQUEST.quantity,
  ward: SAMPLE_REQUEST.ward,
  facility: facilityDefaults.name,
  requiredBy: SAMPLE_REQUEST.requiredBy,
  date: '14 May 2024',
  link: 'dugo.app/r/REQ-0001',
  points: 150,
  reward: 'Dugo+ T-shirt',
  redemptionStatus: 'approved',
}

function templateDefaults() {
  const bodies = {}

  for (const event of TEMPLATE_EVENTS) {
    bodies[event.value] = {}

    for (const channel of CHANNELS) {
      bodies[event.value][channel.value] = {}

      for (const component of COMPONENTS) {
        const filled = MESSAGE_BODIES[event.value][channel.value]
          .replace(/\{\{component\}\}/g, component.label.toLowerCase())
          .replace(/\{\{bloodType\}\}/g, SAMPLE_REQUEST.bloodType)

        bodies[event.value][channel.value][component.value] = filled
      }
    }
  }

  return { channel: 'sms', bodies, fallbackToEmail: true, sendTest: null }
}

/* ---------------------------------------------------------------- rewards --- */
function rewardsDefaults() {
  return {
    points: Object.fromEntries(DONATION_TYPES.map((type) => [type.value, type.points])),
    referralBonus: REWARD_RULES.referralBonus.points,
    referralThreshold: REWARD_RULES.referralBonus.threshold,
    birthdayBonus: 25,
    expiryMonths: 24,
    requireApproval: true,
    catalog: REWARDS.map((reward) => ({ ...reward })),
  }
}

/* ---------------------------------------------------------------- privacy --- */
const CONSENT_TEXT =
  'I consent to Dugo+ collecting my personal data for blood donation, matching and reporting purposes, and I understand I may request access, correction or deletion of my record at any time.'

const DATA_REQUESTS = [
  {
    id: 'settings-privacy-request-1',
    kind: 'Access',
    subject: 'D-0117 Ramon Bautista',
    requested: '2024-05-12',
    due: '2024-06-11',
    status: 'open',
  },
  {
    id: 'settings-privacy-request-2',
    kind: 'Correction',
    subject: 'D-1471',
    requested: '2024-05-10',
    due: '2024-06-09',
    status: 'open',
  },
  {
    id: 'settings-privacy-request-3',
    kind: 'Deletion',
    subject: 'D-1556',
    requested: '2024-04-28',
    due: '2024-05-28',
    status: 'in-review',
  },
]

function privacyDefaults() {
  return {
    consentText: CONSENT_TEXT,
    retentionMonths: 120,
    maskContact: true,
    maskEmail: true,
    maskAddress: true,
    maskBirthdate: false,
    sessionTimeoutMinutes: 15,
    twoFactor: false,
    twoFactorRoles: ['admin'],
    requests: DATA_REQUESTS.map((request) => ({ ...request })),
  }
}

/* ----------------------------------------------------------- staff alerts --- */
const ALERT_EVENTS = [
  { id: 'new-request', label: 'New blood request' },
  { id: 'urgent-request', label: 'Urgent request opened' },
  { id: 'match-confirmed', label: 'Donor accepted a wave' },
  { id: 'stock-low', label: 'Stock below low threshold' },
  { id: 'units-expiring', label: 'Units nearing expiry' },
  { id: 'quarantine-failed', label: 'Cold chain check failed' },
  { id: 'override-used', label: 'Fallback override used' },
  { id: 'redemption-pending', label: 'Reward redemption awaiting approval' },
]

export const ALERT_CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'in-app', label: 'In-app' },
]

function staffAlertDefaults() {
  return {
    events: ALERT_EVENTS.map((event) => ({
      id: event.id,
      label: event.label,
      channels: {
        email: event.id === 'stock-low' || event.id === 'units-expiring' || event.id === 'urgent-request',
        sms: event.id === 'urgent-request' || event.id === 'quarantine-failed' || event.id === 'override-used',
        'in-app': true,
      },
    })),
  }
}

/* ---------------------------------------------------------------- defaults --- */
const DEFAULTS = {
  facility: facilityDefaults,
  staff: staffDefaults,
  compatibility: compatibilityDefaults(),
  eligibility: eligibilityDefaults(),
  inventory: inventoryDefaults(),
  matching: matchingDefaults(),
  templates: templateDefaults(),
  rewards: rewardsDefaults(),
  privacy: privacyDefaults(),
  'staff-alerts': staffAlertDefaults(),
}

/* --------------------------------------------------------------- helpers --- */

export function isHighImpact(sectionId) {
  return HIGH_IMPACT_SECTIONS.includes(sectionId)
}

export function navIdFor(sectionId) {
  return `settings-nav-${sectionId}`
}

export function fieldId(sectionId, name) {
  return `settings-${sectionId}-${name}`
}

/* Deep clone through JSON so a draft cannot write into the saved defaults. */
export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function defaultFor(sectionId) {
  return clone(DEFAULTS[sectionId] ?? {})
}

export function isDirty(sectionId, draft, saved) {
  return JSON.stringify(draft) !== JSON.stringify(saved)
}

/* Changed field names, so the high-impact modal can list what is about to change
   instead of asking the operator to trust a warning. */
export function changedFields(before, after) {
  return [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter(
    (key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]),
  )
}

export function renderTemplate(body, variables = SAMPLE_VARIABLES) {
  return String(body ?? '').replace(/\{\{(\w+)\}\}/g, (match, name) =>
    variables[name] === undefined ? match : String(variables[name]),
  )
}

/* SMS segments: 160 characters, or 320 when the message has to be split. */
export function smsUsage(body) {
  const length = String(body ?? '').length

  return { length, limit: 160, over: length > 160, segments: length === 0 ? 0 : Math.ceil(length / 160) }
}

/* Only SMS is segmented. Email has no per-message limit, so it reports length with
   a limit of 0, which the counter renders as an em dash. */
export function channelUsage(body, channel = 'sms') {
  if (channel === 'email') {
    return { length: String(body ?? '').length, limit: 0, over: false, segments: 0 }
  }

  return smsUsage(body)
}

export function nextInviteId(invites = []) {
  const highest = invites.reduce((max, invite) => Math.max(max, Number(String(invite.id).split('-').pop()) || 0), 0)

  return `settings-staff-invite-${highest + 1}`
}

export default {
  CURRENT_USER,
  SECTIONS,
  HIGH_IMPACT_SECTIONS,
  ROLES,
  PERMISSIONS,
  LAST_EDITED,
  BLOOD_TYPES,
  COMPONENTS,
  DONATION_TYPES,
  DONATION_STAFF,
  CHANNELS,
  TEMPLATE_EVENTS,
  TEMPLATE_VARIABLES,
  MESSAGE_BODIES,
  SAMPLE_VARIABLES,
  ALERT_CHANNELS,
  NOW,
  DEFAULTS,
  isHighImpact,
  navIdFor,
  fieldId,
  clone,
  defaultFor,
  isDirty,
  changedFields,
  renderTemplate,
  smsUsage,
  channelUsage,
  nextInviteId,
}