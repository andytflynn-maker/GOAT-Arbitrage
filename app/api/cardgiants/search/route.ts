import { NextResponse } from 'next/server';

const CARD_GIANTS_MCP_URL = 'https://cardgiants.com/api/ucp/mcp';
const AGENT_PROFILE_ENV = 'GOAT_UCP_AGENT_PROFILE_URL';
const SEARCHES = [
  'sealed sports trading card hobby blaster mega boxes',
  'sealed trading card game booster boxes',
];
const PAGE_SIZE = 10;

type CatalogVariant = {
  id?: string;
  title?: string;
  url?: string | null;
  price?: { amount?: number; currency?: string };
  availability?: { available?: boolean };
};

type CatalogProduct = {
  id?: string;
  title?: string;
  url?: string;
  variants?: CatalogVariant[];
};

type CatalogSearchResult = {
  products?: CatalogProduct[];
  pagination?: { has_next_page?: boolean; cursor?: string | null };
  messages?: Array<{ content?: string }>;
  ucp?: { status?: string };
};

type McpResponse = {
  error?: { message?: string; data?: string };
  result?: {
    isError?: boolean;
    content?: Array<{ text?: string }>;
  };
};

type AgentProfile = {
  ucp?: { version?: string };
  capabilities?: Record<string, Array<{ version?: string }>>;
};

function getAgentProfileUrl(): string {
  const configuredProfile = process.env[AGENT_PROFILE_ENV]?.trim();
  if (!configuredProfile) {
    throw new Error(`Configure ${AGENT_PROFILE_ENV} with a reachable GOAT-owned UCP agent-profile URL before fetching Card Giants.`);
  }

  let profileUrl: URL;
  try {
    profileUrl = new URL(configuredProfile);
  } catch {
    throw new Error(`${AGENT_PROFILE_ENV} must be a valid HTTPS URL for a GOAT-owned UCP agent profile.`);
  }

  if (profileUrl.protocol !== 'https:' || profileUrl.hostname === 'shopify.dev') {
    throw new Error(`${AGENT_PROFILE_ENV} must point to a GOAT-owned HTTPS UCP agent profile, not Shopify's example profile.`);
  }

  return profileUrl.toString();
}

async function validateAgentProfile(profileUrl: string): Promise<void> {
  const response = await fetch(profileUrl, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`${AGENT_PROFILE_ENV} is not reachable (HTTP ${response.status}); configure a public GOAT-owned UCP agent profile.`);
  }

  let profile: AgentProfile;
  try {
    profile = (await response.json()) as AgentProfile;
  } catch {
    throw new Error(`${AGENT_PROFILE_ENV} must return a valid GOAT-owned UCP agent-profile JSON document.`);
  }

  if (!profile.ucp?.version || !profile.capabilities?.['dev.ucp.shopping.catalog.search']?.length) {
    throw new Error(`${AGENT_PROFILE_ENV} must be a GOAT-owned UCP profile that advertises dev.ucp.shopping.catalog.search.`);
  }
}

async function searchCatalog(
  profileUrl: string,
  query: string,
  cursor?: string,
): Promise<CatalogSearchResult> {
  const argumentsPayload = {
    meta: { 'ucp-agent': { profile: profileUrl } },
    catalog: {
      query,
      pagination: {
        limit: PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      },
    },
  };
  const response = await fetch(CARD_GIANTS_MCP_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: 1,
      params: { name: 'search_catalog', arguments: argumentsPayload },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Card Giants catalog request failed with HTTP ${response.status}: ${responseBody || response.statusText}`);
  }

  const payload = (await response.json()) as McpResponse;
  if (payload.error) {
    throw new Error(payload.error.message || payload.error.data || 'Card Giants catalog search failed.');
  }

  const resultText = payload.result?.content?.find((item) => item.text)?.text;
  if (payload.result?.isError || !resultText) {
    throw new Error(resultText || 'Card Giants returned no catalog search result.');
  }

  let result: CatalogSearchResult;
  try {
    result = JSON.parse(resultText) as CatalogSearchResult;
  } catch {
    throw new Error('Card Giants returned an unreadable catalog response.');
  }

  if (result.ucp?.status === 'failure') {
    throw new Error(result.messages?.map((message) => message.content).filter(Boolean).join(' ') || 'Card Giants catalog search failed.');
  }
  return result;
}

function normalizeProduct(product: CatalogProduct) {
  const variant = product.variants?.[0];
  const priceInCents = variant?.price?.amount;
  const productUrl = product.url;
  if (!product.title || !productUrl || typeof priceInCents !== 'number' || !Number.isFinite(priceInCents)
    || variant?.price?.currency !== 'USD' || typeof variant.availability?.available !== 'boolean') {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(productUrl);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('cardgiants.com')) {
    return null;
  }

  const normalizedTitle = product.title.toLowerCase();
  if (!/\b(box|booster)\b/.test(normalizedTitle)) {
    return null;
  }

  return {
    id: `${product.id ?? productUrl}:${variant.id ?? 'default'}`,
    retailer: 'Card Giants',
    title: product.title,
    price: priceInCents / 100,
    url: parsedUrl.toString(),
    availability: variant.availability.available ? 'In Stock' : 'Out of Stock',
  };
}

export async function GET() {
  try {
    const profileUrl = getAgentProfileUrl();
    await validateAgentProfile(profileUrl);
    const productsByUrl = new Map<string, NonNullable<ReturnType<typeof normalizeProduct>>>();

    for (const query of SEARCHES) {
      let cursor: string | undefined;
      const seenCursors = new Set<string>();

      do {
        const result = await searchCatalog(profileUrl, query, cursor);
        for (const product of result.products ?? []) {
          const normalized = normalizeProduct(product);
          if (normalized) {
            productsByUrl.set(normalized.url, normalized);
          }
        }

        const nextCursor = result.pagination?.cursor;
        if (!result.pagination?.has_next_page || !nextCursor) {
          cursor = undefined;
        } else if (seenCursors.has(nextCursor)) {
          throw new Error('Card Giants returned a repeated pagination cursor.');
        } else {
          seenCursors.add(nextCursor);
          cursor = nextCursor;
        }
      } while (cursor);
    }

    return NextResponse.json({ success: true, products: Array.from(productsByUrl.values()) });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Card Giants catalog search failed.',
      },
      { status: 500 },
    );
  }
}
