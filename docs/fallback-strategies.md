# Fallback Strategies & Implementation Roadmap

## Overview

This document outlines a comprehensive fallback strategy for wishlist parsing across multiple retailers, ensuring the application remains functional even when preferred methods fail.

---

## Strategy Priority Matrix

| Priority | Method | Reliability | Cost | Speed | Legal Risk | Implementation Difficulty |
|----------|--------|-------------|------|-------|------------|---------------------------|
| **1** | User Paste URLs | ⭐⭐⭐⭐⭐ | Free | ⚡⚡⚡⚡⚡ | ✅ None | ⭐ Easy |
| **2** | Browser Extension | ⭐⭐⭐⭐ | Free | ⚡⚡⚡⚡ | ✅ Low | ⭐⭐ Medium |
| **3** | Official APIs | ⭐⭐⭐⭐⭐ | $-$$$ | ⚡⚡⚡ | ✅ None | ⭐⭐⭐ Medium |
| **4** | Proxy Services | ⭐⭐⭐⭐ | $$$ | ⚡⚡⚡ | ⚠️ Medium | ⭐ Easy |
| **5** | Direct Scraping | ⭐⭐ | Free | ⚡⚡ | ❌ High | ⭐⭐⭐⭐ Hard |

---

## Fallback Flow Diagram

```
┌─────────────────────────────────────────┐
│ 1. USER PASTE METHOD (Primary)         │
│ - User manually provides URLs           │
│ - Extract product IDs (ASIN/TCIN/SKU)  │
│ - Fetch from cache or API              │
└──────────────┬──────────────────────────┘
               │ SUCCESS ✅
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. BROWSER EXTENSION (Secondary)        │
│ - Chrome/Firefox extension installed    │
│ - Runs on user's machine (client-side) │
│ - Bypasses scraping restrictions        │
└──────────────┬──────────────────────────┘
               │ SUCCESS ✅
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. OFFICIAL APIs (If Available)         │
│ - Amazon PA-API (requires approval)     │
│ - Target Redsky API (unofficial)        │
│ - Walmart __NEXT_DATA__ extraction      │
└──────────────┬──────────────────────────┘
               │ SUCCESS ✅
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. PAID PROXY SERVICES (Fallback)      │
│ - Rainforest API ($0.005/req)          │
│ - ScraperAPI ($49/mo)                   │
│ - ScrapeOps (free tier available)      │
└──────────────┬──────────────────────────┘
               │ SUCCESS ✅
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. DIRECT SCRAPING (Last Resort)       │
│ - Puppeteer/Playwright with proxies    │
│ - Rate limiting (1 req/5 sec)          │
│ - IP rotation (residential proxies)    │
└──────────────┬──────────────────────────┘
               │ SUCCESS ✅
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. MANUAL ENTRY (Ultimate Fallback)    │
│ - User manually enters product info    │
│ - Paste product details (name, price)  │
└─────────────────────────────────────────┘
```

---

## Implementation by Retailer

### Amazon

#### Tier 1: User Paste (Recommended)
```javascript
// User provides URLs like:
// https://www.amazon.com/dp/B08N5WRWNW
// https://www.amazon.com/product-name/dp/B08N5WRWNW

const asins = extractMultipleASINs(userInput);
const products = await Promise.all(asins.map(getProductDetails));
```

**Pros**:
- No scraping needed
- 100% legal
- Fast (instant)
- No rate limits

**Cons**:
- Requires user action
- No bulk import from wishlist

#### Tier 2: Browser Extension
```javascript
// Chrome extension content script extracts data client-side
// User clicks extension button while on wishlist page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractWishlist') {
    const items = extractAmazonWishlist();
    sendResponse({ items });
  }
});
```

**Pros**:
- Uses user's authentication
- No server-side scraping
- Can access private wishlists
- Bypasses anti-bot measures

**Cons**:
- Requires extension install
- Browser-specific (Chrome, Firefox)

#### Tier 3: Amazon PA-API
```javascript
// Official API (requires Associates account + 3 sales)
const product = await amazonPaapi.getItems(credentials, {
  itemIds: [asin],
  resources: ['Images.Primary', 'ItemInfo.Title', 'Offers.Listings.Price']
});
```

**Pros**:
- Official, legal, stable
- Rich product data
- No scraping concerns

**Cons**:
- Requires Amazon Associates approval
- Must make 3 sales in 180 days
- Can't query wishlists directly (only fetch by ASIN)
- Rate limits (1 req/sec)

#### Tier 4: Rainforest API
```javascript
const response = await axios.get('https://api.rainforestapi.com/request', {
  params: {
    api_key: API_KEY,
    type: 'wishlist',
    url: wishlistUrl
  }
});
```

**Pros**:
- Handles scraping for you
- High success rate
- Maintained by third party

**Cons**:
- Costs $0.005-$0.02 per request
- Recurring expenses
- Dependency on external service

#### Tier 5: ScraperAPI + Puppeteer
```javascript
const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${wishlistUrl}&render=true`;
const response = await axios.get(apiUrl);
const html = response.data;
const items = parseWishlistHTML(html);
```

**Pros**:
- Handles proxies, CAPTCHA
- JavaScript rendering
- Reliable

**Cons**:
- $49/month minimum
- Still subject to Amazon's anti-scraping

---

### Target

#### Tier 1: Official API (Recommended)
```javascript
// Target has an unofficial public API that's very stable
const response = await axios.get(
  `https://api.target.com/registry/v2/registry/${registryId}`,
  { headers: { Accept: 'application/json' } }
);
```

**Pros**:
- Fast and reliable
- JSON response (easy parsing)
- No JavaScript rendering needed
- Low detection risk

**Cons**:
- Unofficial (could change)
- Only works for public registries

#### Tier 2: HTML Scraping
```javascript
const $ = cheerio.load(html);
$('[data-test="registry-item"]').each((i, el) => {
  // Target uses stable data-test attributes
  const item = extractItem(el);
});
```

**Pros**:
- Simple (Cheerio is enough)
- Fast (no browser needed)
- `data-test` attributes are stable

**Cons**:
- Could break with UI changes
- Server-side only (no auth)

#### Tier 3: Browser Extension
Same as Amazon approach

---

### Walmart

#### Tier 1: __NEXT_DATA__ Extraction (Recommended)
```javascript
// Walmart uses Next.js with embedded JSON
const $ = cheerio.load(html);
const scriptData = $('#__NEXT_DATA__').html();
const pageData = JSON.parse(scriptData);
const items = pageData.props.pageProps.registryData.items;
```

**Pros**:
- Clean structured data
- No complex HTML parsing
- Fast (Cheerio only)

**Cons**:
- Requires HTTP request to page
- Could change with Next.js updates

---

### Etsy

#### Tier 1: User Paste (Recommended)
Most Etsy favorites are private, so user-paste is best approach.

#### Tier 2: Etsy API (Requires OAuth)
```javascript
// Requires app approval from Etsy
const response = await axios.get(
  'https://openapi.etsy.com/v3/users/favorites',
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
```

**Pros**:
- Official API
- Access to user's private favorites

**Cons**:
- Requires OAuth flow
- User must approve app
- Complex setup

---

## Error Handling Strategy

```javascript
class WishlistParser {
  async parseWithFallback(input, options = {}) {
    const methods = [
      () => this.parseUserPaste(input),
      () => this.parseWithAPI(input),
      () => this.parseWithProxy(input),
      () => this.parseWithScraper(input)
    ];

    let lastError;

    for (const method of methods) {
      try {
        const result = await method();
        if (result.items.length > 0) {
          return result;
        }
      } catch (error) {
        console.error(`Method failed: ${error.message}`);
        lastError = error;

        // Wait before trying next method
        await this.delay(1000);
      }
    }

    throw new Error(`All methods failed. Last error: ${lastError.message}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Rate Limiting Strategy

### Per-Retailer Limits

```javascript
const RATE_LIMITS = {
  amazon: {
    requests: 5,
    windowMs: 60000, // 5 req per minute
    delayBetweenRequests: 3000 // 3 seconds
  },
  target: {
    requests: 20,
    windowMs: 60000, // 20 req per minute
    delayBetweenRequests: 500 // 0.5 seconds
  },
  walmart: {
    requests: 10,
    windowMs: 60000, // 10 req per minute
    delayBetweenRequests: 1000 // 1 second
  }
};

class RateLimiter {
  constructor(config) {
    this.queue = [];
    this.config = config;
  }

  async executeWithRateLimit(fn) {
    // Remove old requests from queue
    const now = Date.now();
    this.queue = this.queue.filter(
      time => now - time < this.config.windowMs
    );

    // Check if we've hit the limit
    if (this.queue.length >= this.config.requests) {
      const oldestRequest = this.queue[0];
      const waitTime = this.config.windowMs - (now - oldestRequest);
      await this.delay(waitTime);
    }

    // Add delay between requests
    if (this.queue.length > 0) {
      await this.delay(this.config.delayBetweenRequests);
    }

    this.queue.push(Date.now());
    return await fn();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Caching Strategy

### Multi-Level Cache

```javascript
class MultiLevelCache {
  constructor() {
    this.memory = new Map(); // L1: In-memory (instant)
    this.redis = redisClient; // L2: Redis (fast)
    this.database = db; // L3: PostgreSQL (persistent)
  }

  async get(key) {
    // Try memory first
    if (this.memory.has(key)) {
      return this.memory.get(key);
    }

    // Try Redis
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue);
      this.memory.set(key, parsed); // Warm up L1
      return parsed;
    }

    // Try database
    const dbValue = await this.database.query(
      'SELECT * FROM products WHERE key = $1 AND cached_at > NOW() - INTERVAL \'7 days\'',
      [key]
    );

    if (dbValue.rows.length > 0) {
      const data = dbValue.rows[0];
      await this.redis.setEx(key, 86400, JSON.stringify(data)); // Warm up L2
      this.memory.set(key, data); // Warm up L1
      return data;
    }

    return null;
  }

  async set(key, value, ttl = 604800) { // Default 7 days
    // Store in all layers
    this.memory.set(key, value);
    await this.redis.setEx(key, ttl, JSON.stringify(value));
    await this.database.query(
      'INSERT INTO products (key, data, cached_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET data = $2, cached_at = NOW()',
      [key, JSON.stringify(value)]
    );
  }
}
```

### Cache Invalidation Rules

```javascript
const CACHE_TTL = {
  // Product details (rarely change)
  product: 7 * 24 * 60 * 60, // 7 days

  // Prices (change frequently)
  price: 6 * 60 * 60, // 6 hours

  // Registry/wishlist (moderately dynamic)
  registry: 24 * 60 * 60, // 24 hours

  // Availability (highly dynamic)
  availability: 1 * 60 * 60, // 1 hour
};
```

---

## User Experience Considerations

### Progressive Enhancement

```javascript
class ProgressiveWishlistParser {
  async parseWithProgress(input, onProgress) {
    onProgress({ stage: 'detecting', progress: 0 });

    const retailer = detectRetailer(input);
    onProgress({ stage: 'detected', retailer, progress: 10 });

    onProgress({ stage: 'checking-cache', progress: 20 });
    const cached = await this.checkCache(input);

    if (cached) {
      onProgress({ stage: 'cache-hit', progress: 100 });
      return cached;
    }

    onProgress({ stage: 'fetching', progress: 40 });
    const items = await this.fetch(input);

    onProgress({ stage: 'parsing', progress: 60 });
    const parsed = await this.parse(items);

    onProgress({ stage: 'caching', progress: 80 });
    await this.cache(parsed);

    onProgress({ stage: 'complete', progress: 100 });
    return parsed;
  }
}
```

### Graceful Degradation

```javascript
// If full parsing fails, provide partial data
async function parseWithGracefulDegradation(url) {
  try {
    return await fullParse(url);
  } catch (error) {
    console.warn('Full parse failed, attempting partial:', error);

    try {
      // Try to extract just basic info
      return await partialParse(url);
    } catch (partialError) {
      // Return minimal data (user can fill in details)
      return {
        url,
        name: 'Product (details unavailable)',
        price: null,
        image: null,
        method: 'manual-entry-required',
        error: error.message
      };
    }
  }
}
```

---

## Browser Extension Implementation

### Manifest v3 (Chrome)

```json
{
  "manifest_version": 3,
  "name": "Wishlist Importer",
  "version": "1.0.0",
  "description": "Import wishlists from Amazon, Target, Walmart, and more",
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "https://www.amazon.com/*",
    "https://www.target.com/*",
    "https://www.walmart.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.amazon.com/hz/wishlist/*"],
      "js": ["content-amazon.js"]
    },
    {
      "matches": ["https://www.target.com/gift-registry/*"],
      "js": ["content-target.js"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}
```

### Content Script Example

```javascript
// content-amazon.js
(function() {
  function extractWishlist() {
    const items = [];

    document.querySelectorAll('[data-itemid]').forEach(el => {
      items.push({
        asin: el.getAttribute('data-itemid'),
        name: el.querySelector('h3 a')?.textContent.trim(),
        price: el.querySelector('.a-price .a-offscreen')?.textContent.trim(),
        image: el.querySelector('img')?.src,
        url: el.querySelector('a[href*="/dp/"]')?.href
      });
    });

    return items;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract') {
      sendResponse({ items: extractWishlist() });
    }
  });
})();
```

### Popup UI

```javascript
// popup.js
document.getElementById('extract').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: 'extract' }, response => {
    if (response && response.items) {
      // Send to backend API
      fetch('https://your-app.com/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: response.items })
      });
    }
  });
});
```

---

## Recommended MVP Implementation

### Phase 1: Basic (Week 1)
1. ✅ User paste URLs (Amazon, Target)
2. ✅ Extract product IDs (ASIN, TCIN)
3. ✅ Basic caching (in-memory)
4. ✅ Display products in UI

### Phase 2: Enhanced (Week 2)
1. ✅ Add Walmart support
2. ✅ Browser extension (Chrome only)
3. ✅ Redis caching
4. ✅ Rate limiting

### Phase 3: Production (Week 3)
1. ✅ Paid API integration (Rainforest/ScraperAPI)
2. ✅ Multi-retailer support (5+ retailers)
3. ✅ Background job queue
4. ✅ Error tracking (Sentry)

### Phase 4: Scale (Month 2)
1. ✅ Amazon PA-API integration
2. ✅ Firefox extension
3. ✅ Advanced caching (multi-level)
4. ✅ Analytics and monitoring

---

## Cost Analysis

### Monthly Costs (Estimate for 1,000 users)

| Service | Usage | Cost |
|---------|-------|------|
| ScraperAPI | 10K requests | $49 |
| Rainforest API | 5K requests | $25 |
| Redis Cloud | 500MB | $5 |
| Database (Postgres) | 10GB | $10 |
| **Total** | | **$89/mo** |

### Cost Optimization

1. **Aggressive caching**: Reduce API calls by 70%
2. **User-paste primary**: Most users provide URLs (free)
3. **Browser extension**: Offload 50% of scraping to client-side
4. **Batch processing**: Group requests to maximize API efficiency

**Optimized Cost**: ~$30/month for 1,000 users

---

## Legal Compliance Checklist

- [ ] Display Terms of Service with clear data usage policy
- [ ] Implement opt-in consent for scraping
- [ ] Respect robots.txt (user-paste bypasses this concern)
- [ ] Rate limiting (no more than 1 req/sec per retailer)
- [ ] User-Agent identification (identify your app)
- [ ] Attribution ("Data from [Retailer]")
- [ ] Privacy policy for cached data
- [ ] GDPR compliance (data deletion on request)
- [ ] CCPA compliance (California users)

---

## Monitoring & Alerting

### Key Metrics to Track

```javascript
const metrics = {
  // Success rates
  parseSuccessRate: 0.95, // Alert if < 90%

  // Performance
  avgParseTime: 2000, // Alert if > 5000ms

  // Errors
  rateLimitErrors: 0, // Alert if > 5/hour
  timeoutErrors: 0, // Alert if > 10/hour

  // Costs
  apiCallsToday: 0, // Alert if > daily budget

  // Cache
  cacheHitRate: 0.80, // Alert if < 60%
};
```

### Sentry Integration

```javascript
const Sentry = require('@sentry/node');

Sentry.init({ dsn: process.env.SENTRY_DSN });

try {
  await parseWishlist(url);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      retailer: detectRetailer(url),
      method: 'user-paste'
    },
    extra: { url }
  });
}
```

---

## Summary

### ✅ Recommended Primary Approach
**User-Paste Method**: User provides individual product URLs

**Pros**:
- 100% legal and compliant
- No scraping infrastructure needed
- Works for all retailers
- Fast and reliable
- Zero cost

**Cons**:
- Requires user action
- Not automated

### 🔧 Recommended Secondary Approach
**Browser Extension**: Chrome/Firefox extension for bulk import

**Pros**:
- Client-side (bypasses scraping concerns)
- Uses user's authentication
- Can access private wishlists
- One-click import

**Cons**:
- Requires installation
- Browser-specific maintenance

### 💰 Recommended Paid Fallback
**Rainforest API** for Amazon + **Target API** for Target

**Total Cost**: ~$30/month for 1,000 users with caching

---

**Next Steps**: Proceed to implementation phase with user-paste as primary method.
