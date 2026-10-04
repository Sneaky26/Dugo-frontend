/* ============================================================================
 * REPORTS SCREEN — ID MAP
 * ----------------------------------------------------------------------------
 * #reports-screen                 the nav-reports screen
 *   #report-builder               the builder card
 *     #report-type                donations | requests-fulfilled | inventory |
 *                                 response-time | wastage
 *     #report-date-range          7-days | 30-days | 90-days | all
 *     #report-component           all | the five component values
 *     #report-facility            all | the eight collection facilities
 *     #report-generate-btn        applies the draft and logs the run
 *     #report-builder-note        says when the draft is not yet applied
 *   #report-metrics               four tiles, one per metric
 *     #report-fulfillment-rate      + -label, -detail
 *     #report-avg-time-to-match     + -label, -detail
 *     #report-avg-time-to-fulfill   + -label, -detail
 *     #report-wastage-rate          + -label, -detail
 *   #report-charts                three labelled chart boxes
 *     #report-chart-fulfillment   requests received vs fulfilled per day
 *     #report-chart-collection     units collected by donation type
 *     #report-chart-wastage        units collected vs wasted by component
 *     each: .chart-box > [chart] + label, then one readable row per bar
 *   #report-table                 the generated report
 *     #report-table-caption       type, range and facility in words
 *     #report-table-empty         shown when the report has no rows
 *     #report-pagination          -info, -prev, -next, -page-N
 *   #report-export
 *     #export-pdf-btn, #export-csv-btn, #report-schedule-btn
 *     #report-export-status       the last format, row count and stamp
 *     #report-schedule-form       -frequency, -recipient, -save-btn, -cancel-btn
 *   #report-saved-list            one row per report generated this session
 *
 * The builder is two-stage: the selects edit a draft and #report-generate-btn
 * applies it, so the table below always shows the report that was asked for rather
 * than whatever the last control happened to be. The metrics and the three charts
 * follow the applied filters; the table follows the applied report type.
 *
 * The saved list is session-local, in the same way the inventory ledger's writes
 * are — running a report here does not write a file.
 * ==========================================================================*/

import { useMemo, useState } from 'react'
import { paginate } from '@/shared/utils/paginate.js'
import data, { buildReport, nextReportId, reportEntryId } from './reports-data.js'

const { REPORT_TYPES, DATE_RANGES, COMPONENT_OPTIONS, DEFAULT_FORM, FACILITIES, PAGINATION } = data

function MetricTile({ metric }) {
  return (
    <div id={metric.id} className="card" data-percent={metric.percent ?? undefined}>
      <span id={`${metric.id}-label`} className="chip">
        {metric.label}
      </span>
      <span id={`${metric.id}-value`}>{metric.value}</span>
      <span id={`${metric.id}-detail`} className="muted">
        {metric.detail}
      </span>
    </div>
  )
}

function Chart({ chart }) {
  return (
    <div id={chart.id} className="card" data-chart={chart.chart}>
      <h2>{chart.label}</h2>
      <div className="chart-box">
        <span>[chart]</span>
        <span>{chart.label}</span>
      </div>
      {chart.rows.map((row) => (
        <div key={row.id} className="donations-by-type-bar" style={{ '--bar-width': `${row.width}%` }}>
          <span id={`${row.id}-label`}>{row.label}</span>
          <span id={`${row.id}-value`}>{row.text}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsScreen() {
  const [draft, setDraft] = useState(DEFAULT_FORM)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [page, setPage] = useState(1)
  const [saved, setSaved] = useState([])
  const [lastExport, setLastExport] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedule, setSchedule] = useState({ frequency: 'weekly', recipient: '' })

  const report = useMemo(() => buildReport(form), [form])
  const reportLabel = `${report.typeLabel} — ${report.rangeLabel}`
  const isDirty = JSON.stringify(draft) !== JSON.stringify(form)

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function generate() {
    setForm(draft)
    setPage(1)
    setSaved((current) => {
      const id = nextReportId(current)

      return [
        ...current,
        {
          id,
          rowId: reportEntryId(id),
          type: draft.type,
          label: `${REPORT_TYPES.find((entry) => entry.value === draft.type)?.label ?? draft.type} — ${DATE_RANGES.find((entry) => entry.value === draft.range)?.label ?? draft.range}`,
          facility: draft.facility === 'all' ? 'All facilities' : FACILITIES.find((entry) => entry.value === draft.facility)?.label ?? draft.facility,
          runAt: 'just now',
        },
      ]
    })
  }

  function openSaved(entry) {
    setForm({ ...form, type: entry.type })
    setDraft({ ...draft, type: entry.type })
    setPage(1)
  }

  function removeSaved(id) {
    setSaved((current) => current.filter((entry) => entry.id !== id))
  }

  function exportReport(format) {
    setLastExport({ format, rows: report.table.rows.length, label: reportLabel })
  }

  const { rows, pageCount, currentPage, firstRow, lastRow, total } = paginate(
    report.table.rows,
    page,
    PAGINATION.pageSize,
  )

  return (
    <div id="reports-screen" data-report-type={form.type}>
      <div id="report-builder" className="card">
        <h2>Report builder</h2>

        <div className="row">
          <div className="field">
            <label htmlFor="report-type">
              <span>Report type</span>
              <select
                id="report-type"
                value={draft.type}
                onChange={(event) => updateDraft('type', event.target.value)}
              >
                {REPORT_TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field">
            <label htmlFor="report-date-range">
              <span>Date range</span>
              <select
                id="report-date-range"
                value={draft.range}
                onChange={(event) => updateDraft('range', event.target.value)}
              >
                {DATE_RANGES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field">
            <label htmlFor="report-component">
              <span>Component</span>
              <select
                id="report-component"
                value={draft.component}
                onChange={(event) => updateDraft('component', event.target.value)}
              >
                {COMPONENT_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field">
            <label htmlFor="report-facility">
              <span>Facility</span>
              <select
                id="report-facility"
                value={draft.facility}
                onChange={(event) => updateDraft('facility', event.target.value)}
              >
                <option value="all">All facilities</option>
                {FACILITIES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button id="report-generate-btn" className="btn" type="button" onClick={generate}>
            <span>[icon]</span>
            <span>Generate report</span>
          </button>
        </div>

        <p id="report-builder-note" className="muted" data-dirty={isDirty}>
          {isDirty
            ? 'Builder changed — generate to apply it to the metrics, charts and table below.'
            : `Showing ${reportLabel.toLowerCase()} from the current ledger.`}
        </p>
      </div>

      <section id="report-metrics" aria-label="Report metrics">
        {report.metrics.map((metric) => (
          <MetricTile key={metric.id} metric={metric} />
        ))}
      </section>

      <section id="report-charts" aria-label="Report charts">
        {report.charts.map((chart) => (
          <Chart key={chart.id} chart={chart} />
        ))}
      </section>

      <div id="report-table" className="card" data-report-type={form.type}>
        <p id="report-table-caption">
          {reportLabel} ·{' '}
          {form.component === 'all' ? 'All components' : data.COMPONENT_OPTIONS.find((entry) => entry.value === form.component)?.label} ·{' '}
          {form.facility === 'all' ? 'All facilities' : FACILITIES.find((entry) => entry.value === form.facility)?.label} · {total} row
          {total === 1 ? '' : 's'}
        </p>

        {rows.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                {report.table.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} id={row.id}>
                  {row.cells.map((cell) => (
                    <td key={cell.key} data-field={cell.key} data-component={cell.component} data-status={cell.status}>
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div id="report-table-empty" data-state="empty">
            <span>No records match this report</span>
            <button id="report-table-empty-reset-btn" className="btn" type="button" onClick={() => setDraft(DEFAULT_FORM)}>
              Reset builder
            </button>
          </div>
        )}

        <div id="report-pagination" className="row row-between">
          <span id="report-pagination-info">
            {firstRow}–{lastRow} of {total}
          </span>
          <div className="row">
            <button
              id="report-pagination-prev"
              className="btn"
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                id={`report-pagination-page-${pageNumber}`}
                className="btn"
                type="button"
                data-active={pageNumber === currentPage}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              id="report-pagination-next"
              className="btn"
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div id="report-export" className="card">
        <h2>Export</h2>
        <div className="row">
          <button id="export-pdf-btn" className="btn" type="button" disabled={total === 0} onClick={() => exportReport('PDF')}>
            <span>[icon]</span>
            <span>Export PDF</span>
          </button>
          <button id="export-csv-btn" className="btn" type="button" disabled={total === 0} onClick={() => exportReport('CSV')}>
            <span>[icon]</span>
            <span>Export CSV</span>
          </button>
          <button
            id="report-schedule-btn"
            className="btn"
            type="button"
            data-active={scheduleOpen}
            onClick={() => setScheduleOpen((open) => !open)}
          >
            <span>[icon]</span>
            <span>Schedule</span>
          </button>
        </div>

        <p id="report-export-status" className="muted" data-format={lastExport?.format ?? 'none'}>
          {lastExport
            ? `Last export ${lastExport.format} · ${lastExport.rows} rows · ${lastExport.label}`
            : 'No export yet — PDF and CSV use the rows in the table above.'}
        </p>

        {scheduleOpen ? (
          <div id="report-schedule-form" className="row" data-state="open">
            <div className="field">
              <label htmlFor="report-schedule-frequency">
                <span>Frequency</span>
                <select
                  id="report-schedule-frequency"
                  value={schedule.frequency}
                  onChange={(event) => setSchedule((current) => ({ ...current, frequency: event.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>

            <div className="field">
              <label htmlFor="report-schedule-recipient">
                <span>Recipient</span>
                <input
                  id="report-schedule-recipient"
                  type="text"
                  placeholder="Email address"
                  value={schedule.recipient}
                  onChange={(event) => setSchedule((current) => ({ ...current, recipient: event.target.value }))}
                />
              </label>
            </div>

            <button
              id="report-schedule-save-btn"
              className="btn"
              type="button"
              disabled={!schedule.recipient}
              onClick={() => setScheduleOpen(false)}
            >
              Save schedule
            </button>
            <button id="report-schedule-cancel-btn" className="btn" type="button" onClick={() => setScheduleOpen(false)}>
              Cancel
            </button>
          </div>
        ) : null}
      </div>

      <div id="report-saved-list" className="card" data-count={saved.length}>
        <h2>Saved reports</h2>
        {saved.length > 0 ? (
          <ul>
            {saved.map((entry) => (
              <li key={entry.id} id={entry.rowId} data-report={entry.id} data-type={entry.type}>
                <span id={`${entry.rowId}-label`}>{entry.label}</span>
                <span id={`${entry.rowId}-facility`} className="muted">
                  {entry.facility}
                </span>
                <span id={`${entry.rowId}-run-at`} className="muted">
                  {entry.runAt}
                </span>
                <button
                  id={`${entry.rowId}-open-btn`}
                  className="btn"
                  type="button"
                  onClick={() => openSaved(entry)}
                >
                  Run again
                </button>
                <button
                  id={`${entry.rowId}-remove-btn`}
                  className="btn"
                  type="button"
                  onClick={() => removeSaved(entry.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p id="report-saved-empty" className="muted">
            No reports generated this session yet.
          </p>
        )}
      </div>
    </div>
  )
}