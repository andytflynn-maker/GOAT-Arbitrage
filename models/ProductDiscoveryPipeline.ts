import type { Product } from '@/models/Product';
import type { ProductMatchInput } from '@/services/productMatchEngine';

export interface MatchPreparationRecord {
  productId: string;
  normalizedProduct: Product;
  source: ProductMatchInput;
  candidatePool: ProductMatchInput[];
  stage: 'prepared';
}

export interface MarketplaceCandidate {
  productId: string;
  retailer: string;
  stage: 'placeholder';
  notes: string;
}

export interface ArbitrageCandidate {
  productId: string;
  retailer: string;
  stage: 'placeholder';
  notes: string;
}

export interface ProductDiscoveryPipelineTimings {
  discoverProductsMs: number;
  normalizeProductsMs: number;
  matchProductsMs: number;
  buildMarketplaceCandidatesMs: number;
  buildArbitrageCandidatesMs: number;
  totalMs: number;
}

export interface ProductDiscoveryPipelineResult {
  adapterName: string;
  query: string;
  discoveredProducts: Product[];
  normalizedProducts: Product[];
  matchPreparation: MatchPreparationRecord[];
  marketplaceCandidates: MarketplaceCandidate[];
  arbitrageCandidates: ArbitrageCandidate[];
  timings: ProductDiscoveryPipelineTimings;
}
