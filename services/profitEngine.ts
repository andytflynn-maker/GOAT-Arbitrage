export interface OpportunityInput {
  retailPrice: number;
  lowestEbayPrice: number;
  averageEbayPrice: number;
  estimatedShipping: number;
  ebayFeePercent: number;
}

export interface OpportunityResult {
  ebayFee: number;
  netProfit: number;
  roiPercent: number;
  opportunityScore: number;
  recommendation: 'BUY' | 'WATCH' | 'PASS';
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function roundRoi(value: number): number {
  return Number(value.toFixed(1));
}

export function calculateOpportunity(input: OpportunityInput): OpportunityResult {
  const ebayFee = roundCurrency(input.lowestEbayPrice * input.ebayFeePercent);
  const netProfit = roundCurrency(
    input.lowestEbayPrice - ebayFee - input.estimatedShipping - input.retailPrice,
  );
  const roiPercent = roundRoi((netProfit / input.retailPrice) * 100);

  const roiScore = Math.max(0, Math.min(100, roiPercent * 2));
  const profitScore = Math.max(0, Math.min(100, netProfit * 2));
  const opportunityScore = Math.max(0, Math.min(100, Math.round((roiScore + profitScore) / 2)));

  let recommendation: OpportunityResult['recommendation'] = 'PASS';

  if (opportunityScore >= 75 || netProfit >= 50) {
    recommendation = 'BUY';
  } else if (opportunityScore >= 40 || netProfit >= 10) {
    recommendation = 'WATCH';
  }

  return {
    ebayFee,
    netProfit,
    roiPercent,
    opportunityScore,
    recommendation,
  };
}
