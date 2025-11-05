# Quick Start Guide - URL Metadata Extraction Service

## 🚀 Getting Started in 5 Minutes

### 1. Installation (if needed)

```bash
# No additional packages required for basic functionality!
# Already part of Next.js project
```

### 2. Basic Usage - API Route

#### Extract Single URL

```bash
# GET request with URL parameter
curl "http://localhost:3000/api/extract-metadata?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08N5WRWNW"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Product Name",
    "description": "Product description",
    "image": "https://example.com/image.jpg",
    "url": "https://www.amazon.com/dp/B08N5WRWNW",
    "price": 29.99,
    "retailer": "amazon",
    "productId": "B08N5WRWNW"
  },
  "cached": false,
  "processingTime": 1234
}
```

#### Extract Multiple URLs (Batch)

```bash
curl -X POST http://localhost:3000/api/extract-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.amazon.com/dp/B08N5WRWNW",
      "https://www.target.com/p/-/A-12345678",
      "https://www.walmart.com/ip/123456789"
    ]
  }'
```

---

### 3. Programmatic Usage

#### In Your Next.js App

```typescript
// app/components/MetadataExtractor.tsx
'use client';

import { useState } from 'react';

export default function MetadataExtractor() {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/extract-metadata?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (data.success) {
        setMetadata(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL..."
      />
      <button onClick={handleExtract} disabled={loading}>
        {loading ? 'Extracting...' : 'Extract'}
      </button>

      {metadata && (
        <div>
          <h3>{metadata.title}</h3>
          <p>{metadata.description}</p>
          <img src={metadata.image} alt={metadata.title} />
          <p>Price: ${metadata.price}</p>
        </div>
      )}
    </div>
  );
}
```

#### Using the Library Directly

```typescript
// lib/myService.ts
import { extractMetadata, detectRetailer } from '@/lib/metadata';

async function processUrl(url: string) {
  // Detect retailer first
  const detection = detectRetailer(url);
  console.log(`Retailer: ${detection.retailer}`);
  console.log(`Product ID: ${detection.productId}`);

  // Extract metadata
  const metadata = await extractMetadata(url, {
    includeRetailerData: true,
    useFallback: true,
    timeout: 10000,
  });

  console.log(metadata);
  return metadata;
}
```

---

### 4. React Hook (Copy & Paste)

```typescript
// hooks/useMetadata.ts
import { useState, useEffect } from 'react';
import type { UrlMetadata } from '@/types/metadata';

export function useMetadata(url: string) {
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setMetadata(null);
      return;
    }

    setLoading(true);
    setError(null);

    const encodedUrl = encodeURIComponent(url);

    fetch(`/api/extract-metadata?url=${encodedUrl}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetadata(data.data);
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { metadata, loading, error };
}

// Usage:
// const { metadata, loading, error } = useMetadata(url);
```

---

### 5. Common Use Cases

#### A. Wishlist Item Preview

```typescript
async function previewWishlistItem(productUrl: string) {
  const response = await fetch(
    `/api/extract-metadata?url=${encodeURIComponent(productUrl)}`
  );
  const { data } = await response.json();

  return {
    name: data.title,
    price: data.price,
    image: data.image,
    store: data.retailer,
    link: data.url,
  };
}
```

#### B. Batch Import Wishlist

```typescript
async function importWishlistUrls(urls: string[]) {
  const response = await fetch('/api/extract-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  const { results } = await response.json();

  const items = results
    .filter((r) => r.success)
    .map((r) => ({
      name: r.data.title,
      price: r.data.price,
      image: r.data.image,
      url: r.data.url,
    }));

  return items;
}
```

#### C. Product URL Validation

```typescript
import { validateUrl, isProductUrl, detectRetailer } from '@/lib/metadata';

function validateProductUrl(url: string) {
  // Step 1: Validate URL format
  const validation = validateUrl(url);
  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  // Step 2: Check if it's a product URL
  if (!isProductUrl(url)) {
    return { valid: false, error: 'URL does not appear to be a product page' };
  }

  // Step 3: Check if retailer is supported
  const detection = detectRetailer(url);
  if (detection.retailer === 'unknown') {
    return { valid: false, error: 'Unsupported retailer' };
  }

  return { valid: true, retailer: detection.retailer };
}
```

---

### 6. Error Handling Template

```typescript
async function extractWithErrorHandling(url: string) {
  try {
    const response = await fetch(
      `/api/extract-metadata?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      // Handle specific error codes
      switch (data.code) {
        case 'INVALID_URL':
          console.error('Invalid URL format');
          break;
        case 'RATE_LIMIT':
          console.error('Rate limit exceeded, try again later');
          break;
        case 'TIMEOUT':
          console.error('Request timeout, site may be slow');
          break;
        case 'NOT_FOUND':
          console.error('URL not found');
          break;
        default:
          console.error('Extraction failed:', data.error);
      }
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

---

### 7. Testing Examples

#### Test API Endpoint

```bash
# Test Amazon URL
curl "http://localhost:3000/api/extract-metadata?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08N5WRWNW"

# Test Target URL
curl "http://localhost:3000/api/extract-metadata?url=https%3A%2F%2Fwww.target.com%2Fp%2F-%2FA-12345678"

# Test Walmart URL
curl "http://localhost:3000/api/extract-metadata?url=https%3A%2F%2Fwww.walmart.com%2Fip%2F123456789"

# Test with force refresh
curl "http://localhost:3000/api/extract-metadata?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08N5WRWNW&forceRefresh=true"
```

#### Test Batch Endpoint

```bash
curl -X POST http://localhost:3000/api/extract-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.amazon.com/dp/B08N5WRWNW",
      "https://www.target.com/p/-/A-12345678"
    ],
    "options": {
      "includeRetailerData": true,
      "timeout": 10000
    }
  }'
```

---

### 8. Performance Optimization Tips

```typescript
// ✅ DO: Batch requests when possible
const urls = [url1, url2, url3];
const response = await fetch('/api/extract-metadata', {
  method: 'POST',
  body: JSON.stringify({ urls }),
});

// ❌ DON'T: Make sequential requests
for (const url of urls) {
  await fetch(`/api/extract-metadata?url=${url}`);
}

// ✅ DO: Let cache work for you
const metadata1 = await extractMetadata(url); // Fresh
const metadata2 = await extractMetadata(url); // Cached (fast!)

// ❌ DON'T: Force refresh unnecessarily
const metadata = await extractMetadata(url, { forceRefresh: true }); // Slow
```

---

### 9. Environment Setup (Optional)

```bash
# .env.local (for Upstash Redis in production)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Rate limiting configuration (optional)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

### 10. Monitoring Cache Performance

```typescript
import { getCacheStats } from '@/lib/metadata';

function showCacheStats() {
  const stats = getCacheStats();
  const { hits, misses, total, hitRate } = stats.getStats();

  console.log(`Cache Statistics:`);
  console.log(`- Total Requests: ${total}`);
  console.log(`- Cache Hits: ${hits}`);
  console.log(`- Cache Misses: ${misses}`);
  console.log(`- Hit Rate: ${hitRate.toFixed(2)}%`);
}
```

---

## 🎯 Most Common Patterns

### Pattern 1: Add to Wishlist Button

```typescript
async function handleAddToWishlist(productUrl: string) {
  try {
    // Extract metadata
    const response = await fetch(
      `/api/extract-metadata?url=${encodeURIComponent(productUrl)}`
    );
    const { data } = await response.json();

    // Save to database
    await fetch('/api/wishlist/items', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        price: data.price,
        image: data.image,
        url: data.url,
        retailer: data.retailer,
        productId: data.productId,
      }),
    });

    alert('Added to wishlist!');
  } catch (error) {
    alert('Failed to add item');
  }
}
```

### Pattern 2: Import from Clipboard

```typescript
async function importFromClipboard() {
  const text = await navigator.clipboard.readText();

  // Extract URLs from text
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlPattern) || [];

  if (urls.length === 0) {
    alert('No URLs found in clipboard');
    return;
  }

  // Batch extract metadata
  const response = await fetch('/api/extract-metadata', {
    method: 'POST',
    body: JSON.stringify({ urls: urls.slice(0, 10) }), // Max 10
  });

  const { results } = await response.json();

  // Process results
  const items = results.filter((r) => r.success).map((r) => r.data);

  return items;
}
```

### Pattern 3: Real-time URL Preview

```typescript
import { useDebounce } from '@/hooks/useDebounce';

function UrlPreview({ url }: { url: string }) {
  const debouncedUrl = useDebounce(url, 500);
  const { metadata, loading } = useMetadata(debouncedUrl);

  if (loading) return <div>Loading preview...</div>;
  if (!metadata) return null;

  return (
    <div className="preview">
      <img src={metadata.image} alt={metadata.title} />
      <h3>{metadata.title}</h3>
      <p>{metadata.description}</p>
      <p className="price">${metadata.price}</p>
    </div>
  );
}
```

---

## 📚 Additional Resources

- **Full API Documentation**: `/docs/api/metadata-extraction-api.md`
- **Service README**: `/docs/metadata-extraction-service-readme.md`
- **Implementation Summary**: `/docs/implementation-summary.md`
- **Research Document**: `/docs/research/metadata-extraction-research.md`

---

## 🆘 Need Help?

### Common Issues

**Q: Rate limit exceeded?**
A: Wait 15 minutes or adjust `RATE_LIMIT_MAX_REQUESTS` in configuration

**Q: Slow extraction?**
A: Some sites are slow. Enable caching and use batch requests

**Q: Missing metadata?**
A: Target site may lack Open Graph tags. Fallback method will provide basic data

**Q: CORS errors?**
A: Use the API route, not direct fetch from client-side

---

**Happy Coding! 🚀**
