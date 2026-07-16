import { NextResponse } from 'next/server';
import { getEbayApplicationToken } from '@/services/ebay';
import { normalizeProductTitle } from '@/services/productNormalization';

const EBAY_BROWSE_API_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

const EXCLUDED_TERMS = [
  'psa',
  'bgs',
  'sgc',
  'graded',
  'refractor',
  'auto',
  'autograph',
  'numbered',
  '/99',
  '/25',
  'single card',
];

const PREFERRED_TERMS = [
  'hobby box',
  'blaster box',
  'mega box',
  'retail box',
  'booster box',
  'pack',
  'factory sealed',
  'sealed',
];

const OTHER_SPORT_AND_CATEGORY_TERMS = [
  'ufc',
  'wwe',
  'formula 1',
  'f1',
  'star wars',
  'marvel',
  'pokemon',
  'magic',
];

const FILLER_WORDS = [
  'the',
  'and',
  'for',
  'with',
  'sealed',
  'box',
  'cards',
  'card',
  'product',
  'products',
  'set',
  'new',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
];

function buildSearchQuery(q: string, category?: string | null, sport?: string | null, productType?: string | null): string {
  const parts = [q.trim()];

  if (category) parts.push(category.trim());
  if (sport) parts.push(sport.trim());
  if (productType) parts.push(productType.trim());

  return parts.join(' ');
}

function extractYear(term: string): string | null {
  const match = term.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

function calculateMatchConfidence(
  requested: ReturnType<typeof normalizeProductTitle>,
  candidate: ReturnType<typeof normalizeProductTitle>,
): number {
  let score = 0;

  if (requested.year && candidate.year && candidate.year === requested.year) {
    score += 30;
  } else if (requested.year && candidate.year && candidate.year !== requested.year) {
    return 0;
  } else if (requested.year && !candidate.year) {
    score += 5;
  }

  if (requested.sport && candidate.sport && candidate.sport === requested.sport) {
    score += 20;
  } else if (requested.sport && candidate.sport && candidate.sport !== requested.sport) {
    return 0;
  }

  if (requested.productType && candidate.productType && candidate.productType === requested.productType) {
    score += 20;
  } else if (requested.productType && candidate.productType && candidate.productType !== requested.productType) {
    return 0;
  }

  if (requested.brand && candidate.brand && candidate.brand === requested.brand) {
    score += 10;
  }

  if (requested.productLine && candidate.productLine && candidate.productLine === requested.productLine) {
    score += 10;
  }

  if (requested.variants.length > 0) {
    const hasMatchingVariant = requested.variants.some((variant) => candidate.variants.includes(variant));
    if (hasMatchingVariant) {
      score += 10;
    } else {
      return 0;
    }
  } else if (candidate.variants.some((variant) => [
    'black',
    'sapphire',
    'cosmic',
    'update',
    'logofractor',
    'sonic',
    'lite',
    'jumbo',
    'breaker delight',
    'fanatics fest',
  ].includes(variant))) {
    return 0;
  }

  const normalizedRequestedTitle = requested.normalizedTitle;
  const normalizedCandidateTitle = candidate.normalizedTitle;
  const requestedTokens = normalizedRequestedTitle.split(/\s+/).filter(Boolean);
  const candidateTokens = normalizedCandidateTitle.split(/\s+/).filter(Boolean);
  const matchedTokens = requestedTokens.filter((token) => candidateTokens.includes(token));
  score += Math.min(15, matchedTokens.length * 3);

  return Math.min(100, Math.max(0, score));
}

function isSealedSportsCardCandidate(requested: ReturnType<typeof normalizeProductTitle>, candidate: ReturnType<typeof normalizeProductTitle>): boolean {
  if (requested.year && candidate.year && candidate.year !== requested.year) {
    return false;
  }

  if (requested.sport && candidate.sport && candidate.sport !== requested.sport) {
    return false;
  }

  if (requested.productType && candidate.productType && candidate.productType !== requested.productType) {
    return false;
  }

  if (requested.brand) {
    if (!candidate.brand || candidate.brand !== requested.brand) {
      return false;
    }
  }

  if (requested.variants.length > 0) {
    const hasMatchingVariant = requested.variants.some((variant) => candidate.variants.includes(variant));
    if (!hasMatchingVariant) {
      return false;
    }
  } else if (candidate.variants.some((variant) => [
    'black',
    'sapphire',
    'cosmic',
    'update',
    'logofractor',
    'sonic',
    'lite',
    'jumbo',
    'breaker delight',
    'fanatics fest',
  ].includes(variant))) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const sport = searchParams.get('sport');
  const productType = searchParams.get('productType');

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required query parameter: q',
      },
      { status: 400 },
    );
  }

  try {
    const token = await getEbayApplicationToken();
    const searchQuery = buildSearchQuery(q, category, sport, productType);

    const response = await fetch(
      `${EBAY_BROWSE_API_URL}?q=${encodeURIComponent(searchQuery)}&limit=10&filter=buyingOptions:FIXED_PRICE`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay search request failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as {
      itemSummaries?: Array<{
        itemId?: string;
        title?: string;
        price?: { value?: number; currency?: string };
        image?: { imageUrl?: string };
        itemWebUrl?: string;
        seller?: { username?: string };
        condition?: string;
      }>;
    };

    const requestedNormalization = normalizeProductTitle(buildSearchQuery(q, category, sport, productType));

    const results = (payload.itemSummaries ?? [])
      .filter((item) => item.title && isSealedSportsCardCandidate(requestedNormalization, normalizeProductTitle(item.title)))
      .map((item) => {
        const title = item.title ?? '';
        const normalizedCandidate = normalizeProductTitle(title);
        const matchConfidence = calculateMatchConfidence(requestedNormalization, normalizedCandidate);

        return {
          itemId: item.itemId ?? null,
          title,
          price: item.price?.value ?? null,
          currency: item.price?.currency ?? null,
          imageUrl: item.image?.imageUrl ?? null,
          itemWebUrl: item.itemWebUrl ?? null,
          sellerUsername: item.seller?.username ?? null,
          condition: item.condition ?? null,
          matchConfidence,
        };
      })
      .sort((left, right) => {
        if (right.matchConfidence !== left.matchConfidence) {
          return right.matchConfidence - left.matchConfidence;
        }

        return (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY);
      })
      .slice(0, 10);

    const numericPrices = results
      .map((item) => item.price)
      .map((price) => (typeof price === 'string' ? Number.parseFloat(price) : price))
      .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));

    const summary = {
      listingCount: results.length,
      lowestPrice: numericPrices.length > 0 ? Number(Math.min(...numericPrices).toFixed(2)) : null,
      highestPrice: numericPrices.length > 0 ? Number(Math.max(...numericPrices).toFixed(2)) : null,
      averagePrice: numericPrices.length > 0 ? Number((numericPrices.reduce((sum, price) => sum + price, 0) / numericPrices.length).toFixed(2)) : null,
    };

    return NextResponse.json({ success: true, summary, results });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve eBay search results',
      },
      { status: 500 },
    );
  }
}
