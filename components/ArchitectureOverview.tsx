import type { Product } from '@/models/Product';

interface ArchitectureOverviewProps {
  products: Product[];
}

export function ArchitectureOverview({ products }: ArchitectureOverviewProps) {
  const totalRetailEntries = products.reduce((count, product) => count + product.retailPricing.length, 0);
  const totalMarketplaceEntries = products.reduce((count, product) => count + product.marketplacePricing.length, 0);

  return (
    <section className="dashboard-card" aria-label="Architecture overview">
      <div className="dashboard-header">
        <h2>Architecture foundation</h2>
        <p>Retailers and marketplaces are isolated behind connectors so the platform can scale across categories.</p>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Retail entries</span>
          <strong>{totalRetailEntries}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Marketplace entries</span>
          <strong>{totalMarketplaceEntries}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Products analyzed</span>
          <strong>{products.length}</strong>
        </article>
      </div>

      <div className="architecture-list">
        <div>
          <h3>Core folders</h3>
          <ul>
            <li>connectors/retailers for retailer integration</li>
            <li>marketplaces for marketplace enrichment</li>
            <li>services for orchestration logic</li>
            <li>models and types for shared contracts</li>
            <li>utils and components for reusable helpers and UI</li>
          </ul>
        </div>

        <div>
          <h3>Shared product model</h3>
          <ul>
            <li>Universal product identity and metadata</li>
            <li>Category-specific attributes stored in a flexible object</li>
            <li>Retail and marketplace pricing arrays for unlimited integrations</li>
            <li>Arbitrage metrics and trend analysis in dedicated sections</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
