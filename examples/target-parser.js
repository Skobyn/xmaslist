/**
 * Target Registry Parser - Multiple Implementation Strategies
 *
 * Target allows public registry scraping (see robots.txt)
 * Registries are easier to parse than Amazon (server-rendered, cleaner HTML)
 */

const axios = require('axios');
const cheerio = require('cheerio');

// ============================================================================
// STRATEGY 1: Target Unofficial API (RECOMMENDED)
// ============================================================================

/**
 * Parse Target registry using their internal API
 *
 * This is the BEST approach for Target:
 * - Clean JSON response
 * - No HTML parsing needed
 * - Fast and reliable
 * - Less likely to break with UI changes
 */
async function parseTargetRegistryAPI(registryId) {
  const apiUrl = `https://api.target.com/registry/v2/registry/${registryId}`;

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  try {
    const response = await axios.get(apiUrl, { headers });
    const data = response.data;

    if (!data.registry_items) {
      throw new Error('Invalid registry or no items found');
    }

    const items = data.registry_items.map(item => ({
      tcin: item.tcin,
      name: item.product_name || item.title,
      price: item.price || null,
      image: item.image_url || item.images?.primary || null,
      url: item.product_url
        ? `https://www.target.com${item.product_url}`
        : `https://www.target.com/p/-/A-${item.tcin}`,
      quantityRequested: item.quantity_requested || 1,
      quantityPurchased: item.quantity_purchased || 0,
      category: item.category || null,
      description: item.description || null,
    }));

    return {
      registryId,
      registryType: data.registry_type || 'unknown',
      registryOwner: data.registry_owner || null,
      eventDate: data.event_date || null,
      items,
      totalItems: items.length,
      method: 'Target API',
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Registry not found. Make sure it\'s public.');
    }
    throw new Error(`Target API Error: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 2: HTML Scraping (Fallback)
// ============================================================================

/**
 * Parse Target registry by scraping HTML
 * Use this if the API approach fails
 */
async function parseTargetRegistryHTML(registryUrl) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    const response = await axios.get(registryUrl, { headers });
    const $ = cheerio.load(response.data);

    const items = [];

    // Target uses data-test attributes (stable for scraping)
    $('[data-test="registry-item"]').each((i, elem) => {
      const $item = $(elem);

      // Extract TCIN from product link
      const productLink = $item.find('a[href*="/p/"]').attr('href');
      const tcinMatch = productLink?.match(/A-(\d+)/);
      const tcin = tcinMatch ? tcinMatch[1] : null;

      const name = $item.find('[data-test="item-title"]').text().trim();
      const priceText = $item.find('[data-test="current-price"]').text().trim();
      const price = parseFloat(priceText.replace(/[$,]/g, '')) || null;
      const image = $item.find('img').attr('src');
      const qtyRequested = parseInt($item.find('[data-test="quantity-needed"]').text()) || 1;
      const qtyPurchased = parseInt($item.find('[data-test="quantity-purchased"]').text()) || 0;

      if (tcin) {
        items.push({
          tcin,
          name,
          price,
          image,
          url: `https://www.target.com${productLink}`,
          quantityRequested: qtyRequested,
          quantityPurchased: qtyPurchased,
        });
      }
    });

    // Extract registry metadata
    const registryOwner = $('[data-test="registry-owner"]').text().trim();
    const eventDate = $('[data-test="event-date"]').text().trim();

    return {
      registryUrl,
      registryOwner,
      eventDate,
      items,
      totalItems: items.length,
      method: 'HTML Scraping',
    };
  } catch (error) {
    throw new Error(`HTML Scraping Error: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 3: Extract TCIN from Product URLs
// ============================================================================

/**
 * Extract TCIN (Target Catalog Item Number) from Target product URLs
 *
 * Supported formats:
 * - https://www.target.com/p/product-name/-/A-12345678
 * - https://www.target.com/p/-/A-12345678
 */
function extractTCIN(url) {
  const patterns = [
    /\/A-(\d{8,})/,              // Standard format
    /\/p\/[^/]+\/(\d{8,})/,      // Alternate format
    /tcin=(\d{8,})/,             // Query parameter format
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
 * Extract multiple TCINs from text
 */
function extractMultipleTCINs(text) {
  const urlPattern = /https?:\/\/(www\.)?target\.com\/[^\s]+/gi;
  const urls = text.match(urlPattern) || [];

  const tcins = new Set();
  urls.forEach(url => {
    const tcin = extractTCIN(url);
    if (tcin) tcins.add(tcin);
  });

  return Array.from(tcins);
}

// ============================================================================
// STRATEGY 4: Get Product Details by TCIN
// ============================================================================

/**
 * Fetch detailed product information by TCIN
 */
async function getProductDetailsByTCIN(tcin) {
  const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1`;

  const params = {
    key: 'ff457966e64d5e877fdbad070f276d18ecec4a01', // Public API key
    tcin: tcin,
    pricing_store_id: '3991', // Default store (can be parameterized)
  };

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  try {
    const response = await axios.get(apiUrl, { params, headers });
    const product = response.data.data.product;

    return {
      tcin: tcin,
      name: product.item.product_description.title,
      price: product.price.current_retail || null,
      image: product.item.enrichment.images.primary_image_url,
      url: `https://www.target.com${product.item.enrichment.buy_url}`,
      brand: product.item.product_brand?.brand || null,
      rating: product.item.ratings_and_reviews?.statistics?.rating?.average || null,
      reviewCount: product.item.ratings_and_reviews?.statistics?.rating?.count || 0,
      inStock: product.available_to_promise_network?.availability_status === 'IN_STOCK',
      description: product.item.product_description?.downstream_description || null,
      features: product.item.product_description?.bullet_descriptions || [],
    };
  } catch (error) {
    throw new Error(`Target Product API Error: ${error.message}`);
  }
}

// ============================================================================
// STRATEGY 5: Browser Extension (Client-Side)
// ============================================================================

/**
 * Content script for Chrome extension
 * Runs on user's browser when visiting Target registry
 */
const browserExtensionContentScript = `
// content.js - Inject into Target registry pages
(function() {
  function extractTargetRegistry() {
    const items = [];

    document.querySelectorAll('[data-test="registry-item"]').forEach(el => {
      const link = el.querySelector('a[href*="/p/"]')?.href;
      const tcin = link?.match(/A-(\\d+)/)?.[1];
      const name = el.querySelector('[data-test="item-title"]')?.textContent.trim();
      const price = el.querySelector('[data-test="current-price"]')?.textContent.trim();
      const image = el.querySelector('img')?.src;
      const qtyNeeded = el.querySelector('[data-test="quantity-needed"]')?.textContent.trim();
      const qtyPurchased = el.querySelector('[data-test="quantity-purchased"]')?.textContent.trim();

      if (tcin) {
        items.push({
          tcin,
          name,
          price,
          image,
          url: link,
          quantityRequested: parseInt(qtyNeeded) || 1,
          quantityPurchased: parseInt(qtyPurchased) || 0,
        });
      }
    });

    return items;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractRegistry') {
      const data = extractTargetRegistry();
      sendResponse({ items: data });
    }
  });
})();
`;

// ============================================================================
// CACHING LAYER
// ============================================================================

/**
 * Cache Target product data
 */
class TargetProductCache {
  constructor(redisClient) {
    this.redis = redisClient;
    this.CACHE_TTL = 7 * 24 * 60 * 60; // 7 days
  }

  async get(tcin) {
    const cached = await this.redis.get(`target:product:${tcin}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async set(tcin, data) {
    await this.redis.setEx(
      `target:product:${tcin}`,
      this.CACHE_TTL,
      JSON.stringify(data)
    );
  }

  async getRegistry(registryId) {
    const cached = await this.redis.get(`target:registry:${registryId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setRegistry(registryId, data) {
    await this.redis.setEx(
      `target:registry:${registryId}`,
      24 * 60 * 60, // 24 hours (registries change more frequently)
      JSON.stringify(data)
    );
  }
}

// ============================================================================
// UNIFIED INTERFACE
// ============================================================================

/**
 * High-level Target parser with automatic fallback
 */
class TargetRegistryParser {
  constructor(config = {}) {
    this.config = {
      cache: config.cache || null,
      preferredMethod: config.preferredMethod || 'api',
    };
  }

  /**
   * Parse registry with automatic method selection
   */
  async parseRegistry(input) {
    // Extract registry ID from URL if provided
    let registryId = input;
    if (input.includes('target.com')) {
      const match = input.match(/registry\/[^/]+\/([a-zA-Z0-9]+)/);
      registryId = match ? match[1] : null;
    }

    if (!registryId) {
      throw new Error('Invalid registry ID or URL');
    }

    // Check cache first
    if (this.config.cache) {
      const cached = await this.config.cache.getRegistry(registryId);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // Try API method first (preferred)
    try {
      const result = await parseTargetRegistryAPI(registryId);

      if (this.config.cache) {
        await this.config.cache.setRegistry(registryId, result);
      }

      return result;
    } catch (error) {
      console.error('API method failed:', error.message);
    }

    // Fallback to HTML scraping
    try {
      const registryUrl = `https://www.target.com/gift-registry/${registryId}`;
      const result = await parseTargetRegistryHTML(registryUrl);

      if (this.config.cache) {
        await this.config.cache.setRegistry(registryId, result);
      }

      return result;
    } catch (error) {
      throw new Error(`All parsing methods failed: ${error.message}`);
    }
  }

  /**
   * Get product details by TCIN
   */
  async getProductDetails(tcin) {
    // Check cache
    if (this.config.cache) {
      const cached = await this.config.cache.get(tcin);
      if (cached) return { ...cached, cached: true };
    }

    const product = await getProductDetailsByTCIN(tcin);

    // Cache result
    if (this.config.cache) {
      await this.config.cache.set(tcin, product);
    }

    return product;
  }

  /**
   * Parse user-pasted product URLs
   */
  async parseProductUrls(text) {
    const tcins = extractMultipleTCINs(text);

    if (tcins.length === 0) {
      throw new Error('No valid Target product URLs found');
    }

    const products = await Promise.all(
      tcins.map(tcin => this.getProductDetails(tcin))
    );

    return {
      items: products,
      totalItems: products.length,
      method: 'user-paste',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  parseTargetRegistryAPI,
  parseTargetRegistryHTML,
  extractTCIN,
  extractMultipleTCINs,
  getProductDetailsByTCIN,
  TargetProductCache,
  TargetRegistryParser,
  browserExtensionContentScript,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Parse public registry (RECOMMENDED)
 */
async function example1_ParseRegistry() {
  const parser = new TargetRegistryParser();

  // Option A: Registry ID
  const result1 = await parser.parseRegistry('abc123def456');

  // Option B: Full URL
  const result2 = await parser.parseRegistry('https://www.target.com/gift-registry/abc123def456');

  console.log('Registry items:', result1.items);
  console.log('Total items:', result1.totalItems);
}

/**
 * Example 2: Parse user-pasted URLs
 */
async function example2_UserPaste() {
  const parser = new TargetRegistryParser();

  const userInput = `
    I want these items:
    https://www.target.com/p/product-name/-/A-12345678
    https://www.target.com/p/-/A-87654321
  `;

  const result = await parser.parseProductUrls(userInput);
  console.log('Products:', result.items);
}

/**
 * Example 3: With caching
 */
async function example3_WithCache() {
  const redis = require('redis');
  const redisClient = redis.createClient();
  await redisClient.connect();

  const cache = new TargetProductCache(redisClient);
  const parser = new TargetRegistryParser({ cache });

  const result = await parser.parseRegistry('abc123def456');
  console.log('Registry:', result);

  // Second call uses cache
  const cachedResult = await parser.parseRegistry('abc123def456');
  console.log('Cached:', cachedResult.cached); // true
}

/**
 * Example 4: Get single product details
 */
async function example4_SingleProduct() {
  const parser = new TargetRegistryParser();

  const product = await parser.getProductDetails('12345678');
  console.log('Product:', product);
}

// Uncomment to test:
// example1_ParseRegistry();
// example2_UserPaste();
