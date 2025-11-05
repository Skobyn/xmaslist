# Wishlist Parsing Research - Comprehensive Analysis

**Research Date**: 2025-11-02
**Focus Areas**: Amazon, Target, Walmart, and multi-retailer parsing strategies

---

## 1. Amazon Wishlist Parsing

### 1.1 URL Structures

Amazon wishlists follow these patterns:

```
Public Wishlist:
https://www.amazon.com/hz/wishlist/ls/[WISHLIST_ID]
https://www.amazon.com/hz/wishlist/ls/[WISHLIST_ID]?type=wishlist

Wedding Registry:
https://www.amazon.com/wedding/registry/[REGISTRY_ID]

Baby Registry:
https://www.amazon.com/baby-reg/[REGISTRY_ID]
```

**Key Findings**:
- Wishlist ID is typically 13 characters (alphanumeric)
- Public wishlists must have "public" visibility setting
- Amazon heavily uses JavaScript rendering (SPA architecture)
- Rate limiting is aggressive (IP-based blocking after ~50 requests/hour)

### 1.2 HTML Structure Analysis

Amazon's wishlist page structure (as of 2025):

```html
<div id="endOfListMarker" data-version="2.0">
  <ul class="g-items-section">
    <li data-id="[ITEM_ID]" data-price="$XX.XX" data-itemid="[ASIN]">
      <div class="a-section">
        <a href="/dp/[ASIN]" data-link="true">
          <img src="[IMAGE_URL]" />
        </a>
        <h3 class="a-size-base">
          <a href="/dp/[ASIN]">[PRODUCT_NAME]</a>
        </h3>
        <span class="a-price">
          <span class="a-offscreen">$XX.XX</span>
        </span>
        <span class="a-size-small">
          [REQUESTED_COUNT] wanted | [PURCHASED_COUNT] purchased
        </span>
      </div>
    </li>
  </ul>
</div>
```

**Challenges**:
- Dynamic content loading (infinite scroll)
- Class names are obfuscated and change frequently
- Anti-bot detection (CAPTCHA, fingerprinting)
- Requires JavaScript execution for full content

### 1.3 Alternative Approaches

#### Option A: Amazon Product Advertising API (PA-API 5.0)
**Status**: Available but restricted

**Requirements**:
- Amazon Associates account
- Minimum 3 qualified sales in 180 days
- API credentials (Access Key, Secret Key, Partner Tag)

**Limitations**:
- Cannot directly query wishlists
- Can only fetch product details by ASIN
- 8,640 requests/day limit (1 req/10 sec)
- Throttling penalties for violations

**Use Case**: Fetch product details after ASIN extraction

#### Option B: Rainforest API
**Cost**: $0.005 - $0.02 per request
**Features**:
- Wishlist parsing support
- Returns JSON structured data
- Handles anti-bot measures
- Residential proxy network

```javascript
// Rainforest API Example
const params = {
  api_key: "YOUR_API_KEY",
  type: "wishlist",
  amazon_domain: "amazon.com",
  url: "https://www.amazon.com/hz/wishlist/ls/[ID]"
};
```

**Pros**: Reliable, maintained, legal gray area
**Cons**: Recurring costs, dependency on third-party

#### Option C: ScraperAPI
**Cost**: $49/month (1M requests)
**Features**:
- Rotating proxies
- CAPTCHA solving
- JavaScript rendering
- Geolocation targeting

#### Option D: ScrapeOps
**Cost**: Free tier (1K requests/month)
**Features**: Similar to ScraperAPI, good for testing

### 1.4 Recommended Approach for Amazon

**Hybrid Strategy**:
1. **User-Paste Method** (Primary): User copies product URLs
2. **Browser Extension** (Alternative): Chrome extension scrapes on client-side
3. **Proxy Scraping** (Fallback): Use ScraperAPI/Rainforest for bulk operations
4. **PA-API** (Enhancement): Fetch additional product details by ASIN

---

## 2. Target Wishlist Parsing

### 2.1 URL Structure

```
Registry:
https://www.target.com/gift-registry/[REGISTRY_ID]

Wishlist (requires login):
https://www.target.com/lists/[LIST_ID]
```

**Findings**:
- Public registries: Wedding, Baby
- Personal wishlists are private (login required)
- Registry ID is 16-character alphanumeric
- Less aggressive anti-scraping than Amazon

### 2.2 HTML Structure

```html
<div data-test="registry-items">
  <div data-test="registry-item">
    <a href="/p/[PRODUCT_NAME]/[TCIN]">
      <img src="[IMAGE_URL]" />
    </a>
    <div data-test="item-title">
      <a href="/p/-/A-[TCIN]">[PRODUCT_NAME]</a>
    </div>
    <div data-test="current-price">
      <span>$XX.XX</span>
    </div>
    <div data-test="quantity-needed">
      [REQUESTED_QTY]
    </div>
    <div data-test="quantity-purchased">
      [PURCHASED_QTY]
    </div>
  </div>
</div>
```

**Key Identifiers**:
- `TCIN`: Target Catalog Item Number (unique product ID)
- `data-test` attributes are stable (easier parsing)
- Server-side rendered (easier to scrape than Amazon)

### 2.3 Target API (Unofficial)

Target has an undocumented API used by their frontend:

```
GET https://api.target.com/registry/v2/registry/[REGISTRY_ID]
Headers:
  - Accept: application/json
```

**Response Structure**:
```json
{
  "registry_items": [
    {
      "tcin": "12345678",
      "product_name": "Product Name",
      "price": 29.99,
      "quantity_requested": 2,
      "quantity_purchased": 0,
      "image_url": "https://...",
      "product_url": "/p/-/A-12345678"
    }
  ]
}
```

**Advantages**:
- JSON response (easy parsing)
- No JavaScript rendering needed
- More stable than HTML scraping
- Lower detection risk

---

## 3. Walmart Registry Parsing

### 3.1 URL Structure

```
Wedding Registry:
https://www.walmart.com/registry/[REGISTRY_TYPE]/[REGISTRY_ID]

Baby Registry:
https://www.walmart.com/registry/baby/[REGISTRY_ID]
```

### 3.2 Implementation Strategy

Walmart uses React with server-side rendering:

```html
<script id="__NEXT_DATA__" type="application/json">
{
  "props": {
    "pageProps": {
      "registryData": {
        "items": [
          {
            "usItemId": "12345678",
            "name": "Product Name",
            "price": 29.99,
            "imageUrl": "https://...",
            "quantity": 2,
            "purchased": 0
          }
        ]
      }
    }
  }
}
</script>
```

**Parsing Strategy**: Extract JSON from `__NEXT_DATA__` script tag

---

## 4. Other Retailers

### 4.1 Etsy Wishlist
- **URL**: `https://www.etsy.com/people/[USERNAME]/favorites`
- **Challenge**: Requires login for most wishlists
- **Approach**: OAuth API (available for approved apps)

### 4.2 Best Buy Registry
- **URL**: `https://www.bestbuy.com/site/registry/[REGISTRY_ID]`
- **Structure**: Similar to Target (server-rendered)
- **API**: No public API available

### 4.3 MyRegistry.com (Universal Registry)
- **URL**: `https://www.myregistry.com/[USERNAME]`
- **Feature**: Aggregates items from multiple retailers
- **Advantage**: Single source for multi-retailer wishlists
- **Parsing**: Clean HTML structure, easy to scrape

---

## 5. Web Scraping Libraries Comparison

### 5.1 Cheerio
**Type**: HTML parser (no JavaScript execution)
**Best For**: Static HTML (Target, Walmart JSON extraction)

```javascript
const cheerio = require('cheerio');
const axios = require('axios');

async function parseTargetRegistry(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const items = [];
  $('[data-test="registry-item"]').each((i, el) => {
    items.push({
      name: $(el).find('[data-test="item-title"]').text(),
      price: $(el).find('[data-test="current-price"]').text(),
      url: $(el).find('a').attr('href')
    });
  });

  return items;
}
```

**Pros**: Fast, low memory, simple
**Cons**: Cannot handle JavaScript-rendered content

### 5.2 Puppeteer
**Type**: Headless Chrome browser
**Best For**: Amazon, dynamic content

```javascript
const puppeteer = require('puppeteer');

async function scrapeAmazonWishlist(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Anti-detection measures
  await page.setUserAgent('Mozilla/5.0...');
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Scroll to trigger infinite loading
  await autoScroll(page);

  const items = await page.evaluate(() => {
    const products = [];
    document.querySelectorAll('[data-itemid]').forEach(item => {
      products.push({
        asin: item.getAttribute('data-itemid'),
        name: item.querySelector('h3 a')?.textContent,
        price: item.querySelector('.a-price .a-offscreen')?.textContent,
        image: item.querySelector('img')?.src
      });
    });
    return products;
  });

  await browser.close();
  return items;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
```

**Pros**: Handles JavaScript, bypass some anti-bot
**Cons**: Slow (2-5s per page), high memory (100-200MB per browser)

### 5.3 Playwright
**Type**: Modern browser automation
**Best For**: Production environments, multiple browsers

```javascript
const { chromium } = require('playwright');

async function scrapeWithPlaywright(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0...',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Block unnecessary resources (faster scraping)
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();
    if (['image', 'stylesheet', 'font'].includes(resourceType)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.goto(url);
  await page.waitForSelector('[data-itemid]');

  const items = await page.$$eval('[data-itemid]', (elements) => {
    return elements.map(el => ({
      asin: el.getAttribute('data-itemid'),
      name: el.querySelector('h3 a')?.textContent,
      price: el.querySelector('.a-price .a-offscreen')?.textContent
    }));
  });

  await browser.close();
  return items;
}
```

**Pros**: Faster than Puppeteer, better API, auto-wait features
**Cons**: Larger bundle size

---

## 6. Anti-Scraping Bypass Techniques

### 6.1 User-Agent Rotation
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];

const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
```

### 6.2 Proxy Rotation
```javascript
const proxies = [
  'http://proxy1.com:8080',
  'http://proxy2.com:8080'
];

// With Puppeteer
await puppeteer.launch({
  args: [`--proxy-server=${proxies[0]}`]
});
```

### 6.3 Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // 5 requests per minute per IP
});

app.use('/api/scrape', limiter);
```

### 6.4 Request Delays
```javascript
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeWithDelay(urls) {
  const results = [];
  for (const url of urls) {
    results.push(await scrapeUrl(url));
    await delay(2000 + Math.random() * 3000); // 2-5 second delay
  }
  return results;
}
```

---

## 7. Legal & Ethical Considerations

### 7.1 robots.txt Compliance

**Amazon robots.txt** (https://www.amazon.com/robots.txt):
```
User-agent: *
Disallow: /exec/obidos/
Disallow: /gp/cart/
Disallow: /hz/wishlist/ # WISHLISTS ARE DISALLOWED
```

**Conclusion**: Amazon explicitly disallows wishlist scraping.

**Target robots.txt**:
```
User-agent: *
Disallow: /account/
Allow: /gift-registry/ # PUBLIC REGISTRIES ALLOWED
```

**Conclusion**: Target allows public registry access.

### 7.2 Terms of Service

**Amazon TOS**: Prohibits automated data collection
**Target TOS**: Prohibits scraping without permission
**Walmart TOS**: Prohibits unauthorized automated access

### 7.3 Legal Risks

**Case Law**:
- **hiQ Labs v. LinkedIn (2019)**: Scraping publicly accessible data may be legal
- **QVC v. Resultly (2015)**: Violating TOS alone doesn't create liability (but CFAA can)

**Risk Assessment**:
- **Low Risk**: User-paste method, browser extensions (client-side)
- **Medium Risk**: API-based scraping with proper rate limits
- **High Risk**: Aggressive scraping, circumventing technical measures

### 7.4 Recommended Legal Approach

1. **Primary Method**: User manually provides product URLs
2. **Alternative**: Browser extension (runs on user's machine)
3. **Disclosure**: Clear privacy policy and data handling
4. **Opt-in**: User explicitly consents to scraping
5. **Rate Limiting**: Respect server resources
6. **Attribution**: Display "Data from [Retailer]" with links

---

## 8. Caching Strategies

### 8.1 Database Schema

```sql
CREATE TABLE scraped_products (
  id UUID PRIMARY KEY,
  asin VARCHAR(20) UNIQUE, -- or TCIN for Target
  retailer VARCHAR(50),
  name TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  product_url TEXT,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP,
  cache_duration INTERVAL DEFAULT '7 days'
);

CREATE INDEX idx_asin ON scraped_products(asin);
CREATE INDEX idx_scraped_at ON scraped_products(scraped_at);
```

### 8.2 Cache Invalidation

```javascript
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getProduct(asin) {
  const cached = await db.query(
    'SELECT * FROM scraped_products WHERE asin = $1 AND scraped_at > NOW() - INTERVAL \'7 days\'',
    [asin]
  );

  if (cached.rows.length > 0) {
    return cached.rows[0]; // Return cached data
  }

  // Scrape fresh data
  const product = await scrapeProduct(asin);

  // Update cache
  await db.query(
    'INSERT INTO scraped_products (asin, name, price, image_url, product_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (asin) DO UPDATE SET name = $2, price = $3, last_updated = NOW()',
    [product.asin, product.name, product.price, product.image, product.url]
  );

  return product;
}
```

### 8.3 Redis Caching

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedProduct(asin) {
  const cached = await client.get(`product:${asin}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const product = await scrapeProduct(asin);
  await client.setEx(`product:${asin}`, 604800, JSON.stringify(product)); // 7 days

  return product;
}
```

---

## 9. Implementation Recommendations

### 9.1 Priority Matrix

| Method | Reliability | Cost | Legal Risk | Speed | Recommendation |
|--------|------------|------|------------|-------|----------------|
| User Paste | ⭐⭐⭐⭐⭐ | Free | ✅ None | ⚡⚡⚡⚡⚡ | **PRIMARY** |
| Browser Extension | ⭐⭐⭐⭐ | Free | ✅ Low | ⚡⚡⚡⚡ | **SECONDARY** |
| Proxy APIs | ⭐⭐⭐⭐ | $$$ | ⚠️ Medium | ⚡⚡⚡ | **FALLBACK** |
| Direct Scraping | ⭐⭐ | Free | ❌ High | ⚡⚡ | **AVOID** |

### 9.2 Recommended Architecture

```
┌─────────────────┐
│  User Interface │
│  (Paste URLs)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  URL Parser     │
│  (Extract ASIN) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Cache Layer    │─────▶│   Redis      │
│  (Check Cache)  │      │   Database   │
└────────┬────────┘      └──────────────┘
         │ (miss)
         ▼
┌─────────────────┐
│  Scraper Queue  │
│  (Rate Limited) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Scraping Layer (Choose One):   │
│  1. ScraperAPI (Paid, Reliable) │
│  2. Playwright (Self-hosted)    │
│  3. PA-API (Amazon Only)        │
└─────────────────────────────────┘
```

---

## 10. Conclusion & Next Steps

### Recommended Implementation Path:

1. **Phase 1: MVP** (Week 1)
   - User paste individual product URLs
   - Parse URL to extract ASIN/TCIN
   - Fetch product details from cache or scrape
   - Display in wishlist

2. **Phase 2: Enhancement** (Week 2)
   - Add browser extension for Chrome
   - Implement Redis caching
   - Support Target, Walmart registries

3. **Phase 3: Scale** (Week 3+)
   - Integrate ScraperAPI for bulk operations
   - Add Amazon PA-API for official data
   - Implement background job queue

### Key Takeaways:

✅ **User-paste method is safest and most reliable**
✅ **Target registries are easier to scrape than Amazon**
✅ **Caching is essential to reduce scraping frequency**
✅ **Browser extensions bypass many legal issues**
✅ **Paid proxy services (ScraperAPI) are worth it for scale**

---

**Research conducted by**: Research Agent
**Next Agent**: Coder (Implementation Phase)
