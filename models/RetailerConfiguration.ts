export type RetailerDataSourceType =
  | 'approved-api'
  | 'licensed-provider'
  | 'merchant-feed'
  | 'manual'
  | 'disabled';

export type RetailerAdapterStatus = 'ready' | 'disabled' | 'needs-config' | 'error';

export type RetailerAuthenticationType = 'none' | 'api-key' | 'oauth2' | 'partner-token' | 'basic';

export interface RetailerConfiguration {
  retailerId: string;
  retailerName: string;
  logoUrl: string;
  website: string;
  enabled: boolean;
  adapterStatus: RetailerAdapterStatus;
  adapterVersion: string;
  dataSourceType: RetailerDataSourceType;
  searchUrlTemplate: string;
  productUrlTemplate: string;
  supportsSearch: boolean;
  supportsInventory: boolean;
  supportsPricing: boolean;
  supportsProductDetails: boolean;
  supportsRestockMonitoring: boolean;
  supportsAuthentication: boolean;
  authenticationType: RetailerAuthenticationType;
  scanPriority: number;
  scanFrequencyMinutes: number;
  categoryMappings: Record<string, string>;
  notes: string;
  createdDate: string;
  modifiedDate: string;
}

export interface RetailerConfigurationCreateInput {
  retailerName: string;
  website: string;
  dataSourceType: RetailerDataSourceType;
  searchUrlTemplate: string;
  productUrlTemplate: string;
  scanPriority: number;
  notes: string;
}
