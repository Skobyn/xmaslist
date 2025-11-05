/**
 * URL Validation Utility
 * Validates and normalizes URLs for metadata extraction
 */

import type { UrlValidationResult, ValidationRules } from '@/types/metadata';

// ============================================================================
// Default Validation Rules
// ============================================================================

const DEFAULT_RULES: ValidationRules = {
  allowedProtocols: ['http:', 'https:'],
  maxUrlLength: 2048,
  requireHttps: false,
  blockedDomains: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'file://',
  ],
};

// ============================================================================
// URL Validation Functions
// ============================================================================

/**
 * Validate and normalize URL
 */
export function validateUrl(
  urlString: string,
  rules: Partial<ValidationRules> = {}
): UrlValidationResult {
  const mergedRules = { ...DEFAULT_RULES, ...rules };
  const warnings: string[] = [];

  // Basic string validation
  if (!urlString || typeof urlString !== 'string') {
    return {
      valid: false,
      error: 'URL must be a non-empty string',
    };
  }

  // Check length
  if (urlString.length > mergedRules.maxUrlLength) {
    return {
      valid: false,
      error: `URL exceeds maximum length of ${mergedRules.maxUrlLength} characters`,
    };
  }

  // Try to parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString.trim());
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  // Validate protocol
  if (!mergedRules.allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      valid: false,
      error: `Protocol ${parsedUrl.protocol} is not allowed. Allowed protocols: ${mergedRules.allowedProtocols.join(', ')}`,
    };
  }

  // Check HTTPS requirement
  if (mergedRules.requireHttps && parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      error: 'HTTPS protocol is required',
    };
  }

  // Warn about HTTP
  if (parsedUrl.protocol === 'http:' && !mergedRules.requireHttps) {
    warnings.push('Using HTTP instead of HTTPS may be less secure');
  }

  // Check blocked domains
  const hostname = parsedUrl.hostname.toLowerCase();
  if (mergedRules.blockedDomains) {
    for (const blocked of mergedRules.blockedDomains) {
      if (hostname.includes(blocked.toLowerCase())) {
        return {
          valid: false,
          error: `Domain ${blocked} is blocked`,
        };
      }
    }
  }

  // Check allowed domains (if specified)
  if (mergedRules.allowedDomains && mergedRules.allowedDomains.length > 0) {
    const isAllowed = mergedRules.allowedDomains.some((domain) =>
      hostname.includes(domain.toLowerCase())
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: `Domain not in allowed list: ${mergedRules.allowedDomains.join(', ')}`,
      };
    }
  }

  // Check for suspicious patterns
  if (hostname.match(/\d+\.\d+\.\d+\.\d+/)) {
    warnings.push('URL uses IP address instead of domain name');
  }

  // Normalize URL
  const normalizedUrl = normalizeUrl(parsedUrl);

  return {
    valid: true,
    url: normalizedUrl,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Normalize URL to standard format
 */
export function normalizeUrl(url: URL | string): string {
  const parsed = typeof url === 'string' ? new URL(url) : url;

  // Remove tracking parameters
  const cleanParams = removeTrackingParams(parsed.searchParams);

  // Rebuild URL
  const normalized = new URL(parsed.origin + parsed.pathname);

  // Add back clean parameters
  cleanParams.forEach((value, key) => {
    normalized.searchParams.append(key, value);
  });

  // Remove trailing slash
  let finalUrl = normalized.href;
  if (finalUrl.endsWith('/') && finalUrl.split('/').length > 3) {
    finalUrl = finalUrl.slice(0, -1);
  }

  return finalUrl;
}

/**
 * Remove tracking parameters from URL
 */
export function removeTrackingParams(searchParams: URLSearchParams): URLSearchParams {
  const trackingParams = [
    // Generic tracking
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid',

    // Social media
    'ref', 'ref_', 'referrer', 'referral', 'source',

    // Amazon specific
    'tag', 'linkCode', 'creativeASIN', 'creative', 'linkId',
    'psc', 'pd_rd_', 'content-id', 'crid', 'sprefix',

    // Other retailers
    'sxpkg', 'ppid', 'sid',
  ];

  const cleaned = new URLSearchParams();

  searchParams.forEach((value, key) => {
    // Keep parameter if it's not a tracking param
    const isTracking = trackingParams.some(
      (param) => key.toLowerCase().startsWith(param.toLowerCase())
    );

    if (!isTracking) {
      cleaned.append(key, value);
    }
  });

  return cleaned;
}

/**
 * Batch validate multiple URLs
 */
export function validateUrls(
  urls: string[],
  rules?: Partial<ValidationRules>
): Array<UrlValidationResult & { originalUrl: string }> {
  return urls.map((url) => ({
    originalUrl: url,
    ...validateUrl(url, rules),
  }));
}

/**
 * Check if URL is likely a product page
 */
export function isProductUrl(url: string): boolean {
  const productPatterns = [
    /\/dp\//i,         // Amazon
    /\/product\//i,    // Generic
    /\/p\//i,          // Target, Walmart
    /\/ip\//i,         // Walmart
    /\/listing\//i,    // Etsy
    /\/item\//i,       // eBay
    /\/pd\//i,         // Wayfair
    /\.html/i,         // Various retailers
  ];

  return productPatterns.some((pattern) => pattern.test(url));
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if two URLs point to the same resource
 */
export function isSameResource(url1: string, url2: string): boolean {
  try {
    const normalized1 = normalizeUrl(url1);
    const normalized2 = normalizeUrl(url2);
    return normalized1 === normalized2;
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for safe storage/display
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove credentials if present
    parsed.username = '';
    parsed.password = '';

    // Remove hash
    parsed.hash = '';

    return normalizeUrl(parsed);
  } catch {
    return url;
  }
}
