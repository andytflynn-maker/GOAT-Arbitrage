import type { Product } from '@/models/Product';
import type { RetailerConnector } from '@/types/connectors';
import { createPlaceholderProduct } from '@/utils/productFactory';

export const steelCityConnector: RetailerConnector = {
  id: 'steel-city',
  name: 'Steel City Collectibles',
  retailer: 'Steel City Collectibles',
  async scan(): Promise<Product[]> {
    return [
      createPlaceholderProduct({
        universal: {
          id: 'sc-2023-panini-prizm-silver',
          title: '2023 Panini Prizm Silver Prizm',
          brand: 'Panini',
          manufacturer: 'Panini',
          category: 'Sports Cards',
          subcategory: 'Rookie Cards',
          UPC: '844000000002',
          SKU: 'SC-002',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
          url: 'https://example.com/steel-city/sc-002',
        },
        retailPricing: [
          {
            retailer: 'Steel City Collectibles',
            retailerPrice: 98.5,
            availability: 'Limited',
            quantity: 2,
          },
        ],
        categoryAttributes: {
          condition: 'Mint',
          grade: 'Ungraded',
          isSealed: true,
          set: 'Prizm',
        },
      }),
    ];
  },
};
