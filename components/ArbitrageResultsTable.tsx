"use client";

import { useMemo, useState } from 'react';
import type { EbayMarketplaceAnalysis, BuyRecommendation, EbayTrendDirection } from '@/models/EbayMarketplaceAnalysis';

interface ArbitrageResultsTableProps {
  rows: EbayMarketplaceAnalysis[];
}

const columns = [
  { key: 'productImage', label: 'Product Image' },
  { key: 'productName', label: 'Product Name' },
  { key: 'retailer', label: 'Retailer' },
  { key: 'retailPrice', label: 'Retail Price' },
  { key: 'lowestBuyItNow', label: 'Lowest eBay BIN' },
  { key: 'averageRecentSoldPrice', label: 'Avg Recent Sold' },
  { key: 'sevenDayTrend', label: '7-Day Trend' },
  { key: 'thirtyDayTrend', label: '30-Day Trend' },
  { key: 'estimatedEbayFees', label: 'Estimated Fees' },
  { key: 'estimatedShipping', label: 'Estimated Shipping' },
  { key: 'netProfit', label: 'Net Profit' },
  { key: 'roiPercentage', label: 'ROI %' },
  { key: 'opportunityScore', label: 'Opportunity Score' },
  { key: 'buyRecommendation', label: 'Buy Recommendation' },
] as const;

function trendIcon(direction: EbayTrendDirection) {
  if (direction === 'Rising') return '↗';
  if (direction === 'Falling') return '↘';
  return '→';
}

function trendColor(direction: EbayTrendDirection) {
  if (direction === 'Rising') return 'trend-positive';
  if (direction === 'Falling') return 'trend-negative';
  return 'trend-neutral';
}

function recommendationTone(recommendation: BuyRecommendation) {
  if (recommendation === 'Strong Buy') return 'recommendation-positive';
  if (recommendation === 'Buy') return 'recommendation-positive';
  if (recommendation === 'Watch') return 'recommendation-neutral';
  return 'recommendation-negative';
}

function scoreTone(score: number) {
  if (score >= 80) return 'score-high';
  if (score >= 65) return 'score-medium';
  return 'score-low';
}

export function ArbitrageResultsTable({ rows }: ArbitrageResultsTableProps) {
  const [sortKey, setSortKey] = useState<keyof EbayMarketplaceAnalysis>('opportunityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortDirection === 'asc'
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });

    return sorted;
  }, [rows, sortKey, sortDirection]);

  function toggleSort(key: keyof EbayMarketplaceAnalysis) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('desc');
  }

  return (
    <div className="table-shell">
      <div className="table-scroll">
        <table className="results-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button type="button" className="sort-button" onClick={() => toggleSort(column.key as keyof EbayMarketplaceAnalysis)}>
                    {column.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.productName}>
                <td>
                  <img src={row.productImage} alt={row.productName} className="product-image" />
                </td>
                <td>{row.productName}</td>
                <td>{row.retailer}</td>
                <td>${row.retailPrice.toFixed(2)}</td>
                <td>${row.lowestBuyItNow.toFixed(2)}</td>
                <td>${row.averageRecentSoldPrice.toFixed(2)}</td>
                <td>
                  <span className={`trend-pill ${trendColor(row.sevenDayTrend)}`}>
                    {trendIcon(row.sevenDayTrend)} {row.sevenDayTrend}
                  </span>
                </td>
                <td>
                  <span className={`trend-pill ${trendColor(row.thirtyDayTrend)}`}>
                    {trendIcon(row.thirtyDayTrend)} {row.thirtyDayTrend}
                  </span>
                </td>
                <td>${row.estimatedEbayFees.toFixed(2)}</td>
                <td>${row.estimatedShipping.toFixed(2)}</td>
                <td>${row.netProfit.toFixed(2)}</td>
                <td>{row.roiPercentage.toFixed(1)}%</td>
                <td>
                  <span className={`score-pill ${scoreTone(row.opportunityScore)}`}>{row.opportunityScore}/100</span>
                </td>
                <td>
                  <span className={`recommendation-pill ${recommendationTone(row.buyRecommendation)}`}>{row.buyRecommendation}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
