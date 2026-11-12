import type { Product } from '@/models/Product';
import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';
import { normalizeProductTitle } from '@/services/productNormalization';

export type TargetDataSourceMode = 'approved-api' | 'licensed-provider' | 'merchant-feed' | 'disabled';

export interface TargetAdapterDataSourceConfig {
  mode: TargetDataSourceMode;
  providerName?: string;
  credentialRef?: string;
  endpointBaseUrl?: string;
  feedUrl?: string;
  notes?: string;
}

export const TARGET_ADAPTER_DEFAULT_CONFIG: TargetAdapterDataSourceConfig = {
  mode: 'disabled',
  notes: 'Target integration is disabled until an approved data source is configured.',
};

/**
 * Future Target adapter workflow:
 * Search
 * ↓
 * Raw Target Product
 * ↓
 * Normalization
 * ↓
 * Product Match Engine
 * ↓
 * eBay Comparison
 * ↓
 * Arbitrage Engine
 */
export class TargetAdapter implements RetailerAdapter {
  public readonly adapterSource = 'stub' as const;

  constructor(
    public readonly dataSourceConfig: TargetAdapterDataSourceConfig = TARGET_ADAPTER_DEFAULT_CONFIG,
  ) {}

  getRetailerName(): string {
    return 'Target';
  }

  async searchProducts(_query: string): Promise<Product[]> {
    // TODO: Implement live Target catalog search and map raw response to Product[].
    return [];
  }

  async getProductByUrl(_url: string): Promise<Product | null> {
    // TODO: Implement live Target product-detail lookup by URL.
    return null;
  }

  normalizeProduct(product: Product): Product {
    // Keep normalization non-destructive and aligned with shared title conventions.
    const titleNormalization = normalizeProductTitle(product.universal.title);

    return {
      ...product,
      universal: {
        ...product.universal,
        title: product.universal.title.trim(),
        brand: product.universal.brand.trim(),
        manufacturer: product.universal.manufacturer.trim(),
      },
      categoryAttributes: {
        ...product.categoryAttributes,
        normalizedTitle: titleNormalization.normalizedTitle,
        normalizedYear: titleNormalization.year,
        normalizedBrand: titleNormalization.brand,
        normalizedProductLine: titleNormalization.productLine,
        normalizedProductType: titleNormalization.productType,
        normalizedVariants: titleNormalization.variants.join(', '),
      },
    };
  }
}
