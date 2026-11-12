import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';
import type {
  RetailerCapabilityFlags,
  RetailerHealthLogEntry,
  RetailerHealthRecord,
  RetailerHealthStatus,
  RetailerHealthSummary,
} from '@/types/retailerHealth';

const MOCK_ADAPTER_VERSION = '1.0.0-mock';

function toRetailerId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function makeDateMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function makeLogs(retailerName: string, status: RetailerHealthStatus, baseId: string): RetailerHealthLogEntry[] {
  const logs: RetailerHealthLogEntry[] = [
    {
      id: `${baseId}-log-1`,
      timestamp: makeDateMinutesAgo(3),
      level: 'info',
      message: `[DEMO] Scan completed for ${retailerName}`,
      source: 'demo',
    },
    {
      id: `${baseId}-log-2`,
      timestamp: makeDateMinutesAgo(11),
      level: 'info',
      message: '[DEMO] Catalog page parsed successfully.',
      source: 'demo',
    },
  ];

  if (status === 'warning' || status === 'error') {
    logs.push({
      id: `${baseId}-log-3`,
      timestamp: makeDateMinutesAgo(28),
      level: status === 'error' ? 'error' : 'warning',
      message: status === 'error' ? '[DEMO] Adapter timeout while fetching product details.' : '[DEMO] Inventory signal fluctuated across pages.',
      source: 'demo',
    });
  }

  return logs;
}

function buildCapabilities(retailerName: string): RetailerCapabilityFlags {
  const normalized = retailerName.toLowerCase();

  if (normalized.includes('blowout')) {
    return {
      supportsSearch: true,
      supportsInventoryDetection: true,
      supportsPriceDetection: true,
      supportsProductDetails: true,
      supportsRestockDetection: false,
    };
  }

  return {
    supportsSearch: true,
    supportsInventoryDetection: true,
    supportsPriceDetection: true,
    supportsProductDetails: true,
    supportsRestockDetection: true,
  };
}

export function buildMockRetailerHealthRecords(adapters: RetailerAdapter[]): RetailerHealthRecord[] {
  const statusSeed: RetailerHealthStatus[] = ['healthy', 'warning', 'error', 'disabled'];

  return adapters.map((adapter, index) => {
    const retailerName = adapter.getRetailerName();
    const retailerId = toRetailerId(retailerName);
    const seededStatus = statusSeed[index % statusSeed.length];
    const disabled = seededStatus === 'disabled';

    const productsFound = disabled ? 0 : 25 + index * 3;
    const opportunitiesFound = disabled ? 0 : Math.max(0, Math.floor(productsFound * 0.32));
    const scanDurationBaseMs = 900 + index * 140;
    const averageDurationMs = 1000 + index * 160;
    const hasError = seededStatus === 'error';
    const hasWarning = seededStatus === 'warning';

    return {
      retailerId,
      retailerName,
      adapterVersion: MOCK_ADAPTER_VERSION,
      dataSource: 'demo',
      disabled,
      metrics: {
        status: seededStatus,
        lastSuccessfulScanAt: disabled || hasError ? null : makeDateMinutesAgo(9 + index * 2),
        lastScanAttemptAt: makeDateMinutesAgo(2 + index),
        lastScanDurationMs: disabled ? null : scanDurationBaseMs,
        averageScanDurationMs: disabled ? null : averageDurationMs,
        productsFound,
        opportunitiesFound,
        successRatePercent: disabled ? 0 : hasError ? 42 : hasWarning ? 88 : 98,
        consecutiveFailures: disabled ? 0 : hasError ? 4 : hasWarning ? 1 : 0,
        totalErrors: disabled ? 0 : hasError ? 29 : hasWarning ? 5 : 1,
        lastErrorMessage: hasError
          ? 'Request timeout during details enrichment.'
          : hasWarning
            ? 'Intermittent inventory parse mismatch.'
            : null,
      },
      capabilities: buildCapabilities(retailerName),
      logs: makeLogs(retailerName, seededStatus, retailerId),
    };
  });
}

export function buildRetailerHealthSummary(records: RetailerHealthRecord[]): RetailerHealthSummary {
  return records.reduce<RetailerHealthSummary>(
    (summary, record) => {
      summary.registeredRetailers += 1;
      summary.productsIndexed += record.metrics.productsFound;
      summary.opportunitiesFoundToday += record.metrics.opportunitiesFound;

      if (record.metrics.status === 'healthy') {
        summary.healthyRetailers += 1;
      }

      if (record.metrics.status === 'error') {
        summary.retailersWithErrors += 1;
      }

      return summary;
    },
    {
      registeredRetailers: 0,
      healthyRetailers: 0,
      retailersWithErrors: 0,
      productsIndexed: 0,
      opportunitiesFoundToday: 0,
    },
  );
}
