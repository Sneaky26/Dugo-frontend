function PageContent({ title, screen: Screen, screenKey, ...props }) {
  return (
    <main id="page-content">
      <h1 id="page-title">{title}</h1>
      {/* Screen action buttons mount here (e.g. requests-new-request-btn). */}
      <div id="page-actions" />
      {/* Screen markup mounts here. screenKey remounts a screen when its
          request target changes (e.g. matching a different request). */}
      <div id="page-body">{Screen && <Screen key={screenKey} {...props} />}</div>
    </main>
  )
}

export default PageContent