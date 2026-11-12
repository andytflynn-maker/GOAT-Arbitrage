export type MarketTrendDirection = 'up' | 'flat' | 'down';
export type MarketTrendLabel = 'Rising' | 'Stable' | 'Falling';

export type MarketTrendSnapshot = {
  sevenDayAverageSoldPrice: number | null;
  thirtyDayAverageSoldPrice: number | null;
  trendDirection: MarketTrendDirection | null;
  percentChange: number | null;
  trendLabel: MarketTrendLabel | null;
  sourceLabel: string;
};

type MarketTrendModuleProps = {
  data: MarketTrendSnapshot;
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return 'Coming Soon';
  }

  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return 'Coming Soon';
  }

  return `${value.toFixed(1)}%`;
}

function directionText(direction: MarketTrendDirection | null) {
  if (direction === 'up') {
    return 'Rising';
  }
  if (direction === 'down') {
    return 'Falling';
  }
  if (direction === 'flat') {
    return 'Stable';
  }

  return 'Coming Soon';
}

export default function MarketTrendModule({ data }: MarketTrendModuleProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px 16px',
        fontSize: '14px',
        color: '#e5e7eb',
      }}
    >
      <div><span style={{ color: '#94a3b8' }}>7-Day Avg Sold Price:</span> {formatCurrency(data.sevenDayAverageSoldPrice)}</div>
      <div><span style={{ color: '#94a3b8' }}>30-Day Avg Sold Price:</span> {formatCurrency(data.thirtyDayAverageSoldPrice)}</div>
      <div><span style={{ color: '#94a3b8' }}>Trend Direction:</span> {directionText(data.trendDirection)}</div>
      <div><span style={{ color: '#94a3b8' }}>Percent Change:</span> {formatPercent(data.percentChange)}</div>
      <div><span style={{ color: '#94a3b8' }}>Trend Label:</span> {data.trendLabel ?? 'Coming Soon'}</div>
      <div><span style={{ color: '#94a3b8' }}>Data Source:</span> {data.sourceLabel}</div>
    </div>
  );
}
