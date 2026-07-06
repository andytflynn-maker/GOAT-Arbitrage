"use client";

import { useMemo, useState } from 'react';
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
    const analyses = await service.analyzeProducts(productNames);
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
        <div className="architecture-list">
          {results.map((analysis) => (
            <div key={analysis.productName}>
              <h3>{analysis.productName}</h3>
              <ul>
                <li>Lowest Buy It Now: ${analysis.lowestBuyItNow}</li>
                <li>Average Recent Sold: ${analysis.averageRecentSoldPrice}</li>
                <li>Sold Listings: {analysis.soldListingsCount}</li>
                <li>7-Day Trend: {analysis.sevenDayTrend}</li>
                <li>30-Day Trend: {analysis.thirtyDayTrend}</li>
                <li>Estimated eBay Fees: ${analysis.estimatedEbayFees}</li>
                <li>Estimated Shipping: ${analysis.estimatedShipping}</li>
                <li>Net Profit: ${analysis.netProfit}</li>
                <li>ROI: {analysis.roiPercentage}%</li>
                <li>Opportunity Score: {analysis.opportunityScore}/100</li>
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="subtitle">Use the scan button to run placeholder eBay analysis for this retailer.</p>
      )}
    </section>
  );
}
