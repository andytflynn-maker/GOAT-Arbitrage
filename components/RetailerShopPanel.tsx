type RetailerShopRow = {
  retailer: string;
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
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Retailers</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{summary.retailerCount}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Lowest Price</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(summary.lowestPrice)}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Average Price</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(summary.averagePrice)}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Highest Price</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(summary.highestPrice)}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retailer</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Price</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Availability</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Shipping</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const availabilityColor = row.availability === 'In Stock' ? '#166534' : row.availability === 'Limited' ? '#b45309' : '#991b1b';
              const availabilityBackground = row.availability === 'In Stock' ? '#dcfce7' : row.availability === 'Limited' ? '#fef3c7' : '#fee2e2';

              return (
                <tr
                  key={row.retailer}
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    background: row.isLowest ? '#f0fdf4' : 'transparent',
                  }}
                >
                  <td style={{ padding: '14px', fontWeight: row.isLowest ? 700 : 600, color: '#0f172a' }}>{row.retailer}</td>
                  <td style={{ padding: '14px', fontWeight: row.isLowest ? 700 : 500, color: row.isLowest ? '#166534' : '#0f172a' }}>{formatCurrency(row.price)}</td>
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
                  <td style={{ padding: '14px', color: '#475569' }}>{row.shipping}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
