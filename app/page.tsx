import { ArchitectureOverview } from '@/components/ArchitectureOverview';
import { runAnalysis } from '@/services/analysisService';

const retailers = [
  "Scan Dave & Adam's",
  "Scan Steel City",
  "Scan Blowout",
  "Scan Midwest Cards",
  "Scan CardGiants",
];

export default async function HomePage() {
  const products = await runAnalysis();
  const buyCandidates = products.filter((product) => (product.arbitrageMetrics.estimatedProfit ?? 0) > 0).length;
  const estimatedProfit = products.reduce((total, product) => total + (product.arbitrageMetrics.estimatedProfit ?? 0), 0);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">GOAT Arbitrage</p>
        <h1>GOAT Arbitrage</h1>
        <p className="subtitle">A universal product model for cards and future collectibles</p>

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
            <strong>{products.length}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Buy candidates</span>
            <strong>{buyCandidates}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Estimated profit</span>
            <strong>${estimatedProfit.toFixed(2)}</strong>
          </article>
        </div>
      </section>

      <ArchitectureOverview products={products} />
    </main>
  );
}
