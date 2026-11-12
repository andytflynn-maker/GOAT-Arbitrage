import { mockOpportunities } from '@/data/mockOpportunities';
import type { Opportunity } from '@/models/Opportunity';
import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';
import { registeredRetailers } from '@/marketplaces/registry';
import { startScan } from '@/services/scanEngine';

export type OpportunityFeedFilter = 'all' | 'hot' | 'price-drops' | 'restocks' | 'limited-stock';
export type OpportunityFeedSortBy = 'highest-roi' | 'highest-confidence' | 'newest' | 'highest-profit';

const placeholderRetailers = new Set<string>([
  'Blowout Cards',
]);

export function getRegisteredRetailerAdapters(): RetailerAdapter[] {
  return [...registeredRetailers];
}

function isVerifiedOpportunity(opportunity: Opportunity): boolean {
  return (
    opportunity.opportunityType !== 'unverified' &&
    opportunity.estimatedMarketPrice !== null &&
    opportunity.netProfit !== null &&
    opportunity.roi !== null &&
    opportunity.confidenceScore !== null
  );
}

function toDemoOpportunity(opportunity: Opportunity): Opportunity {
  const demoId = opportunity.id.startsWith('demo-') ? opportunity.id : `demo-${opportunity.id}`;
  const demoName = opportunity.productName.startsWith('[Demo] ') ? opportunity.productName : `[Demo] ${opportunity.productName}`;
  const demoReason = opportunity.opportunityReason.startsWith('Demo: ') ? opportunity.opportunityReason : `Demo: ${opportunity.opportunityReason}`;

  return {
    ...opportunity,
    id: demoId,
    productName: demoName,
    opportunityReason: demoReason,
  };
}

function splitScannedOpportunities(scannedOpportunities: Opportunity[]) {
  const realScannedOpportunities = scannedOpportunities.filter((opportunity) => !placeholderRetailers.has(opportunity.retailer));
  const demoScannedOpportunities = scannedOpportunities
    .filter((opportunity) => placeholderRetailers.has(opportunity.retailer))
    .map(toDemoOpportunity);
  const verifiedRealOpportunities = realScannedOpportunities.filter(isVerifiedOpportunity);

  return {
    realScannedOpportunities,
    demoScannedOpportunities,
    verifiedRealOpportunities,
  };
}

export function getVerifiedRealOpportunityCount(scannedOpportunities: Opportunity[]): number {
  return splitScannedOpportunities(scannedOpportunities).verifiedRealOpportunities.length;
}

export function buildOpportunityFeedFromScan(scannedOpportunities: Opportunity[]): Opportunity[] {
  const {
    realScannedOpportunities,
    demoScannedOpportunities,
    verifiedRealOpportunities,
  } = splitScannedOpportunities(scannedOpportunities);

  if (verifiedRealOpportunities.length === 0) {
    return [...realScannedOpportunities, ...demoScannedOpportunities, ...mockOpportunities.map(toDemoOpportunity)];
  }

  return [...realScannedOpportunities, ...demoScannedOpportunities];
}

function filterRows(opportunities: Opportunity[], type: OpportunityFeedFilter): Opportunity[] {
  if (type === 'all') {
    return opportunities;
  }
  if (type === 'hot') {
    return opportunities.filter((item) => (item.netProfit ?? Number.NEGATIVE_INFINITY) > 0 && (item.roi ?? Number.NEGATIVE_INFINITY) >= 10);
  }
  if (type === 'price-drops') {
    return opportunities.filter((item) => item.opportunityType === 'price-drop');
  }
  if (type === 'restocks') {
    return opportunities.filter((item) => item.opportunityType === 'restock');
  }

  return opportunities.filter((item) => item.inventoryStatus === 'limited');
}

function sortRows(opportunities: Opportunity[], sortBy: OpportunityFeedSortBy): Opportunity[] {
  const rows = [...opportunities];

  if (sortBy === 'highest-roi') {
    return rows.sort((a, b) => (b.roi ?? Number.NEGATIVE_INFINITY) - (a.roi ?? Number.NEGATIVE_INFINITY));
  }
  if (sortBy === 'highest-confidence') {
    return rows.sort((a, b) => (b.confidenceScore ?? Number.NEGATIVE_INFINITY) - (a.confidenceScore ?? Number.NEGATIVE_INFINITY));
  }
  if (sortBy === 'highest-profit') {
    return rows.sort((a, b) => (b.netProfit ?? Number.NEGATIVE_INFINITY) - (a.netProfit ?? Number.NEGATIVE_INFINITY));
  }

  return rows.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const scannedOpportunities = await startScan();
  return buildOpportunityFeedFromScan(scannedOpportunities);
}

export function getFilteredOpportunities(type: OpportunityFeedFilter, opportunities: Opportunity[] = mockOpportunities): Opportunity[] {
  return filterRows([...opportunities], type);
}

export function getSortedOpportunities(sortBy: OpportunityFeedSortBy, opportunities: Opportunity[] = mockOpportunities): Opportunity[] {
  return sortRows(opportunities, sortBy);
}

export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  const opportunities = await getAllOpportunities();
  return opportunities.find((opportunity) => opportunity.id === id);
}
