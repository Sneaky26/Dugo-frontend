const KPI_ITEMS = [
  {
    id: 'kpi-active-requests',
    label: 'Active requests',
    value: '24',
    trend: '+6 today',
    trendDirection: 'up',
    chartLabel: 'Requests by day',
  },
  {
    id: 'kpi-urgent',
    label: 'Urgent requests',
    value: '3',
    trend: 'oldest 4h 20m',
    trendDirection: 'down',
    status: 'critical',
    chartLabel: 'Urgent per day',
  },
  {
    id: 'kpi-donors-notified',
    label: 'Donors notified',
    value: '41',
    trend: '12 awaiting reply',
    trendDirection: 'flat',
    chartLabel: 'Notified per day',
  },
  {
    id: 'kpi-donors-confirmed',
    label: 'Donors confirmed',
    value: '12',
    trend: 'of 41 notified',
    trendDirection: 'up',
    chartLabel: 'Confirmed per day',
  },
  {
    id: 'kpi-units-collected',
    label: 'Units collected',
    value: '86',
    trend: '+12% vs last week',
    trendDirection: 'up',
    chartLabel: 'Units per day',
  },
]

const URGENT_REQUESTS = [
  {
    id: 'urgent-item-REQ-0001',
    requestId: 'REQ-0001',
    patient: 'R.M.',
    bloodType: 'O-',
    component: 'red-cells',
    componentLabel: 'Red cells',
    units: '6 units',
    ward: 'ICU – 3rd Floor, Tagaytay City Medical Center',
    elapsed: '2h 15m',
    notified: 2,
    confirmed: 1,
    target: 3,
  },
  {
    id: 'urgent-item-REQ-0002',
    requestId: 'REQ-0002',
    patient: 'J.D.',
    bloodType: 'B+',
    component: 'platelets',
    componentLabel: 'Platelets',
    units: '10 units',
    ward: 'ER – Resus, Tagaytay City Medical Center',
    elapsed: '45m',
    notified: 1,
    confirmed: 0,
    target: 3,
  },
  {
    id: 'urgent-item-REQ-0003',
    requestId: 'REQ-0003',
    patient: 'A.S.',
    bloodType: 'A-',
    component: 'plasma',
    componentLabel: 'Plasma',
    units: '8 units',
    ward: 'NICU – 2nd Floor, Mother & Child Center',
    elapsed: '5h 40m',
    notified: 0,
    confirmed: 0,
    target: 3,
  },
]

const CRITICAL_COMPONENTS = [
  {
    id: 'dashboard-critical-alert-platelets',
    status: 'critical',
    component: 'platelets',
    text: 'Platelets: 3 units, expiring in 2 days',
  },
  {
    id: 'dashboard-critical-alert-cryo',
    status: 'critical',
    component: 'cryoprecipitate',
    text: 'Cryoprecipitate: 6 units, expiring in 5 days',
  },
  {
    id: 'dashboard-critical-alert-oneg-rbc',
    status: 'critical',
    bloodType: 'O-',
    text: 'O- Red cells: 4 units, low reserve',
  },
  {
    id: 'dashboard-critical-alert-plasma',
    status: 'warning',
    component: 'plasma',
    text: 'Plasma: 12 units, expires Friday',
  },
]

const INVENTORY_TILES = [
  { id: 'inv-tile-A+', bloodType: 'A+', count: '42', level: 'adequate' },
  { id: 'inv-tile-A-', bloodType: 'A-', count: '8', level: 'low' },
  { id: 'inv-tile-B+', bloodType: 'B+', count: '26', level: 'adequate' },
  { id: 'inv-tile-B-', bloodType: 'B-', count: '5', level: 'low' },
  { id: 'inv-tile-AB+', bloodType: 'AB+', count: '7', level: 'low' },
  { id: 'inv-tile-AB-', bloodType: 'AB-', count: '2', level: 'critical' },
  { id: 'inv-tile-O+', bloodType: 'O+', count: '31', level: 'adequate' },
  { id: 'inv-tile-O-', bloodType: 'O-', count: '4', level: 'critical' },
]

const DONATION_TRENDS = {
  weekly: {
    chartLabel: '[chart] Units collected — last 8 weeks',
    total: '214 units total',
    average: '27 avg per week',
    points: [18, 24, 21, 30, 27, 34, 29, 31],
  },
  monthly: {
    chartLabel: '[chart] Units collected — last 6 months',
    total: '486 units total',
    average: '81 avg per month',
    points: [64, 71, 88, 76, 92, 95],
  },
}

const DONATIONS_BY_TYPE = [
  {
    id: 'dashboard-donations-by-type-whole-blood',
    type: 'whole-blood',
    label: 'Whole Blood',
    units: '142 units',
  },
  {
    id: 'dashboard-donations-by-type-platelet-apheresis',
    type: 'platelet-apheresis',
    label: 'Platelet apheresis',
    units: '38 units',
  },
  {
    id: 'dashboard-donations-by-type-plasma-apheresis',
    type: 'plasma-apheresis',
    label: 'Plasma apheresis',
    units: '21 units',
  },
]

const ACTIVITY_EVENTS = [
  {
    id: 'activity-event-REQ-0001-created',
    event: 'request-created',
    time: '08:42',
    text: 'REQ-0001 created by Dr. Alona — R.M., O- red cells',
  },
  {
    id: 'activity-event-D-0042-accepted',
    event: 'donor-accepted',
    time: '08:31',
    text: 'D-0042 Josefina Dela Cruz accepted the in-app invite',
  },
  {
    id: 'activity-event-DON-1188-completed',
    event: 'donation-completed',
    time: '07:55',
    text: 'DON-1188 completed — 1 unit whole blood',
  },
  {
    id: 'activity-event-APP-4471-sent',
    event: 'app-notification-sent',
    time: '07:20',
    text: 'In-app notification sent to 12 donors for REQ-0002 (B+ platelets)',
  },
  {
    id: 'activity-event-REQ-0002-created',
    event: 'request-created',
    time: '06:58',
    text: 'REQ-0002 created — ER Resus, 10 units platelets',
  },
  {
    id: 'activity-event-DON-1187-completed',
    event: 'donation-completed',
    time: '06:31',
    text: 'DON-1187 completed — 2 units plasma, Cold Chain 2 OK',
  },
]

const MAP_LEGEND = [
  '41 active donors',
  '6 partner hospitals',
  '3 drives today',
]

export default {
  KPI_ITEMS,
  URGENT_REQUESTS,
  CRITICAL_COMPONENTS,
  INVENTORY_TILES,
  DONATION_TRENDS,
  DONATIONS_BY_TYPE,
  ACTIVITY_EVENTS,
  MAP_LEGEND,
}