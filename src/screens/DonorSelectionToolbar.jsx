function DonorSelectionToolbar({
  donorsInView = [],
  selected = [],
  allSelectedInView = false,
  onToggleSelectAll,
  onSelectAllVisible,
  onDeselectAll,
  onSelectEligible,
  onInvertSelection,
  onClearSelection,
  onNotifySelected,
}) {
  const visibleIds = donorsInView.map((donor) => donor.id)
  const selectedInView = selected.filter((id) => visibleIds.includes(id)).length
  const eligibleInView = donorsInView.filter((donor) => donor.eligibilityState?.state === 'eligible')
  const hasSelection = selected.length > 0
  const hasEligible = eligibleInView.length > 0

  return (
    <section id="matching-selection-toolbar" className="card">
      <div className="row row-between">
        <div className="row">
          <span id="matching-selection-count" aria-live="polite">
            {selectedInView} selected / {donorsInView.length} in view
          </span>
          <label className="row">
            <input
              id="matching-select-all"
              type="checkbox"
              checked={allSelectedInView}
              onChange={onToggleSelectAll}
            />
            <span>Select all in view</span>
          </label>
        </div>
        <div className="row">
          <button
            id="matching-selection-select-all-visible-btn"
            className="btn"
            type="button"
            onClick={onSelectAllVisible}
          >
            Select all in view
          </button>
          <button
            id="matching-selection-deselect-all-btn"
            className="btn"
            type="button"
            disabled={selectedInView === 0}
            onClick={onDeselectAll}
          >
            Deselect all
          </button>
          <button
            id="matching-selection-eligible-btn"
            className="btn"
            type="button"
            disabled={!hasEligible}
            onClick={onSelectEligible}
          >
            Select eligible in view
          </button>
          <button
            id="matching-selection-invert-btn"
            className="btn"
            type="button"
            disabled={donorsInView.length === 0}
            onClick={onInvertSelection}
          >
            Invert selection
          </button>
          <button
            id="matching-selection-clear-btn"
            className="btn"
            type="button"
            disabled={!hasSelection}
            onClick={onClearSelection}
          >
            Clear selection
          </button>
        </div>
      </div>
      <div className="row">
        <button
          id="matching-selection-notify-btn"
          className="btn"
          type="button"
          disabled={selectedInView === 0}
          onClick={onNotifySelected}
        >
          Notify selected ({selectedInView})
        </button>
        <button
          id="matching-notify-all-btn"
          className="btn"
          type="button"
          disabled={selectedInView === 0}
          onClick={onNotifySelected}
        >
          Notify selected ({selectedInView})
        </button>
      </div>
    </section>
  )
}

export default DonorSelectionToolbar
