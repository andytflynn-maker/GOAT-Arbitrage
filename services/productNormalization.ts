export interface NormalizedProductTitle {
  normalizedTitle: string;
  year: string | null;
  brand: string | null;
  productLine: string | null;
  sport: string | null;
  productType: string | null;
  variants: string[];
}

const SPORT_ALIASES: Record<string, string> = {
  mlb: 'baseball',
  nfl: 'football',
  nba: 'basketball',
  nhl: 'hockey',
  ufc: 'mma',
  wwe: 'wrestling',
  'formula 1': 'racing',
  f1: 'racing',
};

const PRODUCT_TYPE_PATTERNS = [
  'hobby box',
  'jumbo box',
  'blaster box',
  'mega box',
  'retail box',
  'booster box',
  'pack',
  'case',
];

const VARIANT_PATTERNS = [
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
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractYear(text: string): string | null {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

function detectSport(text: string): string | null {
  const normalized = normalizeText(text);

  for (const [alias, sport] of Object.entries(SPORT_ALIASES)) {
    if (normalized.includes(alias)) {
      return sport;
    }
  }

  const sports = ['baseball', 'football', 'basketball', 'hockey', 'soccer', 'mma', 'wrestling', 'racing'];
  const foundSport = sports.find((sport) => normalized.includes(sport));
  return foundSport ?? null;
}

function detectProductType(text: string): string | null {
  const normalized = normalizeText(text);
  const foundType = PRODUCT_TYPE_PATTERNS.find((type) => normalized.includes(type));
  return foundType ?? null;
}

function detectVariants(text: string): string[] {
  const normalized = normalizeText(text);
  return VARIANT_PATTERNS.filter((variant) => normalized.includes(variant));
}

function detectBrand(text: string): string | null {
  const normalized = normalizeText(text);
  const brandHints = ['topps', 'bowman', 'panini', 'upper deck', 'upperdeck', 'leaf'];
  const match = brandHints.find((brand) => normalized.includes(brand));
  return match ?? null;
}

function detectProductLine(text: string): string | null {
  const normalized = normalizeText(text);
  const brandHints = ['topps', 'bowman', 'panini', 'upper deck', 'upperdeck', 'leaf'];
  const lineHints = ['chrome', 'prizm', 'select', 'series', 'sapphire', 'cosmic', 'update'];
  const match = lineHints.find((line) => normalized.includes(line) && !brandHints.includes(line));
  return match ?? null;
}

export function normalizeProductTitle(title: string): NormalizedProductTitle {
  const normalizedTitle = normalizeText(title);
  const year = extractYear(title);
  const sport = detectSport(normalizedTitle);
  const productType = detectProductType(normalizedTitle);
  const variants = detectVariants(normalizedTitle);
  const brand = detectBrand(normalizedTitle);
  const productLine = detectProductLine(normalizedTitle);

  const meaningfulTokens = normalizedTitle
    .split(/\s+/)
    .filter((token) => token && !FILLER_WORDS.includes(token));

  const normalized = meaningfulTokens.join(' ');

  return {
    normalizedTitle: normalized || normalizedTitle,
    year,
    brand,
    productLine,
    sport,
    productType,
    variants,
  };
}
