function Topbar() {
  return (
    <header id="topbar">
      <form id="topbar-search" className="field" role="search">
        <label className="sr-only">Search Dugo+</label>
        <input
          type="search"
          name="q"
          placeholder="Search requests, donors, inventory"
        />
      </form>

      <button id="topbar-emergency-btn" className="btn" type="button" data-status="emergency">
        <span>[icon]</span>
        <span>Emergency mode</span>
      </button>

      <button id="topbar-notifications" className="btn" type="button" aria-label="Notifications, 5 unread">
        <span>[icon]</span>
        <span className="badge" data-status="new">
          5
        </span>
      </button>

      <button id="topbar-profile" className="btn" type="button">
        <span>[icon]</span>
        <span id="topbar-profile-text">
          <span>Maria Santos</span>
          <span>Blood Bank Admin</span>
        </span>
        <span>[icon]</span>
      </button>
    </header>
  )
}

export default Topbar