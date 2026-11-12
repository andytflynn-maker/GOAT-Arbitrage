import type { RetailerAdapter } from '@/marketplaces/retailerAdapter';
import { BlowoutAdapter } from '@/marketplaces/blowout/blowoutAdapter';
import { TargetAdapter } from '@/marketplaces/target/targetAdapter';

export const registeredRetailers: RetailerAdapter[] = [
  new BlowoutAdapter(),
];

// Registered in the registry module but intentionally disabled until live integration is ready.
export const disabledRetailers: RetailerAdapter[] = [
  new TargetAdapter(),
];
