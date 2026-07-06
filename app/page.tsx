import { ArchitectureOverview } from '@/components/ArchitectureOverview';
import { RetailerScanPanel } from '@/components/RetailerScanPanel';
import { runAnalysis } from '@/services/analysisService';

const retailers = [
  {
    name: "Dave & Adam's",
    products: ['2024 Topps Chrome Sapphire Refractor', '2023 Panini Prizm Silver Prizm'],
  },
  {
    name: 'Steel City Collectibles',
    products: ['2024 Topps Series 1 Hobby Box', '2023 Panini Select Blaster Box'],
  },
  {
    name: 'Blowout Cards',
    products: ['2024 Pokémon Scarlet & Violet Booster Box', '2024 Topps Series 1 Hobby Box'],
  },
  {
    name: 'Midwest Cards',
    products: ['2023 Panini Select Blaster Box', '2024 Topps Chrome Sapphire Refractor'],
  },
  {
    name: 'CardGiants',
    products: ['2024 Pokémon Scarlet & Violet Booster Box', '2024 Topps Chrome Sapphire Refractor'],
  },
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
        <p className="subtitle">A universal product model with mocked eBay pricing intelligence</p>
      </section>

      <section className="dashboard-card" aria-label="Dashboard overview">
        <div className="dashboard-header">
          <h2>Live intelligence</h2>
          <p>Click a retailer scan card to review realistic sample eBay analysis.</p>
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

      <section className="dashboard-card" aria-label="Retailer scan panels">
        <div className="dashboard-header">
          <h2>Retailer scans</h2>
          <p>Each panel uses the reusable eBay marketplace service with mocked data.</p>
        </div>

        <div className="retailer-grid" aria-label="Retailer scan actions">
          {retailers.map((retailer) => (
            <RetailerScanPanel key={retailer.name} retailerName={retailer.name} productNames={retailer.products} />
          ))}
        </div>
      </section>

      <ArchitectureOverview products={products} />
    </main>
  );
}
