import type { Product } from '@/models/Product';
import type { RetailerConnector } from '@/types/connectors';
import { BlowoutAdapter } from '@/marketplaces/blowout/blowoutAdapter';

const blowoutAdapter = new BlowoutAdapter();

export const blowoutConnector: RetailerConnector = {
  id: 'blowout',
  name: 'Blowout Cards',
  retailer: 'Blowout Cards',
  async scan(): Promise<Product[]> {
    return blowoutAdapter.searchProducts('');
  },
};
