/**
 * Retailer Detection Utility
 * Identifies retailer from URL and extracts product identifiers
 */

import type { RetailerType, RetailerDetectionResult, RetailerPattern } from '@/types/metadata';

// ============================================================================
// Retailer Patterns
// ============================================================================

const RETAILER_PATTERNS: RetailerPattern[] = [
  {
    retailer: 'amazon',
    domains: [
      /amazon\.(com|ca|co\.uk|de|fr|it|es|jp|cn|in|com\.au|com\.mx|com\.br)/i,
      /amzn\.(to|com)/i,
    ],
    productIdPattern: /\/(?:dp|gp\/product|product|ASIN)\/([A-Z0-9]{10})/i,
    urlStructurePattern: /\/(dp|gp\/product|product|ASIN)\//i,
  },
  {
    retailer: 'target',
    domains: [/target\.com/i],
    productIdPattern: /\/A-(\d{8,})/i,
    urlStructurePattern: /\/p\/[^/]*\/-\/A-\d+/i,
  },
  {
    retailer: 'walmart',
    domains: [/walmart\.com/i],
    productIdPattern: /\/ip\/[^/]+\/(\d+)/i,
    urlStructurePattern: /\/ip\//i,
  },
  {
    retailer: 'etsy',
    domains: [/etsy\.com/i],
    productIdPattern: /\/listing\/(\d+)/i,
    urlStructurePattern: /\/listing\//i,
  },
  {
    retailer: 'bestbuy',
    domains: [/bestbuy\.com/i],
    productIdPattern: /\/site\/[^/]*\/(\d+)\.p/i,
    urlStructurePattern: /\/site\//i,
  },
  {
    retailer: 'wayfair',
    domains: [/wayfair\.com/i],
    productIdPattern: /\/[^/]+-([A-Z0-9]+)\.html/i,
    urlStructurePattern: /\/[^/]+-[A-Z0-9]+\.html/i,
  },
];

// ============================================================================
// Retailer Detection Functions
// ============================================================================

/**
 * Detect retailer from URL
 */
export function detectRetailer(url: string): RetailerDetectionResult {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    for (const pattern of RETAILER_PATTERNS) {
      // Check domain match
      const domainMatch = pattern.domains.some((regex) => regex.test(hostname));
      if (!domainMatch) continue;

      // Extract product ID
      const productIdMatch = url.match(pattern.productIdPattern);
      const productId = productIdMatch ? productIdMatch[1] : null;

      // Check URL structure
      const structureMatch = pattern.urlStructurePattern.test(url);

      // Calculate confidence score
      let confidence = 0;
      if (domainMatch) confidence += 0.5;
      if (productId) confidence += 0.3;
      if (structureMatch) confidence += 0.2;

      return {
        retailer: pattern.retailer,
        productId,
        confidence,
        patterns: {
          domain: domainMatch,
          urlStructure: structureMatch,
          productIdFormat: productId !== null,
        },
      };
    }

    // Unknown retailer
    return {
      retailer: 'unknown',
      productId: null,
      confidence: 0,
      patterns: {
        domain: false,
        urlStructure: false,
        productIdFormat: false,
      },
    };
  } catch (error) {
    return {
      retailer: 'unknown',
      productId: null,
      confidence: 0,
      patterns: {
        domain: false,
        urlStructure: false,
        productIdFormat: false,
      },
    };
  }
}

/**
 * Extract Amazon ASIN from URL
 */
export function extractAmazonASIN(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract Target TCIN from URL
 */
export function extractTargetTCIN(url: string): string | null {
  const patterns = [
    /\/A-(\d{8,})/i,
    /tcin=(\d{8,})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract Walmart product ID from URL
 */
export function extractWalmartProductId(url: string): string | null {
  const patterns = [
    /\/ip\/[^/]+\/(\d+)/i,
    /\/(\d{8,})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract Etsy listing ID from URL
 */
export function extractEtsyListingId(url: string): string | null {
  const match = url.match(/\/listing\/(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Extract Best Buy SKU from URL
 */
export function extractBestBuySKU(url: string): string | null {
  const match = url.match(/\/site\/[^/]*\/(\d+)\.p/i);
  return match ? match[1] : null;
}

/**
 * Extract product ID for any retailer
 */
export function extractProductId(url: string, retailer?: RetailerType): string | null {
  const detected = retailer || detectRetailer(url).retailer;

  switch (detected) {
    case 'amazon':
      return extractAmazonASIN(url);
    case 'target':
      return extractTargetTCIN(url);
    case 'walmart':
      return extractWalmartProductId(url);
    case 'etsy':
      return extractEtsyListingId(url);
    case 'bestbuy':
      return extractBestBuySKU(url);
    default:
      return null;
  }
}

/**
 * Check if URL is a supported retailer
 */
export function isSupportedRetailer(url: string): boolean {
  const result = detectRetailer(url);
  return result.retailer !== 'unknown' && result.confidence >= 0.5;
}

/**
 * Get retailer display name
 */
export function getRetailerDisplayName(retailer: RetailerType): string {
  const names: Record<RetailerType, string> = {
    amazon: 'Amazon',
    target: 'Target',
    walmart: 'Walmart',
    etsy: 'Etsy',
    bestbuy: 'Best Buy',
    wayfair: 'Wayfair',
    unknown: 'Unknown Retailer',
  };

  return names[retailer];
}

/**
 * Get retailer API endpoint (if available)
 */
export function getRetailerApiEndpoint(retailer: RetailerType, productId: string): string | null {
  switch (retailer) {
    case 'target':
      return `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?tcin=${productId}`;
    case 'walmart':
      return `https://www.walmart.com/ip/${productId}`;
    default:
      return null;
  }
}

/**
 * Normalize product URL to canonical format
 */
export function normalizeProductUrl(url: string): string {
  const detection = detectRetailer(url);

  if (!detection.productId) return url;

  switch (detection.retailer) {
    case 'amazon':
      return `https://www.amazon.com/dp/${detection.productId}`;
    case 'target':
      return `https://www.target.com/p/-/A-${detection.productId}`;
    case 'walmart':
      return `https://www.walmart.com/ip/${detection.productId}`;
    case 'etsy':
      return `https://www.etsy.com/listing/${detection.productId}`;
    case 'bestbuy':
      return `https://www.bestbuy.com/site/${detection.productId}.p`;
    default:
      return url;
  }
}
