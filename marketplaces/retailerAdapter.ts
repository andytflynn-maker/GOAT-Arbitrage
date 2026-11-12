import type { Product } from '@/models/Product';

export type RetailerAdapterSource = 'live' | 'stub' | 'demo' | 'placeholder' | 'unknown';

export interface RetailerAdapter {
  adapterSource?: RetailerAdapterSource;
  getRetailerName(): string;
  searchProducts(query: string): Promise<Product[]>;
  getProductByUrl(url: string): Promise<Product | null>;
  normalizeProduct(product: Product): Product;
}
