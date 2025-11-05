/**
 * Metadata Extraction Library - Main Export
 * Centralized exports for all metadata extraction functionality
 */

// Types
export * from '@/types/metadata';

// Core extraction
export { extractMetadata, extractMetadataBatch } from './metadata-extractor';

// Retailer detection
export {
  detectRetailer,
  extractAmazonASIN,
  extractTargetTCIN,
  extractWalmartProductId,
  extractEtsyListingId,
  extractBestBuySKU,
  extractProductId,
  isSupportedRetailer,
  getRetailerDisplayName,
  getRetailerApiEndpoint,
  normalizeProductUrl,
} from './retailer-detector';

// URL validation
export {
  validateUrl,
  validateUrls,
  normalizeUrl,
  removeTrackingParams,
  isProductUrl,
  extractDomain,
  isSameResource,
  sanitizeUrl,
} from './url-validator';

// Cache
export {
  MetadataCache,
  CacheStats,
  getCache,
  getCacheStats,
} from './cache';
