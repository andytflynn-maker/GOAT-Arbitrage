import type { RetailerConfiguration } from '@/models/RetailerConfiguration';

interface RetailerManagementTableProps {
  rows: RetailerConfiguration[];
  onEdit: (retailerId: string) => void;
  onToggleEnabled: (retailerId: string) => void;
  onViewAdapter: (retailerId: string) => void;
  onViewConfiguration: (retailerId: string) => void;
}

function statusTone(status: RetailerConfiguration['adapterStatus']): { background: string; color: string; border: string } {
  if (status === 'ready') {
    return {
      background: 'rgba(34, 197, 94, 0.18)',
      color: '#bbf7d0',
      border: '1px solid rgba(74, 222, 128, 0.45)',
    };
  }

  if (status === 'needs-config') {
    return {
      background: 'rgba(250, 204, 21, 0.18)',
      color: '#fde68a',
      border: '1px solid rgba(250, 204, 21, 0.45)',
    };
  }

  if (status === 'error') {
    return {
      background: 'rgba(248, 113, 113, 0.18)',
      color: '#fecaca',
      border: '1px solid rgba(248, 113, 113, 0.45)',
    };
  }

  return {
    background: 'rgba(148, 163, 184, 0.18)',
    color: '#cbd5e1',
    border: '1px solid rgba(148, 163, 184, 0.4)',
  };
}

function capabilitySummary(row: RetailerConfiguration): string {
  const parts = [
    row.supportsSearch ? 'Search' : null,
    row.supportsInventory ? 'Inventory' : null,
    row.supportsPricing ? 'Pricing' : null,
    row.supportsProductDetails ? 'Details' : null,
    row.supportsRestockMonitoring ? 'Restock' : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(', ') : 'None';
}

export default function RetailerManagementTable({
  rows,
  onEdit,
  onToggleEnabled,
  onViewAdapter,
  onViewConfiguration,
}: RetailerManagementTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1180px' }}>
        <thead>
          <tr style={{ background: '#111827', color: '#e2e8f0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retailer</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Enabled</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Data Source</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Capabilities</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Scan Frequency</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Priority</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Version</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tone = statusTone(row.adapterStatus);

            return (
              <tr key={row.retailerId} style={{ borderTop: '1px solid #243347', background: '#0b1220' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 700 }}>{row.retailerName}</div>
                  <a href={row.website} target="_blank" rel="noopener noreferrer" className="goat-retailer-link">
                    {row.website}
                  </a>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '12px',
                      background: tone.background,
                      color: tone.color,
                      border: tone.border,
                    }}
                  >
                    {row.adapterStatus}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: row.enabled ? '#bbf7d0' : '#cbd5e1', fontWeight: 700 }}>
                  {row.enabled ? 'Yes' : 'No'}
                </td>
                <td style={{ padding: '12px 14px', color: '#e5e7eb' }}>{row.dataSourceType}</td>
                <td style={{ padding: '12px 14px', color: '#e5e7eb' }}>{capabilitySummary(row)}</td>
                <td style={{ padding: '12px 14px', color: '#e5e7eb' }}>{row.scanFrequencyMinutes} min</td>
                <td style={{ padding: '12px 14px', color: '#e5e7eb' }}>{row.scanPriority}</td>
                <td style={{ padding: '12px 14px', color: '#e5e7eb' }}>{row.adapterVersion}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onEdit(row.retailerId)}
                      style={{ borderRadius: '999px', border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleEnabled(row.retailerId)}
                      style={{ borderRadius: '999px', border: '1px solid #334155', background: '#111827', color: '#cbd5e1', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {row.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewAdapter(row.retailerId)}
                      style={{ borderRadius: '999px', border: '1px solid #2563eb', background: '#1d4ed8', color: '#f8fafc', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View Adapter
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewConfiguration(row.retailerId)}
                      style={{ borderRadius: '999px', border: '1px solid #334155', background: '#0b1220', color: '#cbd5e1', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View Configuration
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
