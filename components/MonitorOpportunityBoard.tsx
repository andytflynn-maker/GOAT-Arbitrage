"use client";

import { useMemo, useState } from 'react';
import type { Opportunity } from '@/models/Opportunity';
import {
  getFilteredOpportunities,
  getSortedOpportunities,
  type OpportunityFeedFilter,
  type OpportunityFeedSortBy,
} from '@/services/opportunityFeed';

type MonitorOpportunityBoardProps = {
  opportunities: Opportunity[];
};

const filterOptions: Array<{ value: OpportunityFeedFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'hot', label: 'Hot Opportunities' },
  { value: 'price-drops', label: 'Price Drops' },
  { value: 'restocks', label: 'Restocks' },
  { value: 'limited-stock', label: 'Limited Stock' },
];

const sortOptions: Array<{ value: OpportunityFeedSortBy; label: string }> = [
  { value: 'highest-roi', label: 'Highest ROI' },
  { value: 'highest-confidence', label: 'Highest Confidence' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest-profit', label: 'Highest Profit' },
];

function formatCurrency(value: number | null) {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}

function formatDetectedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getOpportunityBadge(opportunity: Opportunity) {
  if (opportunity.inventoryStatus === 'limited') {
    return 'Limited Stock';
  }
  if (opportunity.opportunityType === 'price-drop') {
    return 'Price Drop';
  }
  if (opportunity.opportunityType === 'restock') {
    return 'Restock';
  }
  if (opportunity.netProfit !== null && opportunity.roi !== null
    && opportunity.netProfit > 0 && opportunity.roi >= 10) {
    return 'Hot Opportunity';
  }

  return 'Opportunity';
}

export default function MonitorOpportunityBoard({ opportunities }: MonitorOpportunityBoardProps) {
  const [activeFilter, setActiveFilter] = useState<OpportunityFeedFilter>('all');
  const [activeSort, setActiveSort] = useState<OpportunityFeedSortBy>('highest-roi');

  const visibleRows = useMemo(() => {
    const filtered = getFilteredOpportunities(activeFilter, opportunities);
    return getSortedOpportunities(activeSort, filtered);
  }, [opportunities, activeFilter, activeSort]);

  return (
    <section className="dashboard-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>Monitor</p>
          <h2 style={{ margin: 0 }}>Opportunity Feed</h2>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
          <span>Sort</span>
          <select
            value={activeSort}
            onChange={(event) => setActiveSort(event.target.value as OpportunityFeedSortBy)}
            style={{
              padding: '10px 12px',
              borderRadius: '999px',
              border: '1px solid #334155',
              background: '#0b1220',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {filterOptions.map((option) => {
          const isActive = option.value === activeFilter;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveFilter(option.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid #334155',
                background: isActive ? '#1e293b' : '#0b1220',
                color: isActive ? '#f8fafc' : '#cbd5e1',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {visibleRows.map((opportunity) => {
          const badge = getOpportunityBadge(opportunity);
          const imageUrl = opportunity.productImage ?? '/placeholder-product.png';
          const roiTone = opportunity.roi === null ? '#94a3b8' : opportunity.roi >= 0 ? '#4ade80' : '#f87171';
          const profitTone = opportunity.netProfit === null ? '#94a3b8' : opportunity.netProfit >= 0 ? '#4ade80' : '#f87171';

          return (
            <article
              key={opportunity.id}
              onClick={() => console.info('Selected opportunity', opportunity)}
              style={{
                background: '#0b1220',
                borderRadius: '14px',
                border: '1px solid #243347',
                boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '5px 9px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: 'rgba(56, 189, 248, 0.16)', color: '#7dd3fc' }}>
                {badge}
              </div>

              <img
                src={imageUrl}
                alt={opportunity.productName}
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #243347' }}
              />

              <div>
                <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '15px', lineHeight: 1.4 }}>{opportunity.productName}</div>
                <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{opportunity.retailer}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', fontSize: '13px' }}>
                <div><span style={{ color: '#94a3b8' }}>Current:</span> <span style={{ color: '#e5e7eb' }}>{formatCurrency(opportunity.currentPrice)}</span></div>
                <div><span style={{ color: '#94a3b8' }}>Market:</span> <span style={{ color: '#e5e7eb' }}>{formatCurrency(opportunity.estimatedMarketPrice)}</span></div>
                <div><span style={{ color: '#94a3b8' }}>Net:</span> <span style={{ color: profitTone, fontWeight: 700 }}>{formatCurrency(opportunity.netProfit)}</span></div>
                <div><span style={{ color: '#94a3b8' }}>ROI:</span> <span style={{ color: roiTone, fontWeight: 700 }}>{opportunity.roi === null ? '—' : `${opportunity.roi.toFixed(1)}%`}</span></div>
                <div><span style={{ color: '#94a3b8' }}>Confidence:</span> <span style={{ color: '#e5e7eb' }}>{opportunity.confidenceScore ?? '—'}</span></div>
                <div><span style={{ color: '#94a3b8' }}>Detected:</span> <span style={{ color: '#e5e7eb' }}>{formatDetectedAt(opportunity.detectedAt)}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    console.info('Selected opportunity', opportunity);
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '999px',
                    border: '1px solid #2563eb',
                    background: '#1d4ed8',
                    color: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    console.info('Selected opportunity', opportunity);
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '999px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  VIEW DETAILS
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
