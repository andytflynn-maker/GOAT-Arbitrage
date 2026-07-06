import type { Product } from '@/models/Product';
import type { RetailerConnector } from '@/types/connectors';
import { createPlaceholderProduct } from '@/utils/productFactory';

export const daveAdamsConnector: RetailerConnector = {
  id: 'dave-adams',
  name: "Dave & Adam's",
  retailer: "Dave & Adam's",
  async scan(): Promise<Product[]> {
    return [
      createPlaceholderProduct({
        universal: {
          id: 'da-2024-topps-chrome-sapphire',
          title: '2024 Topps Chrome Sapphire Refractor',
          brand: 'Topps',
          manufacturer: 'Topps',
          category: 'Sports Cards',
          subcategory: 'Sealed Products',
          UPC: '844000000001',
          SKU: 'DA-001',
          image: 'https://images.unsplash.com/photo-1609599006353-e611a7a6d856?auto=format&fit=crop&w=800&q=80',
          url: 'https://example.com/dave-adams/da-001',
        },
        retailPricing: [
          {
            retailer: "Dave & Adam's",
            retailerPrice: 129.99,
            availability: 'In Stock',
            quantity: 1,
          },
        ],
      }),
    ];
  },
};
