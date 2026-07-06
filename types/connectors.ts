import type { Product } from '@/models/Product';

export interface RetailerConnector {
  id: string;
  name: string;
  retailer: string;
  scan(input?: RetailerScanInput): Promise<Product[]>;
}

export interface RetailerScanInput {
  url?: string;
  sku?: string;
  title?: string;
}

export interface MarketplaceConnector {
  id: string;
  name: string;
  marketplace: string;
  enrich(product: Product): Promise<Product>;
}
