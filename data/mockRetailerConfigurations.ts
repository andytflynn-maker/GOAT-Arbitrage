import type { RetailerConfiguration } from '@/models/RetailerConfiguration';

function nowIso(): string {
  return new Date().toISOString();
}

function makeRetailerConfiguration(input: {
  retailerId: string;
  retailerName: string;
  website: string;
  enabled: boolean;
  adapterVersion: string;
  dataSourceType: RetailerConfiguration['dataSourceType'];
  searchUrlTemplate: string;
  productUrlTemplate: string;
  scanPriority: number;
  scanFrequencyMinutes: number;
  supportsRestockMonitoring: boolean;
  notes: string;
}): RetailerConfiguration {
  const timestamp = nowIso();

  return {
    retailerId: input.retailerId,
    retailerName: input.retailerName,
    logoUrl: '',
    website: input.website,
    enabled: input.enabled,
    adapterStatus: input.enabled ? 'ready' : 'disabled',
    adapterVersion: input.adapterVersion,
    dataSourceType: input.dataSourceType,
    searchUrlTemplate: input.searchUrlTemplate,
    productUrlTemplate: input.productUrlTemplate,
    supportsSearch: true,
    supportsInventory: true,
    supportsPricing: true,
    supportsProductDetails: true,
    supportsRestockMonitoring: input.supportsRestockMonitoring,
    supportsAuthentication: false,
    authenticationType: 'none',
    scanPriority: input.scanPriority,
    scanFrequencyMinutes: input.scanFrequencyMinutes,
    categoryMappings: {
      'Sports Cards': 'sports-cards',
      'Trading Card Games': 'trading-card-games',
      Sneakers: 'sneakers',
    },
    notes: input.notes,
    createdDate: timestamp,
    modifiedDate: timestamp,
  };
}

export const mockRetailerConfigurations: RetailerConfiguration[] = [
  makeRetailerConfiguration({
    retailerId: 'blowout-cards',
    retailerName: 'Blowout Cards',
    website: 'https://www.blowoutcards.com',
    enabled: true,
    adapterVersion: '1.0.0',
    dataSourceType: 'manual',
    searchUrlTemplate: 'https://www.blowoutcards.com/catalogsearch/result/?q={query}',
    productUrlTemplate: 'https://www.blowoutcards.com/{slug}.html',
    scanPriority: 1,
    scanFrequencyMinutes: 20,
    supportsRestockMonitoring: false,
    notes: 'Initial adapter in production scan registry.',
  }),
  makeRetailerConfiguration({
    retailerId: 'dave-and-adams',
    retailerName: "Dave & Adam's",
    website: 'https://www.dacardworld.com',
    enabled: true,
    adapterVersion: '0.9.0',
    dataSourceType: 'manual',
    searchUrlTemplate: 'https://www.dacardworld.com/search/?Search={query}',
    productUrlTemplate: 'https://www.dacardworld.com/{category}/{slug}',
    scanPriority: 2,
    scanFrequencyMinutes: 25,
    supportsRestockMonitoring: false,
    notes: 'Configured for catalog discovery and price checks.',
  }),
  makeRetailerConfiguration({
    retailerId: 'steel-city-collectibles',
    retailerName: 'Steel City Collectibles',
    website: 'https://www.steelcitycollectibles.com',
    enabled: true,
    adapterVersion: '0.8.4',
    dataSourceType: 'manual',
    searchUrlTemplate: 'https://www.steelcitycollectibles.com/search?query={query}',
    productUrlTemplate: 'https://www.steelcitycollectibles.com/i/{slug}',
    scanPriority: 3,
    scanFrequencyMinutes: 30,
    supportsRestockMonitoring: true,
    notes: 'Good inventory signal coverage for sports cards.',
  }),
  makeRetailerConfiguration({
    retailerId: 'midwest-cards',
    retailerName: 'Midwest Cards',
    website: 'https://www.midwestcards.com',
    enabled: true,
    adapterVersion: '0.7.5',
    dataSourceType: 'manual',
    searchUrlTemplate: 'https://www.midwestcards.com/search?q={query}',
    productUrlTemplate: 'https://www.midwestcards.com/{slug}',
    scanPriority: 4,
    scanFrequencyMinutes: 35,
    supportsRestockMonitoring: false,
    notes: 'Lower scan frequency due to smaller catalog volume.',
  }),
  makeRetailerConfiguration({
    retailerId: 'target',
    retailerName: 'Target',
    website: 'https://www.target.com',
    enabled: false,
    adapterVersion: '0.1.0',
    dataSourceType: 'disabled',
    searchUrlTemplate: 'https://www.target.com/s?searchTerm={query}',
    productUrlTemplate: 'https://www.target.com/p/{slug}/-/A-{id}',
    scanPriority: 5,
    scanFrequencyMinutes: 45,
    supportsRestockMonitoring: true,
    notes: 'Disabled pending approved integration path.',
  }),
  makeRetailerConfiguration({
    retailerId: 'walmart',
    retailerName: 'Walmart',
    website: 'https://www.walmart.com',
    enabled: false,
    adapterVersion: '0.1.0',
    dataSourceType: 'disabled',
    searchUrlTemplate: 'https://www.walmart.com/search?q={query}',
    productUrlTemplate: 'https://www.walmart.com/ip/{id}',
    scanPriority: 6,
    scanFrequencyMinutes: 45,
    supportsRestockMonitoring: true,
    notes: 'Disabled pending provider approval and legal review.',
  }),
  makeRetailerConfiguration({
    retailerId: 'best-buy',
    retailerName: 'Best Buy',
    website: 'https://www.bestbuy.com',
    enabled: false,
    adapterVersion: '0.1.0',
    dataSourceType: 'disabled',
    searchUrlTemplate: 'https://www.bestbuy.com/site/searchpage.jsp?st={query}',
    productUrlTemplate: 'https://www.bestbuy.com/site/{slug}/{id}.p',
    scanPriority: 7,
    scanFrequencyMinutes: 60,
    supportsRestockMonitoring: true,
    notes: 'Disabled while onboarding supported data source.',
  }),
  makeRetailerConfiguration({
    retailerId: 'dicks-sporting-goods',
    retailerName: "Dick's Sporting Goods",
    website: 'https://www.dickssportinggoods.com',
    enabled: false,
    adapterVersion: '0.1.0',
    dataSourceType: 'disabled',
    searchUrlTemplate: 'https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm={query}',
    productUrlTemplate: 'https://www.dickssportinggoods.com/p/{slug}',
    scanPriority: 8,
    scanFrequencyMinutes: 60,
    supportsRestockMonitoring: true,
    notes: 'Disabled until data licensing and feed quality checks complete.',
  }),
];
