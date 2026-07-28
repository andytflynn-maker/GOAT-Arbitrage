type RetailerShopRow = {
  retailer: string;
  productDetailUrl?: string;
  productSearchUrl?: string;
  price: number;
  availability: string;
  shipping: string;
  isLowest: boolean;
};

type RetailerShopSummary = {
  retailerCount: number;
  lowestPrice: number;
  averagePrice: number;
  highestPrice: number;
};

type RetailerShopPanelProps = {
  rows: RetailerShopRow[];
  summary: RetailerShopSummary;
};

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return `$${value.toFixed(2)}`;
}

export default function RetailerShopPanel({ rows, summary }: RetailerShopPanelProps) {
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Retailers</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{summary.retailerCount}</div>
        </div>
        <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Lowest Price</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(summary.lowestPrice)}</div>
        </div>
        <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Average Price</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(summary.averagePrice)}</div>
        </div>
        <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Highest Price</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(summary.highestPrice)}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
          <thead>
            <tr style={{ background: '#111827', color: '#cbd5e1', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retailer</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Price</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Availability</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Shipping</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const availabilityColor = row.availability === 'In Stock' ? '#bbf7d0' : row.availability === 'Limited' ? '#fde68a' : '#fecaca';
              const availabilityBackground = row.availability === 'In Stock' ? 'rgba(34, 197, 94, 0.16)' : row.availability === 'Limited' ? 'rgba(250, 204, 21, 0.16)' : 'rgba(248, 113, 113, 0.16)';
              const retailerProductUrl = row.productDetailUrl ?? row.productSearchUrl;

              return (
                <tr
                  key={row.retailer}
                  style={{
                    borderTop: '1px solid #243347',
                    background: row.isLowest ? 'rgba(34, 197, 94, 0.08)' : '#0b1220',
                  }}
                >
                  <td style={{ padding: '14px', fontWeight: row.isLowest ? 700 : 600, color: '#e5e7eb' }}>
                    {retailerProductUrl ? (
                      <a href={retailerProductUrl} target="_blank" rel="noopener noreferrer" className="goat-retailer-link">
                        {row.retailer}
                      </a>
                    ) : (
                      row.retailer
                    )}
                  </td>
                  <td style={{ padding: '14px', fontWeight: row.isLowest ? 700 : 500, color: row.isLowest ? '#86efac' : '#e5e7eb' }}>{formatCurrency(row.price)}</td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: availabilityColor,
                        background: availabilityBackground,
                      }}
                    >
                      {row.availability}
                    </span>
                  </td>
                  <td style={{ padding: '14px', color: '#cbd5e1' }}>{row.shipping}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
