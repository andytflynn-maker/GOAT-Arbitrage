import {
  blowoutConnector,
  cardGiantsConnector,
  daveAdamsConnector,
  midwestCardsConnector,
  steelCityConnector,
} from '@/connectors/retailers';
import { ebayConnector } from '@/marketplaces/ebay';
import type { Product } from '@/models/Product';

export async function runAnalysis(): Promise<Product[]> {
  const retailerConnectors = [
    daveAdamsConnector,
    steelCityConnector,
    blowoutConnector,
    midwestCardsConnector,
    cardGiantsConnector,
  ];

  const products = await Promise.all(
    retailerConnectors.map((connector) => connector.scan()),
  );

  const flattened = products.flat();

  const enriched = await Promise.all(
    flattened.map((product) => ebayConnector.enrich(product)),
  );

  return enriched;
}
