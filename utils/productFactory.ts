import type { Product } from '@/models/Product';

const defaultProduct: Product = {
  universal: {
    id: 'placeholder-product',
    title: 'Placeholder product',
    brand: 'Unknown',
    manufacturer: 'Unknown',
    category: 'Sports Cards',
    subcategory: 'Sealed Products',
    UPC: '000000000000',
    SKU: 'UNKNOWN',
    image: '/placeholder-product.png',
    url: '#',
  },
  categoryAttributes: {
    condition: 'Near Mint',
    grade: 'Ungraded',
    isSealed: true,
  },
  retailPricing: [
    {
      retailer: 'Unknown',
      retailerPrice: 0,
      availability: 'Unknown',
      quantity: null,
    },
  ],
  marketplacePricing: [],
  arbitrageMetrics: {
    estimatedFees: 0,
    estimatedShipping: 7,
    estimatedProfit: null,
    ROI: null,
    confidenceScore: 0.5,
  },
  trendAnalysis: {
    direction: 'Stable',
    sevenDayAverage: null,
    thirtyDayAverage: null,
    ninetyDayAverage: null,
  },
};

export function createPlaceholderProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...defaultProduct,
    ...overrides,
  };
}
