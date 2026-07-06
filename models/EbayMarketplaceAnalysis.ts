export type EbayTrendDirection = 'Rising' | 'Falling' | 'Flat';

export interface EbayMarketplaceAnalysis {
  productName: string;
  lowestBuyItNow: number;
  averageRecentSoldPrice: number;
  soldListingsCount: number;
  sevenDayTrend: EbayTrendDirection;
  thirtyDayTrend: EbayTrendDirection;
  estimatedEbayFees: number;
  estimatedShipping: number;
  netProfit: number;
  roiPercentage: number;
  opportunityScore: number;
}
