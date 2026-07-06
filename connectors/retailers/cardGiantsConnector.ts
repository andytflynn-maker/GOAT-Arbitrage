import type { Product } from '@/models/Product';
import type { RetailerConnector } from '@/types/connectors';
import { createPlaceholderProduct } from '@/utils/productFactory';

export const cardGiantsConnector: RetailerConnector = {
  id: 'card-giants',
  name: 'CardGiants',
  retailer: 'CardGiants',
  async scan(): Promise<Product[]> {
    return [
      createPlaceholderProduct({
        universal: {
          id: 'cardgiants-2024-pokemon-scarlet-violet',
          title: '2024 Pokémon Scarlet & Violet Booster Box',
          brand: 'Pokemon',
          manufacturer: 'The Pokémon Company',
          category: 'Pokemon',
          subcategory: 'Booster Boxes',
          UPC: '844000000005',
          SKU: 'CG-005',
          image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=800&q=80',
          url: 'https://example.com/cardgiants/cg-005',
        },
        retailPricing: [
          {
            retailer: 'CardGiants',
            retailerPrice: 89.99,
            availability: 'In Stock',
            quantity: 4,
          },
        ],
      }),
    ];
  },
};
