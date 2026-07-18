"use client";

import { FormEvent, useState } from 'react';
import RetailerShopPanel from '@/components/RetailerShopPanel';
import { calculateOpportunity } from '@/services/profitEngine';

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

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return `$${value.toFixed(2)}`;
}

const shopRows = [
  {
    retailer: 'Dave & Adam\'s',
    price: 409.99,
    availability: 'In Stock',
    shipping: 'Free over $250',
    isLowest: false,
  },
  {
    retailer: 'Blowout Cards',
    price: 389.99,
    availability: 'Limited',
    shipping: '$6.95',
    isLowest: true,
  },
  {
    retailer: 'Steel City Collectibles',
    price: 419.5,
    availability: 'In Stock',
    shipping: '$8.50',
    isLowest: false,
  },
  {
    retailer: 'Midwest Cards',
    price: 399.99,
    availability: 'Backorder',
    shipping: '$5.95',
    isLowest: false,
  },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sports Cards');
  const [activeTab, setActiveTab] = useState<'shop' | 'arbitrage'>('shop');
  const [rows, setRows] = useState<SearchResultRow[]>([]);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
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

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setRows([]);
      setSummary(null);
      setMessage('Please enter a search term.');
      return;
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
    }
  }

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
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>
              <span>Category</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '999px',
                  border: '1px solid #475569',
                  background: '#020617',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
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
                  border: '1px solid #d7dce5',
                  fontSize: '16px',
                  outline: 'none',
                  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
                }}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  minWidth: '120px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  border: '1px solid #0f172a',
                  background: isSearching ? '#334155' : '#0f172a',
                  color: 'white',
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
              border: '1px solid #cbd5e1',
              background: activeTab === 'shop' ? '#0f172a' : 'white',
              color: activeTab === 'shop' ? 'white' : '#0f172a',
              fontWeight: 600,
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
              border: '1px solid #cbd5e1',
              background: activeTab === 'arbitrage' ? '#0f172a' : 'white',
              color: activeTab === 'arbitrage' ? 'white' : '#0f172a',
              fontWeight: 600,
            }}
          >
            💰 Arbitrage
          </button>
        </div>

        {activeTab === 'shop' ? (
          <RetailerShopPanel rows={shopRows} summary={shopSummary} />
        ) : summary ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Listings</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{summary.listingCount ?? 0}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Lowest Price</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(summary.lowestPrice)}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Average Price</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(summary.averagePrice)}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Highest Price</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(summary.highestPrice)}</div>
            </div>
          </div>
        ) : null}

        {isSearching ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Searching listings…</div>
        ) : null}

        {!isSearching && message && rows.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{message}</div>
        ) : null}

        {activeTab === 'shop' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retailer</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Availability</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Shipping</th>
                </tr>
              </thead>
              <tbody>
                {shopRows.map((row) => {
                  const availabilityColor = row.availability === 'In Stock' ? '#166534' : row.availability === 'Limited' ? '#b45309' : '#991b1b';
                  const availabilityBackground = row.availability === 'In Stock' ? '#dcfce7' : row.availability === 'Limited' ? '#fef3c7' : '#fee2e2';

                  return (
                    <tr
                      key={row.retailer}
                      style={{
                        borderTop: '1px solid #e2e8f0',
                        background: row.isLowest ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '14px', fontWeight: row.isLowest ? 700 : 600, color: '#0f172a' }}>{row.retailer}</td>
                      <td style={{ padding: '14px', fontWeight: row.isLowest ? 700 : 500, color: row.isLowest ? '#166534' : '#0f172a' }}>{formatCurrency(row.price)}</td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: availabilityColor,
                            background: availabilityBackground,
                          }}
                        >
                          {row.availability}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#475569' }}>{row.shipping}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === 'arbitrage' && !isSearching && rows.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retailer</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Retail Price</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Lowest eBay</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Average eBay</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Profit</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>ROI</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Score</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const lowestEbayPrice = row.price ?? 0;
                  const opportunity = calculateOpportunity({
                    retailPrice: 0,
                    lowestEbayPrice,
                    averageEbayPrice: summary?.averagePrice ?? lowestEbayPrice,
                    estimatedShipping: 8.95,
                    ebayFeePercent: 0.1325,
                  });
                  const retailPrice = lowestEbayPrice - opportunity.ebayFee - 8.95 - opportunity.netProfit;
                  const confidence = row.matchConfidence ?? 0;
                  const isBuy = confidence >= 80;
                  const isWatch = confidence >= 55;
                  const tone = isBuy ? 'buy' : isWatch ? 'watch' : 'pass';
                  const recommendation = isBuy ? 'BUY' : isWatch ? 'WATCH' : 'PASS';

                  return (
                    <tr key={row.itemId ?? row.title} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '14px', fontWeight: 600, color: '#0f172a' }}>{row.title}</td>
                      <td style={{ padding: '14px', color: '#475569' }}>{row.sellerUsername ?? 'eBay Seller'}</td>
                      <td style={{ padding: '14px', color: '#0f172a' }}>{formatCurrency(retailPrice)}</td>
                      <td style={{ padding: '14px', color: '#0f172a' }}>{formatCurrency(lowestEbayPrice)}</td>
                      <td style={{ padding: '14px', color: '#0f172a' }}>{formatCurrency(summary?.averagePrice ?? lowestEbayPrice)}</td>
                      <td style={{ padding: '14px', color: tone === 'pass' ? '#b91c1c' : '#0f172a' }}>{formatCurrency(opportunity.netProfit)}</td>
                      <td style={{ padding: '14px', color: tone === 'pass' ? '#b91c1c' : '#0f172a' }}>{`${opportunity.roiPercent.toFixed(1)}%`}</td>
                      <td style={{ padding: '14px', color: '#0f172a' }}>{confidence}</td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '13px',
                            background: tone === 'buy' ? '#dcfce7' : tone === 'watch' ? '#fef3c7' : '#fee2e2',
                            color: tone === 'buy' ? '#166534' : tone === 'watch' ? '#92400e' : '#991b1b',
                          }}
                        >
                          {recommendation}
                        </span>
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
