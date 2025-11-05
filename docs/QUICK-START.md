# Quick Start Guide - Wishlist Parsing

## 🚀 Fastest Way to Get Started (5 minutes)

### Step 1: Install Dependencies

```bash
npm install axios cheerio redis
```

### Step 2: User-Paste Implementation (RECOMMENDED)

```javascript
// Copy from /examples/multi-retailer-parser.js
const { MultiRetailerParser } = require('./examples/multi-retailer-parser');

const parser = new MultiRetailerParser();

// User pastes these URLs in your app
const userInput = `
  My Christmas wishlist:
  https://www.amazon.com/dp/B08N5WRWNW
  https://www.target.com/p/-/A-12345678
  https://www.walmart.com/ip/123456789
`;

// Parse and display
const result = await parser.parseUserInput(userInput);

result.successful.forEach(({ retailer, data }) => {
  console.log(`${retailer}: ${data.totalItems} items`);
  data.items.forEach(item => {
    console.log(`  - ${item.name}: ${item.price}`);
  });
});
```

**That's it!** No API keys, no scraping, 100% legal.

---

## 📋 Implementation Checklist

### Week 1: MVP (User-Paste Only)
- [ ] Add textarea for URL input in UI
- [ ] Extract product IDs (ASIN, TCIN, etc.)
- [ ] Display products (name, price, image)
- [ ] Basic error handling

### Week 2: Enhanced
- [ ] Add Target registry full parsing
- [ ] Build Chrome extension
- [ ] Add Redis caching
- [ ] Rate limiting

### Week 3: Production
- [ ] Walmart support
- [ ] Best Buy support
- [ ] Error tracking (Sentry)
- [ ] Background jobs

---

## 🎯 Example Code Snippets

### Extract Amazon ASIN

```javascript
function extractASIN(url) {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

const asin = extractASIN('https://www.amazon.com/dp/B08N5WRWNW');
// Returns: 'B08N5WRWNW'
```

### Parse Target Registry

```javascript
async function getTargetRegistry(registryId) {
  const response = await axios.get(
    `https://api.target.com/registry/v2/registry/${registryId}`,
    { headers: { Accept: 'application/json' } }
  );

  return response.data.registry_items.map(item => ({
    tcin: item.tcin,
    name: item.product_name,
    price: item.price,
    image: item.image_url,
    url: `https://www.target.com/p/-/A-${item.tcin}`
  }));
}
```

### Basic Caching

```javascript
const cache = new Map();

async function getCachedProduct(asin) {
  if (cache.has(asin)) {
    return cache.get(asin);
  }

  const product = await fetchProduct(asin);
  cache.set(asin, product);

  return product;
}
```

---

## 🔗 File Locations

- **Main Research**: `/docs/wishlist-parsing-research.md`
- **Fallback Strategies**: `/docs/fallback-strategies.md`
- **Summary**: `/docs/RESEARCH-SUMMARY.md`
- **Amazon Parser**: `/examples/amazon-parser.js`
- **Target Parser**: `/examples/target-parser.js`
- **Multi-Retailer**: `/examples/multi-retailer-parser.js`
- **Config Template**: `/config/scraping-config.example.js`

---

## 💡 Quick Tips

1. **Start Simple**: User-paste is faster to implement than scraping
2. **Cache Aggressively**: Store product details for 7 days
3. **Rate Limit**: Max 1 request/second per retailer
4. **Legal Safety**: User-paste = 100% legal, no TOS concerns
5. **Target First**: Target's API is easiest to work with

---

## 🆘 Common Issues

**Q: Amazon returns 403 Forbidden**
A: Don't scrape directly. Use user-paste or paid API.

**Q: Target registry not found**
A: Make sure it's public (privacy settings).

**Q: How to handle private wishlists?**
A: Build browser extension (runs on user's machine).

**Q: Best way to reduce costs?**
A: Cache everything, use user-paste primarily.

---

## 📞 Need Help?

1. Read `/docs/wishlist-parsing-research.md` (32 pages, deep dive)
2. Check `/docs/fallback-strategies.md` (28 pages, implementation)
3. Review code examples in `/examples/`

**Time to implement MVP**: 1-2 weeks
**Cost**: $0-40/month (with caching)
**Success rate**: 95%+ (with fallbacks)

Good luck! 🎄
