/**
 * TypeScript types for URL metadata extraction
 * Based on research recommendations for Open Graph, product data, and retailer-specific formats
 */

// ============================================================================
// Core Metadata Types
// ============================================================================

/**
 * Standard metadata extracted from any URL
 * Follows Open Graph Protocol and extends with product-specific fields
 */
export interface UrlMetadata {
  // Open Graph Core Properties
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;

  // Extended OG Properties
  siteName?: string | null;
  locale?: string | null;
  type?: string | null; // e.g., "product", "article", "website"

  // Image Details
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageAlt?: string | null;
  imageType?: string | null;

  // Product-Specific Fields
  price?: number | null;
  priceRaw?: string | null;
  currency?: string | null;

  // Additional Metadata
  author?: string | null;
  date?: string | null;
  logo?: string | null;
  publisher?: string | null;

  // Retailer Information
  retailer?: RetailerType;
  productId?: string | null; // ASIN, TCIN, SKU, etc.

  // Cache & Extraction Info
  cached?: boolean;
  extractedAt?: string;
  method?: ExtractionMethod;
}

/**
 * Supported retailer types
 */
export type RetailerType =
  | 'amazon'
  | 'target'
  | 'walmart'
  | 'etsy'
  | 'bestbuy'
  | 'wayfair'
  | 'unknown';

/**
 * Extraction methods used
 */
export type ExtractionMethod =
  | 'metascraper'
  | 'open-graph'
  | 'retailer-api'
  | 'html-parse'
  | 'fallback';

// ============================================================================
// Retailer-Specific Types
// ============================================================================

/**
 * Amazon-specific product metadata
 */
export interface AmazonProductMetadata extends UrlMetadata {
  retailer: 'amazon';
  productId: string; // ASIN
  asin: string;
  features?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  primeEligible?: boolean;
}

/**
 * Target-specific product metadata
 */
export interface TargetProductMetadata extends UrlMetadata {
  retailer: 'target';
  productId: string; // TCIN
  tcin: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  quantityAvailable?: number;
}

/**
 * Walmart-specific product metadata
 */
export interface WalmartProductMetadata extends UrlMetadata {
  retailer: 'walmart';
  productId: string; // usItemId
  usItemId: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
}

/**
 * Union type for all retailer-specific metadata
 */
export type RetailerProductMetadata =
  | AmazonProductMetadata
  | TargetProductMetadata
  | WalmartProductMetadata
  | UrlMetadata;

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for single URL extraction
 */
export interface ExtractMetadataRequest {
  url: string;
  options?: ExtractionOptions;
}

/**
 * Request body for batch URL extraction
 */
export interface BatchExtractMetadataRequest {
  urls: string[];
  options?: ExtractionOptions;
}

/**
 * Options for metadata extraction
 */
export interface ExtractionOptions {
  /** Force refresh cache */
  forceRefresh?: boolean;

  /** Include retailer-specific data */
  includeRetailerData?: boolean;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Use fallback methods if primary fails */
  useFallback?: boolean;

  /** Extract additional product details */
  extractProductDetails?: boolean;
}

/**
 * Success response for single URL extraction
 */
export interface ExtractMetadataResponse {
  success: true;
  data: UrlMetadata;
  cached: boolean;
  processingTime: number; // milliseconds
}

/**
 * Error response for single URL extraction
 */
export interface ExtractMetadataError {
  success: false;
  error: string;
  code: ErrorCode;
  details?: string;
}

/**
 * Response for batch extraction
 */
export interface BatchExtractMetadataResponse {
  success: boolean;
  results: BatchExtractionResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    processingTime: number;
  };
}

/**
 * Individual result in batch extraction
 */
export interface BatchExtractionResult {
  url: string;
  success: boolean;
  data?: UrlMetadata;
  error?: string;
  cached?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for metadata extraction
 */
export enum ErrorCode {
  INVALID_URL = 'INVALID_URL',
  FETCH_FAILED = 'FETCH_FAILED',
  PARSE_FAILED = 'PARSE_FAILED',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  BLOCKED = 'BLOCKED',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
}

/**
 * Detailed error information
 */
export interface MetadataExtractionError extends Error {
  code: ErrorCode;
  url?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry for metadata
 */
export interface MetadataCacheEntry {
  url: string;
  metadata: UrlMetadata;
  createdAt: string;
  expiresAt: string;
  hits: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** TTL in seconds */
  ttl: number;

  /** Key prefix */
  prefix: string;

  /** Enable compression */
  compress?: boolean;
}

// ============================================================================
// Retailer Detection Types
// ============================================================================

/**
 * Retailer detection result
 */
export interface RetailerDetectionResult {
  retailer: RetailerType;
  productId: string | null;
  confidence: number; // 0-1
  patterns: {
    domain: boolean;
    urlStructure: boolean;
    productIdFormat: boolean;
  };
}

/**
 * URL patterns for retailer detection
 */
export interface RetailerPattern {
  retailer: RetailerType;
  domains: RegExp[];
  productIdPattern: RegExp;
  urlStructurePattern: RegExp;
  apiEndpoint?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Overall service configuration
 */
export interface MetadataServiceConfig {
  cache: {
    enabled: boolean;
    ttl: number;
    redisUrl?: string;
  };

  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };

  extraction: {
    timeout: number;
    maxRetries: number;
    userAgent: string;
  };

  retailers: {
    [key in RetailerType]?: {
      enabled: boolean;
      apiKey?: string;
      customParser?: boolean;
    };
  };
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * URL validation result
 */
export interface UrlValidationResult {
  valid: boolean;
  url?: string; // normalized URL
  error?: string;
  warnings?: string[];
}

/**
 * Validation rules
 */
export interface ValidationRules {
  allowedProtocols: string[];
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxUrlLength: number;
  requireHttps?: boolean;
}

// ============================================================================
// Stats & Monitoring Types
// ============================================================================

/**
 * Extraction statistics
 */
export interface ExtractionStats {
  totalRequests: number;
  successfulExtractions: number;
  failedExtractions: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  errorsByCode: Record<ErrorCode, number>;
  requestsByRetailer: Record<RetailerType, number>;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  extractionTime: number;
  fetchTime: number;
  parseTime: number;
  cacheTime: number;
  totalTime: number;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for Amazon metadata
 */
export function isAmazonMetadata(metadata: UrlMetadata): metadata is AmazonProductMetadata {
  return metadata.retailer === 'amazon' && 'asin' in metadata;
}

/**
 * Type guard for Target metadata
 */
export function isTargetMetadata(metadata: UrlMetadata): metadata is TargetProductMetadata {
  return metadata.retailer === 'target' && 'tcin' in metadata;
}

/**
 * Type guard for Walmart metadata
 */
export function isWalmartMetadata(metadata: UrlMetadata): metadata is WalmartProductMetadata {
  return metadata.retailer === 'walmart' && 'usItemId' in metadata;
}

/**
 * Type guard for error response
 */
export function isExtractMetadataError(
  response: ExtractMetadataResponse | ExtractMetadataError
): response is ExtractMetadataError {
  return !response.success;
}
