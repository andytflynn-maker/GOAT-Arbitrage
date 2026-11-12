"use client";

import { FormEvent, useState } from 'react';
import RetailerShopPanel from '@/components/RetailerShopPanel';
import MarketTrendModule, { type MarketTrendSnapshot } from '@/components/MarketTrendModule';
import { calculateOpportunity } from '@/services/profitEngine';
import { normalizeProductTitle } from '@/services/productNormalization';
import { matchProducts } from '@/services/productMatchEngine';

type SearchResultRow = {
  itemId?: string | null;
  title: string;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  itemWebUrl?: string | null;
  sellerUsername?: string | null;
  condition?: string | null;
  matchConfidence?: number | null;
};

type SearchSummary = {
  listingCount?: number | null;
  lowestPrice?: number | null;
  averagePrice?: number | null;
  highestPrice?: number | null;
};

type SelectedProduct = {
  title: string;
  category: string;
  retailer: string;
  retailPrice: number;
};

type AnalysisStatus = 'idle' | 'ready' | 'analyzing' | 'complete';

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return `$${value.toFixed(2)}`;
}

const shopRows = [
  {
    retailer: 'Dave & Adam\'s',
    productDetailUrl: 'https://www.dacardworld.com/sports-cards/2025-topps-chrome-baseball-hobby-box',
    productSearchUrl: 'https://www.dacardworld.com/search/?Search=2025%20Topps%20Chrome%20Baseball%20Hobby%20Box',
    price: 409.99,
    availability: 'In Stock',
    shipping: 'Free over $250',
    isLowest: false,
  },
  {
    retailer: 'Blowout Cards',
    productDetailUrl: 'https://www.blowoutcards.com/2025-topps-chrome-baseball-hobby-box.html',
    productSearchUrl: 'https://www.blowoutcards.com/catalogsearch/result/?q=2025+Topps+Chrome+Baseball+Hobby+Box',
    price: 389.99,
    availability: 'Limited',
    shipping: '$6.95',
    isLowest: true,
  },
  {
    retailer: 'Steel City Collectibles',
    productSearchUrl: 'https://www.steelcitycollectibles.com/search?query=2025%20Topps%20Chrome%20Baseball%20Hobby%20Box',
    price: 419.5,
    availability: 'In Stock',
    shipping: '$8.50',
    isLowest: false,
  },
  {
    retailer: 'Midwest Cards',
    productSearchUrl: 'https://www.midwestcards.com/search?q=2025%20Topps%20Chrome%20Baseball%20Hobby%20Box',
    price: 399.99,
    availability: 'Backorder',
    shipping: '$5.95',
    isLowest: false,
  },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sports Cards');
  const [activeTab, setActiveTab] = useState<'shop' | 'arbitrage' | 'monitor'>('shop');
  const [rows, setRows] = useState<SearchResultRow[]>([]);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const categoryPlaceholders: Record<string, string> = {
    'Sports Cards': 'Search Topps Chrome, Bowman, Prizm...',
    'Trading Card Games': 'Search Pokémon, Lorcana, Magic...',
    Sneakers: 'Search Jordan 1, Yeezy, New Balance...',
    Coins: 'Search Morgan Dollar, Gold Eagle...',
    Currency: 'Search Silver Dollar, Federal Reserve Note...',
    Stamps: 'Search Penny Black, US Commemorative...',
    'Vinyl Records': 'Search Beatles Abbey Road, Pink Floyd...',
    'Video Games': 'Search Nintendo Switch, PS5, Xbox...',
    LEGO: 'Search LEGO Star Wars, Technic...',
    'Action Figures': 'Search Funko Pop, Star Wars Figure...',
    Comics: 'Search Marvel Comics, Batman issue...',
    Memorabilia: 'Search signed baseball, vintage poster...',
    Watches: 'Search Rolex Submariner, Omega Seamaster...',
    'Luxury Goods': 'Search Louis Vuitton bag, Rolex watch...',
    'Other Collectibles': 'Search rare figurine, antique toy...',
  };

  const searchPlaceholder = categoryPlaceholders[selectedCategory] ?? 'Search cards, Pokémon, sneakers, LEGO, coins, comics...';

  const shopSummary = {
    retailerCount: shopRows.length,
    lowestPrice: Math.min(...shopRows.map((row) => row.price)),
    averagePrice: shopRows.reduce((sum, row) => sum + row.price, 0) / shopRows.length,
    highestPrice: Math.max(...shopRows.map((row) => row.price)),
  };

  async function handleSearch(eventOrTerm?: FormEvent<HTMLFormElement> | string, options?: { isMonitorAnalysis?: boolean }) {
    if (eventOrTerm && typeof eventOrTerm === 'object') {
      eventOrTerm.preventDefault();
      eventOrTerm.stopPropagation();
    }

    if (isSearching) {
      return;
    }

    const isAutomaticAnalysis = typeof eventOrTerm === 'string' && options?.isMonitorAnalysis === true;
    const trimmedQuery = isAutomaticAnalysis ? eventOrTerm.trim() : query.trim();

    if (!trimmedQuery) {
      setRows([]);
      setSummary(null);
      setMessage('Please enter a search term.');

      if (isAutomaticAnalysis) {
        setAnalysisStatus('ready');
      }

      return;
    }

    if (!selectedProduct) {
      const defaultRetailerRow = shopRows.find((row) => row.isLowest) ?? shopRows[0];
      setSelectedProduct({
        title: trimmedQuery,
        category: selectedCategory,
        retailer: defaultRetailerRow.retailer,
        retailPrice: defaultRetailerRow.price,
      });
    }

    if (isAutomaticAnalysis) {
      setAnalysisStatus('analyzing');
    }

    setIsSearching(true);
    setMessage(null);

    const searchUrl = `/api/ebay/search?q=${encodeURIComponent(trimmedQuery)}&productType=hobby box&sport=baseball`;

    try {
      console.info('Submitting search request', searchUrl);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to search right now.');
      }

      const nextRows = Array.isArray(data.results) ? data.results : [];
      setRows(nextRows);
      setSummary(data.summary ?? null);

      if (nextRows.length === 0) {
        setMessage('No results found for that search. Try a different title or sport.');
      }
    } catch (error) {
      console.error('Search request failed', error);
      setRows([]);
      setSummary(null);
      setMessage(error instanceof Error ? error.message : 'Unable to search right now.');
    } finally {
      setIsSearching(false);

      if (isAutomaticAnalysis) {
        setAnalysisStatus('complete');
      }
    }
  }

  const analysisStatusBadgeStyles: Record<AnalysisStatus, { background: string; border: string; color: string; label: string }> = {
    idle: {
      background: '#0b1220',
      border: '1px solid #334155',
      color: '#cbd5e1',
      label: 'No Product',
    },
    ready: {
      background: '#0c1f3b',
      border: '1px solid #2563eb',
      color: '#93c5fd',
      label: 'READY',
    },
    analyzing: {
      background: '#241a08',
      border: '1px solid #f59e0b',
      color: '#fde68a',
      label: 'ANALYZING',
    },
    complete: {
      background: '#052e23',
      border: '1px solid #10b981',
      color: '#86efac',
      label: 'COMPLETE',
    },
  };

  const currentAnalysisBadge = analysisStatusBadgeStyles[analysisStatus];

  const getOpportunityMetrics = (row: SearchResultRow, retailPrice: number) => {
    const lowestEbayPrice = row.price ?? 0;
    const averageEbayPrice = summary?.averagePrice ?? lowestEbayPrice;
    const estimatedShipping = 8.95;
    const opportunity = calculateOpportunity({
      retailPrice,
      lowestEbayPrice,
      averageEbayPrice,
      estimatedShipping,
      ebayFeePercent: 0.1325,
    });
    const confidence = row.matchConfidence ?? 0;
    const isBuy = confidence >= 80;
    const isWatch = confidence >= 55;
    const tone = isBuy ? 'buy' : isWatch ? 'watch' : 'pass';
    const recommendation =
      opportunity.netProfit < 0
        ? 'PASS'
        : opportunity.netProfit < 20
          ? 'WATCH'
          : 'BUY';

    let opportunityScore = 100;
    if (opportunity.netProfit < 0) {
      opportunityScore -= 40;
    }
    if (opportunity.roiPercent < 10) {
      opportunityScore -= 20;
    }
    if (confidence < 80) {
      opportunityScore -= 15;
    }
    if (averageEbayPrice < retailPrice) {
      opportunityScore -= 10;
    }
    if (estimatedShipping > 10) {
      opportunityScore -= 10;
    }
    if ((summary?.listingCount ?? 0) < 5) {
      opportunityScore -= 5;
    }
    opportunityScore = Math.max(0, Math.min(100, opportunityScore));

    return {
      lowestEbayPrice,
      averageEbayPrice,
      estimatedShipping,
      retailPrice,
      opportunity,
      tone,
      recommendation,
      opportunityScore,
    };
  };

  const comparisonRowForArbitrage = rows[0]
    ? {
        ...rows[0],
        price: summary?.lowestPrice ?? rows[0].price ?? null,
      }
    : null;
  const sourceNormalizedProduct = selectedProduct ? normalizeProductTitle(selectedProduct.title) : null;
  const candidateNormalizedProduct = comparisonRowForArbitrage?.title ? normalizeProductTitle(comparisonRowForArbitrage.title) : null;
  const productMatchResult = selectedProduct && comparisonRowForArbitrage && sourceNormalizedProduct && candidateNormalizedProduct
    ? matchProducts(
        {
          title: selectedProduct.title,
          year: sourceNormalizedProduct.year,
          brand: sourceNormalizedProduct.brand,
          productLine: sourceNormalizedProduct.productLine,
          productVariant: sourceNormalizedProduct.variants,
          configuration: sourceNormalizedProduct.productType,
        },
        {
          title: comparisonRowForArbitrage.title,
          year: candidateNormalizedProduct.year,
          brand: candidateNormalizedProduct.brand,
          productLine: candidateNormalizedProduct.productLine,
          productVariant: candidateNormalizedProduct.variants,
          configuration: candidateNormalizedProduct.productType,
        },
      )
    : null;
  const isProductMatchRejected = productMatchResult?.recommendation === 'REJECT';
  const isProductMatchReview = productMatchResult?.recommendation === 'REVIEW';
  const productMatchExplanation = (() => {
    if (!productMatchResult) {
      return 'Run a search to compare retailer and marketplace identity before arbitrage calculations.';
    }

    if (isProductMatchRejected) {
      if (productMatchResult.mismatchedFields.length > 0) {
        return `Arbitrage is blocked because product identity conflicts were detected in: ${productMatchResult.mismatchedFields.join(', ')}.`;
      }

      if (productMatchResult.excludedKeywords.length > 0) {
        return `Arbitrage is blocked because excluded identity keywords were detected: ${productMatchResult.excludedKeywords.join(', ')}.`;
      }

      return 'Arbitrage is blocked because the product match engine rejected this pairing.';
    }

    if (isProductMatchReview) {
      return 'Identity is close but requires manual review before purchase execution.';
    }

    return 'Identity alignment passed strict checks. Arbitrage calculations are safe to proceed.';
  })();
  const arbitrageRowsWithMetrics = selectedProduct && comparisonRowForArbitrage && !isProductMatchRejected
    ? shopRows.map((row) => ({
        row,
        rowKey: row.retailer,
        metrics: getOpportunityMetrics(comparisonRowForArbitrage, row.price),
      }))
    : [];
  const sortedArbitrageRowsWithMetrics = [...arbitrageRowsWithMetrics].sort((left, right) => {
    const profitDelta = right.metrics.opportunity.netProfit - left.metrics.opportunity.netProfit;
    if (profitDelta !== 0) {
      return profitDelta;
    }

    return right.metrics.opportunity.roiPercent - left.metrics.opportunity.roiPercent;
  });
  const selectedArbitrageEntry = sortedArbitrageRowsWithMetrics[0] ?? null;
  const selectedOpportunityRow = selectedArbitrageEntry?.row ?? null;
  const decisionMetrics = selectedArbitrageEntry?.metrics ?? null;
  const bestOpportunityRowKey = sortedArbitrageRowsWithMetrics[0]?.rowKey ?? null;
  const focusedOpportunityTitle = (() => {
    const rawTitle = selectedProduct?.title ?? '';
    const retailerSuffix = selectedProduct?.retailer?.trim();
    const conditionOnlyPattern = /^(brand\s+new|new|factory\s+sealed)$/i;
    const marketingPhrasePattern = /(free\s*shipping|free\s*ship|ships?\s+free|fast\s+shipping|limited\s+time|hot\s+deal|best\s+offer)/i;

    if (!rawTitle) {
      return rawTitle;
    }

    const escapedRetailer = retailerSuffix?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleWithoutRetailerSuffix = escapedRetailer
      ? rawTitle.replace(new RegExp(`\\s*[-|:]?\\s*${escapedRetailer}\\s*$`, 'i'), '').trim()
      : rawTitle.trim();
    const segments = titleWithoutRetailerSuffix.split(/\s*[-|:]\s*/);
    const productSegments: string[] = [];

    for (const segment of segments) {
      const trimmedSegment = segment.trim();
      if (conditionOnlyPattern.test(trimmedSegment) || marketingPhrasePattern.test(trimmedSegment)) {
        break;
      }
      productSegments.push(segment);
    }

    const cleanedTitle = (productSegments.length > 0 ? productSegments.join(' - ') : titleWithoutRetailerSuffix)
      .replace(/\s{2,}/g, ' ')
      .trim();

    return cleanedTitle || titleWithoutRetailerSuffix || rawTitle;
  })();
  const decisionBulletPoints = decisionMetrics
    ? [
        (() => {
          const marketDelta = Number((decisionMetrics.retailPrice - decisionMetrics.averageEbayPrice).toFixed(2));
          if (marketDelta > 0) {
            return `Retail price is ${formatCurrency(Math.abs(marketDelta))} above the market average.`;
          }
          if (marketDelta < 0) {
            return `Retail price is ${formatCurrency(Math.abs(marketDelta))} below the market average.`;
          }
          return 'Retail price is aligned with the market average.';
        })(),
        decisionMetrics.opportunity.netProfit < 0
          ? `Expected loss after fees and shipping is ${formatCurrency(Math.abs(decisionMetrics.opportunity.netProfit))}.`
          : `Expected profit after fees and shipping is ${formatCurrency(decisionMetrics.opportunity.netProfit)}.`,
        `ROI is ${decisionMetrics.opportunity.roiPercent.toFixed(1)}%.`,
        `Estimated eBay fees are ${formatCurrency(decisionMetrics.opportunity.ebayFee)} with ${formatCurrency(decisionMetrics.estimatedShipping)} shipping assumed.`,
        `Based on these metrics GOAT recommends ${decisionMetrics.recommendation}.`,
        `${summary?.listingCount ?? 0} comparable listings are currently reflected in this market scan.`,
      ]
    : [];

  const marketTrendSnapshot: MarketTrendSnapshot = {
    sevenDayAverageSoldPrice: null,
    thirtyDayAverageSoldPrice: null,
    trendDirection: null,
    percentChange: null,
    trendLabel: null,
    sourceLabel: 'Placeholder (historical eBay data coming soon)',
  };

  return (
    <main className="page-shell" style={{ gap: '24px' }}>
      <section className="hero-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p className="eyebrow">GOAT Arbitrage</p>
        <h1 style={{ marginBottom: '12px' }}>GOAT Dashboard</h1>
        <p className="subtitle" style={{ maxWidth: '680px', margin: '0 auto' }}>
          Discover collectible opportunities with a clean, modern view of retail and marketplace pricing.
        </p>
      </section>

      <section className="dashboard-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
              <span>Category</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '999px',
                  border: '1px solid #334155',
                  background: '#0b1220',
                  color: '#f8fafc',
                  fontSize: '15px',
                  outline: 'none',
                  boxShadow: '0 8px 30px rgba(2, 6, 23, 0.28)',
                }}
              >
                <option value="Sports Cards">Sports Cards</option>
                <option value="Trading Card Games">Trading Card Games</option>
                <option value="Sneakers">Sneakers</option>
                <option value="Coins">Coins</option>
                <option value="Currency">Currency</option>
                <option value="Stamps">Stamps</option>
                <option value="Vinyl Records">Vinyl Records</option>
                <option value="Video Games">Video Games</option>
                <option value="LEGO">LEGO</option>
                <option value="Action Figures">Action Figures</option>
                <option value="Comics">Comics</option>
                <option value="Memorabilia">Memorabilia</option>
                <option value="Watches">Watches</option>
                <option value="Luxury Goods">Luxury Goods</option>
                <option value="Other Collectibles">Other Collectibles</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1,
                  padding: '16px 18px',
                  borderRadius: '999px',
                  border: '1px solid #334155',
                  background: '#0b1220',
                  color: '#f8fafc',
                  fontSize: '16px',
                  outline: 'none',
                  boxShadow: '0 8px 30px rgba(2, 6, 23, 0.2)',
                }}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  minWidth: '120px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  border: '1px solid #2563eb',
                  background: isSearching ? '#334155' : '#2563eb',
                  color: '#f8fafc',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                }}
              >
                {isSearching ? (
                  <>
                    <span style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '999px', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
                border: '1px solid #334155',
                background: activeTab === 'shop' ? '#1e293b' : '#0b1220',
                color: activeTab === 'shop' ? '#f8fafc' : '#cbd5e1',
              fontWeight: 600,
                transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
            }}
          >
            🛒 Shop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('arbitrage')}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
                border: '1px solid #334155',
                background: activeTab === 'arbitrage' ? '#1e293b' : '#0b1220',
                color: activeTab === 'arbitrage' ? '#f8fafc' : '#cbd5e1',
              fontWeight: 600,
                transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
            }}
          >
            💰 Arbitrage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
                border: '1px solid #334155',
                background: activeTab === 'monitor' ? '#1e293b' : '#0b1220',
                color: activeTab === 'monitor' ? '#f8fafc' : '#cbd5e1',
              fontWeight: 600,
                transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease',
            }}
          >
            📡 Monitor
          </button>
        </div>

        {activeTab === 'shop' ? (
          <RetailerShopPanel rows={shopRows} summary={shopSummary} />
        ) : activeTab === 'monitor' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {[
              { title: '🔥 Hot Restocks', subtitle: 'Coming Soon', onClick: () => setSelectedProduct({ title: '2025 Topps Chrome Baseball Hobby Box', category: 'Sports Cards', retailer: 'Blowout Cards', retailPrice: 389.99 }) },
              { title: '🚨 New Drops', subtitle: 'Coming Soon' },
              { title: '📈 Trending Products', subtitle: 'Coming Soon' },
              { title: '⭐ Best Opportunities', subtitle: 'Coming Soon' },
            ].map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => {
                  if (card.title === '🔥 Hot Restocks') {
                    card.onClick?.();
                    setAnalysisStatus('ready');
                    setActiveTab('arbitrage');
                    setAnalysisStatus('analyzing');
                    void handleSearch('2025 Topps Chrome Baseball Hobby Box', { isMonitorAnalysis: true });
                    return;
                  }
                  setSelectedProduct(null);
                  setAnalysisStatus('idle');
                  setActiveTab('arbitrage');
                }}
                style={{
                  background: '#0b1220',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #243347',
                  boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
                  minHeight: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-2px)';
                  event.currentTarget.style.boxShadow = '0 14px 32px rgba(2, 6, 23, 0.34)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                  event.currentTarget.style.boxShadow = '0 10px 28px rgba(2, 6, 23, 0.26)';
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>{card.title}</div>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{card.subtitle}</div>
              </button>
            ))}
          </div>
        ) : summary ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Listings</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{summary.listingCount ?? 0}</div>
            </div>
            <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Lowest Price</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(summary.lowestPrice)}</div>
            </div>
            <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Average Price</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(summary.averagePrice)}</div>
            </div>
            <div style={{ background: '#0b1220', borderRadius: '12px', padding: '12px 14px', border: '1px solid #243347', boxShadow: '0 8px 20px rgba(2, 6, 23, 0.18)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>Highest Price</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(summary.highestPrice)}</div>
            </div>
          </div>
        ) : null}

        {activeTab === 'arbitrage' && isSearching ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>🔄 Analyzing product...</div>
        ) : null}

        {!isSearching && message && rows.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>{message}</div>
        ) : null}

        {activeTab === 'arbitrage' ? (
          <div
            style={{
              position: 'relative',
              marginBottom: '16px',
              padding: '18px 20px',
              borderRadius: '16px',
                background: 'linear-gradient(135deg, #0b1220 0%, #111827 100%)',
                border: '1px solid #243347',
                boxShadow: '0 16px 40px rgba(2, 6, 23, 0.32)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '999px',
                background: currentAnalysisBadge.background,
                border: currentAnalysisBadge.border,
                color: currentAnalysisBadge.color,
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {currentAnalysisBadge.label}
            </div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '8px' }}>
              Focused Opportunity
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              {selectedProduct ? `Analyzing: ${focusedOpportunityTitle}` : 'No product selected'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#e2e8f0', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#94a3b8', marginRight: '6px' }}>Buy From:</span>
                <span style={{ fontWeight: 600 }}>{selectedOpportunityRow?.retailer ?? selectedProduct?.retailer ?? '—'}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', marginRight: '6px' }}>Retail Price:</span>
                <span style={{ fontWeight: 600 }}>{decisionMetrics ? formatCurrency(decisionMetrics.retailPrice) : formatCurrency(selectedProduct?.retailPrice)}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', marginRight: '6px' }}>Best eBay Comparison:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(decisionMetrics?.averageEbayPrice)}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', marginRight: '6px' }}>Expected eBay Sale Price:</span>
                <span style={{ fontWeight: 600 }}>{decisionMetrics ? formatCurrency(decisionMetrics.averageEbayPrice) : '—'}</span>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'arbitrage' ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '16px 18px',
              borderRadius: '14px',
              background: '#0b1220',
              border: '1px solid #243347',
              boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
            }}
          >
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '12px' }}>
              Product Match
            </div>
            {productMatchResult ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 16px', fontSize: '14px', color: '#e5e7eb', marginBottom: '12px' }}>
                  <div><span style={{ color: '#94a3b8' }}>Confidence:</span> {`${productMatchResult.confidenceScore}%`}</div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Recommendation:</span>{' '}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        fontSize: '12px',
                        background:
                          productMatchResult.recommendation === 'AUTO_MATCH'
                            ? 'rgba(34, 197, 94, 0.18)'
                            : productMatchResult.recommendation === 'REVIEW'
                              ? 'rgba(250, 204, 21, 0.18)'
                              : 'rgba(248, 113, 113, 0.18)',
                        color:
                          productMatchResult.recommendation === 'AUTO_MATCH'
                            ? '#bbf7d0'
                            : productMatchResult.recommendation === 'REVIEW'
                              ? '#fde68a'
                              : '#fecaca',
                      }}
                    >
                      {productMatchResult.recommendation}
                    </span>
                  </div>
                  <div><span style={{ color: '#94a3b8' }}>Matched Fields:</span> {productMatchResult.matchedFields.length > 0 ? productMatchResult.matchedFields.join(', ') : 'None'}</div>
                  <div><span style={{ color: '#94a3b8' }}>Mismatched Fields:</span> {productMatchResult.mismatchedFields.length > 0 ? productMatchResult.mismatchedFields.join(', ') : 'None'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Excluded Identity Keywords:</span> {productMatchResult.excludedKeywords.length > 0 ? productMatchResult.excludedKeywords.join(', ') : 'None'}</div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '14px' }}>{productMatchExplanation}</div>
              </>
            ) : (
              <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                Awaiting product comparison data.
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'arbitrage' && isProductMatchReview ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(250, 204, 21, 0.12)',
              border: '1px solid rgba(250, 204, 21, 0.45)',
              color: '#fde68a',
              fontWeight: 600,
            }}
          >
            Review product match before purchasing.
          </div>
        ) : null}

        {activeTab === 'arbitrage' && isProductMatchRejected ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.45)',
              color: '#fecaca',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Product match rejected.</div>
            <div style={{ fontSize: '14px', marginBottom: '6px' }}>
              {productMatchResult?.mismatchedFields.length
                ? `Mismatched fields: ${productMatchResult.mismatchedFields.join(', ')}.`
                : 'No arbitrage calculation will run for this match.'}
            </div>
            <div style={{ fontSize: '14px' }}>{productMatchExplanation}</div>
          </div>
        ) : null}

        {activeTab === 'arbitrage' && decisionMetrics ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '16px 18px',
              borderRadius: '14px',
                background: '#0b1220',
                border: '1px solid #243347',
                boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
            }}
          >
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '10px' }}>
              Decision Summary
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#e5e7eb', fontSize: '14px', lineHeight: 1.6 }}>
              {decisionBulletPoints.slice(0, 5).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {activeTab === 'arbitrage' && decisionMetrics ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '16px 18px',
              borderRadius: '14px',
                background: '#0b1220',
                border: '1px solid #243347',
                boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
            }}
          >
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '12px' }}>
              Profit Breakdown
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px 16px',
                fontSize: '14px',
                color: '#e5e7eb',
              }}
            >
              <div><span style={{ color: '#94a3b8' }}>Retail Price:</span> {formatCurrency(decisionMetrics.retailPrice)}</div>
              <div><span style={{ color: '#94a3b8' }}>Expected eBay Sale Price:</span> {formatCurrency(decisionMetrics.averageEbayPrice)}</div>
              <div><span style={{ color: '#94a3b8' }}>eBay Fees:</span> {formatCurrency(decisionMetrics.opportunity.ebayFee)}</div>
              <div><span style={{ color: '#94a3b8' }}>Estimated Shipping:</span> {formatCurrency(decisionMetrics.estimatedShipping)}</div>
              <div>
                <span style={{ color: '#94a3b8' }}>Net Profit:</span>{' '}
                <span style={{ color: decisionMetrics.opportunity.netProfit < 0 ? '#f87171' : decisionMetrics.opportunity.netProfit > 0 ? '#4ade80' : '#e5e7eb', fontWeight: 700 }}>
                  {formatCurrency(decisionMetrics.opportunity.netProfit)}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>ROI:</span>{' '}
                <span style={{ color: decisionMetrics.opportunity.roiPercent < 0 ? '#f87171' : decisionMetrics.opportunity.roiPercent > 0 ? '#4ade80' : '#e5e7eb', fontWeight: 700 }}>
                  {`${decisionMetrics.opportunity.roiPercent.toFixed(1)}%`}
                </span>
              </div>
              <div><span style={{ color: '#94a3b8' }}>Recommendation:</span> {decisionMetrics.recommendation}</div>
            </div>
          </div>
        ) : null}

        {activeTab === 'arbitrage' && decisionMetrics ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '16px 18px',
              borderRadius: '14px',
              background: '#0b1220',
              border: '1px solid #243347',
              boxShadow: '0 10px 28px rgba(2, 6, 23, 0.26)',
            }}
          >
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '12px' }}>
              Market Demand
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px 16px',
                fontSize: '14px',
                color: '#e5e7eb',
              }}
            >
              <div><span style={{ color: '#94a3b8' }}>30-Day Sales:</span> 124 (Coming Soon)</div>
              <div><span style={{ color: '#94a3b8' }}>Active Listings:</span> {summary?.listingCount ?? '57 (Coming Soon)'}</div>
              <div><span style={{ color: '#94a3b8' }}>Sell-Through Rate:</span> 68% (Coming Soon)</div>
              <div><span style={{ color: '#94a3b8' }}>Average Days to Sell:</span> 6.3 days (Coming Soon)</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <MarketTrendModule data={marketTrendSnapshot} />
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'arbitrage' && !isSearching && selectedProduct && sortedArbitrageRowsWithMetrics.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="arbitrage-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
              <thead>
                <tr style={{ background: '#111827', color: '#e2e8f0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retailer</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retail Price</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>eBay Avg/Sold Comp</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>eBay Fees</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Shipping</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Net Profit</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>ROI</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Score</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Recommendation</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Buy</th>
                </tr>
              </thead>
              <tbody>
                {sortedArbitrageRowsWithMetrics.map(({ row, rowKey, metrics }) => {
                  const isBestOpportunity = bestOpportunityRowKey === rowKey;
                  const retailerUrl = row.productDetailUrl ?? row.productSearchUrl;
                  const profitColor = metrics.opportunity.netProfit < 0 ? '#f87171' : metrics.opportunity.netProfit > 0 ? '#4ade80' : '#e5e7eb';
                  const roiColor = metrics.opportunity.roiPercent < 0 ? '#f87171' : metrics.opportunity.roiPercent > 0 ? '#4ade80' : '#e5e7eb';

                  return (
                    <tr
                      key={rowKey}
                      className="arbitrage-row"
                      style={{
                        borderTop: '1px solid #243347',
                        background: isBestOpportunity ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                        outline: isBestOpportunity ? '1px solid rgba(74, 222, 128, 0.45)' : 'none',
                        outlineOffset: '-1px',
                      }}
                    >
                      <td style={{ padding: '14px', color: '#cbd5e1' }}>
                        {retailerUrl ? (
                          <a href={retailerUrl} target="_blank" rel="noopener noreferrer" className="goat-retailer-link">
                            {row.retailer}
                          </a>
                        ) : row.retailer}
                      </td>
                      <td style={{ padding: '14px', color: '#e5e7eb' }}>{formatCurrency(metrics.retailPrice)}</td>
                      <td style={{ padding: '14px', color: '#e5e7eb' }}>{formatCurrency(metrics.averageEbayPrice)}</td>
                      <td style={{ padding: '14px', color: '#e5e7eb' }}>{formatCurrency(metrics.opportunity.ebayFee)}</td>
                      <td style={{ padding: '14px', color: '#e5e7eb' }}>{formatCurrency(metrics.estimatedShipping)}</td>
                      <td style={{ padding: '14px', color: profitColor, fontWeight: 700 }}>{formatCurrency(metrics.opportunity.netProfit)}</td>
                      <td style={{ padding: '14px', color: roiColor, fontWeight: 700 }}>{`${metrics.opportunity.roiPercent.toFixed(1)}%`}</td>
                      <td style={{ padding: '14px', color: '#e5e7eb' }}>{metrics.opportunityScore}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isBestOpportunity ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                fontWeight: 700,
                                fontSize: '11px',
                                background: 'rgba(34, 197, 94, 0.18)',
                                color: '#bbf7d0',
                                border: '1px solid rgba(74, 222, 128, 0.45)',
                              }}
                            >
                              ⭐ Best Opportunity
                            </span>
                          ) : null}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              fontWeight: 700,
                              fontSize: '13px',
                              background: metrics.tone === 'buy' ? 'rgba(34, 197, 94, 0.18)' : metrics.tone === 'watch' ? 'rgba(250, 204, 21, 0.18)' : 'rgba(248, 113, 113, 0.18)',
                              color: metrics.tone === 'buy' ? '#bbf7d0' : metrics.tone === 'watch' ? '#fde68a' : '#fecaca',
                            }}
                          >
                            {metrics.recommendation}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        {retailerUrl ? (
                          <a
                            href={retailerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              border: '1px solid #2563eb',
                              background: '#1d4ed8',
                              color: '#f8fafc',
                              fontWeight: 700,
                              fontSize: '12px',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            🛒 Buy
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              border: '1px solid #334155',
                              background: '#1e293b',
                              color: '#94a3b8',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'not-allowed',
                            }}
                          >
                            Unavailable
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
