/**
 * Multi-Retailer Parser - Unified interface for parsing wishlists/registries
 * from Amazon, Target, Walmart, Etsy, Best Buy, and others
 */

const { AmazonWishlistParser } = require('./amazon-parser');
const { TargetRegistryParser } = require('./target-parser');

// ============================================================================
// WALMART REGISTRY PARSER
// ============================================================================

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Parse Walmart registry using __NEXT_DATA__ extraction
 */
async function parseWalmartRegistry(registryUrl) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml',
  };

  try {
    const response = await axios.get(registryUrl, { headers });
    const $ = cheerio.load(response.data);

    // Walmart uses Next.js with embedded JSON data
    const scriptData = $('#__NEXT_DATA__').html();

    if (!scriptData) {
      throw new Error('Could not find __NEXT_DATA__ script. Registry may be private or invalid.');
    }

    const pageData = JSON.parse(scriptData);
    const registryData = pageData.props?.pageProps?.registryData;

    if (!registryData) {
      throw new Error('No registry data found in page');
    }

    const items = (registryData.items || []).map(item => ({
      usItemId: item.usItemId,
      name: item.name || item.productName,
      price: item.price || null,
      image: item.imageUrl || item.thumbnailUrl,
      url: `https://www.walmart.com/ip/${item.usItemId}`,
      quantityRequested: item.quantity || 1,
      quantityPurchased: item.purchased || 0,
      inStock: item.availabilityStatus === 'IN_STOCK',
      brand: item.brand || null,
    }));

    return {
      registryId: registryData.registryId,
      registryType: registryData.registryType || 'unknown',
      registryOwner: registryData.registrantInfo?.name || null,
      eventDate: registryData.eventDate || null,
      items,
      totalItems: items.length,
      method: 'Walmart __NEXT_DATA__ Extraction',
    };
  } catch (error) {
    throw new Error(`Walmart Registry Error: ${error.message}`);
  }
}

/**
 * Extract Walmart product ID from URL
 */
function extractWalmartProductId(url) {
  const patterns = [
    /\/ip\/[^/]+\/(\d+)/,     // Standard format
    /\/(\d{8,})/,             // Direct ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// ============================================================================
// ETSY WISHLIST PARSER
// ============================================================================

/**
 * Parse Etsy favorites/wishlist
 * Note: Most Etsy favorites require authentication
 */
async function parseEtsyFavorites(username) {
  const url = `https://www.etsy.com/people/${username}/favorites`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  try {
    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const items = [];

    $('[data-listing-id]').each((i, elem) => {
      const $item = $(elem);

      const listingId = $item.attr('data-listing-id');
      const name = $item.find('.v2-listing-card__title').text().trim();
      const priceText = $item.find('.currency-value').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null;
      const image = $item.find('img').attr('src');
      const link = $item.find('a[href*="/listing/"]').attr('href');

      if (listingId) {
        items.push({
          listingId,
          name,
          price,
          image,
          url: link?.startsWith('http') ? link : `https://www.etsy.com${link}`,
        });
      }
    });

    return {
      username,
      items,
      totalItems: items.length,
      method: 'Etsy HTML Scraping',
      note: 'May require authentication for private favorites',
    };
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Etsy favorites are private. User must share public link or individual items.');
    }
    throw new Error(`Etsy Parser Error: ${error.message}`);
  }
}

// ============================================================================
// BEST BUY REGISTRY PARSER
// ============================================================================

/**
 * Parse Best Buy registry
 */
async function parseBestBuyRegistry(registryUrl) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  try {
    const response = await axios.get(registryUrl, { headers });
    const $ = cheerio.load(response.data);

    const items = [];

    $('.registry-item').each((i, elem) => {
      const $item = $(elem);

      const skuMatch = $item.find('a[href*="/site/"]').attr('href')?.match(/\/(\d+)\.p/);
      const sku = skuMatch ? skuMatch[1] : null;

      const name = $item.find('.item-title').text().trim();
      const priceText = $item.find('.priceView-customer-price span').text().trim();
      const price = parseFloat(priceText.replace(/[$,]/g, '')) || null;
      const image = $item.find('img').attr('src');
      const qtyRequested = parseInt($item.find('.quantity-requested').text()) || 1;
      const qtyPurchased = parseInt($item.find('.quantity-purchased').text()) || 0;

      if (sku) {
        items.push({
          sku,
          name,
          price,
          image,
          url: `https://www.bestbuy.com/site/${sku}.p`,
          quantityRequested: qtyRequested,
          quantityPurchased: qtyPurchased,
        });
      }
    });

    return {
      registryUrl,
      items,
      totalItems: items.length,
      method: 'Best Buy HTML Scraping',
    };
  } catch (error) {
    throw new Error(`Best Buy Parser Error: ${error.message}`);
  }
}

// ============================================================================
// MYREGISTRY.COM PARSER (Universal Registry Aggregator)
// ============================================================================

/**
 * Parse MyRegistry.com universal registry
 * This is useful because it aggregates items from multiple retailers
 */
async function parseMyRegistry(username) {
  const url = `https://www.myregistry.com/${username}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  try {
    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const items = [];

    $('.registry-item').each((i, elem) => {
      const $item = $(elem);

      const name = $item.find('.item-name').text().trim();
      const priceText = $item.find('.item-price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null;
      const image = $item.find('img').attr('src');
      const retailer = $item.find('.item-retailer').text().trim();
      const productUrl = $item.find('a.item-link').attr('href');

      items.push({
        name,
        price,
        image,
        url: productUrl,
        retailer, // e.g., "Amazon", "Target", "Walmart"
      });
    });

    return {
      username,
      items,
      totalItems: items.length,
      method: 'MyRegistry.com Aggregator',
    };
  } catch (error) {
    throw new Error(`MyRegistry Parser Error: ${error.message}`);
  }
}

// ============================================================================
// URL DETECTOR - Identify Retailer from URL
// ============================================================================

/**
 * Detect which retailer a URL belongs to
 */
function detectRetailer(url) {
  const retailers = {
    amazon: /amazon\.(com|ca|co\.uk|de|fr|it|es|jp|cn|in|com\.au|com\.mx)/i,
    target: /target\.com/i,
    walmart: /walmart\.com/i,
    etsy: /etsy\.com/i,
    bestbuy: /bestbuy\.com/i,
    myregistry: /myregistry\.com/i,
  };

  for (const [retailer, pattern] of Object.entries(retailers)) {
    if (pattern.test(url)) {
      return retailer;
    }
  }

  return 'unknown';
}

// ============================================================================
// UNIFIED MULTI-RETAILER PARSER
// ============================================================================

/**
 * Universal parser that automatically detects retailer and uses appropriate method
 */
class MultiRetailerParser {
  constructor(config = {}) {
    this.amazonParser = new AmazonWishlistParser(config.amazon || {});
    this.targetParser = new TargetRegistryParser(config.target || {});
    this.config = config;
  }

  /**
   * Parse any wishlist/registry URL
   */
  async parse(input) {
    const retailer = detectRetailer(input);

    switch (retailer) {
      case 'amazon':
        return await this.amazonParser.parseWishlist(input);

      case 'target':
        return await this.targetParser.parseRegistry(input);

      case 'walmart':
        return await parseWalmartRegistry(input);

      case 'etsy':
        // Extract username from URL
        const etsyMatch = input.match(/etsy\.com\/people\/([^/]+)/);
        const username = etsyMatch ? etsyMatch[1] : input;
        return await parseEtsyFavorites(username);

      case 'bestbuy':
        return await parseBestBuyRegistry(input);

      case 'myregistry':
        const myRegistryMatch = input.match(/myregistry\.com\/([^/]+)/);
        const myRegistryUser = myRegistryMatch ? myRegistryMatch[1] : input;
        return await parseMyRegistry(myRegistryUser);

      default:
        throw new Error(`Unsupported retailer: ${retailer}. URL: ${input}`);
    }
  }

  /**
   * Parse multiple URLs from different retailers
   */
  async parseMultiple(urls) {
    const results = await Promise.allSettled(
      urls.map(url => this.parse(url))
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push({
          url: urls[index],
          retailer: detectRetailer(urls[index]),
          data: result.value,
        });
      } else {
        failed.push({
          url: urls[index],
          retailer: detectRetailer(urls[index]),
          error: result.reason.message,
        });
      }
    });

    return {
      successful,
      failed,
      totalProcessed: urls.length,
      successRate: (successful.length / urls.length) * 100,
    };
  }

  /**
   * Parse user-pasted text containing product URLs from various retailers
   */
  async parseUserInput(text) {
    // Extract all URLs from text
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlPattern) || [];

    if (urls.length === 0) {
      throw new Error('No valid URLs found in input text');
    }

    return await this.parseMultiple(urls);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  parseWalmartRegistry,
  extractWalmartProductId,
  parseEtsyFavorites,
  parseBestBuyRegistry,
  parseMyRegistry,
  detectRetailer,
  MultiRetailerParser,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Parse single registry/wishlist
 */
async function example1_SingleRetailer() {
  const parser = new MultiRetailerParser();

  // Automatically detects retailer
  const amazonResult = await parser.parse('https://www.amazon.com/hz/wishlist/ls/ABC123DEF456');
  const targetResult = await parser.parse('https://www.target.com/gift-registry/xyz789');
  const walmartResult = await parser.parse('https://www.walmart.com/registry/wedding/123456');

  console.log('Amazon items:', amazonResult.items);
  console.log('Target items:', targetResult.items);
  console.log('Walmart items:', walmartResult.items);
}

/**
 * Example 2: Parse user-pasted URLs from multiple retailers
 */
async function example2_UserPaste() {
  const parser = new MultiRetailerParser();

  const userInput = `
    Here are my wishlists:
    Amazon: https://www.amazon.com/hz/wishlist/ls/ABC123
    Target: https://www.target.com/gift-registry/xyz789
    Walmart: https://www.walmart.com/registry/baby/456789

    And individual products I like:
    https://www.amazon.com/dp/B08N5WRWNW
    https://www.target.com/p/-/A-12345678
  `;

  const result = await parser.parseUserInput(userInput);

  console.log('Successful parses:', result.successful.length);
  console.log('Failed parses:', result.failed.length);
  console.log('Success rate:', result.successRate.toFixed(2) + '%');

  // Process all items
  const allItems = result.successful.flatMap(r => r.data.items);
  console.log('Total items across all retailers:', allItems.length);
}

/**
 * Example 3: Batch process multiple registries
 */
async function example3_BatchProcess() {
  const parser = new MultiRetailerParser({
    amazon: {
      rainforestApiKey: process.env.RAINFOREST_API_KEY,
    },
  });

  const registries = [
    'https://www.amazon.com/hz/wishlist/ls/ABC123',
    'https://www.target.com/gift-registry/xyz789',
    'https://www.walmart.com/registry/wedding/456789',
    'https://www.myregistry.com/johndoe',
  ];

  const result = await parser.parseMultiple(registries);

  result.successful.forEach(({ url, retailer, data }) => {
    console.log(`${retailer}: ${data.totalItems} items from ${url}`);
  });

  result.failed.forEach(({ url, retailer, error }) => {
    console.error(`Failed to parse ${retailer} (${url}): ${error}`);
  });
}

/**
 * Example 4: With caching for performance
 */
async function example4_WithCache() {
  const redis = require('redis');
  const redisClient = redis.createClient();
  await redisClient.connect();

  const { ProductCache } = require('./amazon-parser');
  const { TargetProductCache } = require('./target-parser');

  const parser = new MultiRetailerParser({
    amazon: {
      cache: new ProductCache(redisClient),
    },
    target: {
      cache: new TargetProductCache(redisClient),
    },
  });

  const result = await parser.parse('https://www.target.com/gift-registry/xyz789');
  console.log('Registry:', result);

  // Second call will use cache
  const cachedResult = await parser.parse('https://www.target.com/gift-registry/xyz789');
  console.log('Cached:', cachedResult.cached);
}

// Uncomment to test:
// example1_SingleRetailer();
// example2_UserPaste();
