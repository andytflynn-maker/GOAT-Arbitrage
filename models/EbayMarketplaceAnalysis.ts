export type EbayTrendDirection = 'Rising' | 'Falling' | 'Flat';
export type BuyRecommendation = 'Strong Buy' | 'Buy' | 'Watch' | 'Pass';

export interface EbayMarketplaceAnalysis {
  productName: string;
  productImage: string;
  retailer: string;
  retailPrice: number;
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
  buyRecommendation: BuyRecommendation;
}
