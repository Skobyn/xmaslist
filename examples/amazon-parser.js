/**
 * Amazon Wishlist Parser - Multiple Implementation Strategies
 *
 * WARNING: Amazon's robots.txt disallows wishlist scraping.
 * These examples are for educational purposes and fallback scenarios.
 * PRIMARY RECOMMENDATION: User-paste method or browser extension.
 */

const axios = require('axios');
const cheerio = require('cheerio');

// ============================================================================
// STRATEGY 1: URL Parser (Extract ASIN from Product URLs)
// ============================================================================

/**
 * Extract ASIN from Amazon product URLs
 * This is the RECOMMENDED approach - user pastes individual product URLs
 *
 * Supported URL formats:
 * - https://www.amazon.com/dp/B08N5WRWNW
 * - https://www.amazon.com/product-name/dp/B08N5WRWNW
 * - https://www.amazon.com/gp/product/B08N5WRWNW
 * - https://amzn.to/3xYz123 (short links)
 */
function extractASIN(url) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,           // Standard product page
    /\/gp\/product\/([A-Z0-9]{10})/,  // Alternate format
    /\/product\/([A-Z0-9]{10})/,       // Short format
    /\/ASIN\/([A-Z0-9]{10})/,          // Direct ASIN format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract multiple ASINs from text (user pastes list of URLs)
 */
function extractMultipleASINs(text) {
  const urlPattern = /https?:\/\/(www\.)?amazon\.[a-z.]+\/[^\s]+/gi;
  const urls = text.match(urlPattern) || [];

  const asins = new Set(); // Use Set to avoid duplicates
  urls.forEach(url => {
    const asin = extractASIN(url);
    if (asin) asins.add(asin);
  });

  return Array.from(asins);
}

// ============================================================================
// STRATEGY 2: Amazon Product Advertising API (PA-API 5.0)
// ============================================================================

/**
 * Fetch product details using official Amazon PA-API
 *
 * REQUIREMENTS:
 * - Amazon Associates account
 * - 3 qualified sales in 180 days
 * - API credentials (Access Key, Secret Key, Partner Tag)
 *
 * Install: npm install amazon-paapi
 */
async function getProductDetailsPA_API(asin) {
  // NOTE: Requires amazon-paapi package
  // const { amazonPaapi } = require('amazon-paapi');

  const credentials = {
    accessKey: process.env.AMAZON_ACCESS_KEY,
    secretKey: process.env.AMAZON_SECRET_KEY,
    partnerTag: process.env.AMAZON_PARTNER_TAG,
  };

  const params = {
    resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'ItemInfo.Features',
      'ItemInfo.ByLineInfo',
    ],
  };

  try {
    // const data = await amazonPaapi.getItems(credentials, {
    //   itemIds: [asin],
    //   itemIdType: 'ASIN',
    //   ...params
    // });

    // return {
    //   asin: asin,
    //   name: data.ItemsResult.Items[0].ItemInfo.Title.DisplayValue,
    //   price: data.ItemsResult.Items[0].Offers.Listings[0].Price.DisplayAmount,
    //   image: data.ItemsResult.Items[0].Images.Primary.Large.URL,
    //   url: data.ItemsResult.Items[0].DetailPageURL,
    //   features: data.ItemsResult.Items[0].ItemInfo.Features.DisplayValues
    // };

    return {
      method: 'PA-API',
      note: 'Requires amazon-paapi package and valid credentials',
      asin
    };
  } catch (error) {
    throw new Error(`PA-API Error: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 3: Rainforest API (Third-Party Service)
// ============================================================================

/**
 * Parse wishlist using Rainforest API
 * Cost: $0.005 - $0.02 per request
 * https://www.rainforestapi.com/
 */
async function scrapeWishlistRainforest(wishlistId) {
  const API_KEY = process.env.RAINFOREST_API_KEY;

  const params = {
    api_key: API_KEY,
    type: 'wishlist',
    amazon_domain: 'amazon.com',
    url: `https://www.amazon.com/hz/wishlist/ls/${wishlistId}`,
  };

  try {
    const response = await axios.get('https://api.rainforestapi.com/request', { params });

    const items = response.data.wishlist_results.map(item => ({
      asin: item.asin,
      name: item.title,
      price: item.price?.value || null,
      priceRaw: item.price?.raw || 'N/A',
      image: item.image,
      url: item.link,
      rating: item.rating,
      ratingsTotal: item.ratings_total,
      inStock: item.availability?.raw !== 'Currently unavailable',
    }));

    return {
      wishlistId,
      items,
      totalItems: items.length,
      method: 'Rainforest API',
    };
  } catch (error) {
    throw new Error(`Rainforest API Error: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 4: ScraperAPI (Proxy Service)
// ============================================================================

/**
 * Scrape wishlist using ScraperAPI
 * Cost: $49/month for 1M requests
 * https://www.scraperapi.com/
 */
async function scrapeWishlistScraperAPI(wishlistUrl) {
  const API_KEY = process.env.SCRAPER_API_KEY;

  const apiUrl = 'http://api.scraperapi.com';
  const params = {
    api_key: API_KEY,
    url: wishlistUrl,
    render: true, // Enable JavaScript rendering
    country_code: 'us',
  };

  try {
    const response = await axios.get(apiUrl, { params });
    const html = response.data;

    // Parse HTML with Cheerio
    const items = parseAmazonWishlistHTML(html);

    return {
      items,
      method: 'ScraperAPI',
      source: wishlistUrl,
    };
  } catch (error) {
    throw new Error(`ScraperAPI Error: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 5: Direct Scraping with Puppeteer (NOT RECOMMENDED)
// ============================================================================

/**
 * Direct scraping using Puppeteer
 *
 * ⚠️ WARNING: This violates Amazon's robots.txt and TOS
 * High risk of IP blocking and CAPTCHA challenges
 * Use only for testing in development
 */
async function scrapeWishlistPuppeteer(wishlistUrl) {
  // Puppeteer is imported only if needed
  // const puppeteer = require('puppeteer');

  try {
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: [
    //     '--no-sandbox',
    //     '--disable-setuid-sandbox',
    //     '--disable-dev-shm-usage',
    //     '--disable-accelerated-2d-canvas',
    //     '--disable-gpu',
    //   ],
    // });

    // const page = await browser.newPage();

    // // Anti-detection measures
    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    // await page.setViewport({ width: 1920, height: 1080 });

    // // Set extra headers
    // await page.setExtraHTTPHeaders({
    //   'Accept-Language': 'en-US,en;q=0.9',
    //   'Accept-Encoding': 'gzip, deflate, br',
    //   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    // });

    // await page.goto(wishlistUrl, {
    //   waitUntil: 'networkidle2',
    //   timeout: 30000
    // });

    // // Wait for wishlist items to load
    // await page.waitForSelector('[data-itemid]', { timeout: 10000 });

    // // Scroll to load all items (infinite scroll)
    // await autoScroll(page);

    // // Extract product data
    // const items = await page.evaluate(() => {
    //   const products = [];
    //   document.querySelectorAll('[data-itemid]').forEach(item => {
    //     const asin = item.getAttribute('data-itemid');
    //     const nameEl = item.querySelector('h3 a, [data-test="item-title"] a');
    //     const priceEl = item.querySelector('.a-price .a-offscreen, [data-test="current-price"]');
    //     const imageEl = item.querySelector('img');
    //     const linkEl = item.querySelector('a[href*="/dp/"]');

    //     if (asin) {
    //       products.push({
    //         asin,
    //         name: nameEl?.textContent.trim() || 'Unknown',
    //         price: priceEl?.textContent.trim() || null,
    //         image: imageEl?.src || null,
    //         url: linkEl?.href || `https://www.amazon.com/dp/${asin}`,
    //       });
    //     }
    //   });
    //   return products;
    // });

    // await browser.close();

    // return {
    //   items,
    //   method: 'Puppeteer Direct Scraping',
    //   warning: 'This method violates Amazon TOS and robots.txt',
    // };

    return {
      method: 'Puppeteer',
      note: 'Requires puppeteer package. Not recommended due to TOS violations.',
      url: wishlistUrl
    };
  } catch (error) {
    throw new Error(`Puppeteer Error: ${error.message}`);
  }
}

/**
 * Auto-scroll helper for infinite scroll pages
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          setTimeout(resolve, 1000); // Wait for final lazy-load
        }
      }, 100);
    });
  });
}

// ============================================================================
// HELPER: Parse Amazon Wishlist HTML (for ScraperAPI response)
// ============================================================================

function parseAmazonWishlistHTML(html) {
  const $ = cheerio.load(html);
  const items = [];

  // Amazon's wishlist item selectors (as of 2025)
  $('[data-itemid]').each((i, elem) => {
    const $item = $(elem);

    const asin = $item.attr('data-itemid');
    const name = $item.find('h3 a, [data-test="item-title"] a').text().trim();
    const priceOffscreen = $item.find('.a-price .a-offscreen').first().text().trim();
    const image = $item.find('img').attr('src');
    const productLink = $item.find('a[href*="/dp/"]').attr('href');

    if (asin) {
      items.push({
        asin,
        name: name || 'Unknown Product',
        price: priceOffscreen || null,
        image: image || null,
        url: productLink ? `https://www.amazon.com${productLink}` : `https://www.amazon.com/dp/${asin}`,
      });
    }
  });

  return items;
}

// ============================================================================
// STRATEGY 6: Browser Extension Approach (Client-Side)
// ============================================================================

/**
 * Content script for Chrome extension
 * This runs on the user's browser when they visit Amazon wishlist
 *
 * Advantages:
 * - No server-side scraping (legal gray area avoided)
 * - Uses user's authentication (can access private wishlists)
 * - No proxy costs
 * - Bypasses anti-bot measures
 */
const browserExtensionContentScript = `
// content.js - Inject this into Amazon wishlist pages
(function() {
  function extractWishlistData() {
    const items = [];

    document.querySelectorAll('[data-itemid]').forEach(el => {
      const asin = el.getAttribute('data-itemid');
      const name = el.querySelector('h3 a')?.textContent.trim();
      const price = el.querySelector('.a-price .a-offscreen')?.textContent.trim();
      const image = el.querySelector('img')?.src;
      const url = el.querySelector('a[href*="/dp/"]')?.href;

      if (asin) {
        items.push({ asin, name, price, image, url });
      }
    });

    return items;
  }

  // Listen for message from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractWishlist') {
      const data = extractWishlistData();
      sendResponse({ items: data });
    }
  });
})();
`;

// ============================================================================
// CACHING LAYER
// ============================================================================

/**
 * Cache product data to reduce API calls
 */
class ProductCache {
  constructor(redisClient) {
    this.redis = redisClient;
    this.CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  }

  async get(asin) {
    const cached = await this.redis.get(`product:${asin}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async set(asin, data) {
    await this.redis.setEx(
      `product:${asin}`,
      this.CACHE_TTL,
      JSON.stringify(data)
    );
  }

  async getOrFetch(asin, fetchFunction) {
    let product = await this.get(asin);

    if (!product) {
      product = await fetchFunction(asin);
      await this.set(asin, product);
    }

    return product;
  }
}

// ============================================================================
// UNIFIED INTERFACE
// ============================================================================

/**
 * High-level API that tries multiple strategies with fallbacks
 */
class AmazonWishlistParser {
  constructor(config = {}) {
    this.config = {
      preferredMethod: config.preferredMethod || 'user-paste',
      rainforestApiKey: config.rainforestApiKey || process.env.RAINFOREST_API_KEY,
      scraperApiKey: config.scraperApiKey || process.env.SCRAPER_API_KEY,
      amazonPaApiKeys: config.amazonPaApiKeys || {
        accessKey: process.env.AMAZON_ACCESS_KEY,
        secretKey: process.env.AMAZON_SECRET_KEY,
        partnerTag: process.env.AMAZON_PARTNER_TAG,
      },
      cache: config.cache || null,
    };
  }

  /**
   * Parse wishlist with automatic fallback strategy
   */
  async parseWishlist(input) {
    // Strategy 1: User-pasted URLs (RECOMMENDED)
    if (typeof input === 'string' && input.includes('amazon.com')) {
      const asins = extractMultipleASINs(input);

      if (asins.length > 0) {
        const products = await Promise.all(
          asins.map(asin => this.getProductDetails(asin))
        );

        return {
          items: products.filter(p => p !== null),
          method: 'user-paste',
          totalItems: products.length,
        };
      }
    }

    // Strategy 2: Wishlist ID provided - use paid API
    if (input.length === 13 && /^[A-Z0-9]+$/.test(input)) {
      const wishlistId = input;

      // Try Rainforest API first
      if (this.config.rainforestApiKey) {
        try {
          return await scrapeWishlistRainforest(wishlistId);
        } catch (error) {
          console.error('Rainforest API failed:', error.message);
        }
      }

      // Fallback to ScraperAPI
      if (this.config.scraperApiKey) {
        try {
          const url = `https://www.amazon.com/hz/wishlist/ls/${wishlistId}`;
          return await scrapeWishlistScraperAPI(url);
        } catch (error) {
          console.error('ScraperAPI failed:', error.message);
        }
      }

      throw new Error('No valid API keys provided for wishlist scraping');
    }

    throw new Error('Invalid input. Provide wishlist ID or product URLs.');
  }

  /**
   * Get product details by ASIN
   */
  async getProductDetails(asin) {
    // Check cache first
    if (this.config.cache) {
      const cached = await this.config.cache.get(asin);
      if (cached) return cached;
    }

    // Try PA-API (official, most reliable)
    if (this.config.amazonPaApiKeys.accessKey) {
      try {
        const product = await getProductDetailsPA_API(asin);
        if (this.config.cache) await this.config.cache.set(asin, product);
        return product;
      } catch (error) {
        console.error('PA-API failed:', error.message);
      }
    }

    // Fallback: Basic product info (construct URL)
    const product = {
      asin,
      name: null,
      price: null,
      image: null,
      url: `https://www.amazon.com/dp/${asin}`,
      method: 'basic',
      note: 'Full details require API access',
    };

    if (this.config.cache) await this.config.cache.set(asin, product);
    return product;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  extractASIN,
  extractMultipleASINs,
  getProductDetailsPA_API,
  scrapeWishlistRainforest,
  scrapeWishlistScraperAPI,
  scrapeWishlistPuppeteer,
  parseAmazonWishlistHTML,
  ProductCache,
  AmazonWishlistParser,
  browserExtensionContentScript,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: User-paste method (RECOMMENDED)
 */
async function example1_UserPaste() {
  const userInput = `
    Check out these products I want:
    https://www.amazon.com/dp/B08N5WRWNW
    https://www.amazon.com/Cool-Product/dp/B09XYZ1234
    Also this one: https://amzn.to/3abc123
  `;

  const asins = extractMultipleASINs(userInput);
  console.log('Extracted ASINs:', asins);
  // Output: ['B08N5WRWNW', 'B09XYZ1234', ...]
}

/**
 * Example 2: Using unified parser
 */
async function example2_UnifiedParser() {
  const parser = new AmazonWishlistParser({
    preferredMethod: 'rainforest',
    rainforestApiKey: 'YOUR_API_KEY',
  });

  // Option A: Parse pasted URLs
  const result1 = await parser.parseWishlist('https://www.amazon.com/dp/B08N5WRWNW');

  // Option B: Parse wishlist by ID (requires paid API)
  const result2 = await parser.parseWishlist('2ABCDEF123456');

  console.log(result1.items);
}

/**
 * Example 3: With caching
 */
async function example3_WithCache() {
  const redis = require('redis');
  const redisClient = redis.createClient();
  await redisClient.connect();

  const cache = new ProductCache(redisClient);

  const parser = new AmazonWishlistParser({ cache });

  const product = await parser.getProductDetails('B08N5WRWNW');
  console.log('Product:', product);

  // Second call uses cache (faster)
  const cachedProduct = await parser.getProductDetails('B08N5WRWNW');
}

// Uncomment to test:
// example1_UserPaste();
