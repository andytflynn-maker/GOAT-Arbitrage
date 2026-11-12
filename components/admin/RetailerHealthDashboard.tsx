"use client";

import { useMemo, useState } from 'react';
import { registeredRetailers } from '@/marketplaces/registry';
import { buildMockRetailerHealthRecords, buildRetailerHealthSummary } from '@/data/mockRetailerHealth';
import RetailerHealthCard from '@/components/admin/RetailerHealthCard';
import RetailerHealthSummaryCards from '@/components/admin/RetailerHealthSummaryCards';
import type { RetailerHealthLogEntry, RetailerHealthRecord, RetailerHealthStatus } from '@/types/retailerHealth';

function statusFromMetrics(record: RetailerHealthRecord): RetailerHealthStatus {
  if (record.disabled) {
    return 'disabled';
  }

  if (record.metrics.consecutiveFailures >= 3 || record.metrics.totalErrors >= 20) {
    return 'error';
  }

  if (record.metrics.consecutiveFailures > 0 || record.metrics.lastErrorMessage) {
    return 'warning';
  }

  return 'healthy';
}

function nextMockScanDelta(record: RetailerHealthRecord): RetailerHealthRecord {
  const nowIso = new Date().toISOString();
  const simulatedDurationMs = 900 + Math.floor(Math.random() * 1200);
  const scanSucceeded = !record.disabled && Math.random() > 0.15;
  const productsFound = scanSucceeded ? 18 + Math.floor(Math.random() * 25) : 0;
  const opportunitiesFound = scanSucceeded ? Math.max(0, Math.floor(productsFound * 0.28)) : 0;

  const previousAverage = record.metrics.averageScanDurationMs ?? simulatedDurationMs;
  const nextAverage = Math.round((previousAverage + simulatedDurationMs) / 2);
  const logLevel: RetailerHealthLogEntry['level'] = scanSucceeded ? 'info' : 'error';
  const scanLog: RetailerHealthLogEntry = {
    id: `${record.retailerId}-${Date.now()}`,
    timestamp: nowIso,
    level: logLevel,
    source: 'demo',
    message: scanSucceeded
      ? `[DEMO] Demo scan completed. Found ${productsFound} products and ${opportunitiesFound} opportunities.`
      : '[DEMO] Demo scan failed due to simulated timeout.',
  };

  const nextMetrics = {
    ...record.metrics,
    lastScanAttemptAt: nowIso,
    lastScanDurationMs: simulatedDurationMs,
    averageScanDurationMs: nextAverage,
    productsFound,
    opportunitiesFound,
    successRatePercent: scanSucceeded
      ? Math.min(100, Number((record.metrics.successRatePercent + 1.5).toFixed(1)))
      : Math.max(0, Number((record.metrics.successRatePercent - 8).toFixed(1))),
    consecutiveFailures: scanSucceeded ? 0 : record.metrics.consecutiveFailures + 1,
    totalErrors: scanSucceeded ? record.metrics.totalErrors : record.metrics.totalErrors + 1,
    lastErrorMessage: scanSucceeded ? null : 'Mock scan timed out while checking inventory.',
    lastSuccessfulScanAt: scanSucceeded ? nowIso : record.metrics.lastSuccessfulScanAt,
  };

  return {
    ...record,
    metrics: {
      ...nextMetrics,
      status: statusFromMetrics({ ...record, metrics: nextMetrics }),
    },
    logs: [scanLog, ...record.logs].slice(0, 12),
  };
}

export default function RetailerHealthDashboard() {
  const [retailers, setRetailers] = useState<RetailerHealthRecord[]>(() => buildMockRetailerHealthRecords(registeredRetailers));
  const [busyRetailerId, setBusyRetailerId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const summary = useMemo(() => buildRetailerHealthSummary(retailers), [retailers]);

  const sortedRetailers = useMemo(
    () =>
      [...retailers].sort((left, right) => {
        const statusRank: Record<RetailerHealthStatus, number> = {
          error: 0,
          warning: 1,
          healthy: 2,
          disabled: 3,
        };

        const rankDelta = statusRank[left.metrics.status] - statusRank[right.metrics.status];
        if (rankDelta !== 0) {
          return rankDelta;
        }

        return left.retailerName.localeCompare(right.retailerName);
      }),
    [retailers],
  );

  const handleRunScan = (retailerId: string) => {
    setBusyRetailerId(retailerId);

    window.setTimeout(() => {
      setRetailers((prev) =>
        prev.map((retailer) => {
          if (retailer.retailerId !== retailerId) {
            return retailer;
          }
          return nextMockScanDelta(retailer);
        }),
      );
      setBusyRetailerId(null);
    }, 650);
  };

  const handleToggleDisabled = (retailerId: string) => {
    setRetailers((prev) =>
      prev.map((retailer) => {
        if (retailer.retailerId !== retailerId) {
          return retailer;
        }

        const disabled = !retailer.disabled;
        const nextStatus: RetailerHealthStatus = disabled ? 'disabled' : statusFromMetrics(retailer);
        const log: RetailerHealthLogEntry = {
          id: `${retailer.retailerId}-${Date.now()}-disable`,
          timestamp: new Date().toISOString(),
          level: 'warning',
          source: 'demo',
          message: disabled
            ? '[DEMO] Retailer adapter disabled by admin action.'
            : '[DEMO] Retailer adapter re-enabled by admin action.',
        };

        return {
          ...retailer,
          disabled,
          metrics: {
            ...retailer.metrics,
            status: nextStatus,
          },
          logs: [log, ...retailer.logs].slice(0, 12),
        };
      }),
    );
  };

  const handleToggleLogs = (retailerId: string) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [retailerId]: !prev[retailerId],
    }));
  };

  return (
    <main className="page-shell" style={{ gap: '24px' }}>
      <section className="hero-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p className="eyebrow">GOAT Admin</p>
        <h1 style={{ marginBottom: '12px' }}>Retailer Health Dashboard</h1>
        <p className="subtitle" style={{ maxWidth: '780px', margin: '0 auto' }}>
          Registry-backed operational health for retailer adapters and scan performance. Data shown here is mocked and designed for admin workflow validation.
        </p>
      </section>

      <section className="dashboard-card" style={{ padding: '24px' }}>
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(250, 204, 21, 0.5)',
            background: 'rgba(250, 204, 21, 0.14)',
            color: '#fef08a',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          DEMO DATA — Retailer health monitoring is not connected to live scans yet.
        </div>

        <RetailerHealthSummaryCards summary={summary} />

        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '12px' }}>
          Retailer Adapter Health
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '14px',
          }}
        >
          {sortedRetailers.map((retailer) => (
            <RetailerHealthCard
              key={retailer.retailerId}
              retailer={retailer}
              isBusy={busyRetailerId === retailer.retailerId}
              showLogs={Boolean(expandedLogs[retailer.retailerId])}
              onRunScan={handleRunScan}
              onToggleDisabled={handleToggleDisabled}
              onToggleLogs={handleToggleLogs}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
