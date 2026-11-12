import type { CSSProperties } from 'react';

export type ScanStatusState = 'idle' | 'scanning' | 'completed' | 'error';

export interface ScanStatusProps {
  status: ScanStatusState;
  currentRetailerName?: string;
  scannedRetailers?: number;
  totalRetailers?: number;
  opportunitiesFound?: number;
  elapsedSeconds?: number;
  errorMessage?: string;
}

function formatElapsed(seconds: number | undefined): string {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds < 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

const toneStyles: Record<ScanStatusState, { border: string; background: string; label: string; labelColor: string }> = {
  idle: {
    border: '1px solid #334155',
    background: '#0b1220',
    label: 'Idle',
    labelColor: '#cbd5e1',
  },
  scanning: {
    border: '1px solid #2563eb',
    background: '#0c1f3b',
    label: 'Scanning',
    labelColor: '#93c5fd',
  },
  completed: {
    border: '1px solid #10b981',
    background: '#052e23',
    label: 'Completed',
    labelColor: '#86efac',
  },
  error: {
    border: '1px solid #ef4444',
    background: '#3f1313',
    label: 'Error',
    labelColor: '#fca5a5',
  },
};

export default function ScanStatus({
  status,
  currentRetailerName,
  scannedRetailers = 0,
  totalRetailers = 0,
  opportunitiesFound = 0,
  elapsedSeconds = 0,
  errorMessage,
}: ScanStatusProps) {
  const tone = toneStyles[status];

  const cardStyle: CSSProperties = {
    borderRadius: '14px',
    border: '1px solid #243347',
    background: '#0b1220',
    boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
    padding: '16px 18px',
    color: '#e5e7eb',
  };

  const progressText = totalRetailers > 0 ? `${Math.min(scannedRetailers, totalRetailers)} / ${totalRetailers}` : '0 / 0';

  return (
    <section style={cardStyle} aria-live="polite" aria-label="Scan status">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>
          Scan Status
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '999px',
            padding: '6px 10px',
            fontWeight: 700,
            fontSize: '12px',
            ...tone,
            color: tone.labelColor,
          }}
        >
          {tone.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px 16px', fontSize: '14px' }}>
        <div>
          <span style={{ color: '#94a3b8' }}>Current Retailer:</span>{' '}
          <span>{status === 'scanning' ? currentRetailerName ?? 'Waiting...' : currentRetailerName ?? '—'}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Progress:</span> <span>{progressText}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Total Retailers:</span> <span>{totalRetailers}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Opportunities Found:</span> <span>{opportunitiesFound}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Elapsed Time:</span> <span>{formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>

      {status === 'error' && errorMessage ? (
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#fecaca' }}>
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
