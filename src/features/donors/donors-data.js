/* Donor registry data. The 18 donors below are the Dugo+ registry: the first 12
   are the same identities the matching and request-detail screens already use
   (matching-data.js DONOR_ROSTER, request-detail-data.js DONOR_POOL), so D-0042
   is one person across the whole app. The remaining 6 round the registry out to
   four pages at pageSize 5.

   NOW is a fixed instant — no Date.now() in render, so ages, eligibility
   countdowns and "days until eligible" are reproducible between server and
   client. This is the same convention as request-detail-data.js and the
   hardcoded default in blood-compat.js.

   Eligibility is stored per donation type as a compact value: the string
   'eligible', or a deferral reason. buildDonorProfile normalises both into
   { state, reason } and derives the next-eligible date from the donation
   interval — the same shape matching-data.js already normalises. */

export const NOW = '2024-05-14T09:30'

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

const SEXES = ['female', 'male']

/* Registry status is about the record, not today's donation fitness — a donor
   can be 'active' and still deferred from a single donation type. */
const DONOR_STATUSES = ['active', 'inactive', 'deferred', 'deactivated']

const ELIGIBILITY_STATES = ['eligible', 'deferred', 'permanently-deferred']

/* Donation intervals drive the per-type next-eligible timeline. */
const DONATION_TYPES = [
  { id: 'donation-type-whole-blood', value: 'whole-blood', label: 'Whole blood', intervalDays: 90, points: 100 },
  { id: 'donation-type-platelets', value: 'platelets', label: 'Platelets', intervalDays: 14, points: 150 },
  { id: 'donation-type-plasma', value: 'plasma', label: 'Plasma', intervalDays: 28, points: 60 },
]

const DONATION_SITES = [
  'Tagaytay City Blood Bank',
  'De La Salle Medical Center, Dasmariñas',
  'Taal Clinical Center',
  'Batangas Medical Center',
]

const DONATION_STAFF = ['M. Santos', 'R. Alona', 'J. Buenaventura', 'C. Dimaculang']

const CHANNEL_STATUSES = ['delivered', 'delivered', 'pending', 'failed']

const REVEAL_REASONS = [
  'Patient transfusion enquiry',
  'Donor verification call',
  'Blood bank records correction',
  'Emergency contact confirmation',
  'Law enforcement request',
  'Other — see notes',
]

/* Standard pre-donation screen. Each line is checked against the record. */
const CHECKLIST_ITEMS = [
  { id: 'age', label: 'Age 18–65' },
  { id: 'weight', label: 'Weight at least 50 kg' },
  { id: 'fever', label: 'No fever in the last 24 hours' },
  { id: 'bp', label: 'Blood pressure within range' },
  { id: 'medication', label: 'No medication in the last 2 weeks' },
  { id: 'travel', label: 'No malaria-area travel in the last 6 months' },
]

/* CSV header detection for the import modal. */
const IMPORT_FIELDS = [
  { id: 'import-field-name', value: 'name', label: 'Full name', required: true, matches: ['full name', 'name'] },
  { id: 'import-field-birthdate', value: 'birthdate', label: 'Birthdate', required: true, matches: ['birthdate', 'dob', 'date of birth'] },
  { id: 'import-field-sex', value: 'sex', label: 'Sex', required: true, matches: ['sex', 'gender'] },
  { id: 'import-field-blood-type', value: 'bloodType', label: 'Blood type', required: true, matches: ['blood type', 'bloodtype', 'abo'] },
  { id: 'import-field-contact', value: 'contact', label: 'Mobile number', required: true, matches: ['mobile', 'contact', 'phone', 'cp number'] },
  { id: 'import-field-email', value: 'email', label: 'Email', required: false, matches: ['email', 'e-mail'] },
  { id: 'import-field-address', value: 'address', label: 'Address', required: false, matches: ['address', 'home address'] },
  { id: 'import-field-consent', value: 'consent', label: 'Consent on file', required: true, matches: ['consent', 'consented', 'signup'] },
]

/* The CSV the uploader pretends to have just read. */
const IMPORT_SAMPLE_HEADERS = ['Full Name', 'DOB', 'Gender', 'Blood Type', 'CP Number', 'Email', 'Home Address', 'Consent']

const IMPORT_SAMPLE_ROWS = [
  { row: 2, name: 'Anjelita Bautista', birthdate: '1988-02-19', sex: 'F', bloodType: 'B+', contact: '+63 917 555 0188', email: 'a.bautista@example.ph', address: 'Asisan, Tagaytay City', consent: 'yes', errors: [] },
  { row: 3, name: 'Niño Tolentino', birthdate: '1995-11-04', sex: 'M', bloodType: 'O+', contact: '+63 917 555 0199', email: 'n.tolentino@example.ph', address: 'Ibaan, Tagaytay City', consent: 'yes', errors: [] },
  { row: 4, name: 'Maricel Dizon', birthdate: '', sex: 'F', bloodType: 'AB+', contact: '+63 917 555 0201', email: 'maricel.dizon@example.ph', address: 'Mendez, Cavite', consent: 'yes', errors: [{ field: 'birthdate', message: 'Birthdate is required' }] },
  { row: 5, name: 'Roderick Maliksi', birthdate: '1957-06-30', sex: 'M', bloodType: 'A-', contact: '+63 917 555 0210', email: '', address: 'Carmona, Cavite', consent: 'no', errors: [{ field: 'age', message: 'Age 66 above the 60-year screening limit' }, { field: 'consent', message: 'Consent on file is required' }] },
  { row: 6, name: 'Grace Uy', birthdate: '1990-08-22', sex: 'F', bloodType: 'O-', contact: '+63 917 555 0222', email: 'g.uy@example.ph', address: 'Naic, Cavite', consent: 'yes', errors: [] },
  { row: 7, name: 'Edgardo Pantoja', birthdate: '1993-01-12', sex: 'M', bloodType: 'X', contact: '+63 917 555 0233', email: 'e.pantoja@example.ph', address: 'Ternate, Cavite', consent: 'yes', errors: [{ field: 'bloodType', message: 'X is not a valid blood type' }] },
]

/* Eligibility reasons are plain reasons — the next-eligible date is derived, so
   the two never disagree the way a hardcoded date in prose would. */
const DONORS = [
  {
    donorId: 'D-0042',
    name: 'Josefina Dela Cruz',
    masked: 'J*** D. C.',
    bloodType: 'O+',
    sex: 'female',
    birthdate: '1991-03-14',
    contact: '+63 917 555 0142',
    email: 'j.delacruz@example.ph',
    address: 'Barangay III Poblacion',
    city: 'Tagaytay City',
    totalDonations: 7,
    lastDonation: '2024-01-20',
    status: 'active',
    points: 690,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    donorId: 'D-0117',
    name: 'Ramon Bautista',
    masked: 'R*** B.',
    bloodType: 'O-',
    sex: 'male',
    birthdate: '1986-09-02',
    contact: '+63 917 555 0158',
    email: 'r.bautista@example.ph',
    address: 'Asisan',
    city: 'Tagaytay City',
    totalDonations: 5,
    lastDonation: '2024-02-14',
    status: 'active',
    points: 470,
    apheresisEligible: true,
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'Platelet count 148k — below apheresis threshold',
      plasma: 'eligible',
    },
  },
  {
    donorId: 'D-0233',
    name: 'KC Manalo',
    masked: 'K*** M.',
    bloodType: 'O+',
    sex: 'female',
    birthdate: '1994-12-08',
    contact: '+63 917 555 0166',
    email: 'kc.manalo@example.ph',
    address: 'Ibaan',
    city: 'Tagaytay City',
    totalDonations: 3,
    lastDonation: '2024-05-01',
    status: 'active',
    points: 260,
    apheresisEligible: false,
    eligibility: { 'whole-blood': 'eligible', platelets: 'Recent whole blood donation', plasma: 'eligible' },
  },
  {
    donorId: 'D-0308',
    name: 'Angelo Perez',
    masked: 'A*** P.',
    bloodType: 'A+',
    sex: 'male',
    birthdate: '1980-05-27',
    contact: '+63 917 555 0174',
    email: 'a.perez@example.ph',
    address: 'Mojares',
    city: 'Tagaytay City',
    totalDonations: 11,
    lastDonation: '2023-12-08',
    status: 'active',
    points: 1080,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    donorId: 'D-0451',
    name: 'Divina Ramos',
    masked: 'D*** R.',
    bloodType: 'B+',
    sex: 'female',
    birthdate: '1992-07-19',
    contact: '+63 917 555 0179',
    email: 'd.ramos@example.ph',
    address: 'San Jose',
    city: 'Tagaytay City',
    totalDonations: 4,
    lastDonation: '2024-03-30',
    status: 'deferred',
    points: 340,
    apheresisEligible: false,
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'Not apheresis-eligible — poor venous access',
      plasma: 'eligible',
    },
    deferrals: [{ id: 'donor-deferral-D-0451-1', reason: 'Low hemoglobin 11.2 g/dL', since: '2024-03-30', until: '2024-06-30' }],
  },
  {
    donorId: 'D-0562',
    name: 'Mark Villaflor',
    masked: 'M*** V.',
    bloodType: 'O-',
    sex: 'male',
    birthdate: '1989-04-11',
    contact: '+63 917 555 0181',
    email: 'm.villaflor@example.ph',
    address: 'Tayuman',
    city: 'Tagaytay City',
    totalDonations: 6,
    lastDonation: '2024-04-18',
    status: 'active',
    points: 520,
    apheresisEligible: true,
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'eligible',
      plasma: 'Donated 26 days ago — eligible again shortly',
    },
  },
  {
    donorId: 'D-0673',
    name: 'Liezl Mercado',
    masked: 'L*** M.',
    bloodType: 'A-',
    sex: 'female',
    birthdate: '1997-02-23',
    contact: '+63 917 555 0193',
    email: 'l.mercado@example.ph',
    address: 'Urdaneta',
    city: 'Tagaytay City',
    totalDonations: 1,
    lastDonation: '2024-05-10',
    status: 'active',
    points: 100,
    apheresisEligible: false,
    eligibility: { 'whole-blood': 'eligible', platelets: 'Recent donation — apheresis deferral', plasma: 'eligible' },
  },
  {
    donorId: 'D-0784',
    name: 'Carlo Pimentel',
    masked: 'C*** P.',
    bloodType: 'O+',
    sex: 'male',
    birthdate: '1983-10-05',
    contact: '+63 917 555 0204',
    email: 'c.pimentel@example.ph',
    address: 'Buco',
    city: 'Tagaytay City',
    totalDonations: 8,
    lastDonation: '2024-03-02',
    status: 'inactive',
    points: 780,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    donorId: 'D-0895',
    name: 'Nathaniel Ocampo',
    masked: 'N*** O.',
    bloodType: 'O-',
    sex: 'male',
    birthdate: '1985-01-30',
    contact: '+63 917 555 0217',
    email: 'n.ocampo@example.ph',
    address: 'Batangas City',
    city: 'Ternate',
    totalDonations: 9,
    lastDonation: '2024-02-22',
    status: 'active',
    points: 890,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    donorId: 'D-0910',
    name: 'Perla Gutierrez',
    masked: 'P*** G.',
    bloodType: 'O-',
    sex: 'female',
    birthdate: '1990-06-16',
    contact: '+63 917 555 0228',
    email: 'p.gutierrez@example.ph',
    address: 'Poblacion',
    city: 'Amadeio',
    totalDonations: 2,
    lastDonation: '2024-01-05',
    status: 'deferred',
    points: 140,
    apheresisEligible: false,
    eligibility: {
      'whole-blood': 'eligible',
      platelets: 'Low hemoglobin 11.8 g/dL — recheck in 2 weeks',
      plasma: 'eligible',
    },
    deferrals: [{ id: 'donor-deferral-D-0910-1', reason: 'Low hemoglobin 11.8 g/dL', since: '2024-01-05', until: '2024-05-29' }],
  },
  {
    donorId: 'D-1023',
    name: 'Rosario Enriquez',
    masked: 'R*** E.',
    bloodType: 'O-',
    sex: 'female',
    birthdate: '1988-11-21',
    contact: '+63 917 555 0236',
    email: 'r.enriquez@example.ph',
    address: 'Poblacion',
    city: 'Naic',
    totalDonations: 3,
    lastDonation: '2024-04-25',
    status: 'active',
    points: 210,
    apheresisEligible: true,
    eligibility: {
      'whole-blood': 'Antibiotic course — defer until cleared',
      platelets: 'eligible',
      plasma: 'eligible',
    },
  },
  {
    donorId: 'D-1101',
    name: 'Emmanuel Soriano',
    masked: 'E*** S.',
    bloodType: 'A+',
    sex: 'male',
    birthdate: '1993-03-08',
    contact: '+63 917 555 0244',
    email: 'e.soriano@example.ph',
    address: 'Poblacion',
    city: 'Carmona',
    totalDonations: 5,
    lastDonation: '2024-03-15',
    status: 'active',
    points: 610,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
  },
  {
    donorId: 'D-1204',
    name: 'Anjelita Bautista',
    masked: 'A*** B.',
    bloodType: 'B+',
    sex: 'female',
    birthdate: '1988-02-19',
    contact: '+63 917 555 0188',
    email: 'a.bautista@example.ph',
    address: 'Asisan',
    city: 'Tagaytay City',
    totalDonations: 6,
    lastDonation: '2024-02-27',
    status: 'active',
    points: 560,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
    notes: [{ id: 'donor-note-D-1204-1', author: 'M. Santos', time: '2024-02-27', text: 'Prefers Saturday morning slots at the Taal site.' }],
  },
  {
    donorId: 'D-1338',
    name: 'Niño Tolentino',
    masked: 'N*** T.',
    bloodType: 'O+',
    sex: 'male',
    birthdate: '1995-11-04',
    contact: '+63 917 555 0199',
    email: 'n.tolentino@example.ph',
    address: 'Ibaan',
    city: 'Tagaytay City',
    totalDonations: 2,
    lastDonation: '2024-04-09',
    status: 'active',
    points: 200,
    apheresisEligible: false,
    eligibility: { 'whole-blood': 'eligible', platelets: 'Not apheresis-eligible — under 50 kg', plasma: 'eligible' },
  },
  {
    donorId: 'D-1471',
    name: 'Maricel Dizon',
    masked: 'M*** D.',
    bloodType: 'AB+',
    sex: 'female',
    birthdate: '1996-08-02',
    contact: '+63 917 555 0201',
    email: 'maricel.dizon@example.ph',
    address: 'Mendez',
    city: 'Mendez',
    totalDonations: 4,
    lastDonation: '2024-01-30',
    status: 'active',
    points: 380,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
    notes: [{ id: 'donor-note-D-1471-1', author: 'J. Buenaventura', time: '2024-01-30', text: 'Asked to be pooled as a universal plasma donor.' }],
  },
  {
    donorId: 'D-1556',
    name: 'Roderick Maliksi',
    masked: 'R*** M.',
    bloodType: 'A-',
    sex: 'male',
birthdate: '1957-06-30',
    contact: '+63 917 555 0210',
    email: '',
    address: 'Poblacion',
    city: 'Carmona',
    totalDonations: 12,
    lastDonation: '2023-11-19',
    status: 'active',
    points: 1240,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
    notes: [{ id: 'donor-note-D-1556-1', author: 'R. Alona', time: '2024-05-02', text: 'No email on file. Consent form is paper-only.' }],
  },
  {
    donorId: 'D-1683',
    name: 'Grace Uy',
    masked: 'G*** U.',
    bloodType: 'O-',
    sex: 'female',
    birthdate: '1990-08-22',
    contact: '+63 917 555 0222',
    email: 'g.uy@example.ph',
    address: 'Poblacion',
    city: 'Naic',
    totalDonations: 10,
    lastDonation: '2024-04-02',
    status: 'active',
    points: 940,
    apheresisEligible: true,
    eligibility: { 'whole-blood': 'eligible', platelets: 'eligible', plasma: 'eligible' },
    notes: [{ id: 'donor-note-D-1683-1', author: 'C. Dimaculang', time: '2024-04-02', text: 'High-volume donor — consider for the AB plasma pool.' }],
  },
  {
    donorId: 'D-1729',
    name: 'Edgardo Pantoja',
    masked: 'E*** P.',
    bloodType: 'B-',
    sex: 'male',
    birthdate: '1966-03-17',
    contact: '+63 917 555 0233',
    email: 'e.pantoja@example.ph',
    address: 'Poblacion',
    city: 'Ternate',
    totalDonations: 14,
    lastDonation: '2023-09-28',
    status: 'deactivated',
    points: 1310,
    apheresisEligible: false,
    eligibility: {
      'whole-blood': 'Permanently deferred — no longer in service area',
      platelets: 'Permanently deferred — no longer in service area',
      plasma: 'Permanently deferred — no longer in service area',
    },
    deferrals: [{ id: 'donor-deferral-D-1729-1', reason: 'Donor deactivated — moved out of service area', since: '2023-09-28', until: 'no end date' }],
  },
]

const PAGINATION = { pageSize: 5 }

/* Derived from the records so the city filter can only ever offer a city that
   actually has donors. */
const CITIES = [...new Set(DONORS.map((donor) => donor.city))].sort()

const DEFAULT_FILTERS = {
  search: '',
  bloodType: 'all',
  eligibility: 'all',
  status: 'all',
  city: 'all',
}

function parseDay(value) {
  return new Date(`${value}T00:00`)
}

/* Calendar-day arithmetic in UTC. Parsing the day as local midnight and then
   formatting with toISOString() shifted every result back a day east of GMT —
   2024-05-14 plus 90 days came out as 2024-08-11 in Manila. Both ends now work
   in UTC, so a day string plus a day count is the same date everywhere. */
function addDays(value, days) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysBetween(from, to) {
  return Math.round((parseDay(to) - parseDay(from)) / 86400000)
}

function ageFrom(birthdate, now = NOW) {
  const born = parseDay(birthdate)
  const asOf = new Date(now)
  let age = asOf.getFullYear() - born.getFullYear()
  const monthDelta = asOf.getMonth() - born.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < born.getDate())) age -= 1
  return age
}

/* 'eligible' or a deferral reason, normalised — mirrors matching-data.js. */
function normaliseEligibility(value) {
  return value === 'eligible'
    ? { state: 'eligible', reason: '' }
    : { state: value.startsWith('Permanently') ? 'permanently-deferred' : 'deferred', reason: value }
}

/* Row id for the registry table, following the request-row- convention. */
function rowIdFor(donorId) {
  return `donor-row-${donorId}`
}

/* Registry-wide eligibility: eligible only when every donation type is. */
function overallEligibility(donor) {
  const states = DONATION_TYPES.map((type) => normaliseEligibility(donor.eligibility[type.value]).state)
  if (states.includes('permanently-deferred')) return 'permanently-deferred'
  if (states.includes('deferred')) return 'deferred'
  return 'eligible'
}

export function matchesFilters(donor, filters) {
  const search = filters.search.trim().toLowerCase()
  if (search) {
    const haystack = [donor.donorId, donor.name, donor.masked, donor.address, donor.city, donor.bloodType]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }
  if (filters.bloodType !== 'all' && donor.bloodType !== filters.bloodType) return false
  if (filters.status !== 'all' && donor.status !== filters.status) return false
  if (filters.city !== 'all' && donor.city !== filters.city) return false
  if (filters.eligibility !== 'all' && overallEligibility(donor) !== filters.eligibility) return false
  return true
}

/* Up to five rows per donor, walking back from the last donation. The mix is
   deterministic — index into the donation types — so renders stay stable. */
function buildHistory(donor, index) {
  const rows = []
  let cursor = donor.lastDonation
  const count = Math.min(5, donor.totalDonations)

  for (let slot = 0; slot < count; slot += 1) {
    const type = DONATION_TYPES[(index + slot) % DONATION_TYPES.length]
    rows.push({
      id: `donor-history-row-${donor.donorId}-${slot + 1}`,
      date: cursor,
      type: type.value,
      typeLabel: type.label,
      units: 1,
      site: DONATION_SITES[(index + slot) % DONATION_SITES.length],
      staff: DONATION_STAFF[(index + slot) % DONATION_STAFF.length],
      points: type.points,
    })
    cursor = addDays(cursor, -type.intervalDays)
  }

  return rows
}

/* Points mirror the donation history plus occasional referral bonuses, so the
   balance and the ledger always reconcile against the same rows. */
function buildPoints(donor, history) {
  const ledger = history.map((entry, slot) => ({
    id: `donor-points-row-${donor.donorId}-${slot + 1}`,
    date: entry.date,
    label: `${entry.typeLabel} donation`,
    delta: entry.points,
  }))

  if (donor.totalDonations >= 6) {
    ledger.push({
      id: `donor-points-row-${donor.donorId}-referral`,
      date: addDays(donor.lastDonation, -30),
      label: 'Referral bonus',
      delta: 50,
    })
  }

  /* donor.points is the authoritative balance, so history rows and bonuses are
     never allowed to add up to something else. Whatever they fail to explain goes
     on one dated adjustment row instead of silently disagreeing with the header
     figures the list and the profile both show. */
  const explained = ledger.reduce((total, entry) => total + entry.delta, 0)
  const remainder = donor.points - explained

  if (remainder !== 0) {
    ledger.unshift({
      id: `donor-points-row-${donor.donorId}-older`,
      date: addDays(donor.lastDonation, -history.length * 90),
      label: 'Earlier donations and adjustments',
      delta: remainder,
    })
  }

  return {
    balance: donor.points,
    earned: ledger.filter((entry) => entry.delta > 0).reduce((total, entry) => total + entry.delta, 0),
    redeemed: ledger.filter((entry) => entry.delta < 0).reduce((total, entry) => total + -entry.delta, 0),
    ledger,
  }
}

/* In-app only — no SMS or email, matching the matching screen's channels. */
function buildComms(donor, index) {
  const subject = donor.status === 'deactivated' ? 'Record deactivated' : 'Urgent blood request nearby'
  const rows = [
    {
      id: `donor-comms-row-${donor.donorId}-1`,
      date: addDays(donor.lastDonation, -1),
      subject,
      channel: 'app',
      status: CHANNEL_STATUSES[index % CHANNEL_STATUSES.length],
      response: 'no-reply',
    },
    {
      id: `donor-comms-row-${donor.donorId}-2`,
      date: addDays(donor.lastDonation, -2),
      subject: 'Reminder: next donation due',
      channel: 'app',
      status: CHANNEL_STATUSES[(index + 1) % CHANNEL_STATUSES.length],
      response: 'no-reply',
    },
  ]

  if (donor.apheresisEligible && donor.totalDonations >= 5) {
    rows.push({
      id: `donor-comms-row-${donor.donorId}-3`,
      date: addDays(donor.lastDonation, -12),
      subject: 'Platelet drive invitation',
      channel: 'app',
      status: 'delivered',
      response: 'accepted',
    })
  }

  return rows
}

function buildChecklist(donor) {
  const age = ageFrom(donor.birthdate)

  return CHECKLIST_ITEMS.map((item) => {
    let state = 'pass'
    let note = ''

    if (item.id === 'age') {
      if (age > 60) {
        state = 'warn'
        note = `Age ${age} — physician sign-off required`
      } else if (age < 18 || age > 65) {
        state = 'fail'
        note = `Age ${age} is outside the 18–65 window`
      } else {
        note = `Age ${age}`
      }
    }

    if (item.id === 'weight' && !donor.apheresisEligible) {
      state = 'warn'
      note = 'Below 50 kg or venous access insufficient for apheresis'
    }

    if (item.id === 'travel' && donor.status === 'inactive') {
      state = 'warn'
      note = 'No travel declared since the last activation'
    }

    if (item.id === 'fever' && donor.status === 'deferred') {
      state = 'warn'
      note = 'Deferral on file — see flags'
    }

    return { ...item, state, note }
  })
}

/* Everything the profile screen shows for one donor. */
export function buildDonorProfile(donorId) {
  const donor = DONORS.find((entry) => entry.donorId === donorId)
  if (!donor) return null

  const index = DONORS.indexOf(donor)
  const history = buildHistory(donor, index)

  const eligibility = DONATION_TYPES.map((type) => {
    const { state, reason } = normaliseEligibility(donor.eligibility[type.value])
    const nextEligible = addDays(donor.lastDonation, type.intervalDays)
    return {
      id: `donor-eligibility-${type.value}`,
      type: type.value,
      typeLabel: type.label,
      intervalDays: type.intervalDays,
      state,
      reason,
      lastDonation: donor.lastDonation,
      nextEligible,
      daysUntil: daysBetween(NOW.slice(0, 10), nextEligible),
    }
  })

  return {
    donor,
    rowId: rowIdFor(donor.donorId),
    age: ageFrom(donor.birthdate),
    overallEligibility: overallEligibility(donor),
    eligibility,
    checklist: buildChecklist(donor),
    history,
    points: buildPoints(donor, history),
    comms: buildComms(donor, index),
    deferrals: donor.deferrals ?? [],
    notes: donor.notes ?? [],
  }
}

export {
  BLOOD_TYPES,
  CITIES,
  CHECKLIST_ITEMS,
  DEFAULT_FILTERS,
  DONATION_TYPES,
  DONOR_STATUSES,
  DONORS,
  ELIGIBILITY_STATES,
  IMPORT_FIELDS,
  IMPORT_SAMPLE_HEADERS,
  IMPORT_SAMPLE_ROWS,
  PAGINATION,
  REVEAL_REASONS,
  SEXES,
  addDays,
  ageFrom,
  rowIdFor,
}

export default {
  BLOOD_TYPES,
  CITIES,
  CHECKLIST_ITEMS,
  DEFAULT_FILTERS,
  DONATION_TYPES,
  DONOR_STATUSES,
  DONORS,
  ELIGIBILITY_STATES,
  IMPORT_FIELDS,
  IMPORT_SAMPLE_HEADERS,
  IMPORT_SAMPLE_ROWS,
  PAGINATION,
  REVEAL_REASONS,
  SEXES,
  buildDonorProfile,
  matchesFilters,
}