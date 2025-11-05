# Metadata Extraction API Documentation

## Overview

The Metadata Extraction API provides robust URL metadata extraction with support for Open Graph Protocol, product-specific data, and retailer-specific parsers. Built with caching, rate limiting, and comprehensive error handling.

## Base URL

```
/api/extract-metadata
```

## Authentication

Currently, no authentication is required. Rate limiting is enforced per IP address.

## Rate Limiting

- **Limit**: 100 requests per 15-minute window per IP address
- **Response**: HTTP 429 with reset time when limit exceeded

---

## Endpoints

### 1. Extract Metadata (Single URL)

Extract metadata from a single URL.

**Endpoint**: `GET /api/extract-metadata`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The URL to extract metadata from |
| `forceRefresh` | boolean | No | false | Skip cache and force fresh extraction |
| `includeRetailerData` | boolean | No | true | Include retailer-specific enhanced data |

**Example Request**:

```bash
curl "https://your-domain.com/api/extract-metadata?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08N5WRWNW"
```

**Success Response** (HTTP 200):

```json
{
  "success": true,
  "data": {
    "title": "Product Name",
    "description": "Product description text",
    "image": "https://example.com/image.jpg",
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "siteName": "Amazon",
    "type": "product",
    "price": 29.99,
    "priceRaw": "$29.99",
    "currency": "USD",
    "retailer": "amazon",
    "productId": "B08N5WRWNW",
    "extractedAt": "2025-11-02T22:00:00.000Z",
    "method": "metascraper"
  },
  "cached": false,
  "processingTime": 1234
}
```

**Error Response** (HTTP 4xx/5xx):

```json
{
  "success": false,
  "error": "Invalid URL format",
  "code": "INVALID_URL",
  "details": "Additional error details"
}
```

---

### 2. Batch Extract Metadata

Extract metadata from multiple URLs in a single request.

**Endpoint**: `POST /api/extract-metadata`

**Request Body**:

```json
{
  "urls": [
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://www.target.com/p/-/A-12345678",
    "https://www.walmart.com/ip/123456789"
  ],
  "options": {
    "forceRefresh": false,
    "includeRetailerData": true,
    "timeout": 10000
  }
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `urls` | string[] | Yes | Array of URLs (max 10) |
| `options` | object | No | Extraction options |
| `options.forceRefresh` | boolean | No | Skip cache |
| `options.includeRetailerData` | boolean | No | Include retailer-specific data |
| `options.timeout` | number | No | Request timeout in milliseconds |

**Example Request**:

```bash
curl -X POST "https://your-domain.com/api/extract-metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.amazon.com/dp/B08N5WRWNW",
      "https://www.target.com/p/-/A-12345678"
    ],
    "options": {
      "includeRetailerData": true
    }
  }'
```

**Success Response** (HTTP 200):

```json
{
  "success": true,
  "results": [
    {
      "url": "https://www.amazon.com/dp/B08N5WRWNW",
      "success": true,
      "data": {
        "title": "Product Name",
        "description": "Description",
        "image": "https://example.com/image.jpg",
        "url": "https://www.amazon.com/dp/B08N5WRWNW",
        "price": 29.99,
        "retailer": "amazon",
        "productId": "B08N5WRWNW"
      },
      "cached": true
    },
    {
      "url": "https://www.target.com/p/-/A-12345678",
      "success": false,
      "error": "Failed to fetch URL"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1,
    "cached": 1,
    "processingTime": 2456
  }
}
```

---

## Response Types

### Metadata Object

```typescript
{
  // Core Open Graph Properties
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;

  // Extended Properties
  siteName?: string;
  type?: string;
  locale?: string;

  // Image Details
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  imageType?: string;

  // Product-Specific
  price?: number;
  priceRaw?: string;
  currency?: string;

  // Retailer Information
  retailer?: "amazon" | "target" | "walmart" | "etsy" | "bestbuy" | "unknown";
  productId?: string;

  // Extraction Info
  extractedAt?: string;
  method?: "metascraper" | "open-graph" | "retailer-api" | "fallback";
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_URL` | URL is malformed or invalid | 400 |
| `FETCH_FAILED` | Failed to fetch URL content | 500 |
| `PARSE_FAILED` | Failed to parse metadata | 500 |
| `TIMEOUT` | Request timeout exceeded | 408 |
| `RATE_LIMIT` | Rate limit exceeded | 429 |
| `BLOCKED` | Access blocked by target site | 403 |
| `NOT_FOUND` | URL not found | 404 |
| `SERVER_ERROR` | Internal server error | 500 |

---

## Supported Retailers

The API automatically detects and extracts product IDs for:

- **Amazon** (ASIN)
- **Target** (TCIN)
- **Walmart** (usItemId)
- **Etsy** (Listing ID)
- **Best Buy** (SKU)
- **Wayfair**

---

## Caching

- **Cache Duration**: 1 hour (3600 seconds)
- **Cache Key**: Based on normalized URL
- **Cache Hit**: Returns cached data with `cached: true`
- **Force Refresh**: Use `forceRefresh=true` to bypass cache

---

## Best Practices

### 1. URL Encoding

Always encode URLs in query parameters:

```javascript
const encodedUrl = encodeURIComponent('https://www.amazon.com/dp/B08N5WRWNW');
const apiUrl = `/api/extract-metadata?url=${encodedUrl}`;
```

### 2. Batch Processing

Use batch endpoint for multiple URLs to reduce latency:

```javascript
// ✅ Good - Single request
fetch('/api/extract-metadata', {
  method: 'POST',
  body: JSON.stringify({
    urls: [url1, url2, url3]
  })
});

// ❌ Avoid - Multiple requests
urls.forEach(url => {
  fetch(`/api/extract-metadata?url=${url}`);
});
```

### 3. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch(`/api/extract-metadata?url=${encodedUrl}`);
  const data = await response.json();

  if (!data.success) {
    console.error('Extraction failed:', data.error);
    // Handle specific error codes
    switch (data.code) {
      case 'RATE_LIMIT':
        // Wait and retry
        break;
      case 'INVALID_URL':
        // Show error to user
        break;
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 4. Caching Strategy

Leverage caching for better performance:

```javascript
// Use cache for repeat requests
const metadata1 = await extractMetadata(url);  // Fresh extraction
const metadata2 = await extractMetadata(url);  // Cached (fast)

// Force refresh when needed
const freshMetadata = await extractMetadata(url, { forceRefresh: true });
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
import type { UrlMetadata } from '@/types/metadata';

async function extractMetadata(url: string): Promise<UrlMetadata> {
  const encodedUrl = encodeURIComponent(url);
  const response = await fetch(`/api/extract-metadata?url=${encodedUrl}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data;
}

// Usage
const metadata = await extractMetadata('https://www.amazon.com/dp/B08N5WRWNW');
console.log(metadata.title, metadata.price);
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

function useMetadata(url: string) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    const encodedUrl = encodeURIComponent(url);

    fetch(`/api/extract-metadata?url=${encodedUrl}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetadata(data.data);
        } else {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { metadata, loading, error };
}
```

### Batch Processing

```typescript
async function extractMetadataBatch(urls: string[]) {
  const response = await fetch('/api/extract-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Batch extraction failed');
  }

  // Process results
  const successful = data.results.filter(r => r.success);
  const failed = data.results.filter(r => !r.success);

  console.log(`Successfully extracted: ${successful.length}/${urls.length}`);

  return {
    successful: successful.map(r => r.data),
    failed: failed.map(r => ({ url: r.url, error: r.error })),
  };
}
```

---

## Performance

### Typical Response Times

- **Cache Hit**: 10-50ms
- **Fresh Extraction**: 500-2000ms
- **Batch Request (3 URLs)**: 1000-3000ms

### Optimization Tips

1. **Use caching**: Don't force refresh unnecessarily
2. **Batch requests**: Process multiple URLs together
3. **Timeout management**: Set appropriate timeouts
4. **Parallel processing**: API handles concurrency internally

---

## Limitations

1. **Batch Size**: Maximum 10 URLs per batch request
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **Timeout**: 10 seconds per URL extraction
4. **URL Length**: Maximum 2048 characters
5. **No Authentication**: Public API (for now)

---

## Troubleshooting

### Common Issues

**Issue**: Rate limit exceeded
```
Solution: Wait for rate limit window to reset (shown in error details)
```

**Issue**: Timeout errors
```
Solution: Some sites are slow. Try again or increase timeout in options
```

**Issue**: No metadata found
```
Solution: Target site may not have Open Graph tags. Use fallback method
```

**Issue**: Invalid URL errors
```
Solution: Ensure URL is properly encoded and includes protocol (https://)
```

---

## Support

For issues or questions:
- GitHub Issues: [repository-url]
- Documentation: [docs-url]
- API Status: [status-url]
