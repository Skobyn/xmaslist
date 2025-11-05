/**
 * Scraping Configuration Example
 * Copy this to scraping-config.js and fill in your API keys
 */

module.exports = {
  // ========================================
  // API Keys (Optional - for enhanced features)
  // ========================================

  amazon: {
    // Amazon Product Advertising API (PA-API 5.0)
    // Requirements: Amazon Associates account + 3 qualified sales in 180 days
    // Get credentials: https://affiliate-program.amazon.com/
    paApi: {
      accessKey: process.env.AMAZON_ACCESS_KEY || '',
      secretKey: process.env.AMAZON_SECRET_KEY || '',
      partnerTag: process.env.AMAZON_PARTNER_TAG || '', // Your Associates ID
      region: 'us-east-1',
      marketplace: 'www.amazon.com'
    },

    // Rainforest API (Third-party scraping service)
    // Cost: $0.005 - $0.02 per request
    // Sign up: https://www.rainforestapi.com/
    rainforest: {
      apiKey: process.env.RAINFOREST_API_KEY || '',
      enabled: false
    }
  },

  // ========================================
  // Proxy & Scraping Services
  // ========================================

  scraperApi: {
    // ScraperAPI (Proxy service with CAPTCHA solving)
    // Cost: $49/month for 1M requests
    // Sign up: https://www.scraperapi.com/
    apiKey: process.env.SCRAPER_API_KEY || '',
    enabled: false,
    render: true, // Enable JavaScript rendering
    countryCode: 'us',
    premiumProxy: false // Use premium residential proxies (higher cost)
  },

  scrapeOps: {
    // ScrapeOps (Alternative to ScraperAPI)
    // Cost: Free tier (1K requests/month), then $29/month
    // Sign up: https://scrapeops.io/
    apiKey: process.env.SCRAPEOPS_API_KEY || '',
    enabled: false
  },

  // ========================================
  // Target Configuration
  // ========================================

  target: {
    // Target's unofficial API (free, no auth needed)
    api: {
      baseUrl: 'https://api.target.com',
      registryEndpoint: '/registry/v2/registry',
      productEndpoint: 'https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1'
    },

    // Target public API key (found in their frontend code)
    apiKey: 'ff457966e64d5e877fdbad070f276d18ecec4a01',

    // Default store ID for pricing (can be changed by user's location)
    defaultStoreId: '3991'
  },

  // ========================================
  // Rate Limiting Configuration
  // ========================================

  rateLimits: {
    amazon: {
      requests: 5, // Max requests per window
      windowMs: 60000, // 1 minute
      delayBetweenRequests: 3000, // 3 seconds between requests
      maxRetries: 3,
      retryDelay: 5000 // 5 seconds before retry
    },

    target: {
      requests: 20,
      windowMs: 60000,
      delayBetweenRequests: 500,
      maxRetries: 3,
      retryDelay: 2000
    },

    walmart: {
      requests: 10,
      windowMs: 60000,
      delayBetweenRequests: 1000,
      maxRetries: 3,
      retryDelay: 3000
    },

    etsy: {
      requests: 10,
      windowMs: 60000,
      delayBetweenRequests: 1000,
      maxRetries: 2,
      retryDelay: 5000
    },

    bestbuy: {
      requests: 15,
      windowMs: 60000,
      delayBetweenRequests: 800,
      maxRetries: 3,
      retryDelay: 2000
    }
  },

  // ========================================
  // Caching Configuration
  // ========================================

  cache: {
    // Redis configuration
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: 0,
      keyPrefix: 'xmaslist:',
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    },

    // Cache TTL (Time To Live) in seconds
    ttl: {
      product: 7 * 24 * 60 * 60, // 7 days (product details rarely change)
      price: 6 * 60 * 60, // 6 hours (prices change frequently)
      registry: 24 * 60 * 60, // 24 hours (registries are moderately dynamic)
      availability: 1 * 60 * 60, // 1 hour (stock availability is highly dynamic)
      wishlist: 24 * 60 * 60 // 24 hours
    },

    // In-memory cache (L1 cache)
    memory: {
      enabled: true,
      maxSize: 1000, // Max items in memory
      ttl: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
  },

  // ========================================
  // Puppeteer/Playwright Configuration
  // ========================================

  browser: {
    // Browser automation settings (for direct scraping - not recommended)
    headless: true,

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],

    // User agents for rotation
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:122.0) Gecko/20100101 Firefox/122.0'
    ],

    // Viewport sizes
    viewports: [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 }
    ],

    // Timeouts
    timeout: {
      navigation: 30000, // 30 seconds
      selector: 10000, // 10 seconds
      overall: 60000 // 1 minute max per page
    }
  },

  // ========================================
  // Fallback Strategy Configuration
  // ========================================

  fallback: {
    // Order of methods to try (first to last)
    methods: [
      'user-paste', // Always try user-provided URLs first
      'official-api', // Use official APIs if available
      'proxy-service', // Use paid proxy services
      'direct-scraping' // Last resort (not recommended)
    ],

    // Enable/disable specific methods
    enableUserPaste: true,
    enableBrowserExtension: true,
    enableOfficialApis: true,
    enableProxyServices: false, // Disable by default (requires paid keys)
    enableDirectScraping: false // Disable by default (violates TOS)
  },

  // ========================================
  // Monitoring & Logging
  // ========================================

  monitoring: {
    // Sentry error tracking
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      enabled: false,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1 // 10% of transactions
    },

    // Logging configuration
    logging: {
      level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
      prettyPrint: process.env.NODE_ENV === 'development',
      destination: process.env.LOG_FILE || undefined // Leave undefined to log to stdout
    }
  },

  // ========================================
  // Database Configuration
  // ========================================

  database: {
    // PostgreSQL connection
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'xmaslist',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  },

  // ========================================
  // Feature Flags
  // ========================================

  features: {
    // Enable/disable features
    amazonSupport: true,
    targetSupport: true,
    walmartSupport: true,
    etsySupport: false, // Disabled by default (requires OAuth)
    bestbuySupport: true,
    myregistrySupport: true,

    // Advanced features
    multiLevelCaching: true,
    backgroundJobQueue: false, // Requires Redis
    realTimeUpdates: false, // Requires WebSockets
    priceTracking: false, // Track price changes over time
    availabilityAlerts: false // Notify when items back in stock
  }
};
