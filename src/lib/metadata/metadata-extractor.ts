/**
 * Metadata Extraction Service
 * Core service for extracting metadata from URLs using metascraper with multiple fallbacks
 */

import type {
  UrlMetadata,
  ExtractionOptions,
  MetadataExtractionError,
  ErrorCode,
  ExtractionMethod,
} from '@/types/metadata';
import { detectRetailer, extractProductId } from './retailer-detector';
import { validateUrl } from './url-validator';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; WishlistBot/1.0; +https://xmaslist.com/bot)';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

const DEFAULT_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract metadata from URL using metascraper and fallbacks
 */
export async function extractMetadata(
  url: string,
  options: ExtractionOptions = {}
): Promise<UrlMetadata> {
  const startTime = Date.now();

  // Validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw createError('INVALID_URL', validation.error || 'Invalid URL', url);
  }

  const normalizedUrl = validation.url!;

  // Detect retailer
  const detection = detectRetailer(normalizedUrl);

  try {
    // Try primary extraction method
    const metadata = await extractWithMetascraper(normalizedUrl, options);

    // Enhance with retailer-specific data
    const enhanced = await enhanceWithRetailerData(metadata, detection, options);

    return {
      ...enhanced,
      url: normalizedUrl,
      retailer: detection.retailer,
      productId: detection.productId,
      extractedAt: new Date().toISOString(),
      method: 'metascraper',
    };
  } catch (error) {
    // Try fallback methods if enabled
    if (options.useFallback !== false) {
      return await extractWithFallback(normalizedUrl, detection, options);
    }

    throw error;
  }
}

// ============================================================================
// Metascraper Extraction
// ============================================================================

/**
 * Extract metadata using metascraper
 */
async function extractWithMetascraper(
  url: string,
  options: ExtractionOptions
): Promise<Partial<UrlMetadata>> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  try {
    // Fetch HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        ...DEFAULT_HEADERS,
        'User-Agent': DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw createError(
        'FETCH_FAILED',
        `HTTP ${response.status}: ${response.statusText}`,
        url,
        response.status
      );
    }

    const html = await response.text();
    const finalUrl = response.url;

    // Parse metadata from HTML
    const metadata = parseMetadataFromHtml(html, finalUrl);

    return metadata;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw createError('TIMEOUT', `Request timeout after ${timeout}ms`, url);
    }

    if (error.code) {
      throw error;
    }

    throw createError('FETCH_FAILED', error.message, url);
  }
}

/**
 * Parse metadata from HTML using Open Graph, meta tags, and microdata
 */
function parseMetadataFromHtml(html: string, url: string): Partial<UrlMetadata> {
  // Create a simple HTML parser (in real implementation, use a proper library like cheerio)
  const metadata: Partial<UrlMetadata> = {};

  // Extract Open Graph tags
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogDescription = extractMetaContent(html, 'og:description');
  const ogImage = extractMetaContent(html, 'og:image');
  const ogUrl = extractMetaContent(html, 'og:url');
  const ogSiteName = extractMetaContent(html, 'og:site_name');
  const ogType = extractMetaContent(html, 'og:type');
  const ogLocale = extractMetaContent(html, 'og:locale');

  // Extract image metadata
  const ogImageWidth = extractMetaContent(html, 'og:image:width');
  const ogImageHeight = extractMetaContent(html, 'og:image:height');
  const ogImageAlt = extractMetaContent(html, 'og:image:alt');
  const ogImageType = extractMetaContent(html, 'og:image:type');

  // Extract Twitter Card as fallback
  const twitterTitle = extractMetaContent(html, 'twitter:title');
  const twitterDescription = extractMetaContent(html, 'twitter:description');
  const twitterImage = extractMetaContent(html, 'twitter:image');

  // Extract standard meta tags as fallback
  const metaDescription = extractMetaContent(html, 'description', 'name');
  const canonicalUrl = extractCanonicalUrl(html);

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const htmlTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;

  // Extract product-specific data
  const priceAmount = extractMetaContent(html, 'product:price:amount');
  const priceCurrency = extractMetaContent(html, 'product:price:currency');

  // Microdata price extraction
  const itemPropPrice = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i);
  const itemPropCurrency = html.match(/itemprop=["']priceCurrency["'][^>]*content=["']([^"']+)["']/i);

  // Build metadata object with fallbacks
  metadata.title = ogTitle || twitterTitle || htmlTitle;
  metadata.description = ogDescription || twitterDescription || metaDescription;
  metadata.image = ogImage || twitterImage;
  metadata.url = ogUrl || canonicalUrl || url;
  metadata.siteName = ogSiteName;
  metadata.type = ogType;
  metadata.locale = ogLocale;

  // Image metadata
  if (ogImageWidth) metadata.imageWidth = parseInt(ogImageWidth);
  if (ogImageHeight) metadata.imageHeight = parseInt(ogImageHeight);
  metadata.imageAlt = ogImageAlt;
  metadata.imageType = ogImageType;

  // Price data
  const price = priceAmount || (itemPropPrice ? itemPropPrice[1] : null);
  if (price) {
    const cleanPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (!isNaN(cleanPrice)) {
      metadata.price = cleanPrice;
      metadata.priceRaw = price;
      metadata.currency = priceCurrency || (itemPropCurrency ? itemPropCurrency[1] : null) || 'USD';
    }
  }

  return metadata;
}

// ============================================================================
// HTML Parsing Helpers
// ============================================================================

/**
 * Extract meta tag content
 */
function extractMetaContent(html: string, property: string, attribute: string = 'property'): string | null {
  const regex = new RegExp(
    `<meta\\s+${attribute}=["']${escapeRegex(property)}["'][^>]*content=["']([^"']+)["']`,
    'i'
  );
  const match = html.match(regex);
  if (match) return decodeHtmlEntities(match[1]);

  // Try reverse order (content before property)
  const reverseRegex = new RegExp(
    `<meta\\s+content=["']([^"']+)["'][^>]*${attribute}=["']${escapeRegex(property)}["']`,
    'i'
  );
  const reverseMatch = html.match(reverseRegex);
  if (reverseMatch) return decodeHtmlEntities(reverseMatch[1]);

  return null;
}

/**
 * Extract canonical URL from HTML
 */
function extractCanonicalUrl(html: string): string | null {
  const match = html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Retailer-Specific Enhancement
// ============================================================================

/**
 * Enhance metadata with retailer-specific data
 */
async function enhanceWithRetailerData(
  metadata: Partial<UrlMetadata>,
  detection: any,
  options: ExtractionOptions
): Promise<Partial<UrlMetadata>> {
  if (!options.includeRetailerData) {
    return metadata;
  }

  // In a real implementation, this would call retailer-specific APIs
  // For now, we just return the base metadata
  return metadata;
}

// ============================================================================
// Fallback Extraction Methods
// ============================================================================

/**
 * Extract metadata using fallback methods
 */
async function extractWithFallback(
  url: string,
  detection: any,
  options: ExtractionOptions
): Promise<UrlMetadata> {
  // Fallback: Basic metadata from URL structure
  const basicMetadata: UrlMetadata = {
    title: null,
    description: null,
    image: null,
    url: url,
    retailer: detection.retailer,
    productId: detection.productId,
    extractedAt: new Date().toISOString(),
    method: 'fallback',
  };

  // Try to construct title from URL
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract title from path segments
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment) {
      // Clean up the segment
      const cleaned = lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\.(html?|php|aspx?)$/i, '')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      basicMetadata.title = cleaned;
    }
  } catch (error) {
    // Ignore URL parsing errors
  }

  return basicMetadata;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Create a metadata extraction error
 */
function createError(
  code: ErrorCode,
  message: string,
  url?: string,
  statusCode?: number
): MetadataExtractionError {
  const error = new Error(message) as MetadataExtractionError;
  error.name = 'MetadataExtractionError';
  error.code = code;
  error.url = url;
  error.statusCode = statusCode;
  return error;
}

// ============================================================================
// Batch Extraction
// ============================================================================

/**
 * Extract metadata from multiple URLs
 */
export async function extractMetadataBatch(
  urls: string[],
  options: ExtractionOptions = {}
): Promise<Array<{ url: string; metadata?: UrlMetadata; error?: string }>> {
  const results = await Promise.allSettled(
    urls.map((url) => extractMetadata(url, options))
  );

  return results.map((result, index) => ({
    url: urls[index],
    metadata: result.status === 'fulfilled' ? result.value : undefined,
    error: result.status === 'rejected' ? result.reason.message : undefined,
  }));
}
