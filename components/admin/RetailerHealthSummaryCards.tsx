import type { RetailerHealthSummary } from '@/types/retailerHealth';

interface RetailerHealthSummaryCardsProps {
  summary: RetailerHealthSummary;
}

export default function RetailerHealthSummaryCards({ summary }: RetailerHealthSummaryCardsProps) {
  const cards: Array<{ label: string; value: number }> = [
    { label: 'Registered Retailers (Demo)', value: summary.registeredRetailers },
    { label: 'Healthy Retailers (Demo)', value: summary.healthyRetailers },
    { label: 'Retailers With Errors (Demo)', value: summary.retailersWithErrors },
    { label: 'Products Indexed (Demo)', value: summary.productsIndexed },
    { label: 'Opportunities Found Today (Demo)', value: summary.opportunitiesFoundToday },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: '#0b1220',
            border: '1px solid #243347',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)',
          }}
        >
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: '6px' }}>
            {card.label}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>{card.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
