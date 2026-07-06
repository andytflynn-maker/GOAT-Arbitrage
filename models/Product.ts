export type ProductCategory =
  | 'Sports Cards'
  | 'Pokemon'
  | 'Coins'
  | 'Records'
  | 'Stamps'
  | 'Comics'
  | 'LEGO'
  | 'Funko'
  | 'Action Figures'
  | 'Video Games'
  | 'Other';

export type AvailabilityStatus = 'In Stock' | 'Out of Stock' | 'Limited' | 'Preorder' | 'Unknown';
export type PriceDirection = 'Increasing' | 'Stable' | 'Decreasing' | 'Volatile';

export interface UniversalProductInfo {
  id: string;
  title: string;
  brand: string;
  manufacturer: string;
  category: ProductCategory;
  subcategory: string;
  UPC: string;
  SKU: string;
  image: string;
  url: string;
}

export interface CategorySpecificAttributes {
  [key: string]: string | number | boolean | null | undefined;
}

export interface RetailPricingEntry {
  retailer: string;
  retailerPrice: number;
  availability: AvailabilityStatus;
  quantity: number | null;
}

export interface MarketplacePricingEntry {
  marketplace: string;
  lowestBIN: number | null;
  averageSold30: number | null;
  medianSold30: number | null;
  salesLast30: number | null;
  activeListings: number | null;
  sellThroughRate: number | null;
}

export interface ArbitrageMetrics {
  estimatedFees: number;
  estimatedShipping: number;
  estimatedProfit: number | null;
  ROI: number | null;
  confidenceScore: number;
}

export interface TrendAnalysis {
  direction: PriceDirection;
  sevenDayAverage: number | null;
  thirtyDayAverage: number | null;
  ninetyDayAverage: number | null;
}

export interface Product {
  universal: UniversalProductInfo;
  categoryAttributes: CategorySpecificAttributes;
  retailPricing: RetailPricingEntry[];
  marketplacePricing: MarketplacePricingEntry[];
  arbitrageMetrics: ArbitrageMetrics;
  trendAnalysis: TrendAnalysis;
}
