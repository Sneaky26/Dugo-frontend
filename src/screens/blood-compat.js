/* Blood compatibility helpers — pure functions, no React.
   Rules differ per component: red cells and platelets follow the forward
   ABO/Rh donor table, plasma is reversed, cryoprecipitate ignores Rh. */

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

const ANTIGENS = {
  O: { a: false, b: false },
  A: { a: true, b: false },
  B: { a: false, b: true },
  AB: { a: true, b: true },
}

const RULES = {
  'whole-blood': { abo: 'forward', rh: 'forward' },
  rbc: { abo: 'forward', rh: 'forward' },
  platelets: { abo: 'forward', rh: 'forward' },
  plasma: { abo: 'reversed', rh: 'reversed' },
  cryoprecipitate: { abo: 'reversed', rh: 'any' },
}

function splitType(bloodType) {
  return [bloodType.slice(0, -1), bloodType.slice(-1)]
}

function isSubset(antigens, other) {
  return (!antigens.a || other.a) && (!antigens.b || other.b)
}

/* Can a donor of this type give this component to the recipient? */
function canDonate(donor, recipient, component) {
  const [donorAb, donorRh] = splitType(donor)
  const [recipientAb, recipientRh] = splitType(recipient)
  const donorAntigens = ANTIGENS[donorAb]
  const recipientAntigens = ANTIGENS[recipientAb]
  const rule = RULES[component] ?? RULES.rbc

  const aboCompatible =
    rule.abo === 'reversed'
      ? isSubset(recipientAntigens, donorAntigens)
      : isSubset(donorAntigens, recipientAntigens)

  if (!aboCompatible) return false
  if (rule.rh === 'any') return true
  if (rule.rh === 'reversed') return recipientRh === '+' || donorRh === '-'
  return donorRh === '-' || recipientRh === donorRh
}

/* Acceptable donor types for a recipient, in display order. */
export function donorTypesFor(component, bloodType) {
  if (!bloodType) return []
  return BLOOD_TYPES.filter((donor) => canDonate(donor, bloodType, component))
}

/* Platelets: Rh-negative donors sort first, since Rh-negative recipients should
   preferentially receive Rh-negative platelet units. */
export function sortedDonorTypes(component, bloodType) {
  const types = donorTypesFor(component, bloodType)
  if (component !== 'platelets') return types
  return [...types.filter((type) => type.endsWith('-')), ...types.filter((type) => type.endsWith('+'))]
}

export function donorPreference(component) {
  return component === 'platelets' ? 'negative-first' : 'any'
}

/* Compatible stock for the selection, earliest expiry first, 3 rows max. */
export function compatibleStock(component, bloodType, stock) {
  const donorTypes = donorTypesFor(component, bloodType)
  if (donorTypes.length === 0) return []

  return stock
    .filter((batch) => batch.component === component && donorTypes.includes(batch.bloodType))
    .sort((a, b) => a.expiry.localeCompare(b.expiry))
    .slice(0, 3)
}

/* "Reserve from inventory" / "Reserve X + find donors for the rest" / "Submit and find donors" */
export function planText(stockUnits, quantity, source) {
  if (source === 'donors-only' || stockUnits <= 0) {
    return { plan: 'find-donors', text: 'Submit and find donors' }
  }
  if (stockUnits >= quantity) {
    return { plan: 'reserve-inventory', text: 'Reserve from inventory' }
  }
  return {
    plan: 'partial',
    text: `Reserve ${stockUnits} + find donors for the remaining ${quantity - stockUnits}`,
  }
}

/* Suggested priority from component and how soon the units are needed. */
export function suggestPriority(component, requiredBy, now = '2024-05-14T08:00') {
  if (!requiredBy) return 'urgent'
  const hoursLeft = (new Date(requiredBy) - new Date(now)) / 36e5
  if (hoursLeft <= 4 || component === 'platelets') return 'urgent'
  if (hoursLeft <= 12) return 'stat'
  return 'routine'
}