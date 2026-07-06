"use client";

import { useMemo, useState } from 'react';
import { ArbitrageResultsTable } from '@/components/ArbitrageResultsTable';
import type { EbayMarketplaceAnalysis } from '@/models/EbayMarketplaceAnalysis';
import { EbayMarketplaceService } from '@/services/ebayMarketplaceService';

interface RetailerScanPanelProps {
  retailerName: string;
  productNames: string[];
}

export function RetailerScanPanel({ retailerName, productNames }: RetailerScanPanelProps) {
  const [results, setResults] = useState<EbayMarketplaceAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const service = useMemo(() => new EbayMarketplaceService({ useMockData: true }), []);

  async function runScan() {
    setLoading(true);
    const analyses = await service.analyzeProducts(productNames, retailerName);
    setResults(analyses);
    setLoading(false);
  }

  return (
    <section className="dashboard-card" aria-label={`${retailerName} scan results`}>
      <div className="dashboard-header">
        <h2>{retailerName}</h2>
        <p>Mocked eBay pricing intelligence for several products.</p>
      </div>

      <button type="button" className="retailer-button" onClick={runScan} disabled={loading}>
        {loading ? 'Scanning…' : `Analyze ${retailerName}`}
      </button>

      {results.length > 0 ? (
        <ArbitrageResultsTable rows={results} />
      ) : (
        <p className="subtitle">Click the scan button to inspect a sortable arbitrage results table.</p>
      )}
    </section>
  );
}
