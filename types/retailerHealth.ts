export type RetailerHealthStatus = 'healthy' | 'warning' | 'error' | 'disabled';
export type RetailerHealthDataSource = 'demo' | 'live';

export interface RetailerCapabilityFlags {
  supportsSearch: boolean;
  supportsInventoryDetection: boolean;
  supportsPriceDetection: boolean;
  supportsProductDetails: boolean;
  supportsRestockDetection: boolean;
}

export interface RetailerHealthLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: RetailerHealthDataSource;
}

export interface RetailerHealthMetrics {
  status: RetailerHealthStatus;
  lastSuccessfulScanAt: string | null;
  lastScanAttemptAt: string | null;
  lastScanDurationMs: number | null;
  averageScanDurationMs: number | null;
  productsFound: number;
  opportunitiesFound: number;
  successRatePercent: number;
  consecutiveFailures: number;
  totalErrors: number;
  lastErrorMessage: string | null;
}

export interface RetailerHealthRecord {
  retailerId: string;
  retailerName: string;
  adapterVersion: string;
  dataSource: RetailerHealthDataSource;
  disabled: boolean;
  metrics: RetailerHealthMetrics;
  capabilities: RetailerCapabilityFlags;
  logs: RetailerHealthLogEntry[];
}

export interface RetailerHealthSummary {
  registeredRetailers: number;
  healthyRetailers: number;
  retailersWithErrors: number;
  productsIndexed: number;
  opportunitiesFoundToday: number;
}
