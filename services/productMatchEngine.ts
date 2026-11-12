export type MatchRecommendation = 'AUTO_MATCH' | 'REVIEW' | 'REJECT';

export interface ProductMatchInput {
  year?: string | number | null;
  manufacturer?: string | null;
  brand?: string | null;
  productLine?: string | null;
  productVariant?: string | string[] | null;
  configuration?: string | null;
  cardCount?: number | null;
  packCount?: number | null;
  upc?: string | null;
  title?: string | null;
}

export interface ProductMatchResult {
  confidenceScore: number;
  matchedFields: string[];
  mismatchedFields: string[];
  excludedKeywords: string[];
  recommendation: MatchRecommendation;
}

type FieldWeight = {
  key: 'year' | 'manufacturer' | 'brand' | 'productLine' | 'productVariant' | 'configuration' | 'cardCount' | 'packCount' | 'upc';
  label: string;
  weight: number;
};

const FIELD_WEIGHTS: FieldWeight[] = [
  { key: 'upc', label: 'UPC', weight: 45 },
  { key: 'year', label: 'Year', weight: 10 },
  { key: 'manufacturer', label: 'Manufacturer', weight: 8 },
  { key: 'brand', label: 'Brand', weight: 8 },
  { key: 'productLine', label: 'Product Line', weight: 10 },
  { key: 'productVariant', label: 'Product Variant', weight: 8 },
  { key: 'configuration', label: 'Configuration', weight: 7 },
  { key: 'cardCount', label: 'Card Count', weight: 2 },
  { key: 'packCount', label: 'Pack Count', weight: 2 },
];

const EXCLUDED_KEYWORDS = [
  'single',
  'singles',
  'break',
  'team break',
  'lot',
  'digital',
  'redemption',
  'player break',
  'pick your team',
  'empty box',
  'wrapper',
];

const VARIANT_IDENTITY_TERMS = [
  'platinum',
  'black',
  'sapphire',
  'update',
  'chrome',
  'base',
];

function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeUpc(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D+/g, '');
  return digits.length > 0 ? digits : null;
}

function normalizeYear(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : null;
}

function normalizeNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return value;
}

function normalizeVariant(value: string | string[] | null | undefined): string[] {
  if (!value) {
    return [];
  }

  const parts = Array.isArray(value) ? value : value.split(/[|,/]/g);
  const normalized = parts
    .map((part) => normalizeText(part))
    .filter((part): part is string => Boolean(part));

  return Array.from(new Set(normalized)).sort();
}

function extractIdentityVariantsFromTitle(title: string | null | undefined): string[] {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) {
    return [];
  }

  return VARIANT_IDENTITY_TERMS.filter((term) => normalizedTitle.includes(term));
}

function mergeVariantSources(primary: string[], fromTitle: string[]): string[] {
  return Array.from(new Set([...primary, ...fromTitle])).sort();
}

function parseExcludedKeywords(title: string | null | undefined): string[] {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) {
    return [];
  }

  return EXCLUDED_KEYWORDS.filter((keyword) => normalizedTitle.includes(keyword));
}

function compareStringField(left: string | null, right: string | null): boolean | null {
  if (!left || !right) {
    return null;
  }

  return left === right;
}

function compareNumberField(left: number | null, right: number | null): boolean | null {
  if (left === null || right === null) {
    return null;
  }

  return left === right;
}

function compareVariantField(left: string[], right: string[]): boolean | null {
  if (left.length === 0 || right.length === 0) {
    return null;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export function matchProducts(source: ProductMatchInput, candidate: ProductMatchInput): ProductMatchResult {
  const sourceKeywords = parseExcludedKeywords(source.title);
  const candidateKeywords = parseExcludedKeywords(candidate.title);
  const keywordConflicts = candidateKeywords.filter((keyword) => !sourceKeywords.includes(keyword));

  const sourceYear = normalizeYear(source.year);
  const candidateYear = normalizeYear(candidate.year);

  const sourceManufacturer = normalizeText(source.manufacturer);
  const candidateManufacturer = normalizeText(candidate.manufacturer);

  const sourceBrand = normalizeText(source.brand);
  const candidateBrand = normalizeText(candidate.brand);

  const sourceProductLine = normalizeText(source.productLine);
  const candidateProductLine = normalizeText(candidate.productLine);

  const sourceVariant = mergeVariantSources(
    normalizeVariant(source.productVariant),
    extractIdentityVariantsFromTitle(source.title),
  );
  const candidateVariant = mergeVariantSources(
    normalizeVariant(candidate.productVariant),
    extractIdentityVariantsFromTitle(candidate.title),
  );

  const sourceConfiguration = normalizeText(source.configuration);
  const candidateConfiguration = normalizeText(candidate.configuration);

  const sourceCardCount = normalizeNumber(source.cardCount);
  const candidateCardCount = normalizeNumber(candidate.cardCount);

  const sourcePackCount = normalizeNumber(source.packCount);
  const candidatePackCount = normalizeNumber(candidate.packCount);

  const sourceUpc = normalizeUpc(source.upc);
  const candidateUpc = normalizeUpc(candidate.upc);

  const matchedFields: string[] = [];
  const mismatchedFields: string[] = [];
  let possibleWeight = 0;
  let earnedWeight = 0;
  let hardReject = false;

  const hardConflictKeys = new Set<FieldWeight['key']>([
    'upc',
    'year',
    'productLine',
    'productVariant',
    'configuration',
  ]);

  const yearMatches = sourceYear !== null && candidateYear !== null && sourceYear === candidateYear;
  const productLineMatches =
    sourceProductLine !== null
    && candidateProductLine !== null
    && sourceProductLine === candidateProductLine;
  const variantMatches = compareVariantField(sourceVariant, candidateVariant) === true;
  const configurationMatches =
    sourceConfiguration !== null
    && candidateConfiguration !== null
    && sourceConfiguration === candidateConfiguration;
  const hasCoreIdentityAutoMatchEligibility =
    yearMatches
    && productLineMatches
    && variantMatches
    && configurationMatches;

  for (const field of FIELD_WEIGHTS) {
    let comparison: boolean | null = null;

    if (field.key === 'year') comparison = compareStringField(sourceYear, candidateYear);
    if (field.key === 'manufacturer') comparison = compareStringField(sourceManufacturer, candidateManufacturer);
    if (field.key === 'brand') comparison = compareStringField(sourceBrand, candidateBrand);
    if (field.key === 'productLine') comparison = compareStringField(sourceProductLine, candidateProductLine);
    if (field.key === 'productVariant') comparison = compareVariantField(sourceVariant, candidateVariant);
    if (field.key === 'configuration') comparison = compareStringField(sourceConfiguration, candidateConfiguration);
    if (field.key === 'cardCount') comparison = compareNumberField(sourceCardCount, candidateCardCount);
    if (field.key === 'packCount') comparison = compareNumberField(sourcePackCount, candidatePackCount);
    if (field.key === 'upc') comparison = compareStringField(sourceUpc, candidateUpc);

    if (comparison === null) {
      continue;
    }

    possibleWeight += field.weight;

    if (comparison) {
      earnedWeight += field.weight;
      matchedFields.push(field.label);
      continue;
    }

    mismatchedFields.push(field.label);
    if (hardConflictKeys.has(field.key)) {
      hardReject = true;
    }
  }

  if (keywordConflicts.length > 0) {
    hardReject = true;
  }

  const confidenceScore = possibleWeight > 0
    ? Math.max(0, Math.min(100, Math.round((earnedWeight / possibleWeight) * 100)))
    : 0;

  let recommendation: MatchRecommendation = 'REVIEW';

  if (hardReject || confidenceScore < 85) {
    recommendation = 'REJECT';
  } else if (
    confidenceScore >= 95
    && mismatchedFields.length === 0
    && hasCoreIdentityAutoMatchEligibility
  ) {
    recommendation = 'AUTO_MATCH';
  } else if (confidenceScore >= 85 && confidenceScore <= 94) {
    recommendation = 'REVIEW';
  }

  return {
    confidenceScore,
    matchedFields,
    mismatchedFields,
    excludedKeywords: keywordConflicts,
    recommendation,
  };
}
