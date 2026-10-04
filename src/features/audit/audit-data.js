/* Audit trail data.

   The log records who did what to which record, from which device, with the
   before and after values for every change. It is the record the rest of the app
   already promises:

     - the reveal modal (donors/RevealReasonModal.jsx) says "This action is logged
       with your name, the reason, and the timestamp" and carries data-logged="true",
       so the contact reveals below are the rows that promise produces. The reason
       text is taken from REVEAL_REASONS in donors-data.js.
     - inventory-data.js buildBatchHistory() dates the B2431-O- issue at
       2024-05-14 08:45 by Maria Santos, and pulls the expired B2429-O+ at
       2024-05-14 07:00 on Cold Chain 2. Those two timestamps are used here
       unchanged, so the log and the batch drawer cannot disagree.
     - the fallback override uses a reason from matching-data.js FALLBACK_REASONS.

   Staff names come from donors-data.js DONATION_STAFF, which is the same list the
   donations ledger records collections against. M. Santos is Maria Santos, the
   operator in inventory-data.js. Roles are this screen's own addition: nothing
   else in the app stores a role per person.

   Six entries, newest first: five from the fixed NOW day and one older entry dated
   from the deferral already on D-0451 in donors-data.js, so the date filter has a
   row it can actually drop. Four action types (view, override, issue, edit) and
   four record types (donor, request, inventory, donation) so every filter narrows
   something.

   Entries 1 to 3 are the actions the screen has to be able to show: an issued
   unit, a viewed donor contact and a fallback override. */

import { NOW, REVEAL_REASONS } from '@/features/donors/donors-data.js'
import { FALLBACK_REASONS } from '@/features/matching/matching-data.js'

const NOW_DAY = NOW.slice(0, 10)

/* The four people who appear in the log, with the role each entry is filed under. */
const STAFF = [
  { id: 'audit-staff-M-Santos', name: 'M. Santos', role: 'Inventory officer', device: 'Desktop · Chrome', ip: '10.0.4.21' },
  { id: 'audit-staff-R-Alona', name: 'R. Alona', role: 'Registry officer', device: 'Desktop · Chrome', ip: '10.0.4.18' },
  { id: 'audit-staff-J-Buenaventura', name: 'J. Buenaventura', role: 'Matching officer', device: 'Tablet · Dugo+ app', ip: '10.0.4.27' },
  { id: 'audit-staff-C-Dimaculang', name: 'C. Dimaculang', role: 'Medical director', device: 'Desktop · Chrome', ip: '10.0.4.12' },
]

/* Grouping for the action filter. `action` is the wording the table prints. */
const ACTION_TYPES = [
  { value: 'view', label: 'View' },
  { value: 'override', label: 'Override' },
  { value: 'issue', label: 'Issue / release' },
  { value: 'edit', label: 'Edit' },
  { value: 'discard', label: 'Discard' },
]

const RECORD_TYPES = [
  { value: 'donor', label: 'Donor record' },
  { value: 'request', label: 'Blood request' },
  { value: 'inventory', label: 'Inventory batch' },
  { value: 'donation', label: 'Donation' },
]

const DATE_RANGES = [
  { value: '24-hours', label: 'Last 24 hours', days: 1 },
  { value: '7-days', label: 'Last 7 days', days: 7 },
  { value: '30-days', label: 'Last 30 days', days: 30 },
  { value: 'all', label: 'All time', days: null },
]

const DEFAULT_FILTERS = { user: 'all', action: 'all', record: 'all', range: 'all' }

/* The six entries. `before` and `after` are ordered field pairs; a null side means
   the field did not exist before, which is how a first write reads. */
const ENTRIES = [
  {
    id: 'AUD-1041',
    at: '2024-05-14T08:45',
    user: 'M. Santos',
    action: 'Issued units',
    actionType: 'issue',
    recordType: 'inventory',
    recordId: 'B2431-O-',
    recordLabel: 'B2431-O- → REQ-0010',
    details: 'Issued 1 whole blood unit against REQ-0010 (D.R., O-, OR 2)',
    ip: '10.0.4.21',
    device: 'Desktop · Chrome',
    sensitive: false,
    before: [
      { field: 'status', value: 'Available' },
      { field: 'reservedFor', value: 'REQ-0010' },
      { field: 'issuedUnits', value: '0' },
    ],
    after: [
      { field: 'status', value: 'Issued' },
      { field: 'reservedFor', value: 'REQ-0010' },
      { field: 'issuedUnits', value: '1' },
    ],
  },
  {
    id: 'AUD-1042',
    at: '2024-05-14T08:12',
    user: 'R. Alona',
    action: 'Viewed donor contact',
    actionType: 'view',
    recordType: 'donor',
    recordId: 'D-0117',
    recordLabel: 'D-0117 Ramon Bautista',
    details: `${REVEAL_REASONS[0]} — requested by the ward for an active transfusion`,
    ip: '10.0.4.18',
    device: 'Desktop · Chrome',
    sensitive: true,
    before: [
      { field: 'contact', value: 'R*** B. · masked' },
      { field: 'email', value: 'r.bautista@example.ph · hidden' },
    ],
    after: [
      { field: 'contact', value: '+63 917 555 0158' },
      { field: 'email', value: 'r.bautista@example.ph' },
    ],
  },
  {
    id: 'AUD-1043',
    at: '2024-05-14T07:58',
    user: 'J. Buenaventura',
    action: 'Fallback override',
    actionType: 'override',
    recordType: 'request',
    recordId: 'REQ-0001',
    recordLabel: 'REQ-0001 — R.M., O- red cells',
    details: `${FALLBACK_REASONS[1]} — fallback tier allowed for the ICU request`,
    ip: '10.0.4.27',
    device: 'Tablet · Dugo+ app',
    sensitive: false,
    before: [
      { field: 'tiersAllowed', value: 'exact, compatible' },
      { field: 'authorisedBy', value: '—' },
    ],
    after: [
      { field: 'tiersAllowed', value: 'exact, compatible, fallback' },
      { field: 'authorisedBy', value: 'C. Dimaculang' },
    ],
  },
  {
    id: 'AUD-1044',
    at: '2024-05-14T07:30',
    user: 'R. Alona',
    action: 'Donation recorded',
    actionType: 'edit',
    recordType: 'donation',
    recordId: 'DON-1195',
    recordLabel: 'DON-1195 → B2421-O-',
    details: '1 unit whole blood collected and filed into quarantine',
    ip: '10.0.4.18',
    device: 'Desktop · Chrome',
    sensitive: false,
    before: [
      { field: 'donation', value: '—' },
      { field: 'batch', value: '—' },
      { field: 'status', value: '—' },
    ],
    after: [
      { field: 'donation', value: 'DON-1195 · 2024-05-14' },
      { field: 'batch', value: 'B2421-O- · O- whole blood · 1u' },
      { field: 'status', value: 'Quarantine' },
    ],
  },
  {
    id: 'AUD-1045',
    at: '2024-05-14T07:00',
    user: 'M. Santos',
    action: 'Units discarded',
    actionType: 'discard',
    recordType: 'inventory',
    recordId: 'B2429-O+',
    recordLabel: 'B2429-O+',
    details: 'Cold Chain 2 pulled 6 platelet units past expiry on 2024-05-13 — discarded',
    ip: '10.0.4.21',
    device: 'Desktop · Chrome',
    sensitive: false,
    before: [
      { field: 'status', value: 'Available' },
      { field: 'units', value: '6' },
      { field: 'reason', value: '—' },
    ],
    after: [
      { field: 'status', value: 'Expired' },
      { field: 'units', value: '6' },
      { field: 'reason', value: 'Expired' },
    ],
  },
  {
    id: 'AUD-1046',
    at: '2024-03-30T10:22',
    user: 'C. Dimaculang',
    action: 'Donor record edited',
    actionType: 'edit',
    recordType: 'donor',
    recordId: 'D-0451',
    recordLabel: 'D-0451 Divina Ramos',
    details: 'Record deferred — low hemoglobin 11.2 g/dL, review on 2024-06-30',
    ip: '10.0.4.12',
    device: 'Desktop · Chrome',
    sensitive: false,
    before: [
      { field: 'status', value: 'active' },
      { field: 'deferral', value: '—' },
    ],
    after: [
      { field: 'status', value: 'deferred' },
      { field: 'deferral', value: 'Low hemoglobin 11.2 g/dL · until 2024-06-30' },
    ],
  },
]

/* The privacy note sits under the table on the screen. RA 10173 is the Data Privacy
   Act; the sentences mirror what the app already does — masked contact details by
   default, a recorded reason before a reveal, and a log of who revealed what. */
const PRIVACY_NOTE = {
  title: 'Data Privacy Act (RA 10173)',
  lines: [
    'Donor contact details stay masked until someone records a reason for revealing them, and every reveal is logged here with the staff member, role, timestamp, IP and device.',
    'Entries marked sensitive are visible to the medical director and administrators only, and exporting them requires administrator approval.',
    'Log entries are append-only and retained for five years. Contact details are never included in an export — only the masked value and the reveal reason.',
  ],
}

const PAGINATION = { pageSize: 6 }

function staffFor(name) {
  return STAFF.find((entry) => entry.name === name) ?? null
}

function rangeStart(range) {
  const entry = DATE_RANGES.find((item) => item.value === range)
  if (!entry || entry.days === null) return null

  const date = new Date(`${NOW_DAY}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - entry.days)
  return date.toISOString().slice(0, 10)
}

/* One log row plus everything the table, the drawer and the filters need. */
export function buildEntries(filters = DEFAULT_FILTERS) {
  const start = rangeStart(filters.range)

  return ENTRIES.map((entry) => {
    const staff = staffFor(entry.user)
    const changedFields = entry.before.map((field) => field.field)

    return {
      ...entry,
      rowId: `audit-row-${entry.id}`,
      role: staff?.role ?? '—',
      day: entry.at.slice(0, 10),
      time: entry.at.slice(11),
      device: entry.device,
      ip: entry.ip,
      actionLabel: ACTION_TYPES.find((action) => action.value === entry.actionType)?.label ?? entry.actionType,
      recordLabelText: RECORD_TYPES.find((record) => record.value === entry.recordType)?.label ?? entry.recordType,
      changedFields,
      changedSummary: changedFields.join(', '),
    }
  })
    .filter((entry) => (filters.user === 'all' ? true : entry.user === filters.user))
    .filter((entry) => (filters.action === 'all' ? true : entry.actionType === filters.action))
    .filter((entry) => (filters.record === 'all' ? true : entry.recordType === filters.record))
    .filter((entry) => (start === null ? true : entry.day >= start && entry.day <= NOW_DAY))
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function buildEntryDetail(entryId) {
  const entry = ENTRIES.find((item) => item.id === entryId)
  if (!entry) return null

  const staff = staffFor(entry.user)

  return {
    ...entry,
    rowId: `audit-row-${entry.id}`,
    role: staff?.role ?? '—',
    day: entry.at.slice(0, 10),
    time: entry.at.slice(11),
    /* A field only in `after` was created by this action rather than changed, so
       the drawer can label it instead of showing an empty before column. */
    changes: entry.after.map((field, index) => ({
      id: `audit-detail-change-${entry.id}-${index + 1}`,
      field: field.field,
      before: entry.before[index]?.value ?? null,
      after: field.value,
      created: entry.before[index] === undefined,
    })),
  }
}

export function buildFilters() {
  return {
    staff: STAFF.map((entry) => ({ value: entry.name, label: entry.name })),
    actions: ACTION_TYPES,
    records: RECORD_TYPES,
    ranges: DATE_RANGES,
  }
}

export default {
  NOW,
  NOW_DAY,
  STAFF,
  ACTION_TYPES,
  RECORD_TYPES,
  DATE_RANGES,
  DEFAULT_FILTERS,
  ENTRIES,
  PRIVACY_NOTE,
  PAGINATION,
  buildEntries,
  buildEntryDetail,
  buildFilters,
}