/**
 * Product Normalizer — Canonical product identification engine.
 *
 * Maps different product titles across stores to a single canonical product.
 * Uses multiple signals: brand, model, GTIN/EAN, ASIN, SKU, MPN,
 * variant extraction, and semantic similarity.
 */

export interface ProductFingerprint {
  brand: string | null;
  model: string | null;
  productFamily: string | null;
  variant: string | null;
  category: string | null;
  sku: string | null;
  mpn: string | null;
  gtin: string | null;
  asin: string | null;
  /** A short key used for cache lookups and deduplication */
  fingerprintKey: string;
}

export interface NormalizedProduct {
  brand: string | null;
  model: string | null;
  category: string | null;
  canonicalTitle: string;
  /** Extracted identifiers */
  identifiers: {
    gtin: string | null;
    asin: string | null;
    modelNumber: string | null;
    sku: string | null;
    mpn: string | null;
  };
  /** Structured fingerprint for cross-store matching */
  fingerprint: ProductFingerprint;
  /** Confidence of normalization (0–1) */
  confidence: number;
}

/** Known brand aliases and common misspellings */
const BRAND_ALIASES: Record<string, string> = {
  "apple": "Apple",
  "samsung": "Samsung",
  "sony": "Sony",
  "lg": "LG",
  "hp": "HP",
  "dell": "Dell",
  "lenovo": "Lenovo",
  "asus": "ASUS",
  "acer": "Acer",
  "mi": "Xiaomi",
  "xiaomi": "Xiaomi",
  "redmi": "Xiaomi",
  "poco": "POCO",
  "oneplus": "OnePlus",
  "one plus": "OnePlus",
  "1+": "OnePlus",
  "realme": "Realme",
  "oppo": "OPPO",
  "vivo": "Vivo",
  "nothing": "Nothing",
  "google": "Google",
  "motorola": "Motorola",
  "moto": "Motorola",
  "nokia": "Nokia",
  "bosch": "Bosch",
  "philips": "Philips",
  "panasonic": "Panasonic",
  "whirlpool": "Whirlpool",
  "haier": "Haier",
  "godrej": "Godrej",
  "voltas": "Voltas",
  "daikin": "Daikin",
  "jbl": "JBL",
  "bose": "Bose",
  "sennheiser": "Sennheiser",
  "boat": "boAt",
  "nike": "Nike",
  "adidas": "Adidas",
  "puma": "Puma",
  "dyson": "Dyson",
  "canon": "Canon",
  "nikon": "Nikon",
  "gopro": "GoPro",
  "fitbit": "Fitbit",
  "garmin": "Garmin",
  "intel": "Intel",
  "amd": "AMD",
  "nvidia": "NVIDIA",
  "corsair": "Corsair",
  "logitech": "Logitech",
  "razer": "Razer",
  "marshall": "Marshall",
  "microsoft": "Microsoft",
  "amazon": "Amazon",
  // Additional brands for broader coverage
  "tcl": "TCL",
  "hisense": "Hisense",
  "toshiba": "Toshiba",
  "sharp": "Sharp",
  "huawei": "Huawei",
  "honor": "Honor",
  "iqoo": "iQOO",
  "tecno": "Tecno",
  "infinix": "Infinix",
  "lava": "Lava",
  "micromax": "Micromax",
  "msi": "MSI",
  "gigabyte": "Gigabyte",
  "asrock": "ASRock",
  "zotac": "Zotac",
  "evga": "EVGA",
  "kingston": "Kingston",
  "crucial": "Crucial",
  "western digital": "Western Digital",
  "wd": "Western Digital",
  "seagate": "Seagate",
  "sandisk": "SanDisk",
  "samsung evo": "Samsung",
  "hyperx": "HyperX",
  "steelseries": "SteelSeries",
  "anker": "Anker",
  "belkin": "Belkin",
  "tp-link": "TP-Link",
  "tplink": "TP-Link",
  "netgear": "Netgear",
  "asus rog": "ASUS",
  "rog": "ASUS",
  "thinkpad": "Lenovo",
  "ideapad": "Lenovo",
  "inspiron": "Dell",
  "latitude": "Dell",
  "xps": "Dell",
  "pavilion": "HP",
  "envy": "HP",
  "spectre": "HP",
  "omen": "HP",
  "legion": "Lenovo",
  "vivobook": "ASUS",
  "zenbook": "ASUS",
  "surface": "Microsoft",
  "pixel": "Google",
  "iphone": "Apple",
  "ipad": "Apple",
  "macbook": "Apple",
  "airpods": "Apple",
  "galaxy": "Samsung",
  "fire": "Amazon",
  "kindle": "Amazon",
  "echo": "Amazon",
  "ring": "Amazon",
  "playstation": "Sony",
  "ps5": "Sony",
  "ps4": "Sony",
  "xbox": "Microsoft",
  "nintendo": "Nintendo",
  "switch": "Nintendo",
  "beats": "Beats",
  "skullcandy": "Skullcandy",
  "audio-technica": "Audio-Technica",
  "audio technica": "Audio-Technica",
  "bang & olufsen": "Bang & Olufsen",
  "b&o": "Bang & Olufsen",
  "sonos": "Sonos",
  "harman kardon": "Harman Kardon",
  "ultimate ears": "Ultimate Ears",
  "ue": "Ultimate Ears",
  "breville": "Breville",
  "kitchenaid": "KitchenAid",
  "instant pot": "Instant Pot",
  "ninja": "Ninja",
  "cuisinart": "Cuisinart",
  "roomba": "iRobot",
  "irobot": "iRobot",
  "eufy": "Eufy",
  "roborock": "Roborock",
  "dreame": "Dreame",
  "bissell": "Bissell",
  "shark": "Shark",
  "under armour": "Under Armour",
  "new balance": "New Balance",
  "reebok": "Reebok",
  "converse": "Converse",
  "vans": "Vans",
  "skechers": "Skechers",
  "crocs": "Crocs",
  "epson": "Epson",
  "brother": "Brother",
};

/** Category detection patterns */
const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(laptop|notebook|macbook|chromebook)\b/i, category: "Laptops" },
  { pattern: /\b(phone|smartphone|iphone|galaxy\s*s|pixel)\b/i, category: "Smartphones" },
  { pattern: /\b(tablet|ipad)\b/i, category: "Tablets" },
  { pattern: /\b(headphone|earphone|earbud|airpod|earbuds|headset)\b/i, category: "Audio" },
  { pattern: /\b(speaker|soundbar|subwoofer)\b/i, category: "Audio" },
  { pattern: /\b(tv|television|smart\s*tv|oled|qled)\b/i, category: "TVs" },
  { pattern: /\b(monitor|display)\b/i, category: "Monitors" },
  { pattern: /\b(camera|dslr|mirrorless|webcam)\b/i, category: "Cameras" },
  { pattern: /\b(watch|smartwatch|fitness\s*band)\b/i, category: "Wearables" },
  { pattern: /\b(refrigerator|fridge)\b/i, category: "Appliances" },
  { pattern: /\b(washing\s*machine|washer|dryer)\b/i, category: "Appliances" },
  { pattern: /\b(air\s*conditioner|ac)\b/i, category: "Appliances" },
  { pattern: /\b(microwave|oven)\b/i, category: "Appliances" },
  { pattern: /\b(vacuum|cleaner|robot\s*vacuum)\b/i, category: "Appliances" },
  { pattern: /\b(router|modem|mesh|wifi)\b/i, category: "Networking" },
  { pattern: /\b(keyboard|mouse|gaming)\b/i, category: "Peripherals" },
  { pattern: /\b(printer|scanner)\b/i, category: "Printers" },
  { pattern: /\b(ssd|hdd|hard\s*drive|storage|usb|flash\s*drive)\b/i, category: "Storage" },
  { pattern: /\b(ram|memory|ddr)\b/i, category: "Components" },
  { pattern: /\b(gpu|graphics\s*card)\b/i, category: "Components" },
  { pattern: /\b(processor|cpu)\b/i, category: "Components" },
  { pattern: /\b(shoe|sneaker|running|boot)\b/i, category: "Footwear" },
  { pattern: /\b(shirt|tshirt|t-shirt|jacket|hoodie)\b/i, category: "Clothing" },
  { pattern: /\b(trimmer|shaver|groomer)\b/i, category: "Personal Care" },
  { pattern: /\b(iron|mixer|grinder|blender|juicer)\b/i, category: "Kitchen" },
];

/** Extract the brand from a title */
export function extractBrand(title: string, hintBrand?: string | null): string | null {
  // If a hint is provided, normalize it
  if (hintBrand) {
    const normalized = BRAND_ALIASES[hintBrand.toLowerCase()];
    if (normalized) return normalized;
    return hintBrand;
  }

  // Try to find brand in title
  const lowerTitle = title.toLowerCase();
  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    if (regex.test(lowerTitle)) {
      return canonical;
    }
  }

  // Fallback: first word is often the brand
  const firstWord = title.split(/\s+/)[0];
  if (firstWord && firstWord.length > 1) {
    const normalized = BRAND_ALIASES[firstWord.toLowerCase()];
    if (normalized) return normalized;
  }

  return null;
}

/** Extract model number/name from title */
export function extractModel(
  title: string,
  brand: string | null,
): string | null {
  if (!title) return null;

  let cleaned = title;

  // Remove brand
  if (brand) {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegex(brand)}\\b`, "gi"), "");
  }

  // Remove parenthetical content but preserve the content before
  cleaned = cleaned
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(
      /\b(with|for|and|the|new|latest|best|buy|online|price|offer|sale|discount|off|cell\s*phone|smartphone|wireless|headphones?|earbuds?|laptop|tablet|monitor|keyboard|mouse|speaker)\b/gi,
      " ",
    )
    .replace(/\s{2,}/g, " ")
    .trim();

  // MODEL_SUFFIX captures common product line suffixes
  const SUFFIX = "(?:\\s+(?:Pro|Plus|Max|Ultra|Lite|SE|FE|Mini|Note|Edge|Neo|Fold|Flip|Slim|Air))*";

  // Try well-known product families first (order matters — most specific first)
  const familyPatterns = [
    // e.g., "WH-1000XM5", "MDR-7506", "RTX 4090"
    new RegExp(`([A-Z]{2,4}-\\d{2,5}[A-Z]*\\d*)`, "i"),
    // e.g., "Galaxy S25 FE", "Galaxy Z Fold 6"
    new RegExp(`(Galaxy\\s+[A-Z]\\w*\\s*\\d+${SUFFIX})`, "i"),
    // e.g., "iPhone 16 Pro Max"
    new RegExp(`(iPhone\\s+\\d+${SUFFIX})`, "i"),
    // e.g., "Pixel 9 Pro"
    new RegExp(`(Pixel\\s+\\d+[a-z]?${SUFFIX})`, "i"),
    // e.g., "MacBook Air M3", "MacBook Pro 16"
    new RegExp(`(MacBook\\s+(?:Air|Pro)\\s*M?\\d*)`, "i"),
    // e.g., "iPad Pro M4", "iPad Air"
    new RegExp(`(iPad\\s+(?:Pro|Air|Mini)?\\s*M?\\d*)`, "i"),
    // e.g., "Surface Pro 10", "Surface Laptop 6"
    new RegExp(`(Surface\\s+\\w+\\s*\\d*)`, "i"),
    // e.g., "ThinkPad X1 Carbon Gen 12"
    new RegExp(`(ThinkPad\\s+\\w+\\s*\\w*\\s*(?:Gen\\s*\\d+)?)`, "i"),
    // e.g., "Redmi Note 13 Pro"
    new RegExp(`(Redmi\\s+\\w+\\s*\\d+${SUFFIX})`, "i"),
    // e.g., "OnePlus 12", "OnePlus Nord CE 4"
    new RegExp(`((?:OnePlus|Nord)\\s+\\w*\\s*\\d*${SUFFIX})`, "i"),
    // Generic: Letter(s)+Number pattern with optional suffix, e.g., "A16", "S25 FE", "M3 Pro"
    new RegExp(`([A-Z]\\d{1,4}${SUFFIX})`, "i"),
  ];

  for (const pattern of familyPatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1] && match[1].trim().length > 2) {
      return match[1].replace(/\s+/g, " ").trim();
    }
  }

  // Fallback: take the first meaningful words (product family keywords)
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1 && !/^\d+(?:GB|TB|MP|mAh|W|Hz)$/i.test(w));
  return words.slice(0, 4).join(" ") || null;
}

/** Detect product category from title */
export function detectCategory(title: string): string | null {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(title)) return category;
  }
  return null;
}

/** Build a canonical title from extracted parts */
export function buildCanonicalTitle(
  originalTitle: string,
  brand: string | null,
  model: string | null,
): string {
  // Remove excessive marketing fluff
  let canonical = originalTitle
    .replace(/\b(buy|online|best|price|offer|sale|discount|off|limited|new|latest)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Cap at 150 chars
  if (canonical.length > 150) {
    canonical = canonical.substring(0, 147) + "...";
  }

  return canonical || originalTitle;
}

/**
 * Compute similarity between two product titles.
 * Returns a score between 0 and 1.
 */
export function titleSimilarity(title1: string, title2: string): number {
  const words1 = tokenize(title1);
  const words2 = tokenize(title2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Jaccard similarity
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Weighted bonus for matching key identifiers
  let identifierBonus = 0;
  const keyPatterns = [
    /[A-Z]{2,4}[-]?\d{3,5}[A-Z]?\d{0,2}/gi, // Model numbers
    /\d{3,4}\s*(?:gb|tb|mb)/gi, // Storage sizes
    /\d+\s*(?:inch|"|cm|mm)/gi, // Screen sizes
  ];

  for (const pattern of keyPatterns) {
    const matches1 = title1.match(pattern) || [];
    const matches2 = title2.match(pattern) || [];
    for (const m1 of matches1) {
      for (const m2 of matches2) {
        if (m1.toLowerCase() === m2.toLowerCase()) {
          identifierBonus += 0.15;
        }
      }
    }
  }

  return Math.min(1, jaccard + identifierBonus);
}

/**
 * Extract variant information (storage, RAM, color, size, etc.) from title.
 */
export function extractVariant(title: string): string | null {
  const variants: string[] = [];

  // Storage (e.g., 128GB, 256GB, 1TB, 512 GB)
  const storageMatch = title.match(/\b(\d{2,4}\s*(?:GB|TB|gb|tb))\b/i);
  if (storageMatch) variants.push(storageMatch[1].replace(/\s+/g, "").toUpperCase());

  // RAM (e.g., 8GB RAM, 16 GB RAM)
  const ramMatch = title.match(/\b(\d{1,3}\s*GB)\s*RAM\b/i);
  if (ramMatch) variants.push(ramMatch[1].replace(/\s+/g, "") + " RAM");

  // Screen size (e.g., 15.6 inch, 55", 6.7-inch)
  const screenMatch = title.match(/\b([\d.]+)\s*[-]?\s*(?:inch|"|''|in)\b/i);
  if (screenMatch) variants.push(`${screenMatch[1]}"`);

  // Color (common color keywords)
  const colorMatch = title.match(
    /\b(black|white|silver|gold|blue|red|green|purple|grey|gray|pink|midnight|starlight|titanium|graphite|phantom|cosmic|arctic|onyx|ivory|cream|jet\s*black|space\s*grey|space\s*gray|natural\s*titanium|desert\s*titanium)\b/i
  );
  if (colorMatch) variants.push(colorMatch[1]);

  return variants.length > 0 ? variants.join(", ") : null;
}

/**
 * Extract product family/line (e.g., "Galaxy S", "iPhone", "MacBook Air").
 */
export function extractProductFamily(title: string, brand: string | null): string | null {
  const familyPatterns: Array<{ pattern: RegExp; family: string }> = [
    // Apple
    { pattern: /\b(iPhone)\s*\d*/i, family: "iPhone" },
    { pattern: /\b(iPad)\s*(Pro|Air|Mini)?/i, family: "iPad" },
    { pattern: /\b(MacBook)\s*(Air|Pro)?/i, family: "MacBook" },
    { pattern: /\b(Apple\s*Watch)\s*(Series|Ultra|SE)?/i, family: "Apple Watch" },
    { pattern: /\b(AirPods)\s*(Pro|Max)?/i, family: "AirPods" },
    // Samsung
    { pattern: /\b(Galaxy)\s*(S|A|M|F|Z\s*Fold|Z\s*Flip|Tab|Note|Buds)/i, family: "Galaxy" },
    // Google
    { pattern: /\b(Pixel)\s*\d*/i, family: "Pixel" },
    // OnePlus
    { pattern: /\b(OnePlus)\s*\d*/i, family: "OnePlus" },
    // Sony
    { pattern: /\b(WH-\d+|WF-\d+|PlayStation|Xperia)/i, family: "$1" },
    // Laptops
    { pattern: /\b(ThinkPad|IdeaPad|Yoga)\s*[A-Z]?\d*/i, family: "$1" },
    { pattern: /\b(Inspiron|Latitude|XPS|Vostro)\b/i, family: "$1" },
    { pattern: /\b(Pavilion|Envy|Spectre|Omen|EliteBook|ProBook)\b/i, family: "$1" },
    { pattern: /\b(VivoBook|ZenBook|ROG|TUF)\b/i, family: "$1" },
    { pattern: /\b(Surface)\s*(Pro|Laptop|Go|Book|Studio)?/i, family: "Surface" },
    // TVs
    { pattern: /\b(OLED|QLED|Neo\s*QLED|NanoCell|Crystal\s*UHD)\b/i, family: "$1" },
    // Gaming
    { pattern: /\b(PlayStation\s*\d|PS\d|Xbox\s*Series\s*[XS]?|Nintendo\s*Switch)\b/i, family: "$1" },
  ];

  for (const { pattern, family } of familyPatterns) {
    const match = title.match(pattern);
    if (match) {
      return family.startsWith("$") ? match[1] : family;
    }
  }

  return null;
}

/**
 * Extract SKU or MPN patterns from title or supplementary data.
 */
export function extractSku(title: string): string | null {
  // Common SKU patterns: alphanumeric codes like B09V3KXJPB, SM-S926B, MWP22HN/A
  const skuPatterns = [
    /\b([A-Z]{1,3}\d{2,4}[A-Z]{1,3}(?:\/[A-Z])?\b)/i,    // e.g., MWP22HN/A
    /\b(SM-[A-Z]\d{3,4}[A-Z]?)\b/i,                         // Samsung model e.g., SM-S926B
    /\b([A-Z]\d{4}[A-Z]{2,3})\b/i,                           // e.g., A2894LL
    /\b(B0[A-Z0-9]{8,9})\b/,                                  // Amazon ASIN pattern
  ];

  for (const pattern of skuPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Build a product fingerprint key for cache and deduplication.
 */
function buildFingerprintKey(brand: string | null, model: string | null, variant: string | null): string {
  const parts: string[] = [];
  if (brand) parts.push(brand.toLowerCase());
  if (model) parts.push(model.toLowerCase().replace(/\s+/g, "-"));
  if (variant) parts.push(variant.toLowerCase().replace(/[\s,]+/g, "-"));
  return parts.join(":") || "unknown";
}

/**
 * Build a full product fingerprint from extraction results.
 */
export function buildFingerprint(
  brand: string | null,
  model: string | null,
  category: string | null,
  title: string,
  hintGtin?: string | null,
  hintAsin?: string | null,
): ProductFingerprint {
  const variant = extractVariant(title);
  const productFamily = extractProductFamily(title, brand);
  const sku = extractSku(title);

  return {
    brand,
    model,
    productFamily,
    variant,
    category,
    sku,
    mpn: sku, // MPN often same as SKU for consumer electronics
    gtin: hintGtin ?? null,
    asin: hintAsin ?? null,
    fingerprintKey: buildFingerprintKey(brand, model, variant),
  };
}

/**
 * Full product normalization pipeline.
 */
export function normalizeProduct(
  title: string,
  hintBrand?: string | null,
  hintGtin?: string | null,
  hintAsin?: string | null,
): NormalizedProduct {
  const brand = extractBrand(title, hintBrand);
  const model = extractModel(title, brand);
  const category = detectCategory(title);
  const canonicalTitle = buildCanonicalTitle(title, brand, model);
  const sku = extractSku(title);
  const fingerprint = buildFingerprint(brand, model, category, title, hintGtin, hintAsin);

  // Confidence scoring
  let confidence = 0.5; // Base
  if (brand) confidence += 0.15;
  if (model) confidence += 0.15;
  if (hintGtin) confidence += 0.1;
  if (hintAsin) confidence += 0.05;
  if (category) confidence += 0.05;
  if (fingerprint.variant) confidence += 0.05;
  if (fingerprint.productFamily) confidence += 0.05;

  return {
    brand,
    model,
    category,
    canonicalTitle,
    identifiers: {
      gtin: hintGtin ?? null,
      asin: hintAsin ?? null,
      modelNumber: model,
      sku: sku,
      mpn: sku,
    },
    fingerprint,
    confidence: Math.min(1, confidence),
  };
}

/**
 * Build a marketplace-optimized search query from a fingerprint.
 * This produces a search string that works well across different marketplaces.
 */
export function buildSearchQueryFromFingerprint(fp: ProductFingerprint): string {
  const parts: string[] = [];
  if (fp.brand) parts.push(fp.brand);
  if (fp.model) parts.push(fp.model);
  if (fp.variant) {
    // Only add storage/RAM to search, not color
    const variantParts = fp.variant.split(",").map(v => v.trim());
    for (const vp of variantParts) {
      if (/\d+\s*(GB|TB|RAM|")/i.test(vp)) parts.push(vp);
    }
  }
  return parts.join(" ").trim();
}

/**
 * Score how well two product fingerprints match.
 * Returns 0–1 with weighted scoring.
 */
export function fingerprintSimilarity(fp1: ProductFingerprint, fp2: ProductFingerprint): number {
  let score = 0;
  let maxScore = 0;

  // GTIN match is definitive
  if (fp1.gtin && fp2.gtin) {
    if (fp1.gtin === fp2.gtin) return 1.0;
    return 0.0; // Different GTINs = different products
  }

  // Brand match (weight: 0.25)
  maxScore += 0.25;
  if (fp1.brand && fp2.brand && fp1.brand.toLowerCase() === fp2.brand.toLowerCase()) {
    score += 0.25;
  }

  // Model match (weight: 0.35)
  maxScore += 0.35;
  if (fp1.model && fp2.model) {
    const m1 = fp1.model.toLowerCase().replace(/\s+/g, "");
    const m2 = fp2.model.toLowerCase().replace(/\s+/g, "");
    if (m1 === m2) {
      score += 0.35;
    } else if (m1.includes(m2) || m2.includes(m1)) {
      score += 0.25;
    }
  }

  // Variant match (weight: 0.2)
  maxScore += 0.2;
  if (fp1.variant && fp2.variant) {
    const v1 = fp1.variant.toLowerCase();
    const v2 = fp2.variant.toLowerCase();
    if (v1 === v2) {
      score += 0.2;
    } else {
      // Check storage match specifically
      const storage1 = v1.match(/(\d+)\s*(gb|tb)/i);
      const storage2 = v2.match(/(\d+)\s*(gb|tb)/i);
      if (storage1 && storage2 && storage1[1] === storage2[1] && storage1[2].toLowerCase() === storage2[2].toLowerCase()) {
        score += 0.15;
      }
    }
  }

  // Product family match (weight: 0.1)
  maxScore += 0.1;
  if (fp1.productFamily && fp2.productFamily &&
      fp1.productFamily.toLowerCase() === fp2.productFamily.toLowerCase()) {
    score += 0.1;
  }

  // Category match (weight: 0.1)
  maxScore += 0.1;
  if (fp1.category && fp2.category && fp1.category === fp2.category) {
    score += 0.1;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

// ============================================================
// Helpers
// ============================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "it",
  "that",
  "this",
  "was",
  "are",
  "be",
  "has",
  "had",
  "have",
  "been",
  "will",
  "can",
  "may",
  "new",
  "buy",
  "online",
  "best",
  "price",
  "offer",
  "sale",
]);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
