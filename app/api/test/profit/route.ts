import { NextResponse } from 'next/server';
import { calculateOpportunity } from '@/services/profitEngine';

export async function GET() {
  const result = calculateOpportunity({
    retailPrice: 409.99,
    lowestEbayPrice: 479.99,
    averageEbayPrice: 498.74,
    estimatedShipping: 8.95,
    ebayFeePercent: 0.1325,
  });

  return NextResponse.json(result);
}
