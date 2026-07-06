import type { Product } from '@/models/Product';
import type { RetailerConnector } from '@/types/connectors';
import { createPlaceholderProduct } from '@/utils/productFactory';

export const blowoutConnector: RetailerConnector = {
  id: 'blowout',
  name: 'Blowout Cards',
  retailer: 'Blowout Cards',
  async scan(): Promise<Product[]> {
    return [
      createPlaceholderProduct({
        universal: {
          id: 'blowout-2024-topps-series-1',
          title: '2024 Topps Series 1 Hobby Box',
          brand: 'Topps',
          manufacturer: 'Topps',
          category: 'Sports Cards',
          subcategory: 'Hobby Boxes',
          UPC: '844000000003',
          SKU: 'BW-003',
          image: 'https://images.unsplash.com/photo-1626071456492-8cae8c8b0b4b?auto=format&fit=crop&w=800&q=80',
          url: 'https://example.com/blowout/bw-003',
        },
        retailPricing: [
          {
            retailer: 'Blowout Cards',
            retailerPrice: 119.95,
            availability: 'In Stock',
            quantity: 3,
          },
        ],
      }),
    ];
  },
};
