import type { BuyRecommendation, EbayMarketplaceAnalysis, EbayTrendDirection } from '@/models/EbayMarketplaceAnalysis';

export interface EbayMarketplaceServiceConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  useMockData?: boolean;
}

export class EbayMarketplaceService {
  constructor(private readonly config: EbayMarketplaceServiceConfig = {}) {}

  async analyzeProduct(productName: string, retailer = 'Retailer'): Promise<EbayMarketplaceAnalysis> {
    if (this.config.useMockData === false) {
      return this.fetchFromApi(productName, retailer);
    }

    return this.getMockAnalysis(productName, retailer);
  }

  async analyzeProducts(productNames: string[], retailer = 'Retailer'): Promise<EbayMarketplaceAnalysis[]> {
    return Promise.all(productNames.map((name) => this.analyzeProduct(name, retailer)));
  }

  private async fetchFromApi(productName: string, retailer: string): Promise<EbayMarketplaceAnalysis> {
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
      productImage: payload.productImage ?? '/placeholder-product.png',
      retailer,
      retailPrice: payload.retailPrice ?? 0,
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
      buyRecommendation: payload.buyRecommendation ?? 'Watch',
    };
  }

  private getMockAnalysis(productName: string, retailer: string): EbayMarketplaceAnalysis {
    const normalizedName = productName.toLowerCase();
    const retailPrice = this.getSeededRetailPrice(normalizedName);
    const averageSoldPrice = retailPrice * 1.16;
    const lowestBin = retailPrice * 0.97;
    const fees = averageSoldPrice * 0.125;
    const shipping = 7;
    const netProfit = averageSoldPrice - retailPrice - fees - shipping;
    const roi = retailPrice > 0 ? (netProfit / retailPrice) * 100 : 0;
    const score = this.getSeededOpportunityScore(normalizedName);

    return {
      productName,
      productImage: this.getSeededImage(normalizedName),
      retailer,
      retailPrice: Math.round(retailPrice * 100) / 100,
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
      buyRecommendation: this.getRecommendation(score, roi),
    };
  }

  private getSeededRetailPrice(productName: string): number {
    const patterns: Array<[RegExp, number]> = [
      [/topps|chrome|refractor|prizm|select/, 129],
      [/pokemon|booster|box/, 94],
      [/panini|hobby|blaster/, 76],
      [/funko|figure|action/, 48],
      [/lego|video game|comic|coin|stamp|record/, 62],
    ];

    return patterns.find(([regex]) => regex.test(productName))?.[1] ?? 55;
  }

  private getSeededSoldCount(productName: string): number {
    const count = this.getSeededRetailPrice(productName) / 5;
    return Math.max(8, Math.round(count));
  }

  private getSeededOpportunityScore(productName: string): number {
    const price = this.getSeededRetailPrice(productName);
    const score = Math.min(99, Math.max(42, Math.round((price / 145) * 100)));
    return score + (productName.includes('pokemon') ? 5 : 0);
  }

  private getSeededTrend(productName: string, window: '7d' | '30d'): EbayTrendDirection {
    const seeded = productName.includes('pokemon') ? 'Rising' : productName.includes('prizm') ? 'Flat' : window === '7d' ? 'Rising' : 'Flat';
    return seeded as EbayTrendDirection;
  }

  private getSeededImage(productName: string): string {
    const images: Record<string, string> = {
      'topps chrome sapphire refractor': 'https://images.unsplash.com/photo-1609599006353-e611a7a6d856?auto=format&fit=crop&w=400&q=80',
      'panini prizm silver prizm': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
      'topps series 1 hobby box': 'https://images.unsplash.com/photo-1626071456492-8cae8c8b0b4b?auto=format&fit=crop&w=400&q=80',
      'panini select blaster box': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=400&q=80',
      'pokemon scarlet & violet booster box': 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=400&q=80',
    };

    return images[productName] ?? 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80';
  }

  private getRecommendation(score: number, roi: number): BuyRecommendation {
    if (score >= 85 && roi >= 18) return 'Strong Buy';
    if (score >= 72 && roi >= 10) return 'Buy';
    if (score >= 55) return 'Watch';
    return 'Pass';
  }
}
