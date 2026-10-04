function PageContent({ title, screen: Screen }) {
  return (
    <main id="page-content">
      <h1 id="page-title">{title}</h1>
      {/* Screen action buttons mount here (e.g. requests-new-request-btn). */}
      <div id="page-actions" />
      {/* Screen markup mounts here. */}
      <div id="page-body">{Screen && <Screen />}</div>
    </main>
  )
}

export default PageContent