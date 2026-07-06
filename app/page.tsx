const retailers = [
  "Scan Dave & Adam's",
  "Scan Steel City",
  "Scan Blowout",
  "Scan Midwest Cards",
  "Scan CardGiants",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">GOAT Arbitrage</p>
        <h1>GOAT Arbitrage</h1>
        <p className="subtitle">Dealer intelligence for sealed card inventory</p>

        <div className="retailer-grid" aria-label="Retailer scan actions">
          {retailers.map((retailer) => (
            <button key={retailer} type="button" className="retailer-button">
              {retailer}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-card" aria-label="Dashboard overview">
        <div className="dashboard-header">
          <h2>Live intelligence</h2>
          <p>Foundation UI for upcoming dealer analysis.</p>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Products scanned</span>
            <strong>0</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Buy candidates</span>
            <strong>0</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Estimated profit</span>
            <strong>$0</strong>
          </article>
        </div>
      </section>
    </main>
  );
}
