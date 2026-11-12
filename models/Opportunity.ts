export type OpportunityType =
  | 'arbitrage'
  | 'restock'
  | 'price-drop'
  | 'under-market'
  | 'unverified';

export type InventoryStatus =
  | 'in-stock'
  | 'limited'
  | 'backorder'
  | 'out-of-stock';

export interface Opportunity {
  id: string;
  retailer: string;
  retailerLogo?: string;
  productName: string;
  productImage?: string;
  productUrl: string;
  category: string;
  currentPrice: number;
  msrp?: number;
  estimatedMarketPrice: number | null;
  netProfit: number | null;
  roi: number | null;
  confidenceScore: number | null;
  opportunityType: OpportunityType;
  opportunityReason: string;
  inventoryStatus: InventoryStatus;
  detectedAt: string;
  isNew: boolean;
}
