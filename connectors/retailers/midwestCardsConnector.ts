import type { Product } from '@/models/Product';
import type { RetailerConnector } from '@/types/connectors';
import { createPlaceholderProduct } from '@/utils/productFactory';

export const midwestCardsConnector: RetailerConnector = {
  id: 'midwest-cards',
  name: 'Midwest Cards',
  retailer: 'Midwest Cards',
  async scan(): Promise<Product[]> {
    return [
      createPlaceholderProduct({
        universal: {
          id: 'midwest-2023-pandora-box',
          title: '2023 Panini Select Blaster Box',
          brand: 'Panini',
          manufacturer: 'Panini',
          category: 'Sports Cards',
          subcategory: 'Blaster Boxes',
          UPC: '844000000004',
          SKU: 'MC-004',
          image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80',
          url: 'https://example.com/midwest/mc-004',
        },
        retailPricing: [
          {
            retailer: 'Midwest Cards',
            retailerPrice: 69.99,
            availability: 'Limited',
            quantity: 1,
          },
        ],
      }),
    ];
  },
};
