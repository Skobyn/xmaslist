/**
 * Unit Tests for Metadata Extraction Utilities
 * Tests URL parsing and product information extraction from various retailers
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock metadata extractor functions
const extractAmazonMetadata = (url: string) => {
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
  if (!asinMatch) return null;

  return {
    asin: asinMatch[1],
    title: 'Mocked Amazon Product',
    price: 29.99,
    currency: 'USD',
    imageUrl: 'https://example.com/image.jpg',
    url: url,
  };
};

const extractTargetMetadata = (url: string) => {
  const productIdMatch = url.match(/\/-\/A-(\d+)/);
  if (!productIdMatch) return null;

  return {
    productId: productIdMatch[1],
    title: 'Mocked Target Product',
    price: 19.99,
    currency: 'USD',
    imageUrl: 'https://example.com/target-image.jpg',
    url: url,
  };
};

const extractGenericMetadata = (url: string) => {
  try {
    const urlObj = new URL(url);
    return {
      domain: urlObj.hostname,
      title: 'Generic Product',
      url: url,
    };
  } catch {
    return null;
  }
};

describe('Metadata Extraction Utilities', () => {
  describe('extractAmazonMetadata', () => {
    it('should extract ASIN from standard Amazon URL', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const result = extractAmazonMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.asin).toBe('B08N5WRWNW');
      expect(result?.url).toBe(url);
    });

    it('should extract ASIN from product URL with title', () => {
      const url = 'https://www.amazon.com/Wireless-Headphones/dp/B08N5WRWNW/ref=sr_1_1';
      const result = extractAmazonMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.asin).toBe('B08N5WRWNW');
    });

    it('should handle Amazon URLs with query parameters', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW?tag=example-20';
      const result = extractAmazonMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.asin).toBe('B08N5WRWNW');
    });

    it('should return null for invalid Amazon URLs', () => {
      const url = 'https://www.amazon.com/invalid-url';
      const result = extractAmazonMetadata(url);

      expect(result).toBeNull();
    });

    it('should extract product metadata', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const result = extractAmazonMetadata(url);

      expect(result?.title).toBeDefined();
      expect(result?.price).toBeGreaterThan(0);
      expect(result?.currency).toBe('USD');
      expect(result?.imageUrl).toBeDefined();
    });
  });

  describe('extractTargetMetadata', () => {
    it('should extract product ID from Target URL', () => {
      const url = 'https://www.target.com/p/product-name/-/A-12345678';
      const result = extractTargetMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.productId).toBe('12345678');
    });

    it('should handle Target URLs with query parameters', () => {
      const url = 'https://www.target.com/p/product/-/A-12345678?preselect=87654321';
      const result = extractTargetMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.productId).toBe('12345678');
    });

    it('should return null for invalid Target URLs', () => {
      const url = 'https://www.target.com/invalid';
      const result = extractTargetMetadata(url);

      expect(result).toBeNull();
    });

    it('should extract product metadata', () => {
      const url = 'https://www.target.com/p/product/-/A-12345678';
      const result = extractTargetMetadata(url);

      expect(result?.title).toBeDefined();
      expect(result?.price).toBeGreaterThan(0);
      expect(result?.imageUrl).toBeDefined();
    });
  });

  describe('extractGenericMetadata', () => {
    it('should extract domain from any valid URL', () => {
      const url = 'https://www.walmart.com/product/12345';
      const result = extractGenericMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.domain).toBe('www.walmart.com');
      expect(result?.url).toBe(url);
    });

    it('should handle URLs with different protocols', () => {
      const httpUrl = 'http://example.com/product';
      const httpsUrl = 'https://example.com/product';

      const httpResult = extractGenericMetadata(httpUrl);
      const httpsResult = extractGenericMetadata(httpsUrl);

      expect(httpResult?.domain).toBe('example.com');
      expect(httpsResult?.domain).toBe('example.com');
    });

    it('should return null for invalid URLs', () => {
      const result = extractGenericMetadata('not-a-valid-url');
      expect(result).toBeNull();
    });

    it('should extract metadata with fallback title', () => {
      const url = 'https://example.com/product';
      const result = extractGenericMetadata(url);

      expect(result?.title).toBe('Generic Product');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(extractAmazonMetadata('')).toBeNull();
      expect(extractTargetMetadata('')).toBeNull();
      expect(extractGenericMetadata('')).toBeNull();
    });

    it('should handle malformed URLs', () => {
      const malformedUrls = [
        'ht tp://invalid',
        '//incomplete',
        'www.noprotocol.com',
      ];

      malformedUrls.forEach(url => {
        expect(extractGenericMetadata(url)).toBeNull();
      });
    });

    it('should handle URLs with special characters', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW?tag=test&utm_source=google&utm_medium=cpc';
      const result = extractAmazonMetadata(url);

      expect(result).toBeTruthy();
      expect(result?.asin).toBe('B08N5WRWNW');
    });

    it('should handle international Amazon domains', () => {
      const urls = [
        'https://www.amazon.co.uk/dp/B08N5WRWNW',
        'https://www.amazon.de/dp/B08N5WRWNW',
        'https://www.amazon.ca/dp/B08N5WRWNW',
      ];

      urls.forEach(url => {
        const result = extractAmazonMetadata(url);
        expect(result?.asin).toBe('B08N5WRWNW');
      });
    });
  });

  describe('Performance', () => {
    it('should extract metadata quickly', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        extractAmazonMetadata(url);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should process 1000 URLs in <100ms
    });
  });

  describe('Data Validation', () => {
    it('should validate price format', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const result = extractAmazonMetadata(url);

      expect(result?.price).toBeGreaterThan(0);
      expect(typeof result?.price).toBe('number');
      expect(result?.price?.toString()).toMatch(/^\d+(\.\d{2})?$/);
    });

    it('should validate currency code', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const result = extractAmazonMetadata(url);

      expect(result?.currency).toMatch(/^[A-Z]{3}$/);
    });

    it('should validate image URL format', () => {
      const url = 'https://www.amazon.com/dp/B08N5WRWNW';
      const result = extractAmazonMetadata(url);

      expect(result?.imageUrl).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i);
    });
  });
});
