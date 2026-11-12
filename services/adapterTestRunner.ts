import type { Product, AvailabilityStatus } from '@/models/Product';
import type { RetailerAdapter, RetailerAdapterSource } from '@/marketplaces/retailerAdapter';
import type {
  AdapterSourceType,
  AdapterTestResult,
  AdapterTestStep,
} from '@/types/adapterTesting';

const VALID_AVAILABILITY_VALUES: AvailabilityStatus[] = [
  'In Stock',
  'Out of Stock',
  'Limited',
  'Preorder',
  'Unknown',
];

function now(): number {
  return Date.now();
}

function detectSourceFromAdapter(adapter: RetailerAdapter): AdapterSourceType {
  const explicitSource: RetailerAdapterSource = adapter.adapterSource ?? 'unknown';
  return explicitSource;
}

function hasValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function requiredFieldIssues(product: Product): string[] {
  const issues: string[] = [];

  if (!product.universal.id.trim()) issues.push('universal.id is missing');
  if (!product.universal.title.trim()) issues.push('universal.title is missing');
  if (!product.universal.brand.trim()) issues.push('universal.brand is missing');
  if (!product.universal.manufacturer.trim()) issues.push('universal.manufacturer is missing');
  if (!product.universal.url.trim()) issues.push('universal.url is missing');
  if (!product.universal.image.trim()) issues.push('universal.image is missing');
  if (product.retailPricing.length === 0) issues.push('retailPricing entries are missing');

  return issues;
}

function priceIssues(products: Product[]): string[] {
  const issues: string[] = [];

  products.forEach((product) => {
    product.retailPricing.forEach((entry, index) => {
      if (!Number.isFinite(entry.retailerPrice) || entry.retailerPrice <= 0) {
        issues.push(`${product.universal.id}: retailPricing[${index}] has invalid price`);
      }
    });
  });

  return issues;
}

function inventoryIssues(products: Product[]): string[] {
  const issues: string[] = [];

  products.forEach((product) => {
    product.retailPricing.forEach((entry, index) => {
      if (!VALID_AVAILABILITY_VALUES.includes(entry.availability)) {
        issues.push(`${product.universal.id}: retailPricing[${index}] has invalid availability`);
      }

      if (entry.quantity !== null && (!Number.isInteger(entry.quantity) || entry.quantity < 0)) {
        issues.push(`${product.universal.id}: retailPricing[${index}] has invalid quantity`);
      }
    });
  });

  return issues;
}

function urlIssues(products: Product[]): string[] {
  const issues: string[] = [];

  products.forEach((product) => {
    if (!hasValidHttpUrl(product.universal.url)) {
      issues.push(`${product.universal.id}: product URL is invalid`);
    }
  });

  return issues;
}

function stepDuration(start: number): number {
  return now() - start;
}

export class AdapterTestRunner {
  async run(adapter: RetailerAdapter, query: string): Promise<AdapterTestResult> {
    const runStart = now();
    const steps: AdapterTestStep[] = [];
    const errorDetails: string[] = [];

    let adapterName = 'Unknown Adapter';
    let adapterSource = detectSourceFromAdapter(adapter);
    let searchProductsResult: Product[] = [];
    let normalizedProducts: Product[] = [];

    const addStep = (step: AdapterTestStep) => {
      steps.push(step);
    };

    const adapterFoundStart = now();
    if (adapter) {
      addStep({
        key: 'adapter-found',
        label: 'Adapter found',
        status: 'passed',
        message: 'Adapter instance resolved successfully.',
        durationMs: stepDuration(adapterFoundStart),
      });
    } else {
      addStep({
        key: 'adapter-found',
        label: 'Adapter found',
        status: 'failed',
        message: 'Adapter instance not found.',
        durationMs: stepDuration(adapterFoundStart),
      });
    }

    const nameStart = now();
    try {
      adapterName = adapter.getRetailerName();
      const status = adapterName.trim().length > 0 ? 'passed' : 'failed';
      addStep({
        key: 'retailer-name-resolved',
        label: 'Retailer name resolved',
        status,
        message: status === 'passed' ? `Retailer name resolved as ${adapterName}.` : 'Retailer name is empty.',
        durationMs: stepDuration(nameStart),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while resolving retailer name.';
      errorDetails.push(`Retailer name step: ${message}`);
      addStep({
        key: 'retailer-name-resolved',
        label: 'Retailer name resolved',
        status: 'failed',
        message,
        durationMs: stepDuration(nameStart),
      });
    }

    const searchStart = now();
    try {
      searchProductsResult = await adapter.searchProducts(query);
      addStep({
        key: 'search-method-executed',
        label: 'Search method executed',
        status: 'passed',
        message: `Search executed with query "${query}".`,
        durationMs: stepDuration(searchStart),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while executing search.';
      errorDetails.push(`Search step: ${message}`);
      addStep({
        key: 'search-method-executed',
        label: 'Search method executed',
        status: 'failed',
        message,
        durationMs: stepDuration(searchStart),
      });
    }

    const productsReturnedStart = now();
    const hasProducts = searchProductsResult.length > 0;
    addStep({
      key: 'products-returned',
      label: 'Products returned',
      status: hasProducts ? 'passed' : 'failed',
      message: hasProducts
        ? `${searchProductsResult.length} product(s) returned.`
        : 'No products returned',
      durationMs: stepDuration(productsReturnedStart),
    });

    const normalizationStart = now();
    if (hasProducts) {
      try {
        normalizedProducts = searchProductsResult.map((product) => adapter.normalizeProduct(product));
        addStep({
          key: 'product-normalization-completed',
          label: 'Product normalization completed',
          status: 'passed',
          message: `Normalized ${normalizedProducts.length} product(s).`,
          durationMs: stepDuration(normalizationStart),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error while normalizing products.';
        errorDetails.push(`Normalization step: ${message}`);
        addStep({
          key: 'product-normalization-completed',
          label: 'Product normalization completed',
          status: 'failed',
          message,
          durationMs: stepDuration(normalizationStart),
        });
      }
    } else {
      addStep({
        key: 'product-normalization-completed',
        label: 'Product normalization completed',
        status: 'failed',
        message: 'Normalization skipped because no products were returned.',
        durationMs: stepDuration(normalizationStart),
      });
    }

    const validationInput = normalizedProducts.length > 0 ? normalizedProducts : searchProductsResult;

    const requiredStart = now();
    if (validationInput.length > 0) {
      const issues = requiredFieldIssues(validationInput[0]);
      addStep({
        key: 'required-fields-present',
        label: 'Required fields present',
        status: issues.length === 0 ? 'passed' : 'failed',
        message: issues.length === 0 ? 'Required fields are present.' : 'Required field validation failed.',
        durationMs: stepDuration(requiredStart),
        details: issues,
      });
      errorDetails.push(...issues);
    } else {
      addStep({
        key: 'required-fields-present',
        label: 'Required fields present',
        status: 'failed',
        message: 'Required fields cannot be validated without products.',
        durationMs: stepDuration(requiredStart),
      });
    }

    const urlStart = now();
    if (validationInput.length > 0) {
      const issues = urlIssues(validationInput);
      addStep({
        key: 'product-urls-valid',
        label: 'Product URLs valid',
        status: issues.length === 0 ? 'passed' : 'failed',
        message: issues.length === 0 ? 'Product URLs are valid.' : 'Invalid product URLs found.',
        durationMs: stepDuration(urlStart),
        details: issues,
      });
      errorDetails.push(...issues);
    } else {
      addStep({
        key: 'product-urls-valid',
        label: 'Product URLs valid',
        status: 'failed',
        message: 'URL validation cannot be performed without products.',
        durationMs: stepDuration(urlStart),
      });
    }

    const priceStart = now();
    if (validationInput.length > 0) {
      const issues = priceIssues(validationInput);
      addStep({
        key: 'prices-valid',
        label: 'Prices valid',
        status: issues.length === 0 ? 'passed' : 'failed',
        message: issues.length === 0 ? 'Prices are valid.' : 'Price validation failed.',
        durationMs: stepDuration(priceStart),
        details: issues,
      });
      errorDetails.push(...issues);
    } else {
      addStep({
        key: 'prices-valid',
        label: 'Prices valid',
        status: 'failed',
        message: 'Price validation cannot be performed without products.',
        durationMs: stepDuration(priceStart),
      });
    }

    const inventoryStart = now();
    if (validationInput.length > 0) {
      const issues = inventoryIssues(validationInput);
      addStep({
        key: 'inventory-values-valid',
        label: 'Inventory values valid',
        status: issues.length === 0 ? 'passed' : 'failed',
        message: issues.length === 0 ? 'Inventory values are valid.' : 'Inventory validation failed.',
        durationMs: stepDuration(inventoryStart),
        details: issues,
      });
      errorDetails.push(...issues);
    } else {
      addStep({
        key: 'inventory-values-valid',
        label: 'Inventory values valid',
        status: 'failed',
        message: 'Inventory validation cannot be performed without products.',
        durationMs: stepDuration(inventoryStart),
      });
    }

    const sourceVerificationStart = now();
    const sourceVerifiedLive = adapterSource === 'live';
    addStep({
      key: 'data-source-explicitly-verified',
      label: 'Data source explicitly verified',
      status: sourceVerifiedLive ? 'passed' : 'failed',
      message: sourceVerifiedLive
        ? 'Adapter explicitly declares a verified live data source.'
        : `Adapter source is explicitly declared as ${adapterSource}; live source verification not satisfied.`,
      durationMs: stepDuration(sourceVerificationStart),
    });

    if (!sourceVerifiedLive) {
      errorDetails.push(`Source verification: adapter source is ${adapterSource}, not live.`);
    }

    const status = steps.every((step) => step.status === 'passed') ? 'passed' : 'failed';

    return {
      status,
      adapterName,
      adapterSource,
      query,
      productsReturnedCount: searchProductsResult.length,
      elapsedMs: now() - runStart,
      steps,
      errorDetails,
      sampleNormalizedProduct: normalizedProducts.length > 0 ? normalizedProducts[0] : null,
    };
  }
}
