import type { RetailerHealthLogEntry, RetailerHealthRecord, RetailerHealthStatus } from '@/types/retailerHealth';

interface RetailerHealthCardProps {
  retailer: RetailerHealthRecord;
  isBusy: boolean;
  showLogs: boolean;
  onRunScan: (retailerId: string) => void;
  onToggleDisabled: (retailerId: string) => void;
  onToggleLogs: (retailerId: string) => void;
}

const STATUS_STYLES: Record<RetailerHealthStatus, { bg: string; border: string; text: string; label: string }> = {
  healthy: {
    bg: 'rgba(34, 197, 94, 0.18)',
    border: '1px solid rgba(74, 222, 128, 0.45)',
    text: '#bbf7d0',
    label: 'Healthy',
  },
  warning: {
    bg: 'rgba(250, 204, 21, 0.18)',
    border: '1px solid rgba(250, 204, 21, 0.45)',
    text: '#fde68a',
    label: 'Warning',
  },
  error: {
    bg: 'rgba(248, 113, 113, 0.18)',
    border: '1px solid rgba(248, 113, 113, 0.45)',
    text: '#fecaca',
    label: 'Error',
  },
  disabled: {
    bg: 'rgba(148, 163, 184, 0.18)',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    text: '#cbd5e1',
    label: 'Disabled',
  },
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'Demo: Never';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Demo: Invalid date';
  }

  return `Demo: ${date.toLocaleString()}`;
}

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) {
    return 'Demo: N/A';
  }

  if (milliseconds < 1000) {
    return `Demo: ${milliseconds} ms`;
  }

  return `Demo: ${(milliseconds / 1000).toFixed(2)} s`;
}

function renderCapability(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function renderLogLevel(log: RetailerHealthLogEntry): string {
  if (log.level === 'error') {
    return '#fecaca';
  }
  if (log.level === 'warning') {
    return '#fde68a';
  }

  return '#bfdbfe';
}

export default function RetailerHealthCard({
  retailer,
  isBusy,
  showLogs,
  onRunScan,
  onToggleDisabled,
  onToggleLogs,
}: RetailerHealthCardProps) {
  const statusStyle = STATUS_STYLES[retailer.metrics.status];

  return (
    <article
      style={{
        background: 'linear-gradient(180deg, rgba(11, 18, 32, 0.96), rgba(8, 13, 24, 0.95))',
        border: '1px solid #243347',
        borderRadius: '14px',
        boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
        padding: '16px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px' }}>{retailer.retailerName}</h3>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Adapter v{retailer.adapterVersion} • {retailer.dataSource.toUpperCase()} DATA</div>
        </div>
        <span
          style={{
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 700,
            background: statusStyle.bg,
            border: statusStyle.border,
            color: statusStyle.text,
            whiteSpace: 'nowrap',
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px 12px', marginBottom: '14px' }}>
        <div><span style={{ color: '#94a3b8' }}>Last Successful Scan (Demo):</span> <span style={{ color: '#e2e8f0' }}>{formatDate(retailer.metrics.lastSuccessfulScanAt)}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Last Scan Attempt (Demo):</span> <span style={{ color: '#e2e8f0' }}>{formatDate(retailer.metrics.lastScanAttemptAt)}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Scan Duration (Demo):</span> <span style={{ color: '#e2e8f0' }}>{formatDuration(retailer.metrics.lastScanDurationMs)}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Average Scan Duration (Demo):</span> <span style={{ color: '#e2e8f0' }}>{formatDuration(retailer.metrics.averageScanDurationMs)}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Products Found (Demo):</span> <span style={{ color: '#e2e8f0' }}>{retailer.metrics.productsFound.toLocaleString()}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Opportunities Found (Demo):</span> <span style={{ color: '#e2e8f0' }}>{retailer.metrics.opportunitiesFound.toLocaleString()}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Success Rate % (Demo):</span> <span style={{ color: '#e2e8f0' }}>{retailer.metrics.successRatePercent.toFixed(1)}%</span></div>
        <div><span style={{ color: '#94a3b8' }}>Consecutive Failures (Demo):</span> <span style={{ color: '#e2e8f0' }}>{retailer.metrics.consecutiveFailures}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Total Errors (Demo):</span> <span style={{ color: '#e2e8f0' }}>{retailer.metrics.totalErrors}</span></div>
        <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Last Error Message (Demo):</span> <span style={{ color: '#e2e8f0' }}>{retailer.metrics.lastErrorMessage ?? 'Demo: None'}</span></div>
      </div>

      <div style={{ borderTop: '1px solid #243347', paddingTop: '12px', marginTop: '2px', marginBottom: '14px' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          Capabilities
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px 12px' }}>
          <div><span style={{ color: '#94a3b8' }}>Supports Search:</span> <span style={{ color: '#e2e8f0' }}>{renderCapability(retailer.capabilities.supportsSearch)}</span></div>
          <div><span style={{ color: '#94a3b8' }}>Supports Inventory Detection:</span> <span style={{ color: '#e2e8f0' }}>{renderCapability(retailer.capabilities.supportsInventoryDetection)}</span></div>
          <div><span style={{ color: '#94a3b8' }}>Supports Price Detection:</span> <span style={{ color: '#e2e8f0' }}>{renderCapability(retailer.capabilities.supportsPriceDetection)}</span></div>
          <div><span style={{ color: '#94a3b8' }}>Supports Product Details:</span> <span style={{ color: '#e2e8f0' }}>{renderCapability(retailer.capabilities.supportsProductDetails)}</span></div>
          <div><span style={{ color: '#94a3b8' }}>Supports Restock Detection:</span> <span style={{ color: '#e2e8f0' }}>{renderCapability(retailer.capabilities.supportsRestockDetection)}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: showLogs ? '12px' : 0 }}>
        <button
          type="button"
          onClick={() => onRunScan(retailer.retailerId)}
          disabled={isBusy}
          style={{
            borderRadius: '999px',
            border: '1px solid #2563eb',
            background: isBusy ? '#1e293b' : '#1d4ed8',
            color: '#f8fafc',
            fontWeight: 700,
            fontSize: '12px',
            padding: '6px 12px',
            cursor: isBusy ? 'wait' : 'pointer',
          }}
        >
          {isBusy ? 'Running Demo Scan...' : 'Run Demo Scan'}
        </button>
        <button
          type="button"
          onClick={() => onToggleDisabled(retailer.retailerId)}
          style={{
            borderRadius: '999px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#cbd5e1',
            fontWeight: 700,
            fontSize: '12px',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          {retailer.disabled ? 'Demo Enable' : 'Demo Disable'}
        </button>
        <button
          type="button"
          onClick={() => onToggleLogs(retailer.retailerId)}
          style={{
            borderRadius: '999px',
            border: '1px solid #334155',
            background: '#0b1220',
            color: '#cbd5e1',
            fontWeight: 700,
            fontSize: '12px',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          {showLogs ? 'Hide Demo Logs' : 'View Demo Logs'}
        </button>
      </div>

      {showLogs ? (
        <div style={{ borderTop: '1px solid #243347', paddingTop: '10px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Demo Logs
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {retailer.logs.map((log) => (
              <div
                key={log.id}
                style={{
                  border: '1px solid #1f2d43',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  background: 'rgba(11, 18, 32, 0.68)',
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Demo: {new Date(log.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: renderLogLevel(log), marginBottom: '2px' }}>DEMO {log.level.toUpperCase()}</div>
                <div style={{ color: '#e2e8f0', fontSize: '14px' }}>{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
