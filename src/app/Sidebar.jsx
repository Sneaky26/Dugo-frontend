function Sidebar({ items, activeNav, onSelect }) {
  return (
    <aside id="sidebar">
      <div id="sidebar-logo">
        <span id="sidebar-logo-name">Dugo+</span>
        <span id="sidebar-logo-facility" className="pill">
          Tagaytay City Blood Bank, Cavite
        </span>
      </div>

      <nav id="sidebar-nav" aria-label="Main">
        {items.map((item) => (
          <a
            key={item.id}
            id={item.id}
            className="btn"
            href={`#/${item.label.toLowerCase().replaceAll(' ', '-')}`}
            data-active={item.id === activeNav}
            onClick={(event) => {
              event.preventDefault()
              onSelect(item.id)
            }}
          >
            <span>[icon]</span>
            <span>{item.label}</span>
            {item.id === 'nav-requests' && (
              <span id="nav-urgent-count" className="badge" data-status="urgent">
                3
              </span>
            )}
          </a>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar