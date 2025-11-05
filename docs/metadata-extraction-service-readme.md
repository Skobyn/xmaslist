# URL Metadata Extraction Service

## Overview

A production-ready URL metadata extraction service built with Next.js API routes, TypeScript, and comprehensive error handling. Extracts Open Graph metadata, product-specific data, and retailer-specific information from any URL.

## Features

✅ **Open Graph Protocol Support**
- Complete OG tag extraction (title, description, image, URL, etc.)
- Twitter Card fallbacks
- Standard meta tag extraction

✅ **Product-Specific Data**
- Price extraction from multiple sources
- Product images with dimensions
- Currency detection
- Stock status (when available)

✅ **Retailer-Specific Parsers**
- Amazon (ASIN extraction)
- Target (TCIN extraction)
- Walmart (usItemId extraction)
- Etsy (Listing ID extraction)
- Best Buy (SKU extraction)
- Wayfair

✅ **Performance Optimizations**
- Redis caching with TTL
- In-memory fallback cache
- Cache hit/miss statistics
- Configurable cache duration

✅ **Rate Limiting**
- IP-based rate limiting
- Configurable limits (100 req/15min default)
- Graceful error responses

✅ **Error Handling**
- Comprehensive error codes
- Detailed error messages
- Validation at every step
- Graceful degradation

✅ **Batch Processing**
- Process up to 10 URLs in parallel
- Consolidated response format
- Individual error handling

## Architecture

```
/src
├── types/
│   └── metadata.ts              # TypeScript types and interfaces
├── lib/
│   └── metadata/
│       ├── index.ts             # Main exports
│       ├── metadata-extractor.ts # Core extraction logic
│       ├── retailer-detector.ts  # Retailer identification
│       ├── url-validator.ts     # URL validation
│       └── cache.ts             # Redis cache implementation
└── app/
    └── api/
        └── extract-metadata/
            └── route.ts         # API route handlers
```

## Installation

```bash
# Install dependencies
npm install

# Environment variables (optional)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

## Usage

### API Endpoints

#### 1. Single URL Extraction

```bash
GET /api/extract-metadata?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08N5WRWNW
```

#### 2. Batch URL Extraction

```bash
POST /api/extract-metadata
Content-Type: application/json

{
  "urls": [
    "https://www.amazon.com/dp/B08N5WRWNW",
    "https://www.target.com/p/-/A-12345678"
  ]
}
```

### Programmatic Usage

```typescript
import { extractMetadata } from '@/lib/metadata';

// Extract metadata
const metadata = await extractMetadata('https://www.amazon.com/dp/B08N5WRWNW', {
  includeRetailerData: true,
  useFallback: true,
  timeout: 10000,
});

console.log(metadata.title);      // "Product Name"
console.log(metadata.price);      // 29.99
console.log(metadata.retailer);   // "amazon"
console.log(metadata.productId);  // "B08N5WRWNW"
```

## Response Format

```typescript
{
  success: true,
  data: {
    // Core Properties
    title: "Product Name",
    description: "Product description",
    image: "https://example.com/image.jpg",
    url: "https://www.amazon.com/dp/B08N5WRWNW",

    // Extended Properties
    siteName: "Amazon",
    type: "product",
    locale: "en_US",

    // Image Details
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: "Product image",
    imageType: "image/jpeg",

    // Product Data
    price: 29.99,
    priceRaw: "$29.99",
    currency: "USD",

    // Retailer Info
    retailer: "amazon",
    productId: "B08N5WRWNW",

    // Metadata
    extractedAt: "2025-11-02T22:00:00.000Z",
    method: "metascraper"
  },
  cached: false,
  processingTime: 1234
}
```

## Supported Retailers

| Retailer | Product ID | Detection | API Support |
|----------|-----------|-----------|-------------|
| Amazon | ASIN | ✅ | Partial |
| Target | TCIN | ✅ | ✅ |
| Walmart | usItemId | ✅ | Partial |
| Etsy | Listing ID | ✅ | ❌ |
| Best Buy | SKU | ✅ | ❌ |
| Wayfair | - | ✅ | ❌ |

## Error Handling

The service provides detailed error codes:

```typescript
enum ErrorCode {
  INVALID_URL = 'INVALID_URL',        // Malformed URL
  FETCH_FAILED = 'FETCH_FAILED',      // Network error
  PARSE_FAILED = 'PARSE_FAILED',      // Parsing error
  TIMEOUT = 'TIMEOUT',                // Request timeout
  RATE_LIMIT = 'RATE_LIMIT',          // Rate limit exceeded
  BLOCKED = 'BLOCKED',                // Access blocked
  NOT_FOUND = 'NOT_FOUND',            // URL not found
  SERVER_ERROR = 'SERVER_ERROR',      // Internal error
}
```

## Configuration

### Cache Configuration

```typescript
const cache = new MetadataCache({
  ttl: 3600,           // 1 hour
  prefix: 'metadata:', // Key prefix
  compress: false,     // Optional compression
});
```

### Extraction Options

```typescript
const options = {
  forceRefresh: false,          // Skip cache
  includeRetailerData: true,    // Add retailer-specific data
  timeout: 10000,               // 10 seconds
  useFallback: true,            // Use fallback methods
  extractProductDetails: true,  // Extract detailed product info
};
```

### Rate Limiting

```typescript
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;  // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;       // 100 requests
```

## Performance

### Benchmarks

- **Cache Hit**: ~10-50ms
- **Fresh Extraction**: ~500-2000ms
- **Batch (3 URLs)**: ~1000-3000ms

### Optimization Tips

1. **Enable caching** for frequently accessed URLs
2. **Batch requests** instead of sequential calls
3. **Use appropriate timeouts** based on site complexity
4. **Monitor cache hit rate** and adjust TTL

## Caching Strategy

The service implements a multi-tier caching strategy:

1. **In-Memory Cache** (Development)
   - Fast, no setup required
   - Limited to single instance
   - Good for testing

2. **Redis Cache** (Production)
   - Distributed caching
   - Shared across instances
   - Upstash Redis recommended

### Cache Flow

```
Request → Check Cache → Hit? → Return Cached
                      ↓ Miss
                Extract Metadata
                      ↓
                Store in Cache → Return Fresh
```

## URL Validation

All URLs are validated and normalized:

```typescript
// Validation checks:
✅ Protocol (http/https)
✅ Domain format
✅ URL length (<2048 chars)
✅ Blocked domains
✅ Tracking parameter removal
```

## Retailer Detection

Automatic retailer detection based on:

1. Domain matching
2. URL structure
3. Product ID format

```typescript
const detection = detectRetailer('https://www.amazon.com/dp/B08N5WRWNW');
// {
//   retailer: 'amazon',
//   productId: 'B08N5WRWNW',
//   confidence: 1.0
// }
```

## Testing

### Test Single URL

```bash
curl "http://localhost:3000/api/extract-metadata?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08N5WRWNW"
```

### Test Batch

```bash
curl -X POST http://localhost:3000/api/extract-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.amazon.com/dp/B08N5WRWNW",
      "https://www.target.com/p/-/A-12345678"
    ]
  }'
```

## Production Deployment

### Environment Variables

```bash
# Redis (Optional - uses in-memory cache if not provided)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Vercel Deployment

```bash
npm run build
vercel deploy
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Monitoring

### Cache Statistics

```typescript
const stats = getCacheStats();
console.log(stats.getStats());
// {
//   hits: 150,
//   misses: 50,
//   total: 200,
//   hitRate: 75
// }
```

### Performance Metrics

Each response includes:
- `processingTime`: Total extraction time
- `cached`: Whether result was cached
- `method`: Extraction method used

## Limitations

1. **Batch Size**: Max 10 URLs per request
2. **Rate Limit**: 100 requests per 15 minutes per IP
3. **Timeout**: 10 seconds per URL
4. **No Authentication**: Public API (for now)
5. **No Wishlist Parsing**: Individual product URLs only

## Future Enhancements

- [ ] Upstash Redis integration
- [ ] Image proxy support (Cloudinary/imgix)
- [ ] Retailer-specific API integrations
- [ ] WebSocket streaming for real-time updates
- [ ] Authentication and API keys
- [ ] Advanced analytics dashboard
- [ ] Webhook notifications
- [ ] Custom extraction rules

## Troubleshooting

### Common Issues

**Cache not working?**
- Check Redis connection
- Verify TTL settings
- Monitor cache stats

**Rate limiting too strict?**
- Adjust `RATE_LIMIT_MAX_REQUESTS`
- Increase window duration
- Implement per-user limits

**Timeouts?**
- Increase timeout value
- Check target site performance
- Use fallback methods

**Missing metadata?**
- Verify site has OG tags
- Check HTML structure
- Enable fallback extraction

## Contributing

Contributions welcome! Please:

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Follow existing code style

## License

MIT License - See LICENSE file for details

## References

- [Open Graph Protocol](https://ogp.me/)
- [Metascraper Documentation](https://metascraper.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Research Document](/docs/research/metadata-extraction-research.md)
- [API Documentation](/docs/api/metadata-extraction-api.md)
