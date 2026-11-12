import type { Product } from '@/models/Product';

export type AdapterTestStatus = 'idle' | 'running' | 'passed' | 'failed';

export type AdapterSourceType = 'stub' | 'demo' | 'placeholder' | 'live' | 'unknown';

export interface AdapterTestStep {
  key:
    | 'adapter-found'
    | 'retailer-name-resolved'
    | 'search-method-executed'
    | 'products-returned'
    | 'product-normalization-completed'
    | 'required-fields-present'
    | 'product-urls-valid'
    | 'prices-valid'
    | 'inventory-values-valid'
    | 'data-source-explicitly-verified';
  label: string;
  status: Exclude<AdapterTestStatus, 'idle' | 'running'>;
  message: string;
  durationMs: number;
  details?: string[];
}

export interface AdapterTestResult {
  status: Exclude<AdapterTestStatus, 'idle' | 'running'>;
  adapterName: string;
  adapterSource: AdapterSourceType;
  query: string;
  productsReturnedCount: number;
  elapsedMs: number;
  steps: AdapterTestStep[];
  errorDetails: string[];
  sampleNormalizedProduct: Product | null;
}
