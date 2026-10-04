import { useState } from 'react'
import data from './dashboard-data.js'

function KpiCard({ item }) {
  return (
    <div id={item.id} className="card" data-status={item.status}>
      <span id={`${item.id}-label`} className="chip">
        {item.label}
      </span>
      <span id={`${item.id}-value`}>{item.value}</span>
      <span id={`${item.id}-trend`} data-trend={item.trendDirection}>
        {item.trend}
      </span>
      <div
        id={`${item.id}-chart`}
        className="card"
        data-chart="sparkline"
        data-trend={item.trendDirection}
      >
        [chart] {item.chartLabel}
      </div>
    </div>
  )
}

function UrgentItem({ request }) {
  const segments = Array.from({ length: request.target }, (_, index) => index)

  return (
    <article
      id={request.id}
      className="card"
      data-status="urgent"
      data-blood-type={request.bloodType}
      data-component={request.component}
    >
      <div className="row row-between">
        <span id={`${request.id}-patient`} className="chip">
          {request.patient}
        </span>
        <span id={`${request.id}-blood-type`} className="badge" data-blood-type={request.bloodType}>
          {request.bloodType}
        </span>
        <span id={`${request.id}-component`} className="chip" data-component={request.component}>
          {request.componentLabel}
        </span>
        <span id={`${request.id}-units`} className="pill">
          {request.units}
        </span>
        <button id={`${request.id}-view-btn`} className="btn" type="button">
          View
        </button>
      </div>

      <span id={`${request.id}-ward`}>{request.ward}</span>

      <div className="row row-between">
        <span id={`${request.id}-elapsed`} data-state="running">
          {request.elapsed}
        </span>
        <span
          id={`${request.id}-progress`}
          className="row"
          data-notified={request.notified}
          data-confirmed={request.confirmed}
        >
          <span>
            {request.notified} of {request.target} notified · {request.confirmed} confirmed
          </span>
          {segments.map((index) => (
            <span
              key={index}
              className="chip"
              data-filled={index < request.notified}
              data-confirmed={index < request.confirmed}
            />
          ))}
        </span>
      </div>
    </article>
  )
}

function InventoryTile({ tile }) {
  return (
    <div id={tile.id} className="card" data-blood-type={tile.bloodType} data-level={tile.level}>
      <span id={`${tile.id}-label`} className="chip">
        {tile.bloodType}
      </span>
      <span id={`${tile.id}-count`}>{tile.count}</span>
      <span id={`${tile.id}-level`} className="chip" data-level={tile.level}>
        {tile.level}
      </span>
    </div>
  )
}

function Dashboard() {
  const [period, setPeriod] = useState('weekly')
  const trend = data.DONATION_TRENDS[period]

  return (
    <div id="dashboard">
      <section id="dashboard-kpi-row">
        {data.KPI_ITEMS.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </section>

      <section id="dashboard-overview-row">
        <section id="dashboard-urgent-panel" className="card">
          <header id="dashboard-urgent-panel-header" className="row row-between">
            <span>Urgent requests</span>
            <span
              id="dashboard-urgent-count-pill"
              className="badge"
              data-status="urgent"
              data-count={data.URGENT_REQUESTS.length}
            >
              {data.URGENT_REQUESTS.length} urgent
            </span>
            <button id="dashboard-urgent-panel-view-all" className="btn" type="button">
              View all
            </button>
          </header>

          <div id="urgent-list">
            {data.URGENT_REQUESTS.map((request) => (
              <UrgentItem key={request.id} request={request} />
            ))}
          </div>
        </section>

        <section id="dashboard-map-card" className="card">
          <header id="dashboard-map-card-title">Donor coverage map</header>
          <div id="dashboard-map" data-map="calabarzon" data-region="calabarzon">
            [map] CALABARZON
          </div>
          <div id="dashboard-map-legend" className="row">
            {data.MAP_LEGEND.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </section>
      </section>

      <section id="dashboard-critical-components" className="card">
        <header id="dashboard-critical-components-title">Critical components</header>
        <div className="row">
          {data.CRITICAL_COMPONENTS.map((alert) => (
            <span
              key={alert.id}
              id={alert.id}
              className="chip"
              data-status={alert.status}
              data-component={alert.component}
              data-blood-type={alert.bloodType}
            >
              {alert.text}
            </span>
          ))}
        </div>
      </section>

      <section id="dashboard-inventory-snapshot" className="card">
        <header id="dashboard-inventory-snapshot-header" className="row row-between">
          <span id="dashboard-inventory-snapshot-title">Inventory snapshot</span>
          <button id="dashboard-inventory-snapshot-view-all" className="btn" type="button">
            Open inventory
          </button>
        </header>

        <div id="dashboard-inventory-tiles">
          {data.INVENTORY_TILES.map((tile) => (
            <InventoryTile key={tile.id} tile={tile} />
          ))}
        </div>
      </section>

      <section id="dashboard-donation-trend" className="card">
        <header id="dashboard-donation-trend-title">Donation trend</header>

        <div id="dashboard-donation-trend-tabs">
          {Object.keys(data.DONATION_TRENDS).map((key) => (
            <button
              key={key}
              id={`dashboard-donation-trend-tab-${key}`}
              className="tab"
              type="button"
              data-period={key}
              data-active={key === period}
              onClick={() => setPeriod(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div
          id="dashboard-donation-trend-chart"
          className="card"
          data-chart="bar"
          data-period={period}
          data-points={trend.points.join(',')}
        >
          {trend.chartLabel}
        </div>

        <div id="dashboard-donation-trend-summary" className="row">
          <span className="chip">{trend.total}</span>
          <span className="chip">{trend.average}</span>
        </div>
      </section>

      <section id="dashboard-donations-by-type" className="card">
        <header id="dashboard-donations-by-type-title">Donations by type</header>

        <div id="dashboard-donations-by-type-chart" className="card" data-chart="bar">
          [chart] Units by donation type — last 30 days
        </div>

        <div id="dashboard-donations-by-type-legend" className="row">
          {data.DONATIONS_BY_TYPE.map((entry) => (
            <span key={entry.id} id={entry.id} className="chip" data-type={entry.type}>
              {entry.label} {entry.units}
            </span>
          ))}
        </div>
      </section>

      <section id="dashboard-activity-feed" className="card">
        <header id="dashboard-activity-feed-header" className="row row-between">
          <span id="dashboard-activity-feed-title">Activity</span>
          <button id="dashboard-activity-feed-filter" className="btn" type="button">
            All events
          </button>
        </header>

        <div id="activity-feed-list">
          {data.ACTIVITY_EVENTS.map((event) => (
            <div key={event.id} id={event.id} className="row row-between" data-event={event.event}>
              <span className="chip">{event.event}</span>
              <span>{event.text}</span>
              <span className="chip">{event.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard