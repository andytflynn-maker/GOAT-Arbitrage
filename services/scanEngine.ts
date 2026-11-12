import type { Opportunity, OpportunityType, InventoryStatus } from '@/models/Opportunity';
import type { Product, AvailabilityStatus } from '@/models/Product';
import { registeredRetailers } from '@/marketplaces/registry';
import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';

function toInventoryStatus(availability: AvailabilityStatus): InventoryStatus {
  if (availability === 'Out of Stock') {
    return 'out-of-stock';
  }
  if (availability === 'Limited') {
    return 'limited';
  }
  if (availability === 'Preorder') {
    return 'backorder';
  }

  return 'in-stock';
}

function toOpportunityType(netProfit: number): OpportunityType {
  if (netProfit > 20) {
    return 'arbitrage';
  }
  if (netProfit > 0) {
    return 'under-market';
  }

  return 'price-drop';
}

function getDetectedAt(product: Product): string {
  const detectedAt = product.categoryAttributes.detectedAt;
  if (typeof detectedAt === 'string' && detectedAt.trim().length > 0) {
    return detectedAt;
  }

  return new Date().toISOString();
}

function getIsNew(product: Product): boolean {
  const isNew = product.categoryAttributes.isNew;
  return typeof isNew === 'boolean' ? isNew : false;
}

function buildOpportunity(adapter: RetailerAdapter, product: Product): Opportunity {
  const primaryRetail = product.retailPricing[0];
  const currentPrice = primaryRetail?.retailerPrice ?? 0;
  const estimatedMarketPrice = product.marketplacePricing[0]?.averageSold30 ?? null;
  const estimatedProfit = product.arbitrageMetrics.estimatedProfit;
  const roi = product.arbitrageMetrics.ROI;
  const confidenceScoreRaw = product.arbitrageMetrics.confidenceScore;
  const confidenceScore =
    estimatedMarketPrice !== null && estimatedProfit !== null && roi !== null
      ? Math.round(confidenceScoreRaw * 100)
      : null;
  const hasVerifiedMarketAnalysis =
    estimatedMarketPrice !== null &&
    estimatedProfit !== null &&
    roi !== null &&
    confidenceScore !== null;
  const opportunityType: OpportunityType = hasVerifiedMarketAnalysis
    ? toOpportunityType(estimatedProfit)
    : 'unverified';
  const opportunityReason = hasVerifiedMarketAnalysis
    ? `Detected by ${adapter.getRetailerName()} adapter scan.`
    : 'Market analysis pending';

  return {
    id: `${adapter.getRetailerName().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product.universal.id}`,
    retailer: adapter.getRetailerName(),
    productName: product.universal.title,
    productImage: product.universal.image,
    productUrl: product.universal.url,
    category: product.universal.category,
    currentPrice,
    estimatedMarketPrice,
    netProfit: estimatedProfit,
    roi,
    confidenceScore,
    opportunityType,
    opportunityReason,
    inventoryStatus: toInventoryStatus(primaryRetail?.availability ?? 'Unknown'),
    detectedAt: getDetectedAt(product),
    isNew: getIsNew(product),
  };
}

export async function scanRetailer(adapter: RetailerAdapter): Promise<Opportunity[]> {
  const retailerName = adapter.getRetailerName();
  console.info(`Scanning ${retailerName}...`);

  const products = await adapter.searchProducts('');
  const opportunities = products.map((product) => buildOpportunity(adapter, adapter.normalizeProduct(product)));

  console.info(`Finished ${retailerName}.`);
  return opportunities;
}

export async function scanAllRetailers(): Promise<Opportunity[]> {
  const allOpportunities: Opportunity[] = [];

  for (const adapter of registeredRetailers) {
    const retailerOpportunities = await scanRetailer(adapter);
    allOpportunities.push(...retailerOpportunities);
  }

  return allOpportunities;
}

export async function startScan(): Promise<Opportunity[]> {
  console.info('Starting retailer scan...');
  const opportunities = await scanAllRetailers();
  console.info(`Retailer scan complete. ${opportunities.length} opportunities found.`);
  return opportunities;
}
