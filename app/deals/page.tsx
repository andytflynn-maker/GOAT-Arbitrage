"use client";

import { type ChangeEvent, type FormEvent, useState } from 'react';

type ActiveListing = {
  itemId: string | null;
  title: string;
  price: number | null;
  currency: string | null;
  itemWebUrl: string | null;
  sellerUsername: string | null;
  condition: string | null;
  matchConfidence: number;
};

type SearchResponse = {
  success: boolean;
  error?: string;
  results?: ActiveListing[];
};

type CardGiantsResponse = {
  success: boolean;
  error?: string;
  products?: Array<{
    id: string;
    retailer: string;
    title: string;
    price: number;
    url: string;
    availability: string;
  }>;
};

type ImportedProduct = {
  id: string;
  retailer: string;
  title: string;
  price: number;
  url: string;
  availability: string;
  analysisStatus: 'not-analyzed' | 'queued' | 'searching' | 'analyzed' | 'no-match' | 'error';
  ebayPrice?: number;
  ebayUrl?: string;
  ebayTitle?: string;
  estimatedProfit?: number;
  analysisError?: string;
};

type DealInputs = {
  title: string;
  retailer: string;
  retailerUrl: string;
  purchasePrice: string;
  inboundShipping: string;
  tax: string;
};

const INITIAL_INPUTS: DealInputs = {
  title: '',
  retailer: '',
  retailerUrl: '',
  purchasePrice: '',
  inboundShipping: '0',
  tax: '0',
};

const EBAY_FEE_RATE = 0.125;
const OUTBOUND_SHIPPING = 7;
const CSV_COLUMNS = ['retailer', 'title', 'price', 'url', 'availability'] as const;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      insideQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      row.push(field);
      if (row.some((value) => value.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      field = '';
      if (character === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
    } else if (character === '"') {
      throw new Error('CSV contains a quote in an unquoted field.');
    } else {
      field += character;
    }
  }

  if (insideQuotes) {
    throw new Error('CSV contains an unclosed quoted field.');
  }

  row.push(field);
  if (row.some((value) => value.trim() !== '')) {
    rows.push(row);
  }
  return rows;
}

function parseCsvPrice(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const price = Number(trimmed.replace(/[$,]/g, ''));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function parseProductUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

function parseAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export default function DealsPage() {
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [listings, setListings] = useState<ActiveListing[]>([]);
  const [searchedTitle, setSearchedTitle] = useState('');
  const [searchedAt, setSearchedAt] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ completed: 0, total: 0 });
  const [isFetchingCardGiants, setIsFetchingCardGiants] = useState(false);
  const [cardGiantsError, setCardGiantsError] = useState<string | null>(null);

  const positiveProfitProducts = importedProducts
    .filter((product) => (product.estimatedProfit ?? 0) > 0 && product.ebayPrice !== undefined && product.ebayUrl)
    .sort((left, right) => (right.estimatedProfit ?? 0) - (left.estimatedProfit ?? 0));

  const lowestListing = listings
    .filter((listing) => typeof listing.price === 'number' && Number.isFinite(listing.price))
    .reduce<ActiveListing | null>((lowest, listing) =>
      !lowest || (listing.price ?? Number.POSITIVE_INFINITY) < (lowest.price ?? Number.POSITIVE_INFINITY)
        ? listing
        : lowest,
    null);
  const purchasePrice = parseAmount(inputs.purchasePrice);
  const inboundShipping = parseAmount(inputs.inboundShipping);
  const tax = parseAmount(inputs.tax);
  const acquisitionCost = purchasePrice + inboundShipping + tax;
  const estimatedNet = lowestListing?.price == null
    ? null
    : lowestListing.price * (1 - EBAY_FEE_RATE) - OUTBOUND_SHIPPING - acquisitionCost;
  const estimatedRoi = estimatedNet === null || acquisitionCost === 0
    ? null
    : (estimatedNet / acquisitionCost) * 100;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setListings([]);
    setSearchedTitle(inputs.title.trim());
    setSearchedAt(null);

    if (!inputs.title.trim() || !inputs.retailer.trim() || !inputs.retailerUrl.trim()) {
      setError('Enter the product title, retailer name, and retailer URL.');
      return;
    }

    if ([inputs.purchasePrice, inputs.inboundShipping, inputs.tax].some((value) => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      setError('Enter valid non-negative amounts for price, shipping, and tax.');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/ebay/search?q=${encodeURIComponent(inputs.title.trim())}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const payload = (await response.json()) as SearchResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'eBay active listings could not be retrieved.');
      }

      setListings((payload.results ?? []).map((listing) => {
        const price = listing.price == null ? null : Number(listing.price);
        return { ...listing, price: price !== null && Number.isFinite(price) ? price : null };
      }));
      setSearchedAt(new Date().toLocaleString());
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'eBay active listings could not be retrieved.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCsvImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCsvErrors([]);
    setCsvMessage(null);

    try {
      const csvRows = parseCsv(await file.text());
      if (csvRows.length < 2) {
        throw new Error('CSV must include a header row and at least one product row.');
      }

      const headers = csvRows[0].map((header) => header.trim().toLowerCase());
      const columnIndexes = CSV_COLUMNS.map((column) => headers.indexOf(column));
      const missingColumns = CSV_COLUMNS.filter((_, index) => columnIndexes[index] === -1);
      if (missingColumns.length > 0) {
        throw new Error(`CSV is missing required columns: ${missingColumns.join(', ')}.`);
      }

      const validProducts: ImportedProduct[] = [];
      const rejectedRows: string[] = [];

      csvRows.slice(1).forEach((values, index) => {
        const rowNumber = index + 2;
        const valueFor = (columnIndex: number) => (values[columnIndex] ?? '').trim();
        const retailer = valueFor(columnIndexes[0]);
        const title = valueFor(columnIndexes[1]);
        const price = parseCsvPrice(valueFor(columnIndexes[2]));
        const url = parseProductUrl(valueFor(columnIndexes[3]));
        const availability = valueFor(columnIndexes[4]);
        const issues: string[] = [];

        if (!retailer) issues.push('retailer is required');
        if (!title) issues.push('title is required');
        if (price === null) issues.push('price must be a positive amount');
        if (!url) issues.push('url must be a valid http(s) URL');
        if (!availability) issues.push('availability is required');

        if (issues.length > 0 || price === null || url === null) {
          rejectedRows.push(`Row ${rowNumber}: ${issues.join('; ')}.`);
          return;
        }

        validProducts.push({
          id: `${Date.now()}-${rowNumber}`,
          retailer,
          title,
          price,
          url,
          availability,
          analysisStatus: 'not-analyzed',
        });
      });

      setImportedProducts(validProducts);
      setCsvErrors(rejectedRows);
      setCsvMessage(`Imported ${validProducts.length} valid product${validProducts.length === 1 ? '' : 's'}; rejected ${rejectedRows.length} invalid row${rejectedRows.length === 1 ? '' : 's'}.`);
      setAnalysisProgress({ completed: 0, total: 0 });
    } catch (importError) {
      setCsvErrors([importError instanceof Error ? importError.message : 'Unable to read this CSV file.']);
    }
  }

  async function handleFetchCardGiants() {
    if (isFetchingCardGiants || isBulkAnalyzing) return;

    setIsFetchingCardGiants(true);
    setCardGiantsError(null);
    setCsvMessage(null);
    setCsvErrors([]);

    try {
      const response = await fetch('/api/cardgiants/search', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const payload = (await response.json()) as CardGiantsResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Card Giants products could not be retrieved.');
      }

      const products = (payload.products ?? []).map((product) => ({
        ...product,
        analysisStatus: 'not-analyzed' as const,
      }));
      setImportedProducts((current) => {
        const productsByUrl = new Map(current.map((product) => [product.url, product]));
        for (const product of products) {
          productsByUrl.set(product.url, product);
        }
        return Array.from(productsByUrl.values());
      });
      setAnalysisProgress({ completed: 0, total: 0 });
      setCsvMessage(`Fetched ${products.length} Card Giants product${products.length === 1 ? '' : 's'}. Use Analyze All to compare live eBay listings.`);
    } catch (fetchError) {
      setCardGiantsError(fetchError instanceof Error ? fetchError.message : 'Card Giants products could not be retrieved.');
    } finally {
      setIsFetchingCardGiants(false);
    }
  }

  async function handleAnalyzeAll() {
    if (isBulkAnalyzing || importedProducts.length === 0) return;

    const products = importedProducts.map((product) => ({
      ...product,
      analysisStatus: 'queued' as const,
      ebayPrice: undefined,
      ebayUrl: undefined,
      ebayTitle: undefined,
      estimatedProfit: undefined,
      analysisError: undefined,
    }));
    setImportedProducts(products);
    setIsBulkAnalyzing(true);
    setAnalysisProgress({ completed: 0, total: products.length });

    let nextIndex = 0;
    let completed = 0;
    const worker = async () => {
      while (true) {
        const productIndex = nextIndex;
        nextIndex += 1;
        if (productIndex >= products.length) return;

        const product = products[productIndex];
        const updateProduct = (updates: Partial<ImportedProduct>) => {
          setImportedProducts((current) => current.map((item) =>
            item.id === product.id ? { ...item, ...updates } : item,
          ));
        };

        updateProduct({ analysisStatus: 'searching' });
        try {
          const response = await fetch(`/api/ebay/search?q=${encodeURIComponent(product.title)}`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          const payload = (await response.json()) as SearchResponse;

          if (!response.ok || !payload.success) {
            throw new Error(payload.error || 'eBay active listings could not be retrieved.');
          }

          const lowestListing = (payload.results ?? [])
            .map((listing) => ({
              ...listing,
              numericPrice: listing.price == null ? null : Number(listing.price),
            }))
            .filter((listing): listing is ActiveListing & { numericPrice: number } =>
              listing.currency === 'USD'
              && typeof listing.numericPrice === 'number'
              && Number.isFinite(listing.numericPrice)
              && listing.numericPrice > 0
              && Boolean(listing.itemWebUrl))
            .reduce<(ActiveListing & { numericPrice: number }) | null>((lowest, listing) =>
              !lowest || listing.numericPrice < lowest.numericPrice ? listing : lowest,
            null);

          if (!lowestListing || !lowestListing.itemWebUrl) {
            updateProduct({ analysisStatus: 'no-match' });
          } else {
            const estimatedProfit = Number((lowestListing.numericPrice * 0.875 - product.price - OUTBOUND_SHIPPING).toFixed(2));
            updateProduct({
              analysisStatus: 'analyzed',
              ebayPrice: lowestListing.numericPrice,
              ebayUrl: lowestListing.itemWebUrl,
              ebayTitle: lowestListing.title,
              estimatedProfit,
            });
          }
        } catch (analysisError) {
          updateProduct({
            analysisStatus: 'error',
            analysisError: analysisError instanceof Error ? analysisError.message : 'eBay analysis failed.',
          });
        } finally {
          completed += 1;
          setAnalysisProgress({ completed, total: products.length });
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(2, products.length) }, () => worker()));
    } finally {
      setIsBulkAnalyzing(false);
    }
  }

  function updateInput(field: keyof DealInputs, value: string) {
    setInputs((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="deal-shell">
      <header className="deal-topbar">
        <a className="deal-brand" href="/">GOAT <span>PERSONAL DEAL FINDER</span></a>
        <span className="deal-private-label">PRIVATE WORKSPACE</span>
      </header>

      <section className="deal-heading">
        <div>
          <p className="deal-eyebrow">SEALED CARDS / RESALE CHECK</p>
          <h1>Deal analyzer</h1>
        </div>
        <p className="deal-warning">ACTIVE ASKING PRICES, NOT SOLD COMPS</p>
      </section>

      <section className="deal-results" aria-labelledby="bulk-import-heading">
        <div className="deal-results-heading">
          <div>
            <p className="deal-eyebrow">REAL RETAILER DATA</p>
            <h2 id="bulk-import-heading">Bulk CSV import</h2>
          </div>
          <span className="deal-timestamp">Required columns: retailer, title, price, url, availability</span>
        </div>
        <label className="deal-csv-upload">
          <span>Choose a retailer product CSV</span>
          <input type="file" accept=".csv,text/csv" onChange={handleCsvImport} disabled={isBulkAnalyzing} />
        </label>
        <div className="deal-bulk-actions">
          <button type="button" onClick={handleFetchCardGiants} disabled={isFetchingCardGiants || isBulkAnalyzing}>
            {isFetchingCardGiants ? 'Fetching Card Giants...' : 'Fetch Card Giants'}
          </button>
        </div>
        {cardGiantsError && <p className="deal-error" role="alert">{cardGiantsError}</p>}
        {csvMessage && <p className="deal-csv-message" role="status">{csvMessage}</p>}
        {csvErrors.length > 0 && (
          <div className="deal-csv-errors" role="alert">
            <strong>Import issues</strong>
            <ul>
              {csvErrors.slice(0, 20).map((csvError, index) => <li key={`${csvError}-${index}`}>{csvError}</li>)}
            </ul>
            {csvErrors.length > 20 && <span>Showing 20 of {csvErrors.length} issues.</span>}
          </div>
        )}

        {importedProducts.length > 0 && (
          <>
            <div className="deal-bulk-actions">
              <button type="button" onClick={handleAnalyzeAll} disabled={isBulkAnalyzing}>
                {isBulkAnalyzing ? `Analyzing ${analysisProgress.completed}/${analysisProgress.total}...` : 'Analyze All'}
              </button>
              {analysisProgress.total > 0 && (
                <span role="status">Progress: {analysisProgress.completed} of {analysisProgress.total} products</span>
              )}
            </div>
            <div className="deal-table-scroll">
              <table className="deal-data-table">
                <thead>
                  <tr><th>Retailer</th><th>Product</th><th>Price</th><th>Availability</th><th>Analysis status</th></tr>
                </thead>
                <tbody>
                  {importedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.retailer}</td>
                      <td><a href={product.url} target="_blank" rel="noopener noreferrer">{product.title} ↗</a></td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.availability}</td>
                      <td>
                        {product.analysisStatus === 'error'
                          ? `Error: ${product.analysisError}`
                          : product.analysisStatus === 'no-match'
                            ? 'No matching USD listing'
                            : product.analysisStatus.replace('-', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!isBulkAnalyzing && analysisProgress.total > 0 && (
          <section className="deal-positive-results" aria-live="polite">
            <h3>Positive-profit opportunities <span>{positiveProfitProducts.length}</span></h3>
            <p className="deal-match-warning">eBay BIN values are active asking prices, not verified sales. Profit estimate: lowest matching BIN × 0.875 − retailer price − $7 shipping.</p>
            {positiveProfitProducts.length === 0 ? (
              <p className="deal-empty">No positive-profit products with a matching USD listing were found.</p>
            ) : (
              <div className="deal-table-scroll">
                <table className="deal-data-table">
                  <thead>
                    <tr><th>Retailer</th><th>Product</th><th>Retail price</th><th>Lowest matching eBay BIN (asking)</th><th>Estimated profit</th></tr>
                  </thead>
                  <tbody>
                    {positiveProfitProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.retailer}</td>
                        <td>
                          <a href={product.url} target="_blank" rel="noopener noreferrer">{product.title} ↗</a>
                          {product.ebayTitle && <small className="deal-ebay-title">eBay match: {product.ebayTitle}</small>}
                        </td>
                        <td>{formatCurrency(product.price)}</td>
                        <td><a href={product.ebayUrl} target="_blank" rel="noopener noreferrer">{formatCurrency(product.ebayPrice ?? 0)} ↗</a></td>
                        <td className="is-positive">{formatCurrency(product.estimatedProfit ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </section>

      <form className="deal-form" onSubmit={handleSubmit}>
        <div className="deal-form-heading">
          <h2>Retail source</h2>
          <span>RETAILER DATA ENTERED BY YOU</span>
        </div>
        <label className="deal-field deal-field-wide">
          <span>Product title</span>
          <input value={inputs.title} onChange={(event) => updateInput('title', event.target.value)} required placeholder="2025 Topps Chrome Baseball Hobby Box" />
        </label>
        <label className="deal-field">
          <span>Retailer name</span>
          <input value={inputs.retailer} onChange={(event) => updateInput('retailer', event.target.value)} required placeholder="Retailer" />
        </label>
        <label className="deal-field">
          <span>Retailer product URL</span>
          <input type="url" value={inputs.retailerUrl} onChange={(event) => updateInput('retailerUrl', event.target.value)} required placeholder="https://retailer.example/product" />
        </label>
        <label className="deal-field">
          <span>Purchase price (USD)</span>
          <input type="number" min="0" step="0.01" value={inputs.purchasePrice} onChange={(event) => updateInput('purchasePrice', event.target.value)} required />
        </label>
        <label className="deal-field">
          <span>Inbound shipping (USD)</span>
          <input type="number" min="0" step="0.01" value={inputs.inboundShipping} onChange={(event) => updateInput('inboundShipping', event.target.value)} required />
        </label>
        <label className="deal-field">
          <span>Estimated tax (USD)</span>
          <input type="number" min="0" step="0.01" value={inputs.tax} onChange={(event) => updateInput('tax', event.target.value)} required />
        </label>
        <div className="deal-form-actions">
          <button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching eBay...' : 'Analyze deal'}
          </button>
          {error && <p className="deal-error" role="alert">{error}</p>}
        </div>
      </form>

      {searchedAt && (
        <section className="deal-results" aria-live="polite">
          <div className="deal-results-heading">
            <div>
              <p className="deal-eyebrow">EBAY BROWSE API</p>
              <h2>{searchedTitle}</h2>
            </div>
            <span className="deal-timestamp">Retrieved {searchedAt}</span>
          </div>

          <p className="deal-match-warning">
            Listing titles are candidates, not confirmed product matches. Review year, configuration, variant, condition, and retailer source before relying on this estimate.
          </p>

          {lowestListing && estimatedNet !== null ? (
            <div className="deal-estimate-grid">
              <div className="deal-estimate-primary">
                <span>EST. NET AT LOWEST ACTIVE ASK</span>
                <strong className={estimatedNet >= 0 ? 'is-positive' : 'is-negative'}>{formatCurrency(estimatedNet)}</strong>
                <small>ROI {estimatedRoi === null ? '—' : `${estimatedRoi.toFixed(1)}%`} on retailer cost + inbound shipping + tax</small>
              </div>
              <dl className="deal-cost-breakdown">
                <div><dt>Lowest active asking price</dt><dd>{formatCurrency(lowestListing.price ?? 0, lowestListing.currency ?? 'USD')}</dd></div>
                <div><dt>eBay fee estimate (12.5%)</dt><dd>{formatCurrency((lowestListing.price ?? 0) * EBAY_FEE_RATE)}</dd></div>
                <div><dt>Outbound shipping</dt><dd>{formatCurrency(OUTBOUND_SHIPPING)}</dd></div>
                <div><dt>Retail + inbound + tax</dt><dd>{formatCurrency(acquisitionCost)}</dd></div>
              </dl>
            </div>
          ) : (
            <p className="deal-empty">No matching active listings with a usable price were returned. No fallback prices are shown.</p>
          )}

          <div className="deal-source-links">
            <a href={inputs.retailerUrl} target="_blank" rel="noopener noreferrer">Open retailer source ↗</a>
            <span>{inputs.retailer}</span>
          </div>

          {listings.length > 0 && (
            <div className="deal-listings">
              <h3>Active listing candidates <span>{listings.length}</span></h3>
              {listings.map((listing, index) => (
                <article className="deal-listing" key={listing.itemId ?? `${listing.title}-${index}`}>
                  <div className="deal-listing-copy">
                    {listing.itemWebUrl ? (
                      <a href={listing.itemWebUrl} target="_blank" rel="noopener noreferrer">{listing.title || 'Untitled listing'} ↗</a>
                    ) : (
                      <span>{listing.title || 'Untitled listing'}</span>
                    )}
                    <span>{listing.condition || 'Condition not provided'}{listing.sellerUsername ? ` · Seller ${listing.sellerUsername}` : ''}</span>
                  </div>
                  <div className="deal-listing-price">
                    <strong>{listing.price == null ? 'Price unavailable' : formatCurrency(listing.price, listing.currency ?? 'USD')}</strong>
                    <span>ACTIVE ASKING PRICE</span>
                  </div>
                  <div className={`deal-confidence ${listing.matchConfidence < 80 ? 'needs-review' : ''}`}>
                    <strong>{listing.matchConfidence}%</strong>
                    <span>{listing.matchConfidence < 80 ? 'REVIEW MATCH' : 'MATCH SIGNAL'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="deal-disclaimer">Estimate only. Active asking prices do not establish sale value, verified profit, or sales velocity.</p>
        </section>
      )}
    </main>
  );
}