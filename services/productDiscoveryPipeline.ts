import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';
import type { Product } from '@/models/Product';
import type {
  ArbitrageCandidate,
  MarketplaceCandidate,
  MatchPreparationRecord,
  ProductDiscoveryPipelineResult,
} from '@/models/ProductDiscoveryPipeline';
import { normalizeProductTitle } from '@/services/productNormalization';
import type { ProductMatchInput } from '@/services/productMatchEngine';

function nowMs(): number {
  return Date.now();
}

function toMatchInput(product: Product): ProductMatchInput {
  const titleNormalization = normalizeProductTitle(product.universal.title);

  return {
    title: product.universal.title,
    upc: product.universal.UPC,
    manufacturer: product.universal.manufacturer,
    brand: product.universal.brand,
    year: titleNormalization.year,
    productLine: titleNormalization.productLine,
    productVariant: titleNormalization.variants,
    configuration: titleNormalization.productType,
  };
}

export async function discoverProducts(adapter: RetailerAdapter, query: string): Promise<Product[]> {
  return adapter.searchProducts(query);
}

export function normalizeProducts(products: Product[]): Product[] {
  return products.map((product) => {
    const normalized = normalizeProductTitle(product.universal.title);

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
        normalizedTitle: normalized.normalizedTitle,
        normalizedYear: normalized.year,
        normalizedBrand: normalized.brand,
        normalizedProductLine: normalized.productLine,
        normalizedProductType: normalized.productType,
        normalizedVariants: normalized.variants.join(', '),
      },
    };
  });
}

export function matchProducts(products: Product[]): MatchPreparationRecord[] {
  return products.map((product) => ({
    productId: product.universal.id,
    normalizedProduct: product,
    source: toMatchInput(product),
    candidatePool: [],
    stage: 'prepared',
  }));
}

export function buildMarketplaceCandidates(products: Product[]): MarketplaceCandidate[] {
  return products.map((product) => ({
    productId: product.universal.id,
    retailer: product.retailPricing[0]?.retailer ?? 'Unknown',
    stage: 'placeholder',
    notes: 'Marketplace candidate generation is not implemented yet.',
  }));
}

export function buildArbitrageCandidates(products: Product[]): ArbitrageCandidate[] {
  return products.map((product) => ({
    productId: product.universal.id,
    retailer: product.retailPricing[0]?.retailer ?? 'Unknown',
    stage: 'placeholder',
    notes: 'Arbitrage candidate generation is not implemented yet.',
  }));
}

export async function runPipeline(adapter: RetailerAdapter, query: string): Promise<ProductDiscoveryPipelineResult> {
  const totalStart = nowMs();

  const discoverStart = nowMs();
  const discoveredProducts = await discoverProducts(adapter, query);
  const discoverProductsMs = nowMs() - discoverStart;

  const normalizeStart = nowMs();
  const normalizedProducts = normalizeProducts(discoveredProducts);
  const normalizeProductsMs = nowMs() - normalizeStart;

  const matchStart = nowMs();
  const matchPreparation = matchProducts(normalizedProducts);
  const matchProductsMs = nowMs() - matchStart;

  const marketplaceStart = nowMs();
  const marketplaceCandidates = buildMarketplaceCandidates(normalizedProducts);
  const buildMarketplaceCandidatesMs = nowMs() - marketplaceStart;

  const arbitrageStart = nowMs();
  const arbitrageCandidates = buildArbitrageCandidates(normalizedProducts);
  const buildArbitrageCandidatesMs = nowMs() - arbitrageStart;

  const totalMs = nowMs() - totalStart;

  return {
    adapterName: adapter.getRetailerName(),
    query,
    discoveredProducts,
    normalizedProducts,
    matchPreparation,
    marketplaceCandidates,
    arbitrageCandidates,
    timings: {
      discoverProductsMs,
      normalizeProductsMs,
      matchProductsMs,
      buildMarketplaceCandidatesMs,
      buildArbitrageCandidatesMs,
      totalMs,
    },
  };
}
