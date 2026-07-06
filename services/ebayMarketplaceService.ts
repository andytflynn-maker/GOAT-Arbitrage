import type { EbayMarketplaceAnalysis, EbayTrendDirection } from '@/models/EbayMarketplaceAnalysis';

export interface EbayMarketplaceServiceConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  useMockData?: boolean;
}

export class EbayMarketplaceService {
  constructor(private readonly config: EbayMarketplaceServiceConfig = {}) {}

  async analyzeProduct(productName: string): Promise<EbayMarketplaceAnalysis> {
    if (this.config.useMockData === false) {
      return this.fetchFromApi(productName);
    }

    return this.getMockAnalysis(productName);
  }

  async analyzeProducts(productNames: string[]): Promise<EbayMarketplaceAnalysis[]> {
    return Promise.all(productNames.map((name) => this.analyzeProduct(name)));
  }

  private async fetchFromApi(productName: string): Promise<EbayMarketplaceAnalysis> {
    const response = await fetch(`${this.config.apiBaseUrl ?? 'https://api.example.com'}/ebay/pricing?query=${encodeURIComponent(productName)}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey ?? 'demo-key'}`,
      },
    });

    if (!response.ok) {
      throw new Error(`eBay marketplace pricing request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Partial<EbayMarketplaceAnalysis>;

    return {
      productName,
      lowestBuyItNow: payload.lowestBuyItNow ?? 0,
      averageRecentSoldPrice: payload.averageRecentSoldPrice ?? 0,
      soldListingsCount: payload.soldListingsCount ?? 0,
      sevenDayTrend: (payload.sevenDayTrend as EbayTrendDirection) ?? 'Flat',
      thirtyDayTrend: (payload.thirtyDayTrend as EbayTrendDirection) ?? 'Flat',
      estimatedEbayFees: payload.estimatedEbayFees ?? 0,
      estimatedShipping: payload.estimatedShipping ?? 0,
      netProfit: payload.netProfit ?? 0,
      roiPercentage: payload.roiPercentage ?? 0,
      opportunityScore: payload.opportunityScore ?? 0,
    };
  }

  private getMockAnalysis(productName: string): EbayMarketplaceAnalysis {
    const normalizedName = productName.toLowerCase();
    const basePrice = this.getSeededPrice(normalizedName);
    const averageSoldPrice = basePrice * 1.14;
    const lowestBin = basePrice * 0.96;
    const fees = averageSoldPrice * 0.125;
    const shipping = 7;
    const netProfit = averageSoldPrice - basePrice - fees - shipping;
    const roi = basePrice > 0 ? (netProfit / basePrice) * 100 : 0;
    const score = this.getSeededOpportunityScore(normalizedName);

    return {
      productName,
      lowestBuyItNow: Math.round(lowestBin * 100) / 100,
      averageRecentSoldPrice: Math.round(averageSoldPrice * 100) / 100,
      soldListingsCount: this.getSeededSoldCount(normalizedName),
      sevenDayTrend: this.getSeededTrend(normalizedName, '7d'),
      thirtyDayTrend: this.getSeededTrend(normalizedName, '30d'),
      estimatedEbayFees: Math.round(fees * 100) / 100,
      estimatedShipping: shipping,
      netProfit: Math.round(netProfit * 100) / 100,
      roiPercentage: Math.round(roi * 100) / 100,
      opportunityScore: score,
    };
  }

  private getSeededPrice(productName: string): number {
    const patterns: Array<[RegExp, number]> = [
      [/topps|chrome|refractor|prizm|select/, 120],
      [/pokemon|booster|box/, 90],
      [/panini|hobby|blaster/, 75],
      [/funko|figure|action/, 45],
      [/lego|video game|comic|coin|stamp|record/, 60],
    ];

    return patterns.find(([regex]) => regex.test(productName))?.[1] ?? 55;
  }

  private getSeededSoldCount(productName: string): number {
    const count = this.getSeededPrice(productName) / 5;
    return Math.max(8, Math.round(count));
  }

  private getSeededOpportunityScore(productName: string): number {
    const price = this.getSeededPrice(productName);
    const score = Math.min(99, Math.max(40, Math.round((price / 140) * 100)));
    return score + (productName.includes('pokemon') ? 5 : 0);
  }

  private getSeededTrend(productName: string, window: '7d' | '30d'): EbayTrendDirection {
    const seeded = productName.includes('pokemon') ? 'Rising' : productName.includes('prizm') ? 'Flat' : window === '7d' ? 'Rising' : 'Flat';
    return seeded as EbayTrendDirection;
  }
}
